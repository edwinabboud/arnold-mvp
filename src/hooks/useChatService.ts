// =============================================================================
// ARNOLD — Chat Service Hook
// Bridges ChatWidget ↔ Rules Engine ↔ Claude API
// Manages message state, input classification, pain flow, context building.
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  tryQuickResponse,
  routeInteraction,
  type UserAction,
} from '../engine/api';
import {
  handlePainReport,
  handleTooEasy,
  handleCouldntFinish,
} from '../engine/rules';
import { ChatMessage, ChatOption } from '../types/logging';
import { CoachingContext, PainReport, PlannedExercise } from '../types';
import { markAsSurfaced, getUnsurfacedItems, addToQueue } from '../engine/adaptationQueue';
import { captureAdaptationSurfaced } from '../services/analytics';
import {
  ReviewState,
  createReviewState,
  isReviewMessage,
  parseOverallFeel,
  handleOverallFeel,
  handleExerciseSelection,
} from '../engine/sessionReview';

// ── Types ───────────────────────────────────────────────────────────────────

type PainFlowState = 'idle' | 'awaiting_body_part' | 'awaiting_severity';

export interface UseChatServiceReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  chatEngaged: boolean;
  sendText: (text: string) => Promise<void>;
  tapOption: (option: ChatOption, messageId: string) => Promise<void>;
  reportPain: (bodyPart: string, severity: number) => Promise<void>;
  addSystemMessage: (text: string) => void;
  addArnoldReply: (text: string, source: 'quick' | 'rules' | 'llm', options?: ChatOption[]) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Yield to the renderer so React paints the queued state (user bubble +
 * typing indicator) BEFORE the synchronous v2.4.8 context-packet build
 * blocks the JS thread. Without this, `setIsLoading(true)` is enqueued in
 * the same tick as the heavy `buildContextPacket` work, and the indicator
 * doesn't appear until the response lands — the chat feels frozen on send.
 */
