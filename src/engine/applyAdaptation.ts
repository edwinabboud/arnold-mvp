// =============================================================================
// ARNOLD — Apply Adaptation Decisions
// Takes SilentAdaptationResult and applies progression/regression changes
// to the mesocycle and user progressions.
// =============================================================================

import { Mesocycle, PlannedExercise, ProgressionLevel, UserProgression } from "../types";
import { PROGRESSIONS } from "../data/progressions";
import { SilentAdaptationResult, SilentDecision } from "./silentAdaptation";

interface AdaptationApplied {
  updatedMesocycle: Mesocycle;
  updatedProgressions: UserProgression[];
  changesApplied: string[];
}

function getOldProgressionId(exerciseId: string, mesocycle: Mesocycle): string | null {
  for (const week of mesocycle.weeks) {
    for (const session of week.sessions) {
      const allExercises = [
        ...session.exercises,
        ...session.warmUpExercises,
        ...session.cooldownExercises,
      ];
      const found = allExercises.find(e => e.id === exerciseId);
      if (found) return found.progressionId;
    }
  }
  return null;
}

function swapProgressionInMesocycle(
  mesocycle: Mesocycle,
  oldProgressionId: string,
  newProgression: ProgressionLevel
): Mesocycle {
  const swapExercise = (ex: PlannedExercise): PlannedExercise => {
    if (ex.progressionId !== oldProgressionId) return ex;
    return {
      ...ex,
      progressionId: newProgression.id,
      name: newProgression.name,
      reps: newProgression.targetReps,
      sets: newProgression.targetSets,
      notes: newProgression.cues[0] || ex.notes,
    };
  };

  return {
    ...mesocycle,
    weeks: mesocycle.weeks.map(week => ({
      ...week,
      sessions: week.sessions.map(session => ({
        ...session,
        exercises: session.exercises.map(swapExercise),
        warmUpExercises: session.warmUpExercises.map(swapExercise),
        cooldownExercises: session.cooldownExercises.map(swapExercise),
      })),
    })),
  };
}

export function applyAdaptationDecisions(
  result: SilentAdaptationResult,
  mesocycle: Mesocycle,
  progressions: UserProgression[]
): AdaptationApplied {
  let updatedMesocycle = JSON.parse(JSON.stringify(mesocycle)) as Mesocycle;
  let updatedProgressions = [...progressions];
  const changesApplied: string[] = [];

  for (const sd of result.decisions) {
    const d = sd.decision;

    if (d.type === "progress_exercise") {
      const oldProgId = getOldProgressionId(d.exerciseId, updatedMesocycle);

      updatedProgressions = updatedProgressions.map(p => {
        if (p.progressionId === oldProgId) {
          return { ...p, status: "mastered" as const, consecutiveSuccesses: 0 };
        }
        if (p.progressionId === d.toProgressionId) {
          return { ...p, status: "active" as const, consecutiveSuccesses: 0 };
        }
        return p;
      });

      const newProg = PROGRESSIONS.find(p => p.id === d.toProgressionId);
      if (newProg && oldProgId) {
        updatedMesocycle = swapProgressionInMesocycle(updatedMesocycle, oldProgId, newProg);
        changesApplied.push(`Advanced: ${oldProgId} → ${newProg.name} (${d.toProgressionId})`);
      }
    }

    if (d.type === "regress_exercise") {
      const oldProgId = getOldProgressionId(d.exerciseId, updatedMesocycle);

      updatedProgressions = updatedProgressions.map(p => {
        if (p.progressionId === oldProgId) {
          return { ...p, status: "locked" as const, consecutiveSuccesses: 0 };
        }
        if (p.progressionId === d.toProgressionId) {
          return { ...p, status: "active" as const, consecutiveSuccesses: 0 };
        }
        return p;
      });

      const newProg = PROGRESSIONS.find(p => p.id === d.toProgressionId);
      if (newProg && oldProgId) {
        updatedMesocycle = swapProgressionInMesocycle(updatedMesocycle, oldProgId, newProg);
        changesApplied.push(`Regressed: ${oldProgId} → ${newProg.name} (${d.toProgressionId})`);
      }
    }

    if (d.type === "adjust_volume" || d.type === "swap_exercise") {
      changesApplied.push(`[Logged, not applied] ${d.type}: ${sd.reason}`);
    }
  }

  return { updatedMesocycle, updatedProgressions, changesApplied };
}
