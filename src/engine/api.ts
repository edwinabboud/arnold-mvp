// =============================================================================
// ARNOLD — Claude API Integration
// 4 specialized agents + orchestration router + quick response bypass.
// Claude Sonnet for all agents in MVP. Opus only if quality insufficient.
//
// Agent prompts live in src/engine/prompts/ — one file per agent.
// This file handles: config, quick response bypass, API calls, orchestration.
// =============================================================================

import {
  CoachingContext,
  CoachingDecision,
  Mesocycle,
  PainReport,
  PlanPhase,
  PlannedExercise,
  PlannedSession,
  SessionLog,
  UserProgression,
} from "../types";
import { ChatMessage } from "../types/logging";
import { getExerciseKnowledge } from "../data/exerciseKnowledge";

// ── Agent Prompts (imported from dedicated files) ────────────────────────────
import { CONVERSATION_AGENT_PROMPT } from "./prompts/conversationAgent";
import { PLAN_GENERATOR_PROMPT } from "./prompts/planGeneratorAgent";
import { SESSION_ADAPTER_PROMPT } from "./prompts/sessionAdapterAgent";
import { PROGRESS_ANALYST_PROMPT } from "./prompts/progressAnalystAgent";

// ── Silent Adaptation (deterministic, no AI) ─────────────────────────────────
import {
  processSessionForAdaptation,
  SilentAdaptationResult,
} from "./silentAdaptation";
import { buildContextPacket, contextPacketToString } from "./contextPacket";
import { buildChatContextStringV248 } from "./chatContext";
import { buildE1RMProfile } from "./weightEngine";
import { AdaptationQueue, getUnsurfacedItems, formatForChat } from "./adaptationQueue";

// ── Config ───────────────────────────────────────────────────────────────────

// API key removed from client — all Anthropic calls go through the Supabase proxy.
// The proxy validates the user's JWT and adds the API key server-side.
const PROXY_URL = "https://wovmdwaeezdmxlbpnpkz.supabase.co/functions/v1/arnold-proxy";
const DELETE_ACCOUNT_URL = "https://wovmdwaeezdmxlbpnpkz.supabase.co/functions/v1/arnold-delete-account";
const DEFAULT_MODEL = "claude-3-haiku-20240307";
const CONVERSATION_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 500;

interface APIConfig {
  model?: string;
  maxTokens?: number;
  // apiKey intentionally removed — key lives server-side in Supabase secrets
}

let config: APIConfig = { model: DEFAULT_MODEL, maxTokens: MAX_TOKENS };

// Kept for backwards compatibility — App.tsx calls this at startup.
// apiKey field is ignored; only model/maxTokens are used.
export function configureAPI(apiConfig: { apiKey?: string; model?: string; maxTokens?: number }): void {
  config = { model: apiConfig.model ?? config.model, maxTokens: apiConfig.maxTokens ?? config.maxTokens };
}

// Returns the current Supabase session JWT for authenticating proxy requests.
// Uses the existing shared client which already holds the user's session.
async function getAuthToken(): Promise<string> {
  try {
    const { supabase } = await import("../config/supabase");
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  } catch {
    return "";
  }
}

// ── Quick Response Bypass ────────────────────────────────────────────────────
// Common actions skip the LLM entirely. ~80% of interactions hit this path.
// Keeps API costs at ~$0.02–$0.05 per training session.