function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function makeId(prefix: string = 'msg'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeArnoldMsg(text: string, source: 'quick' | 'rules' | 'llm', options?: ChatOption[]): ChatMessage {
  return {
    id: makeId(),
    role: 'arnold',
    text,
    timestamp: new Date().toISOString(),
    source,
    ...(options && options.length > 0 ? { options } : {}),
  };
}

function makeUserMsg(text: string): ChatMessage {
  return {
    id: makeId('user'),
    role: 'user',
    text,
    timestamp: new Date().toISOString(),
    source: 'quick', // user messages don't really have a source, but field is required
  };
}

// ── Context Builder ─────────────────────────────────────────────────────────

function buildCoachingContext(): CoachingContext {
  const store = useStore.getState();
  const session = store.activeSession;
  const planned = session?.plannedSession;

  return {
    currentPhase: planned?.phase || 'base_building',
    recentSessions: store.sessionHistory.slice(-5),
    recentPainReports: session?.painReports || [],
    activeProgressions: store.userProgressions,
    streaks: store.streaks,
    programPath: store.profile?.programPath || "hybrid_athlete",
    tier: store.profile?.tier || "beginner",
    todaysSession: planned || {
      id: 'none',
      weekId: 'none',
      dayOfWeek: new Date().getDay(),
      label: 'Training',
      phase: 'base_building' as const,
      patterns: [],
      exercises: [],
      warmUpExercises: [],
      cooldownExercises: [],
    },
  };
}

// ── Current Exercise Info ───────────────────────────────────────────────────

function getCurrentExerciseInfo(): {
  current: PlannedExercise | undefined;
  setsRemaining: number;
  exercisesRemaining: number;
} | null {
  const store = useStore.getState();
  const session = store.activeSession;
  if (!session) return null;

  const planned = session.plannedSession;
  const allExercises = [
    ...(planned.warmUpExercises || []),
    ...planned.exercises,
    ...(planned.cooldownExercises || []),
  ];
  const current = allExercises[session.currentExerciseIndex];
  const setsRemaining = current ? current.sets - session.currentSetIndex : 0;
  const exercisesRemaining = allExercises.length - session.currentExerciseIndex - 1;

  return { current, setsRemaining, exercisesRemaining };
}

// ── The Hook ────────────────────────────────────────────────────────────────

export function useChatService(): UseChatServiceReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    makeArnoldMsg("Session loaded. I'm here if you need me.", 'quick'),
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Pain flow state machine
  const painFlowRef = useRef<PainFlowState>('idle');
  const painBodyPartRef = useRef<string>('');

  // Session review state machine
  const reviewStateRef = useRef<ReviewState>(createReviewState());

  // Track whether user engaged chat this session (for post-session cost optimization)
  const chatEngagedRef = useRef(false);

  // ── Arnold call helper (passes adaptation queue + marks surfaced) ──
  const callArnold = useCallback(async (
    action: UserAction,
    ctx: CoachingContext,
    rulesResult?: any,
  ) => {
    const store = useStore.getState();
    const response = await routeInteraction(action, ctx, rulesResult, store.adaptationQueue);

    const unsurfaced = getUnsurfacedItems(store.adaptationQueue);
    if (unsurfaced.length > 0) {
      const updated = markAsSurfaced(store.adaptationQueue, unsurfaced.map(i => i.id));
      store.setAdaptationQueue(updated);
      // One event per adaptation type that just got surfaced. We capture per
      // *type* (not per item) so a session that surfaces three weight bumps
      // doesn't triple-inflate the funnel — but a weight bump + a rep change
      // surfaces twice as expected.
      const typesSurfaced = new Set(unsurfaced.map((i) => i.type as string));
      typesSurfaced.forEach((t) => captureAdaptationSurfaced({ adaptation_type: t }));
    }

    return response;
  }, []);

  // ── Add message helpers ──

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const addArnoldReply = useCallback((text: string, source: 'quick' | 'rules' | 'llm', options?: ChatOption[]) => {
    addMessage(makeArnoldMsg(text, source, options));
  }, [addMessage]);

  // v2.4.9 Part 1 — one-time migration message for existing Compact/Standard
  // users. Recommended users see nothing (their sessions are unchanged).
  // Fires the first time this hook mounts post-update, then `markV249MigrationShown`
  // persists the flag so it doesn't repeat across screens or app restarts.
  useEffect(() => {
    const state = useStore.getState();
    if (state.v249MigrationShown) return;
    const tier = state.profile?.schedule?.sessionTier;
    if (tier !== "compact" && tier !== "standard") return;
    addMessage(
      makeArnoldMsg(
        "I'm rebuilding how I shorten sessions — for now you're getting full sessions. The shorter options come back soon with better programming.",
        'rules',
      ),
    );
    state.markV249MigrationShown();
  }, [addMessage]);

  const addSystemMessage = useCallback((text: string) => {
    addMessage({
      id: makeId('sys'),
      role: 'system',
      text,
      timestamp: new Date().toISOString(),
      source: 'quick',
    });
  }, [addMessage]);

  // ── Report Pain (called after body part + severity collected) ──

  const reportPain = useCallback(async (bodyPart: string, severity: number) => {
    const store = useStore.getState();
    const info = getCurrentExerciseInfo();

    // Create and log the pain report in the store
    const painReport: PainReport = {
      id: makeId('pain'),
      sessionId: store.activeSession?.plannedSession.id || '',
      bodyArea: bodyPart.toLowerCase(),
      severity,
      exerciseId: info?.current?.id,
      timestamp: new Date().toISOString(),
    };
    store.logPain(painReport);

    // Run rules engine
    const ctx = buildCoachingContext();
    const fallbackExercise = ctx.todaysSession.exercises[0];
    const exercise = info?.current || fallbackExercise;

    if (!exercise) {
      addArnoldReply(
        severity >= 8
          ? "That sounds serious. Stop and consider seeing a physio."
          : "Noted. I'll monitor it.",
        'rules'
      );
      return;
    }

    const decision = handlePainReport(painReport, ctx.recentPainReports, exercise);

    // Route through conversation agent for Arnold's voice
    setIsLoading(true);
    await yieldToPaint();
    try {
      const response = await callArnold(
        { type: 'pain_report', bodyArea: bodyPart, severity },
        ctx,
        decision
      );
      addMessage(response);
    } catch (err) {
      console.error('[useChatService] Pain report error:', err);
      addArnoldReply(
        severity >= 8
          ? "That's serious. Stop the exercise. Consider seeing a physio."
          : "Noted. I'll keep an eye on it.",
        'rules'
      );
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, addArnoldReply]);

  // ── Send Text (main entry point) ──

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message immediately
    addMessage(makeUserMsg(trimmed));
    chatEngagedRef.current = true;
    const lower = trimmed.toLowerCase();

    // ── Pain flow state machine ──
    if (painFlowRef.current === 'awaiting_severity') {
      const severity = parseInt(lower) || 5;
      painFlowRef.current = 'idle';
      await reportPain(painBodyPartRef.current, severity);
      return;
    }

    if (painFlowRef.current === 'awaiting_body_part') {
      painBodyPartRef.current = trimmed;
      painFlowRef.current = 'awaiting_severity';
      addArnoldReply(`Got it — ${trimmed.toLowerCase()}. From 1 to 10, how much does it hurt?`, 'rules');
      return;
    }

    // ── Session review flow (deterministic, no LLM) ──
    if (reviewStateRef.current.step === 'awaiting_exercise' && trimmed.startsWith('__review_exercise__')) {
      const result = handleExerciseSelection(reviewStateRef.current, trimmed);
      reviewStateRef.current = result.newState;
      addArnoldReply(result.arnoldText, 'rules');

      if (result.adaptations && result.adaptations.length > 0) {
        const store = useStore.getState();
        let queue = store.adaptationQueue;
        for (const item of result.adaptations) {
          queue = addToQueue(queue, item, reviewStateRef.current.sessionId);
        }
        store.setAdaptationQueue(queue);
        console.log("[ARNOLD] Review adaptations queued:", result.adaptations.map(a => a.change));
      }
      return;
    }

    if (isReviewMessage(trimmed)) {
      const feel = parseOverallFeel(trimmed);
      if (feel) {
        const store = useStore.getState();
        const session = store.activeSession?.plannedSession;
        // Also check session history for just-completed session
        const lastLog = store.sessionHistory[store.sessionHistory.length - 1];
        const plannedSession = session
          || (lastLog && store.activeMesocycle?.weeks
            .flatMap(w => w.sessions)
            .find(s => s.id === lastLog.plannedSessionId));

        if (plannedSession) {
          const result = handleOverallFeel(feel, plannedSession);
          reviewStateRef.current = result.newState;

          if (result.options) {
            addArnoldReply(result.arnoldText, 'rules', result.options as ChatOption[]);
          } else {
            addArnoldReply(result.arnoldText, 'rules');
          }

          if (result.adaptations && result.adaptations.length > 0) {
            let queue = store.adaptationQueue;
            for (const item of result.adaptations) {
              queue = addToQueue(queue, item, plannedSession.id);
            }
            store.setAdaptationQueue(queue);
            console.log("[ARNOLD] Review adaptations queued:", result.adaptations.map(a => a.change));
          }
          return;
        }
      }
    }

    // ── Quick bypass: "how many left" (no API call) ──
    if (/how many|sets? left|left on/i.test(lower)) {
      const info = getCurrentExerciseInfo();
      if (info) {
        const quick = tryQuickResponse('how_many_left', {
          exerciseName: info.current?.name,
          setsRemaining: info.setsRemaining,
          exercisesRemaining: info.exercisesRemaining,
        });
        if (quick) {
          addMessage(quick);
          return;
        }
      }
    }

    // ── Pain keywords → start pain flow ──
    if (/hurt|pain|sore|ache|twinge|tender/i.test(lower)) {
      painFlowRef.current = 'awaiting_body_part';
      addArnoldReply("Where does it hurt?", 'rules');
      return;
    }

    // ── From here, everything calls the API ──
    setIsLoading(true);
    await yieldToPaint();
    try {
      const info = getCurrentExerciseInfo();
      const ctx = buildCoachingContext();

      // "Too easy" → rules engine + conversation agent
      if (/too easy|too light|boring|not challenging/i.test(lower)) {
        if (info?.current) {
          const decision = handleTooEasy(info.current, ctx.currentPhase);
          const response = await callArnold(
            { type: 'chat_message', text: trimmed },
            ctx,
            decision
          );
          addMessage(response);
          return;
        }
      }

      // "Can't finish" → rules engine + conversation agent
      if (/can'?t finish|too hard|struggling|failed|couldn'?t do|couldn'?t complete/i.test(lower)) {
        if (info?.current) {
          const store = useStore.getState();
          const progression = store.userProgressions.find(
            p => p.progressionId === info.current!.progressionId
          );
          if (!progression) {
            addArnoldReply("Can't find your progression for this exercise — try again from the home screen.", 'quick');
            return;
          }
          const decision = handleCouldntFinish(info.current, ctx.recentSessions, progression);
          const response = await callArnold(
            { type: 'chat_message', text: trimmed },
            ctx,
            decision
          );
          addMessage(response);
          return;
        }
      }

      // General message → conversation agent
      const response = await callArnold(
        { type: 'chat_message', text: trimmed },
        ctx
      );
      addMessage(response);

    } catch (err) {
      console.error('[useChatService] Error:', err);
      addArnoldReply("Can't reach my brain right now. Try again in a sec.", 'quick');
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, addArnoldReply, reportPain]);

  // ── Tap Option ──

  const tapOption = useCallback(async (option: ChatOption, messageId: string) => {
    // Mark the option as selected on the original message
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, optionSelected: option.id } : m)
    );

    if (option.action === 'dismiss') return;

    if (option.action === 'decision') {
      // Plan change accept/reject
      setIsLoading(true);
      await yieldToPaint();
      try {
        const ctx = buildCoachingContext();
        const response = await callArnold(
          { type: 'plan_change_response', accepted: option.value === 'approve_change' },
          ctx
        );
        addMessage(response);
      } catch {
        addArnoldReply("Got it. Let's move on.", 'quick');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // followup or navigate → treat as text input
    await sendText(option.value || option.label);
  }, [addMessage, addArnoldReply, sendText]);

  return {
    messages,
    isLoading,
    chatEngaged: chatEngagedRef.current,
    sendText,
    tapOption,
    reportPain,
    addSystemMessage,
    addArnoldReply,
  };
}