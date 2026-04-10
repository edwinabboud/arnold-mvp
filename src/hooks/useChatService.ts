// =============================================================================
// ARNOLD — Chat Service Hook
// Bridges ChatWidget ↔ Rules Engine ↔ Claude API
// Manages message state, input classification, pain flow, context building.
// =============================================================================

import { useState, useCallback, useRef } from 'react';
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
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
    userGoals: store.onboarding.rankedGoals.length > 0
      ? store.onboarding.rankedGoals
      : [{ goal: 'skill_acquisition' as const, rank: 1 }],
    todaysSession: planned || {
      id: 'none',
      weekId: 'none',
      dayOfWeek: new Date().getDay(),
      label: 'Training',
      phase: 'base_building' as const,
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

  // Track whether user engaged chat this session (for post-session cost optimization)
  const chatEngagedRef = useRef(false);

  // ── Add message helpers ──

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const addArnoldReply = useCallback((text: string, source: 'quick' | 'rules' | 'llm', options?: ChatOption[]) => {
    addMessage(makeArnoldMsg(text, source, options));
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
    try {
      const response = await routeInteraction(
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
    try {
      const info = getCurrentExerciseInfo();
      const ctx = buildCoachingContext();

      // "Too easy" → rules engine + conversation agent
      if (/too easy|too light|boring|not challenging/i.test(lower)) {
        if (info?.current) {
          const decision = handleTooEasy(info.current, ctx.currentPhase);
          const response = await routeInteraction(
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
          const decision = handleCouldntFinish(info.current, ctx.recentSessions, progression);
          const response = await routeInteraction(
            { type: 'chat_message', text: trimmed },
            ctx,
            decision
          );
          addMessage(response);
          return;
        }
      }

      // General message → conversation agent
      const response = await routeInteraction(
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
      try {
        const ctx = buildCoachingContext();
        const response = await routeInteraction(
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
  };
}