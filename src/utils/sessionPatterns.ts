import { MovementPattern, PlannedExercise, ProgressionLevel } from "../types";

/**
 * Walks an exercise list, looks up each exercise's progression in the supplied
 * progressions array, and returns the deduplicated set of movement patterns
 * trained. warmup/cooldown/skill_practice roles are skipped — they don't
 * define the session's identity (skill_practice is preparatory submaximal CNS
 * work, not pattern-defining). skill_isometric IS pattern-defining (a planche
 * hold IS the push pattern) and stays walked. Returns [] if no patterns can
 * be resolved (e.g. empty session, unknown progressionIds).
 *
 * Pure helper — receives `progressions` as a parameter so the caller controls
 * the lookup table and the function stays trivially testable.
 */
export function derivePatternsFromExercises(
  exercises: PlannedExercise[],
  progressions: ProgressionLevel[],
): MovementPattern[] {
  const patternSet = new Set<MovementPattern>();
  for (const ex of exercises) {
    if (
      ex.exerciseRole === "warmup" ||
      ex.exerciseRole === "cooldown" ||
      ex.exerciseRole === "skill_practice"
    ) continue;
    const prog = progressions.find(p => p.id === ex.progressionId);
    if (prog) patternSet.add(prog.pattern);
  }
  if (patternSet.size === 0) {
    console.warn("[ARNOLD] derivePatternsFromExercises: no patterns resolved");
    return [];
  }
  return Array.from(patternSet);
}
