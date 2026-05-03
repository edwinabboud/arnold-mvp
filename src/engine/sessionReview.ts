// =============================================================================
// ARNOLD — Session Review Engine
// Deterministic conversation tree for post-session feedback.
// Narrows from "How did it feel?" to specific exercise-level adaptations
// in 2-3 steps. No LLM needed — pure state machine.
//
// Flow:
//   1. User taps chip: "Way too easy" / "Felt solid" / "Way too hard"
//   2. If easy/hard: Arnold shows weighted exercises as chips
//   3. User picks exercise (or "All of them")
//   4. Arnold confirms the change → writes AdaptationItem to queue
//
// "Felt solid" = done immediately, no changes queued.
// =============================================================================

import type { PlannedExercise, PlannedSession } from "../types";
import type { AdaptationItem, AdaptationType } from "./adaptationQueue";

// ── Types ───────────────────────────────────────────────────────────────────

export type ReviewStep = "idle" | "awaiting_exercise" | "done";

export interface ReviewState {
  step: ReviewStep;
  overallFeel: "easy" | "hard" | null;
  sessionId: string;
  weightedExercises: Array<{ key: string; name: string; weight: number }>;
}

interface ReviewOption {
  id: string;
  label: string;
  action: "followup";
  value: string;
}

interface ReviewResult {
  newState: ReviewState;
  arnoldText: string;
  options?: ReviewOption[];
  adaptations?: AdaptationItem[];
}

// ── State ───────────────────────────────────────────────────────────────────

export function createReviewState(): ReviewState {
  return { step: "idle", overallFeel: null, sessionId: "", weightedExercises: [] };
}

// ── Detection ───────────────────────────────────────────────────────────────

/** Returns true if the text is part of the review flow (not general chat) */
export function isReviewMessage(text: string): boolean {
  return text.startsWith("The session felt ")
    || text.startsWith("__review_exercise__");
}

/** Parse the overall feel from the chip's value text */
export function parseOverallFeel(text: string): "easy" | "solid" | "hard" | null {
  const lower = text.toLowerCase();
  if (lower.includes("way too easy")) return "easy";
  if (lower.includes("about right") || lower.includes("solid")) return "solid";
  if (lower.includes("way too hard")) return "hard";
  return null;
}

// ── Step 1: Overall Feel ────────────────────────────────────────────────────

export function handleOverallFeel(
  feel: "easy" | "solid" | "hard",
  session: PlannedSession,
): ReviewResult {
  // "Felt solid" — no changes, done
  if (feel === "solid") {
    return {
      newState: { step: "done", overallFeel: null, sessionId: session.id, weightedExercises: [] },
      arnoldText: "Good. Weight stays where it is. See you next session.",
    };
  }

  // Get weighted exercises, deduplicated by progressionId
  const seen = new Set<string>();
  const weighted: PlannedExercise[] = [];
  for (const ex of session.exercises) {
    if (
      ex.addedWeightKg != null && ex.addedWeightKg > 0
      && (ex.exerciseRole === "main" || ex.exerciseRole === "volume")
      && !seen.has(ex.progressionId)
    ) {
      seen.add(ex.progressionId);
      weighted.push(ex);
    }
  }

  // No weighted exercises to adjust
  if (weighted.length === 0) {
    return {
      newState: { step: "done", overallFeel: feel, sessionId: session.id, weightedExercises: [] },
      arnoldText: feel === "easy"
        ? "Noted. No weighted exercises to adjust this session. We'll push harder next time."
        : "Noted. No weighted exercises to adjust. We'll dial it back next session.",
    };
  }

  const delta = feel === "easy" ? 2.5 : -2.5;
  const sign = delta > 0 ? "+" : "";

  // Only 1 weighted exercise — skip selection, apply directly
  if (weighted.length === 1) {
    const ex = weighted[0];
    return {
      newState: { step: "done", overallFeel: feel, sessionId: session.id, weightedExercises: [] },
      arnoldText: `${sign}${delta}kg on ${ex.name} next session.`,
      adaptations: [buildAdaptation(ex.progressionId, ex.name, delta, feel)],
    };
  }

  // Multiple weighted exercises — ask which one
  const options: ReviewOption[] = weighted.map((ex, i) => ({
    id: `review_ex_${i}`,
    label: `${ex.name} (+${ex.addedWeightKg}kg)`,
    action: "followup" as const,
    value: `__review_exercise__${ex.progressionId}__${ex.name}`,
  }));

  options.push({
    id: "review_ex_all",
    label: "All of them",
    action: "followup" as const,
    value: "__review_exercise__ALL__all weighted exercises",
  });

  return {
    newState: {
      step: "awaiting_exercise",
      overallFeel: feel,
      sessionId: session.id,
      weightedExercises: weighted.map(ex => ({
        key: ex.progressionId,
        name: ex.name,
        weight: ex.addedWeightKg ?? 0,
      })),
    },
    arnoldText: feel === "easy"
      ? "Which exercise felt too easy?"
      : "Which one was too heavy?",
    options,
  };
}

// ── Step 2: Exercise Selection ──────────────────────────────────────────────

export function handleExerciseSelection(
  state: ReviewState,
  input: string,
): ReviewResult {
  const match = input.match(/__review_exercise__(.+?)__(.+)/);
  if (!match) {
    return {
      newState: { ...state, step: "done" },
      arnoldText: "Got it. Keeping things as they are.",
      adaptations: [],
    };
  }

  const [, progressionId, exerciseName] = match;
  const delta = state.overallFeel === "easy" ? 2.5 : -2.5;
  const sign = delta > 0 ? "+" : "";

  // "All of them"
  if (progressionId === "ALL") {
    const adaptations = state.weightedExercises.map((ex, i) =>
      buildAdaptation(ex.key, ex.name, delta, state.overallFeel!, `_${i}`)
    );
    const names = state.weightedExercises.map(e => e.name).join(", ");
    return {
      newState: { ...state, step: "done" },
      arnoldText: `${sign}${delta}kg across the board — ${names}. Applied for next session.`,
      adaptations,
    };
  }

  // Single exercise
  return {
    newState: { ...state, step: "done" },
    arnoldText: `${sign}${delta}kg on ${exerciseName} next session.`,
    adaptations: [buildAdaptation(progressionId, exerciseName, delta, state.overallFeel!)],
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildAdaptation(
  exerciseKey: string,
  exerciseName: string,
  delta: number,
  feel: "easy" | "hard",
  idSuffix: string = "",
): AdaptationItem {
  const sign = delta > 0 ? "+" : "";
  return {
    id: `review_${Date.now()}${idSuffix}`,
    type: (delta > 0 ? "weight_increase" : "weight_decrease") as AdaptationType,
    exerciseKey,
    exerciseName,
    change: `${sign}${delta}kg next session`,
    reason: `User reported ${exerciseName} felt ${feel === "easy" ? "too easy" : "too hard"} during session review.`,
    weightDeltaKg: delta,
    createdAt: new Date().toISOString(),
    surfaced: true,
    userResponse: "approved",
    applied: false,
  };
}
