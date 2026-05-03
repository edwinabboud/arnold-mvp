// =============================================================================
// ARNOLD — Silent Adaptation Engine (Spec Section 10.5)
//
// The app adapts the plan even when the user never touches the chat.
// This engine runs after every completed session, processing behavioral
// signals from session logs to make deterministic plan adjustments.
//
// Five behavioral signals:
//   1. All sets completed 2-3 consecutive sessions → advance progression
//   2. Exercise repeatedly skipped across sessions → flag for review / swap
//   3. Session frequency drops below plan → recalibrate volume
//   4. Reps consistently below target on moderate/easy → evaluate regression
//   5. User completes sessions but never engages chat → continue silently
//
// This is deterministic code — no AI. Fast, predictable, testable.
// Outputs the same CoachingDecision types as the rest of the rules engine.
// =============================================================================

import {
  CoachingDecision,
  CompletedSet,
  DifficultyIntent,
  Mesocycle,
  PlanPhase,
  PlannedExercise,
  PlannedSession,
  SessionLog,
  UserProgression,
} from "../types";
import { getNextProgression, getPreviousProgression } from "../data/progressions";
import type { AdaptationItem } from "./adaptationQueue";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SilentAdaptationResult {
  /** Decisions to apply — same types as rules engine output */
  decisions: SilentDecision[];
  /** Flags for the Progress Analyst to review at weekly analysis */
  flags: AdaptationFlag[];
  /** Summary for logging (never shown to user) */
  internalLog: string;
  /** Weight adjustments from autoregulation table */
  weightAdaptations: AdaptationItem[];
}

export interface SilentDecision {
  decision: CoachingDecision;
  signal: BehavioralSignal;
  confidence: number; // 0-1, only act on > 0.7
  /** Human-readable explanation for logging */
  reason: string;
}

export type BehavioralSignal =
  | "consistent_completion"    // Signal 1: ready to advance
  | "exercise_skipped"         // Signal 2: avoidance pattern
  | "frequency_drop"           // Signal 3: schedule issue
  | "reps_below_target"        // Signal 4: possible overestimation
  | "no_chat_engagement";      // Signal 5: just-train user (info only)

export interface AdaptationFlag {
  signal: BehavioralSignal;
  detail: string;
  severity: "info" | "warning" | "action_needed";
  exerciseId?: string;
  progressionId?: string;
}

// ── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  /** Sessions of consistent completion before auto-advancing */
  ADVANCE_THRESHOLD: 2,
  /** Times an exercise must be skipped before flagging */
  SKIP_THRESHOLD: 2,
  /** Session window to look back for skip patterns */
  SKIP_LOOKBACK_SESSIONS: 6,
  /** Minimum completion rate on moderate/easy before flagging regression */
  MIN_COMPLETION_RATE: 0.75,
  /** Sessions to look back for completion rate analysis */
  COMPLETION_LOOKBACK_SESSIONS: 4,
  /** What percentage of planned sessions must be hit to be "on track" */
  FREQUENCY_THRESHOLD: 0.7,
  /** Weeks to look back for frequency analysis */
  FREQUENCY_LOOKBACK_WEEKS: 2,
};

// ── Main Entry Point ─────────────────────────────────────────────────────────
// Call this after every completed session.