export function tryQuickResponse(
  action: string,
  context: {
    exerciseName?: string;
    setsRemaining?: number;
    exercisesRemaining?: number;
    restSeconds?: number;
    setNumber?: number;
    totalSets?: number;
  }
): ChatMessage | null {
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}`;

  switch (action) {
    case "set_done":
      if (context.setsRemaining && context.setsRemaining > 0) {
        return {
          id, role: "arnold", timestamp: now, source: "quick",
          text: `Done. ${context.restSeconds || 90}s rest. ${context.setsRemaining} sets left.`,
        };
      }
      return {
        id, role: "arnold", timestamp: now, source: "quick",
        text: "Last set done. Moving on.",
      };

    case "how_many_left":
      return {
        id, role: "arnold", timestamp: now, source: "quick",
        text: `${context.setsRemaining || 0} sets left on ${context.exerciseName}. ${context.exercisesRemaining || 0} exercises after this.`,
      };

    case "rest_started":
      return {
        id, role: "arnold", timestamp: now, source: "quick",
        text: `Rest. ${context.restSeconds}s. Set ${(context.setNumber || 0) + 1} of ${context.totalSets} next.`,
      };

    case "session_end":
      return {
        id, role: "arnold", timestamp: now, source: "quick",
        text: "Session done. Good work.",
        options: [
          { id: "fb_great", label: "Great", action: "followup", value: "great" },
          { id: "fb_good", label: "Good", action: "followup", value: "good" },
          { id: "fb_tough", label: "Tough", action: "followup", value: "tough" },
          { id: "fb_bad", label: "Bad", action: "followup", value: "bad" },
          { id: "fb_explain", label: "Let me explain", action: "followup", value: "explain" },
        ],
      };

    default:
      return null;
  }
}

// ── Agent Prompt Map ─────────────────────────────────────────────────────────
// Each agent's full prompt lives in its own file under src/engine/prompts/.
// This map just wires them to the agent names used by the orchestration router.

const AGENT_PROMPTS = {
  conversation: CONVERSATION_AGENT_PROMPT,
  sessionAdapter: SESSION_ADAPTER_PROMPT,
  progressAnalyst: PROGRESS_ANALYST_PROMPT,
  planGenerator: PLAN_GENERATOR_PROMPT,
};

// ── API Call ──────────────────────────────────────────────────────────────────

async function callAgent(
  agent: keyof typeof AGENT_PROMPTS,
  userMessage: string,
  context?: string
): Promise<string> {
  const systemPrompt = AGENT_PROMPTS[agent];

  const messages = [
    ...(context ? [{ role: "user" as const, content: `Context:\n${context}` }, { role: "assistant" as const, content: "Understood. I have the context." }] : []),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const authToken = await getAuthToken();
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: agent === "conversation" ? CONVERSATION_MODEL : (config.model || DEFAULT_MODEL),
        max_tokens: config.maxTokens || MAX_TOKENS,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content
      ?.map((block: { type: string; text?: string }) =>
        block.type === "text" ? block.text : ""
      )
      .filter(Boolean)
      .join("\n");

    if (__DEV__) {
      console.log(`[Arnold] ${agent} agent OK`, {
        status: response.status,
        textLen: (text || "").length,
        preview: (text || "").slice(0, 80),
      });
    }
    return text || "";
  } catch (error) {
    // Visible in any build via console.error; dev builds also get the
    // explicit "FALLBACK FIRING" tag so device logs make the cause
    // unambiguous when triaging "why is Arnold answering generically?".
    console.error(`[Arnold] ${agent} agent error:`, error);
    if (__DEV__) {
      console.log(
        `[Arnold] ${agent} agent FALLBACK FIRING — returning canned "Let me think about that. Try again in a sec."`,
      );
    }
    return JSON.stringify({
      message: "Let me think about that. Try again in a sec.",
      tone: "neutral",
    });
  }
}

// ── Orchestration Router ─────────────────────────────────────────────────────
// Decides which agent to call based on what the user did.

export type UserAction =
  | { type: "chat_message"; text: string }
  | { type: "pain_report"; bodyArea: string; severity: number }
  | { type: "feedback"; feeling: string; exerciseId?: string }
  | { type: "plan_change_response"; accepted: boolean }
  | { type: "exercise_question"; exerciseId: string }
  | { type: "general_question"; text: string };

export async function routeInteraction(
  action: UserAction,
  coachingContext: CoachingContext,
  rulesDecision?: CoachingDecision,
  adaptationQueue?: AdaptationQueue,
): Promise<ChatMessage> {
  const now = new Date().toISOString();

  // ── v2.4.8 packet first; v1 only as fallback ─────────────────────────────
  // The v2.4.8 ConversationContextPacket pulls real values from the store:
  // completedSession, 5+5 history window, recovery block, real e1rm from
  // benchmarks, structured pendingAdaptations. The v1 path here used to feed
  // hardcoded { bodyweight: 70, week: 1, pullUpReps: 0, dipReps: 0 } — which
  // produced an empty e1rm profile and no completed-session block, leaving
  // the conversation agent with nothing path-specific to reference and
  // forcing generic prose. v1 is retained ONLY for the edge case where the
  // store has no profile yet (very early lifecycle).
  let contextStr: string;
  let contextSource: "v2.4.8" | "v1-fallback" = "v2.4.8";
  const v248Str = (() => {
    try {
      return buildChatContextStringV248();
    } catch (err) {
      console.error("[Arnold] v2.4.8 packet build threw — falling back to v1", err);
      return null;
    }
  })();

  if (v248Str) {
    contextStr = v248Str;
  } else {
    contextSource = "v1-fallback";
    // Original v1 behaviour — kept verbatim for the no-profile edge case.
    const e1rmProfile = coachingContext.todaysSession
      ? buildE1RMProfile({
          bodyweightKg: 70, // TODO: get from user profile when passed in
          pullUpMaxReps: 0,
          dipMaxReps: 0,
        })
      : null;
    try {
      const weekNumber = 1; // TODO: derive from mesocycle state
      const packet = buildContextPacket({
        path: coachingContext.programPath,
        tier: coachingContext.tier,
        phase: coachingContext.currentPhase,
        weekNumber,
        session: coachingContext.todaysSession,
        bodyweightKg: 70,
        e1rmProfile,
      });
      contextStr = contextPacketToString(packet);
    } catch {
      contextStr = JSON.stringify({
        phase: coachingContext.currentPhase,
        programPath: coachingContext.programPath,
        tier: coachingContext.tier,
      });
    }
  }

  if (__DEV__) {
    console.log(`[Arnold] routeInteraction context: ${contextSource}`, {
      action: action.type,
      contextLen: contextStr.length,
    });
  }

  // Append rules decision
  if (rulesDecision) {
    contextStr += `\n\nRules decision: ${JSON.stringify(rulesDecision)}`;
  }

  // Append pending adaptations as a plain string ONLY on the v1 fallback. The
  // v2.4.8 packet already includes a structured `PENDING ADAPTATIONS` block
  // serialized by conversationContextPacketToString — re-appending here
  // would just duplicate the same data.
  if (contextSource === "v1-fallback") {
    const pendingAdaptations = adaptationQueue ? getUnsurfacedItems(adaptationQueue) : [];
    if (pendingAdaptations.length > 0) {
      contextStr += `\n\nPending adaptations (surface these to the user): ${formatForChat(pendingAdaptations)}`;
    }
  }

  contextStr += `\n\nStreaks: ${coachingContext.streaks.currentDaily} day streak, ${coachingContext.streaks.totalSessions} total sessions.`;
  contextStr += `\nRecent sessions: ${coachingContext.recentSessions.length} in history.`;

  switch (action.type) {
    case "exercise_question": {
      // Enrich with exercise knowledge base
      const kb = getExerciseKnowledge(action.exerciseId);
      const kbStr = kb
        ? `\nExercise knowledge:\nPrimary: ${kb.primaryMuscles.join(", ")}\nMistakes: ${kb.commonMistakes.join("; ")}\nBreathing: ${kb.breathing}\nWhy: ${kb.whyInPlan}`
        : "";

      const response = await callAgent(
        "conversation",
        `User is asking about exercise ${action.exerciseId}.${kbStr}`,
        contextStr
      );
      return parseConversationResponse(response);
    }

    case "pain_report": {
      const response = await callAgent(
        "conversation",
        `User reported ${action.severity}/10 pain in ${action.bodyArea}. Rules engine decision: ${JSON.stringify(rulesDecision)}`,
        contextStr
      );
      return parseConversationResponse(response);
    }

    case "feedback": {
      const response = await callAgent(
        "conversation",
        `Post-session feedback: user feels "${action.feeling}"${action.exerciseId ? ` about ${action.exerciseId}` : ""}. Rules engine decision: ${JSON.stringify(rulesDecision)}`,
        contextStr
      );
      return parseConversationResponse(response);
    }

    case "chat_message":
    case "general_question": {
      const text = action.type === "chat_message" ? action.text : action.text;
      const response = await callAgent(
        "conversation",
        text,
        contextStr
      );
      return parseConversationResponse(response);
    }

    case "plan_change_response": {
      if (action.accepted) {
        return {
          id: `msg_${Date.now()}`, role: "arnold", timestamp: now, source: "rules",
          text: "Done. Plan updated. Changes are live from your next session.",
        };
      }
      return {
        id: `msg_${Date.now()}`, role: "arnold", timestamp: now, source: "rules",
        text: "Got it. Keeping the plan as is. Let me know if you change your mind.",
      };
    }

    default:
      return {
        id: `msg_${Date.now()}`, role: "arnold", timestamp: now, source: "quick",
        text: "I'm here. What do you need?",
      };
  }
}

// ── Post-Session Analysis (Progress Analyst) ─────────────────────────────────

export async function runPostSessionAnalysis(
  sessionLog: SessionLog,
  context: CoachingContext
): Promise<{
  findings: Array<{ type: string; details: string }>;
  planChanges: Array<{ description: string; affectedWeeks: number[] }>;
}> {
  let contextStr: string;
  try {
    const packet = buildContextPacket({
      path: context.programPath,
      tier: context.tier,
      phase: context.currentPhase,
      weekNumber: 1,
      session: context.todaysSession,
      bodyweightKg: 70,
      e1rmProfile: null,
    });
    contextStr = contextPacketToString(packet);
    contextStr += `\n\nRecent sessions: ${JSON.stringify(context.recentSessions.slice(-5).map(s => ({
      id: s.id,
      status: s.status,
      setsCompleted: s.completedSets.length,
      painReports: s.painReports.length,
    })))}`;
    contextStr += `\nProgressions: ${JSON.stringify(context.activeProgressions.map(p => ({
      id: p.progressionId,
      status: p.status,
      consecutiveSuccesses: p.consecutiveSuccesses,
    })))}`;
  } catch {
    contextStr = JSON.stringify({
      phase: context.currentPhase,
      programPath: context.programPath,
      tier: context.tier,
      recentSessions: context.recentSessions.length,
    });
  }

  const response = await callAgent(
    "progressAnalyst",
    `Analyze this session: ${JSON.stringify(sessionLog)}`,
    contextStr
  );

  try {
    const cleaned = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { findings: [], planChanges: [] };
  }
}

// ── Combined Post-Session Processing ─────────────────────────────────────────
// Runs after EVERY completed session. Silent adaptation always runs.
// LLM-based Progress Analyst only runs if the user engaged the chat
// (otherwise it's wasted cost — silent adaptation handles it).

export async function processCompletedSession(
  sessionLog: SessionLog,
  allSessionHistory: SessionLog[],
  mesocycle: Mesocycle,
  context: CoachingContext,
  chatWasEngaged: boolean
): Promise<{
  silentAdaptation: SilentAdaptationResult;
  llmAnalysis: { findings: Array<{ type: string; details: string }>; planChanges: Array<{ description: string; affectedWeeks: number[] }> } | null;
}> {
  // 1. ALWAYS run silent adaptation (deterministic, free, fast)
  const silentAdaptation = processSessionForAdaptation(
    sessionLog,
    allSessionHistory,
    mesocycle,
    context.activeProgressions
  );

  // 2. Only run LLM analysis if user engaged the chat (costs ~$0.01-0.03)
  let llmAnalysis = null;
  if (chatWasEngaged) {
    llmAnalysis = await runPostSessionAnalysis(sessionLog, context);

    // Log any adaptation items from the analyst
    if (llmAnalysis && llmAnalysis.findings) {
      try {
        const rawResponse = JSON.stringify(llmAnalysis);
        if (rawResponse.includes('adaptationItems')) {
          console.log("[ARNOLD] Progress analyst findings:", llmAnalysis.findings.map((f: any) => f.details));
        }
      } catch {
        // Non-critical — analyst findings are informational
      }
    }
  }

  return { silentAdaptation, llmAnalysis };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseConversationResponse(raw: string): ChatMessage {
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}`;

  // Strategy: try multiple ways to extract a clean message from the LLM response.
  // The LLM sometimes returns pure JSON, sometimes text + JSON, sometimes just text.

  const trimmed = (raw || "").replace(/```json/g, "").replace(/```/g, "").trim();

  // Attempt 1: Maybe the whole thing is valid JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.message) {
      return buildMessage(id, now, parsed.message, parsed.options);
    }
  } catch {}

  // Attempt 2: Find JSON object in the string (text before/after JSON)
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const beforeJson = trimmed.substring(0, firstBrace).trim();
    const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed && parsed.message) {
        // Combine any pre-JSON text with the parsed message
        const fullMessage = beforeJson
          ? beforeJson + " " + parsed.message
          : parsed.message;
        return buildMessage(id, now, fullMessage, parsed.options);
      }
    } catch {}
  }

  // Attempt 3: Regex extract just the "message" field value
  const msgMatch = trimmed.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (msgMatch && msgMatch[1]) {
    const extracted = msgMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    const beforeJson = firstBrace !== -1 ? trimmed.substring(0, firstBrace).trim() : "";
    const fullMessage = beforeJson ? beforeJson + " " + extracted : extracted;
    return { id, role: "arnold", timestamp: now, source: "llm", text: fullMessage };
  }

  // Attempt 4: Just strip any JSON-looking content and return plain text
  let cleanText = trimmed;
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleanText = trimmed.substring(0, firstBrace).trim();
  }
  if (!cleanText) cleanText = trimmed;

  return { id, role: "arnold", timestamp: now, source: "llm", text: cleanText };
}

