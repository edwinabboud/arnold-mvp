// =============================================================================
// ARNOLD — Coaching Rules Engine (Section 5 of spec)
// Deterministic decision logic. No AI needed for these decisions.
// =============================================================================

import {
  CoachingDecision,
  CompletedSet,
  DifficultyIntent,
  PainReport,
  PlanPhase,
  PlannedExercise,
  SessionLog,
  UserProgression,
} from "../types";
import { getNextProgression, getPreviousProgression } from "../data/progressions";

// ── 5.1 Pain / Discomfort Logic ─────────────────────────────────────────────

export function handlePainReport(
  pain: PainReport,
  recentPain: PainReport[],
  exercise: PlannedExercise
): CoachingDecision {
  const severity = pain.severity;

  // Severe: stop immediately
  if (severity >= 8) {
    return {
      type: "stop_exercise",
      exerciseId: exercise.id,
      reason: `Pain level ${severity}/10 on ${pain.bodyArea}. Stopping exercise immediately.`,
    };
  }

  // Moderate: reduce intensity, consider swap
  if (severity >= 6) {
    return {
      type: "swap_exercise",
      exerciseId: exercise.id,
      alternatives: findAlternatives(exercise),
    };
  }

  // Mild: log and monitor
  // Check if this body area has been reported in recent sessions
  const recurring = recentPain.filter(
    (p) => p.bodyArea === pain.bodyArea && p.severity >= 3
  );

  if (recurring.length >= 2) {
    // Recurring mild pain → add prehab
    return {
      type: "add_prehab",
      exercises: generatePrehabExercises(pain.bodyArea),
    };
  }

  return {
    type: "no_change",
    reason: `Mild discomfort (${severity}/10) on ${pain.bodyArea}. Logged. Monitoring.`,
  };
}

// ── 5.2 "That Felt Too Easy" Logic ──────────────────────────────────────────

export function handleTooEasy(
  exercise: PlannedExercise,
  phase: PlanPhase
): CoachingDecision {
  switch (phase) {
    case "deload":
      return {
        type: "no_change",
        reason: "Deload week — this is by design. Trust the process.",
      };

    case "intensity":
    case "strength":
    case "peaking": {
      const next = getNextProgression(exercise.progressionId);
      if (next) {
        return {
          type: "progress_exercise",
          exerciseId: exercise.id,
          toProgressionId: next.id,
        };
      }
      // At top of tree — add volume instead
      return {
        type: "adjust_volume",
        exerciseId: exercise.id,
        newSets: exercise.sets + 1,
        newReps: exercise.reps,
      };
    }

    case "assessment":
      return {
        type: "no_change",
        reason: "Assessment phase — noted. Adjusting baseline upward.",
      };

    default:
      return {
        type: "adjust_volume",
        exerciseId: exercise.id,
        newSets: exercise.sets,
        newReps: exercise.reps + 2,
      };
  }
}

// ── 5.3 "Couldn't Finish Sets" Logic ────────────────────────────────────────

export function handleCouldntFinish(
  exercise: PlannedExercise,
  recentSessions: SessionLog[],
  progression: UserProgression
): CoachingDecision {
  const tag = exercise.difficultyIntent;

  switch (tag) {
    case "challenging":
      // Expected — this is the point
      return {
        type: "no_change",
        reason: "This was meant to push you. Struggling is progress.",
      };

    case "moderate": {
      // Check if it's a one-off or a pattern
      const recentFailures = countRecentFailures(
        exercise.progressionId,
        recentSessions
      );
      if (recentFailures >= 2) {
        const prev = getPreviousProgression(exercise.progressionId);
        if (prev) {
          return {
            type: "regress_exercise",
            exerciseId: exercise.id,
            toProgressionId: prev.id,
          };
        }
      }
      return {
        type: "no_change",
        reason: "One rough session. Happens. We'll see how next time goes.",
      };
    }

    case "easy": {
      // Significant overestimation — regress immediately
      const prev = getPreviousProgression(exercise.progressionId);
      if (prev) {
        return {
          type: "regress_exercise",
          exerciseId: exercise.id,
          toProgressionId: prev.id,
        };
      }
      return {
        type: "adjust_volume",
        exerciseId: exercise.id,
        newSets: exercise.sets,
        newReps: Math.max(1, exercise.reps - 2),
      };
    }

    default:
      return { type: "no_change", reason: "Logged." };
  }
}