export function runSilentAdaptation(
  latestSession: SessionLog,
  recentSessions: SessionLog[],
  plannedSessions: PlannedSession[],
  userProgressions: UserProgression[],
  currentPhase: PlanPhase,
  mesocycle: Mesocycle,
  chatEngaged: boolean
): SilentAdaptationResult {
  const decisions: SilentDecision[] = [];
  const flags: AdaptationFlag[] = [];
  const logs: string[] = [];

  // Include latest session in the recent set
  const allSessions = [...recentSessions, latestSession];

  // ── Signal 1: Consistent Completion → Advance Progression ──────────────
  const advanceResults = checkConsistentCompletion(
    allSessions,
    plannedSessions,
    userProgressions,
    currentPhase
  );
  decisions.push(...advanceResults.decisions);
  flags.push(...advanceResults.flags);
  logs.push(...advanceResults.logs);

  // ── Signal 2: Exercise Skipping → Flag / Swap ─────────────────────────
  const skipResults = checkExerciseSkipping(
    allSessions,
    plannedSessions
  );
  decisions.push(...skipResults.decisions);
  flags.push(...skipResults.flags);
  logs.push(...skipResults.logs);

  // ── Signal 3: Frequency Drop → Recalibrate Volume ────────────────────
  const freqResults = checkFrequencyDrop(
    allSessions,
    mesocycle
  );
  decisions.push(...freqResults.decisions);
  flags.push(...freqResults.flags);
  logs.push(...freqResults.logs);

  // ── Signal 4: Reps Below Target → Evaluate Regression ────────────────
  const repResults = checkRepsBelowTarget(
    allSessions,
    plannedSessions,
    userProgressions
  );
  decisions.push(...repResults.decisions);
  flags.push(...repResults.flags);
  logs.push(...repResults.logs);

  // ── Signal 5: No Chat Engagement → Info Flag Only ────────────────────
  if (!chatEngaged) {
    flags.push({
      signal: "no_chat_engagement",
      detail: "User completed session without opening chat. Silent adaptation is the primary feedback loop.",
      severity: "info",
    });
    logs.push("Signal 5: No chat engagement. Silent adaptation active.");
  }

  // ── Weight Autoregulation ────────────────────────────────────────────
  const weightResults = checkWeightAutoregulation(latestSession, plannedSessions);
  logs.push(...weightResults.logs);

  return {
    decisions: decisions.filter(d => d.confidence >= 0.7),
    flags,
    internalLog: logs.join("\n"),
    weightAdaptations: weightResults.adaptations,
  };
}

// ── Signal 1: Consistent Completion ──────────────────────────────────────────
// "All sets completed for 2-3 consecutive sessions at a progression → advance"

function checkConsistentCompletion(
  sessions: SessionLog[],
  planned: PlannedSession[],
  progressions: UserProgression[],
  currentPhase: PlanPhase
): { decisions: SilentDecision[]; flags: AdaptationFlag[]; logs: string[] } {
  const decisions: SilentDecision[] = [];
  const flags: AdaptationFlag[] = [];
  const logs: string[] = [];

  // Don't auto-advance during deload or assessment
  if (currentPhase === "deload" || currentPhase === "assessment") {
    logs.push("Signal 1: Skipped — deload or assessment phase.");
    return { decisions, flags, logs };
  }

  // Group completed sets by exercise across recent sessions
  const exerciseHistory = buildExerciseHistory(sessions, planned);

  for (const [exerciseId, history] of Object.entries(exerciseHistory)) {
    const { plannedExercise, sessionResults } = history;
    if (!plannedExercise) continue;

    // Only consider moderate/easy exercises for auto-advancement
    // Challenging exercises are SUPPOSED to be hard — don't auto-advance
    if (plannedExercise.difficultyIntent === "challenging") continue;

    // Check: did they complete all prescribed sets/reps for N consecutive sessions?
    const recentResults = sessionResults.slice(-CONFIG.ADVANCE_THRESHOLD);
    if (recentResults.length < CONFIG.ADVANCE_THRESHOLD) continue;

    const allCompleted = recentResults.every(result => {
      const completionRate = result.totalRepsCompleted / result.totalRepsPlanned;
      return completionRate >= 0.95; // 95%+ counts as "completed"
    });

    if (allCompleted) {
      const nextProg = getNextProgression(plannedExercise.progressionId);
      if (nextProg) {
        decisions.push({
          decision: {
            type: "progress_exercise",
            exerciseId: plannedExercise.id,
            toProgressionId: nextProg.id,
          },
          signal: "consistent_completion",
          confidence: 0.85,
          reason: `Completed all sets/reps for ${recentResults.length} consecutive sessions on ${plannedExercise.name}. Advancing to ${nextProg.name}.`,
        });
        logs.push(`Signal 1: ${plannedExercise.name} → advance to ${nextProg.name} (${recentResults.length} clean sessions).`);
      } else {
        // At top of progression tree — suggest volume increase
        decisions.push({
          decision: {
            type: "adjust_volume",
            exerciseId: plannedExercise.id,
            newSets: plannedExercise.sets + 1,
            newReps: plannedExercise.reps,
          },
          signal: "consistent_completion",
          confidence: 0.75,
          reason: `At top of progression tree for ${plannedExercise.name}. Adding 1 set for continued overload.`,
        });
        logs.push(`Signal 1: ${plannedExercise.name} — top of tree, adding volume.`);
      }
    }
  }

  return { decisions, flags, logs };
}