function buildMessage(
  id: string,
  timestamp: string,
  message: string,
  rawOptions?: any[]
): ChatMessage {
  let options: Array<{ id: string; label: string; action: "followup" | "decision" | "dismiss" | "navigate"; value?: string }> | undefined;

  if (rawOptions && Array.isArray(rawOptions) && rawOptions.length > 0) {
    const filtered = rawOptions
      .filter((opt: any) => opt && typeof opt.label === "string" && opt.label.trim() !== "")
      .map((opt: any, idx: number) => ({
        id: opt.id || `opt_${Date.now()}_${idx}`,
        label: opt.label,
        action: (opt.action || "followup") as "followup" | "decision" | "dismiss" | "navigate",
        value: opt.value || opt.label.toLowerCase().replace(/\s+/g, "_"),
      }));

    if (filtered.length > 0) {
      options = filtered;
    }
  }

  return {
    id,
    role: "arnold",
    timestamp,
    source: "llm",
    text: message,
    options,
  };
}

/**
 * Permanently deletes the current user's account on the server.
 * Calls the arnold-delete-account Edge Function which removes the auth user
 * (cascade FKs wipe profiles/mesocycles/session_logs/streaks/user_progressions).
 * Throws on any failure — caller decides whether to clear local state.
 * Required by Apple guideline 5.1.1(v).
 */
export async function deleteAccount(): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(DELETE_ACCOUNT_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[ARNOLD] Account deletion failed:", response.status, errorBody);
    throw new Error(`Deletion failed: ${response.status}`);
  }

  console.log("[ARNOLD] Account deleted on server");
}
