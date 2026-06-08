// =============================================================================
// ARNOLD — Chat-surface bridge to the v2.4.8 Conversation Context Packet.
//
// `src/engine/api.ts → routeInteraction` historically called the v1
// `buildContextPacket` with hardcoded inputs (bodyweight 70, week 1, synthetic
// e1rm of zero reps, no completed session) which gave the conversation agent
// almost no real data — the model fell back to generic prose.
//
// This module reads the live store and assembles the rich v2.4.8 packet from
// REAL values: the user's profile, the active mesocycle (for week + phase),
// real benchmarks → real e1rm, the full SessionLog history, the planned-
// session lookup so post-session SessionSummaries can be built, the
// adaptation queue, and — when the most recent SessionLog is fresh and
// completed — the `completedSession` block the v2.4.8 packet uses to drive
// post-session conversation specificity.
//
// Used only on the chat surface (`routeInteraction`). The review orchestrator
// continues to call `buildConversationContextPacket` directly with its own
// inputs; this file does not touch that path.
// =============================================================================

import { useStore } from "../store/useStore";
import type { PlannedSession, SessionLog, UserBenchmarks } from "../types";
import { buildE1RMProfile } from "./weightEngine";
import {
  buildConversationContextPacket,
  conversationContextPacketToString,
} from "./conversationContext";

/**
 * Treat a SessionLog as "the session the user just finished" if it completed
 * within this window. Beyond that, the chat surface is no longer in a
 * post-session conversation context — the packet's `completedSession` should
 * be null so the agent doesn't talk about a workout from yesterday as if it
 * just happened.
 */
const POST_SESSION_FRESHNESS_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Builds the v2.4.8 ConversationContextPacket from current store state and
 * returns its prompt-ready serialized form. Returns `null` if the essentials
 * (profile + at least the schedule for sessionTier) aren't available yet —
 * the caller should fall back to the lean v1 path in that case.
 *
 * NOTE: this reads the store directly. It does NOT subscribe; it captures a
 * snapshot at call time. That's the right shape for the chat path because
 * each user turn does one round-trip with one fresh packet.
 */
export function buildChatContextStringV248(): string | null {
  const store = useStore.getState();
  const profile = store.profile;
  const mesocycle = store.activeMesocycle;

  // Without a profile we have no path / tier / sessionTier / bodyweight — the
  // v2.4.8 packet is not constructible. Fall back to v1 with synthetic inputs.
  if (!profile) return null;

  // ── Current week derivation ───────────────────────────────────────────────
  // Best signal in order of preference:
  //   1. Live session: use the week the activeSession's planned session lives in.
  //   2. Post-session: use the week of the most recently completed SessionLog.
  //   3. Fallback: week 1.
  let currentWeekNumber = 1;
  if (mesocycle) {
    const activePlannedId = store.activeSession?.plannedSession.id;
    if (activePlannedId) {
      const w = mesocycle.weeks.find((week) =>
        week.sessions.some((s) => s.id === activePlannedId),
      );
      if (w) currentWeekNumber = w.weekNumber;
    } else if (store.sessionHistory.length > 0) {
      const lastLog = store.sessionHistory[store.sessionHistory.length - 1];
      const w = mesocycle.weeks.find((week) =>
        week.sessions.some((s) => s.id === lastLog.plannedSessionId),
      );
      if (w) currentWeekNumber = w.weekNumber;
    }
  }

  // ── plannedSessionsById ───────────────────────────────────────────────────
  // The v2.4.8 packet uses this to attach SessionSummaries onto historical
  // SessionLogs. Older sessions from prior mesocycles won't be present; the
  // packet builder degrades gracefully (recentHistory entries with no planned
  // companion fall back to empty exercises + pain-flag-only).
  const plannedSessionsById = new Map<string, PlannedSession>();
  if (mesocycle) {
    for (const week of mesocycle.weeks) {
      for (const session of week.sessions) {
        plannedSessionsById.set(session.id, session);
      }
    }
  }

  // ── Real e1rm from benchmarks ─────────────────────────────────────────────
  // The v1 path passed { pullUpMaxReps: 0, dipMaxReps: 0 } which produced an
  // all-null e1RMProfile. With real benchmarks we get actual e1RM kg values
  // the agent can reference ("your dip e1RM sits at 87kg, so today's +25kg
  // working set is sitting around 71% intensity").
  const benchmarks: UserBenchmarks =
    profile.benchmarks ?? ({
      collectedAt: new Date().toISOString(),
      source: "onboarding",
      bodyweightKg: profile.bodyweightKg,
    } as UserBenchmarks);
  const e1rmProfile = buildE1RMProfile(benchmarks);

  // ── completedSession (post-session contexts only) ─────────────────────────
  // Find the most recent SessionLog that:
  //   (a) is marked completed,
  //   (b) has its planned session available (lookup hits),
  //   (c) completed within POST_SESSION_FRESHNESS_MS.
  // Iterating from the end is cheap; the array is already chronological.
  let completedSession:
    | { log: SessionLog; planned: PlannedSession }
    | undefined;
  const now = Date.now();
  for (let i = store.sessionHistory.length - 1; i >= 0; i--) {
    const log = store.sessionHistory[i];
    if (log.status !== "completed") continue;
    const planned = plannedSessionsById.get(log.plannedSessionId);
    if (!planned) continue;
    const finishedAt = log.completedAt ? Date.parse(log.completedAt) : 0;
    if (!finishedAt || now - finishedAt > POST_SESSION_FRESHNESS_MS) break; // older than the window — stop scanning
    completedSession = { log, planned };
    break;
  }

  // ── Knowledge block ───────────────────────────────────────────────────────
  // Wired empty for now; the v2.4.8 serializer prints explicit "null
  // (reason)" markers when these are empty/null, which is acceptable. The
  // major wins of this fix (completedSession, recentHistory, recovery, real
  // e1rm) are independent of these enrichment fields.
  const knowledge = {
    phaseGuidance: "",
    currentVariationRationale: null,
    relevantProtocol: null,
  };

  const packet = buildConversationContextPacket({
    profile,
    mesocycle,
    currentWeekNumber,
    e1rmProfile,
    sessionHistory: store.sessionHistory,
    plannedSessionsById,
    adaptationQueue: store.adaptationQueue,
    knowledge,
    completedSession,
  });

  return conversationContextPacketToString(packet);
}