// ── Signal 2: Exercise Skipping ──────────────────────────────────────────────
// "Exercise repeatedly skipped across sessions → flag for review, may swap"

function checkExerciseSkipping(
  sessions: SessionLog[],
  planned: PlannedSession[]
): { decisions: SilentDecision[]; flags: AdaptationFlag[]; logs: string[] } {
  const decisions: SilentDecision[] = [];
  const flags: AdaptationFlag[] = [];
  const logs: string[] = [];

  // Look at the last N sessions
  const recentSessions = sessions.slice(-CONFIG.SKIP_LOOKBACK_SESSIONS);
  if (recentSessions.length < 3) return { decisions, flags, logs }; // need enough data

  // For each planned exercise, count how many sessions it was skipped
  const skipCounts: Record<string, { count: number; totalAppearances: number; name: string; progressionId: string }> = {};

  for (const session of recentSessions) {
    const plannedSession = planned.find(p => p.id === session.plannedSessionId);
    if (!plannedSession) continue;

    for (const plannedEx of plannedSession.exercises) {
      if (!skipCounts[plannedEx.id]) {
        skipCounts[plannedEx.id] = { count: 0, totalAppearances: 0, name: plannedEx.name, progressionId: plannedEx.progressionId };
      }
      skipCounts[plannedEx.id].totalAppearances++;

      // Check if any sets were completed for this exercise
      const completedSetsForEx = session.completedSets.filter(
        s => s.exerciseId === plannedEx.id || s.exerciseId === plannedEx.progressionId
      );
      if (completedSetsForEx.length === 0) {
        skipCounts[plannedEx.id].count++;
      }
    }
  }

  // Flag exercises that were skipped repeatedly
  for (const [exerciseId, data] of Object.entries(skipCounts)) {
    if (data.count >= CONFIG.SKIP_THRESHOLD && data.totalAppearances >= 3) {
      const skipRate = data.count / data.totalAppearances;

      if (skipRate >= 0.5) {
        // Skipped more than half the time — suggest swap
        const prevProg = getPreviousProgression(data.progressionId);
        if (prevProg) {
          decisions.push({
            decision: {
              type: "swap_exercise",
              exerciseId,
              alternatives: [prevProg.id],
            },
            signal: "exercise_skipped",
            confidence: 0.75,
            reason: `${data.name} skipped ${data.count}/${data.totalAppearances} sessions. Possible discomfort, dislike, or equipment issue. Suggesting easier alternative.`,
          });
        }
        logs.push(`Signal 2: ${data.name} skipped ${data.count}/${data.totalAppearances} times. Suggesting swap.`);
      } else {
        // Skipped a few times — flag for monitoring
        flags.push({
          signal: "exercise_skipped",
          detail: `${data.name} skipped ${data.count}/${data.totalAppearances} recent sessions. Monitoring.`,
          severity: "warning",
          exerciseId,
          progressionId: data.progressionId,
        });
        logs.push(`Signal 2: ${data.name} skipped ${data.count}/${data.totalAppearances} times. Flagged for review.`);
      }
    }
  }

  return { decisions, flags, logs };
}

// ── Signal 3: Frequency Drop ─────────────────────────────────────────────────
// "Session frequency drops below plan → recalibrate weekly volume"