// ── 5.4 Missed Training Time ────────────────────────────────────────────────

export type BreakType = "active" | "inactive" | "illness_injury";

export function handleMissedTime(
  breakType: BreakType,
  daysMissed: number
): {
  regressionWeeks: number;
  planShiftWeeks: number;
  requiresRetest: boolean;
  message: string;
} {
  switch (breakType) {
    case "active":
      return {
        regressionWeeks: 1,
        planShiftWeeks: Math.ceil(daysMissed / 7),
        requiresRetest: false,
        message:
          "You stayed active — nice. Minor step back, then we're rolling.",
      };

    case "inactive":
      return {
        regressionWeeks: Math.min(3, Math.ceil(daysMissed / 5)),
        planShiftWeeks: Math.ceil(daysMissed / 5) + 1,
        requiresRetest: daysMissed > 14,
        message:
          "No judgment. We'll ease back in and re-test a few things.",
      };

    case "illness_injury":
      return {
        regressionWeeks: 0, // handled by re-assessment
        planShiftWeeks: 0, // plan paused entirely
        requiresRetest: true,
        message:
          "Health first. We'll do a careful re-assessment before loading up again.",
      };
  }
}

// ── Progression Advancement Check ───────────────────────────────────────────

export function shouldAdvanceProgression(
  progression: UserProgression,
  exercise: PlannedExercise
): boolean {
  // Advance when: 2-3 consecutive sessions completed at moderate/easy
  return (
    progression.consecutiveSuccesses >= 2 &&
    (exercise.difficultyIntent === "moderate" ||
      exercise.difficultyIntent === "easy")
  );
}

export function shouldRegressProgression(
  progression: UserProgression,
  recentPain: PainReport[],
  exercise: PlannedExercise
): boolean {
  // Regress when: fails on moderate/easy OR pain >6
  const painOnMovement = recentPain.filter(
    (p) => p.exerciseId === exercise.id && p.severity > 6
  );
  return painOnMovement.length > 0;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findAlternatives(exercise: PlannedExercise): string[] {
  // Returns IDs of alternative exercises from the same movement pattern
  // In a full implementation this queries the progression tree
  const prev = getPreviousProgression(exercise.progressionId);
  return prev ? [prev.id] : [];
}

function generatePrehabExercises(bodyArea: string): PlannedExercise[] {
  // Simplified prehab prescription — in production this would be a larger database
  const prehabMap: Record<string, PlannedExercise> = {
    shoulder: {
      id: "prehab_shoulder_01",
      progressionId: "prehab",
      name: "Shoulder Dislocates with Band",
      sets: 2,
      reps: 15,
      restSeconds: 30,
      difficultyIntent: "easy",
    },
    elbow: {
      id: "prehab_elbow_01",
      progressionId: "prehab",
      name: "Wrist Curls & Extensions",
      sets: 2,
      reps: 15,
      restSeconds: 30,
      difficultyIntent: "easy",
    },
    wrist: {
      id: "prehab_wrist_01",
      progressionId: "prehab",
      name: "Wrist Circles & Stretches",
      sets: 2,
      reps: 10,
      restSeconds: 30,
      difficultyIntent: "easy",
    },
    knee: {
      id: "prehab_knee_01",
      progressionId: "prehab",
      name: "Terminal Knee Extensions",
      sets: 2,
      reps: 15,
      restSeconds: 30,
      difficultyIntent: "easy",
    },
    lower_back: {
      id: "prehab_back_01",
      progressionId: "prehab",
      name: "Cat-Cow Stretches",
      sets: 2,
      reps: 10,
      restSeconds: 30,
      difficultyIntent: "easy",
    },
  };

  const exercise = prehabMap[bodyArea];
  return exercise ? [exercise] : [];
}

function countRecentFailures(
  progressionId: string,
  recentSessions: SessionLog[]
): number {
  let failures = 0;
  for (const session of recentSessions.slice(-5)) {
    for (const set of session.completedSets) {
      // A "failure" is completing < 80% of target reps on this progression
      if (set.exerciseId === progressionId) {
        // Simplified check — in production we'd compare against the planned reps
        if (set.perceivedDifficulty === "challenging") {
          failures++;
        }
      }
    }
  }
  return failures;
}