function checkFrequencyDrop(
  sessions: SessionLog[],
  mesocycle: Mesocycle
): { decisions: SilentDecision[]; flags: AdaptationFlag[]; logs: string[] } {
  const decisions: SilentDecision[] = [];
  const flags: AdaptationFlag[] = [];
  const logs: string[] = [];

  // Calculate planned sessions per week from the mesocycle
  const totalPlannedWeeks = mesocycle.weeks.length;
  if (totalPlannedWeeks === 0) return { decisions, flags, logs };

  const avgPlannedPerWeek = mesocycle.weeks.reduce(
    (sum, w) => sum + w.sessions.length, 0
  ) / totalPlannedWeeks;

  // Look at actual sessions in the last N weeks
  const now = new Date();
  const lookbackMs = CONFIG.FREQUENCY_LOOKBACK_WEEKS * 7 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - lookbackMs);

  const recentCompletedSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= cutoff && s.status === "completed";
  });

  const actualPerWeek = recentCompletedSessions.length / CONFIG.FREQUENCY_LOOKBACK_WEEKS;
  const frequencyRatio = actualPerWeek / avgPlannedPerWeek;

  if (frequencyRatio < CONFIG.FREQUENCY_THRESHOLD && recentCompletedSessions.length >= 2) {
    // User is training less than planned
    const newVolumeMultiplier = Math.max(0.6, frequencyRatio); // Don't drop below 60%

    flags.push({
      signal: "frequency_drop",
      detail: `Training ${actualPerWeek.toFixed(1)}x/week vs planned ${avgPlannedPerWeek.toFixed(1)}x/week (${(frequencyRatio * 100).toFixed(0)}%). Volume recalibration needed.`,
      severity: "action_needed",
    });

    // Adjust volume on all current exercises proportionally
    // We output a single "recalibrate" decision that the plan generator can act on
    decisions.push({
      decision: {
        type: "adjust_volume",
        exerciseId: "__all__", // special marker: applies to entire plan
        newSets: -1, // marker: use multiplier instead
        newReps: -1,
      },
      signal: "frequency_drop",
      confidence: 0.8,
      reason: `Frequency dropped to ${(frequencyRatio * 100).toFixed(0)}% of plan. Recalibrating weekly volume to match actual training rate. Multiplier: ${newVolumeMultiplier.toFixed(2)}.`,
    });

    logs.push(`Signal 3: Frequency at ${(frequencyRatio * 100).toFixed(0)}% (${actualPerWeek.toFixed(1)} vs ${avgPlannedPerWeek.toFixed(1)}/wk). Recalibrating.`);
  } else {
    logs.push(`Signal 3: Frequency OK (${actualPerWeek.toFixed(1)} vs ${avgPlannedPerWeek.toFixed(1)}/wk).`);
  }

  return { decisions, flags, logs };
}

// ── Signal 4: Reps Below Target ──────────────────────────────────────────────
// "Reps consistently below target on moderate/easy → evaluate regression"

function checkRepsBelowTarget(
  sessions: SessionLog[],
  planned: PlannedSession[],
  progressions: UserProgression[]
): { decisions: SilentDecision[]; flags: AdaptationFlag[]; logs: string[] } {
  const decisions: SilentDecision[] = [];
  const flags: AdaptationFlag[] = [];
  const logs: string[] = [];

  const recentSessions = sessions.slice(-CONFIG.COMPLETION_LOOKBACK_SESSIONS);
  if (recentSessions.length < 2) return { decisions, flags, logs };

  const exerciseHistory = buildExerciseHistory(recentSessions, planned);

  for (const [exerciseId, history] of Object.entries(exerciseHistory)) {
    const { plannedExercise, sessionResults } = history;
    if (!plannedExercise) continue;

    // Only flag moderate/easy exercises — challenging exercises are expected to be hard
    if (plannedExercise.difficultyIntent === "challenging") continue;

    // Need at least 2 sessions of data
    if (sessionResults.length < 2) continue;

    // Calculate average completion rate across recent sessions
    const avgCompletionRate = sessionResults.reduce(
      (sum, r) => sum + (r.totalRepsCompleted / r.totalRepsPlanned), 0
    ) / sessionResults.length;

    if (avgCompletionRate < CONFIG.MIN_COMPLETION_RATE) {
      const prevProg = getPreviousProgression(plannedExercise.progressionId);

      if (prevProg && sessionResults.length >= 3) {
        // Consistent underperformance across 3+ sessions → regress
        decisions.push({
          decision: {
            type: "regress_exercise",
            exerciseId: plannedExercise.id,
            toProgressionId: prevProg.id,
          },
          signal: "reps_below_target",
          confidence: 0.8,
          reason: `${plannedExercise.name}: avg ${(avgCompletionRate * 100).toFixed(0)}% completion rate on ${plannedExercise.difficultyIntent} exercise over ${sessionResults.length} sessions. Regressing to ${prevProg.name}.`,
        });
        logs.push(`Signal 4: ${plannedExercise.name} — ${(avgCompletionRate * 100).toFixed(0)}% completion → regressing to ${prevProg.name}.`);
      } else {
        // Early signal — flag for monitoring, don't act yet
        flags.push({
          signal: "reps_below_target",
          detail: `${plannedExercise.name}: ${(avgCompletionRate * 100).toFixed(0)}% completion rate on ${plannedExercise.difficultyIntent} exercise. Monitoring.`,
          severity: "warning",
          exerciseId: plannedExercise.id,
          progressionId: plannedExercise.progressionId,
        });
        logs.push(`Signal 4: ${plannedExercise.name} — ${(avgCompletionRate * 100).toFixed(0)}% completion. Flagged, not acting yet.`);
      }
    }
  }

  return { decisions, flags, logs };
}

// ── Weight Autoregulation ───────────────────────────────────────────────────
// Applies the autoregulation table to weighted exercises after every session.
// Maps perceivedDifficulty to RPE approximation, checks rep completion,
// outputs weight adjustment items for the adaptation queue.

function checkWeightAutoregulation(
  latestSession: SessionLog,
  plannedSessions: PlannedSession[],
): { adaptations: AdaptationItem[]; logs: string[] } {
  const adaptations: AdaptationItem[] = [];
  const logs: string[] = [];

  const planned = plannedSessions.find(p => p.id === latestSession.plannedSessionId);
  if (!planned) return { adaptations, logs };

  const allWeighted = planned.exercises.filter(ex =>
    ex.addedWeightKg !== undefined
    && ex.addedWeightKg > 0
    && (ex.exerciseRole === "main" || ex.exerciseRole === "volume")
  );

  // Deduplicate by progressionId — keep highest priority role (main > volume)
  const ROLE_PRIORITY: Record<string, number> = { main: 2, volume: 1 };
  const byProgId = new Map<string, PlannedExercise>();
  for (const ex of allWeighted) {
    const existing = byProgId.get(ex.progressionId);
    if (!existing || (ROLE_PRIORITY[ex.exerciseRole] ?? 0) > (ROLE_PRIORITY[existing.exerciseRole] ?? 0)) {
      byProgId.set(ex.progressionId, ex);
    }
  }
  const weightedExercises = Array.from(byProgId.values());

  for (const exercise of weightedExercises) {
    // Match completed sets from ALL exercises sharing this progressionId
    const completedSets = latestSession.completedSets.filter(
      s => s.exerciseId === exercise.id || s.exerciseId === exercise.progressionId
    );

    if (completedSets.length === 0) {
      logs.push(`Autoregulation: ${exercise.name} — no completed sets, skipping.`);
      continue;
    }

    const totalRepsPlanned = exercise.sets * exercise.reps;
    const totalRepsCompleted = completedSets.reduce((sum, s) => sum + s.repsCompleted, 0);
    const repsShort = totalRepsPlanned - totalRepsCompleted;

    const lastSet = completedSets[completedSets.length - 1];
    const lastSetMissed = lastSet ? (exercise.reps - lastSet.repsCompleted) : 0;

    const difficulties = completedSets
      .map(s => s.perceivedDifficulty)
      .filter(Boolean) as DifficultyIntent[];
    const dominant = getDominantDifficulty(difficulties);

    const result = applyAutoregulationTable(repsShort, lastSetMissed, dominant, exercise);

    if (result) {
      adaptations.push(result);
      logs.push(`Autoregulation: ${exercise.name} — ${result.change} (${result.reason})`);
    } else {
      logs.push(`Autoregulation: ${exercise.name} — no change needed.`);
    }
  }

  return { adaptations, logs };
}

function getDominantDifficulty(
  difficulties: DifficultyIntent[]
): DifficultyIntent | null {
  if (difficulties.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const d of difficulties) {
    counts[d] = (counts[d] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as DifficultyIntent;
}

function applyAutoregulationTable(
  totalRepsShort: number,
  lastSetMissed: number,
  difficulty: DifficultyIntent | null,
  exercise: PlannedExercise,
): AdaptationItem | null {
  const now = new Date().toISOString();
  const base = {
    exerciseKey: exercise.progressionId,
    exerciseName: exercise.name,
    createdAt: now,
    surfaced: false,
    userResponse: null as null,
    applied: false,
  };

  // Rule 5: Missed 2+ reps total
  if (totalRepsShort >= 2) {
    return {
      ...base,
      id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
      type: "weight_decrease",
      change: "-2.5kg next session",
      reason: `Missed ${totalRepsShort} reps on ${exercise.name}. Dropping weight to rebuild.`,
      weightDeltaKg: -2.5,
    };
  }

  // Rule 4: Missed 1 rep on last set only
  if (lastSetMissed === 1 && totalRepsShort === 1) {
    return {
      ...base,
      id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
      type: "weight_hold",
      change: "Same weight — retry",
      reason: `Missed 1 rep on last set of ${exercise.name}. Weight stays, retry next session.`,
      weightDeltaKg: 0,
    };
  }

  // All reps completed — check difficulty
  if (totalRepsShort <= 0 && difficulty) {
    // Rule 1: Easy = RPE below target → +2.5kg
    if (difficulty === "easy") {
      return {
        ...base,
        id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
        type: "weight_increase",
        change: "+2.5kg next session",
        reason: `All reps clean and felt easy on ${exercise.name}. Bumping weight.`,
        weightDeltaKg: 2.5,
      };
    }

    // Rule 2: Moderate = at target RPE → +1.25kg
    if (difficulty === "moderate") {
      return {
        ...base,
        id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
        type: "weight_increase",
        change: "+1.25kg next session",
        reason: `All reps clean at target effort on ${exercise.name}. Micro-loading.`,
        weightDeltaKg: 1.25,
      };
    }

    // Rule 3: Challenging = RPE above target → no change
    if (difficulty === "challenging") {
      return null;
    }
  }

  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ExerciseSessionResult {
  sessionId: string;
  totalRepsPlanned: number;
  totalRepsCompleted: number;
  setsPlanned: number;
  setsCompleted: number;
}

interface ExerciseHistory {
  plannedExercise: PlannedExercise | null;
  sessionResults: ExerciseSessionResult[];
}

/**
 * Build a per-exercise history from recent sessions.
 * Groups completed sets by exercise and calculates completion rates.
 */
function buildExerciseHistory(
  sessions: SessionLog[],
  planned: PlannedSession[]
): Record<string, ExerciseHistory> {
  const history: Record<string, ExerciseHistory> = {};

  for (const session of sessions) {
    const plannedSession = planned.find(p => p.id === session.plannedSessionId);
    if (!plannedSession) continue;

    for (const plannedEx of plannedSession.exercises) {
      if (!history[plannedEx.id]) {
        history[plannedEx.id] = {
          plannedExercise: plannedEx,
          sessionResults: [],
        };
      }

      // Find completed sets matching this exercise
      const completedSets = session.completedSets.filter(
        s => s.exerciseId === plannedEx.id || s.exerciseId === plannedEx.progressionId
      );

      const totalRepsPlanned = plannedEx.sets * plannedEx.reps;
      const totalRepsCompleted = completedSets.reduce(
        (sum, s) => sum + s.repsCompleted, 0
      );

      history[plannedEx.id].sessionResults.push({
        sessionId: session.id,
        totalRepsPlanned,
        totalRepsCompleted,
        setsPlanned: plannedEx.sets,
        setsCompleted: completedSets.length,
      });
    }
  }

  return history;
}

// ── Convenience: Run After Session ───────────────────────────────────────────
// Wraps runSilentAdaptation with the most common call pattern.

export function processSessionForAdaptation(
  sessionLog: SessionLog,
  allSessionHistory: SessionLog[],
  mesocycle: Mesocycle,
  userProgressions: UserProgression[]
): SilentAdaptationResult {
  // Gather planned sessions from the mesocycle
  const allPlannedSessions = mesocycle.weeks.flatMap(w => w.sessions);

  // Determine current phase from the session's planned session
  const plannedSession = allPlannedSessions.find(
    p => p.id === sessionLog.plannedSessionId
  );
  const currentPhase = plannedSession?.phase || "base_building";

  // Check if the user engaged the chat during this session
  // (No chat messages logged = no engagement)
  const chatEngaged = false; // Default: assume no engagement
  // In production, this would be: interactionLogs.some(l => l.type === "chat_message" && l.sessionId === sessionLog.id)

  // Get recent sessions (last 6, excluding current)
  const recentSessions = allSessionHistory
    .filter(s => s.id !== sessionLog.id && s.status === "completed")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, CONFIG.SKIP_LOOKBACK_SESSIONS);

  return runSilentAdaptation(
    sessionLog,
    recentSessions,
    allPlannedSessions,
    userProgressions,
    currentPhase,
    mesocycle,
    chatEngaged
  );
}
