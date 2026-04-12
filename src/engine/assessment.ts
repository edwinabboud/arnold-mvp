// =============================================================================
// ARNOLD — Assessment Week Builder
// Generates a test week to establish baselines across all movement patterns.
// Results feed into the mesocycle generator.
// =============================================================================

import {
  PlannedExercise,
  PlannedSession,
  PlanWeek,
  ProgramPath,
  Schedule,
  DifficultyIntent,
} from "../types";
import { PROGRESSIONS, getProgressionTree } from "../data/progressions";

// ── Assessment Exercise Builder ─────────────────────────────────────────────

/**
 * For each movement pattern, we test at 3 levels:
 *   - Entry level (order 0-1): can they do the basics?
 *   - Mid level (order 2-4): where's their working level?
 *   - Advanced (order 5+): how far can they push?
 *
 * The test is simple: attempt the prescribed reps. If completed,
 * try the next level. The highest completed level = their baseline.
 */

interface AssessmentExercise extends PlannedExercise {
  assessmentType: "max_reps" | "max_hold" | "pass_fail";
}

function buildAssessmentExercise(
  progressionId: string,
  order: number
): AssessmentExercise {
  const prog = PROGRESSIONS.find((p) => p.id === progressionId);
  if (!prog) throw new Error(`Progression ${progressionId} not found`);

  return {
    id: `assess_${progressionId}`,
    progressionId: prog.id,
    name: `TEST: ${prog.name}`,
    sets: prog.isIsometric ? 1 : 2,
    reps: prog.isIsometric
      ? prog.targetReps
      : Math.ceil(prog.targetReps * 0.75),
    restSeconds: 120,
    difficultyIntent: "moderate" as DifficultyIntent,
    exerciseRole: "main" as const,
    notes: `Assessment — ${prog.isIsometric ? "hold as long as you can" : "do as many clean reps as possible"}. ${prog.cues.join(". ")}.`,
    assessmentType: prog.isIsometric ? "max_hold" : "max_reps",
  };
}

// ── Movement Pattern Groupings for Splits ───────────────────────────────────

const SPLIT_PATTERNS = {
  push_pull_legs: {
    push: [
      { patterns: ["push", "skill"], label: "Push + Skills Assessment" },
      { patterns: ["pull", "core"], label: "Pull + Core Assessment" },
      { patterns: ["legs"], label: "Legs Assessment" },
    ],
  },
  upper_lower: {
    groups: [
      { patterns: ["push", "pull", "skill"], label: "Upper Body Assessment" },
      { patterns: ["legs", "core"], label: "Lower Body + Core Assessment" },
    ],
  },
  full_body: {
    groups: [
      { patterns: ["push", "pull", "legs", "core", "skill"], label: "Full Body Assessment" },
    ],
  },
};

// ── Assessment Week Generator ───────────────────────────────────────────────

/**
 * Build test sessions that cover all movement patterns the user needs,
 * distributed across their preferred training days.
 */
export function buildAssessmentWeek(
  schedule: Schedule,
  programPath: ProgramPath
): PlanWeek {
  const mesocycleId = `meso_${Date.now()}`;
  const weekId = `week_assess_${Date.now()}`;

  // Determine which patterns to test based on goals
  const patternsToTest = getRequiredPatterns(programPath);

  // Pick test levels for each pattern (entry, mid, advanced)
  const testExercises = buildTestExercises(patternsToTest);

  // Distribute across sessions based on split
  const sessions = distributeToSessions(
    testExercises,
    schedule,
    weekId
  );

  return {
    id: weekId,
    mesocycleId,
    weekNumber: 0, // assessment is week 0
    phase: "assessment",
    sessions,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getRequiredPatterns(programPath: ProgramPath): string[] {
  switch (programPath) {
    case "street_lifter": return ["pull", "push", "legs", "core"];
    case "skill_builder": return ["pull", "push", "core", "skill"];
    case "hybrid_athlete": return ["pull", "push", "legs", "core", "skill"];
    default: return ["pull", "push", "legs", "core"];
  }
}

function buildTestExercises(
  patterns: string[]
): Map<string, AssessmentExercise[]> {
  const result = new Map<string, AssessmentExercise[]>();

  for (const pattern of patterns) {
    const tree = getProgressionTree(pattern);
    if (tree.length === 0) continue;

    const exercises: AssessmentExercise[] = [];

    // Entry level: order 0 or 1
    const entry = tree.find((p) => p.order <= 1) || tree[0];
    exercises.push(buildAssessmentExercise(entry.id, entry.order));

    // Mid level: order 2-4
    const mid = tree.find((p) => p.order >= 2 && p.order <= 4);
    if (mid) exercises.push(buildAssessmentExercise(mid.id, mid.order));

    // Advanced: order 5+
    const advanced = tree.find((p) => p.order >= 5);
    if (advanced) exercises.push(buildAssessmentExercise(advanced.id, advanced.order));

    result.set(pattern, exercises);
  }

  return result;
}

function distributeToSessions(
  testExercises: Map<string, AssessmentExercise[]>,
  schedule: Schedule,
  weekId: string
): PlannedSession[] {
  const sessions: PlannedSession[] = [];
  const allPatterns = Array.from(testExercises.keys());

  // Group patterns into sessions based on split
  let sessionGroups: { patterns: string[]; label: string }[];

  switch (schedule.split) {
    case "push_pull_legs":
      sessionGroups = [
        { patterns: ["push", "skill"], label: "Push + Skills Test" },
        { patterns: ["pull", "core"], label: "Pull + Core Test" },
        { patterns: ["legs"], label: "Legs Test" },
      ];
      break;
    case "upper_lower":
      sessionGroups = [
        { patterns: ["push", "pull", "skill"], label: "Upper Body Test" },
        { patterns: ["legs", "core"], label: "Lower + Core Test" },
      ];
      break;
    case "full_body":
    default:
      // Spread across available days
      if (schedule.daysPerWeek >= 3) {
        sessionGroups = [
          { patterns: ["push", "core"], label: "Push + Core Test" },
          { patterns: ["pull", "skill"], label: "Pull + Skills Test" },
          { patterns: ["legs"], label: "Legs Test" },
        ];
      } else {
        sessionGroups = [
          { patterns: ["push", "pull", "legs", "core", "skill"], label: "Full Assessment" },
        ];
      }
      break;
  }

  // Repeat groups to fill available days if needed
  const days = schedule.preferredDays.slice(0, schedule.daysPerWeek);

  for (let i = 0; i < days.length && i < sessionGroups.length; i++) {
    const group = sessionGroups[i % sessionGroups.length];
    const exercises: PlannedExercise[] = [];

    for (const pattern of group.patterns) {
      const patternTests = testExercises.get(pattern);
      if (patternTests) {
        exercises.push(...patternTests);
      }
    }

    if (exercises.length === 0) continue;

    // Build warm-up
    const warmUp = buildAssessmentWarmup(group.patterns);

    sessions.push({
      id: `assess_session_${i}_${Date.now()}`,
      weekId,
      dayOfWeek: days[i],
      label: `Assessment — ${group.label}`,
      phase: "assessment",
      exercises,
      warmUpExercises: warmUp,
      cooldownExercises: buildCooldown(group.patterns),
    });
  }

  return sessions;
}

function buildAssessmentWarmup(patterns: string[]): PlannedExercise[] {
  const warmup: PlannedExercise[] = [];

  // General activation
  warmup.push({
    id: "warmup_jacks",
    progressionId: "warmup",
    name: "Jumping Jacks",
    sets: 1,
    reps: 30,
    restSeconds: 0,
    difficultyIntent: "easy",
    exerciseRole: "warmup" as const,
    notes: "Get the blood flowing",
  });

  warmup.push({
    id: "warmup_arm_circles",
    progressionId: "warmup",
    name: "Arm Circles",
    sets: 1,
    reps: 20,
    restSeconds: 0,
    difficultyIntent: "easy",
    exerciseRole: "warmup" as const,
    notes: "10 forward, 10 backward",
  });

  // Pattern-specific
  if (patterns.includes("push")) {
    warmup.push({
      id: "warmup_scap_push",
      progressionId: "warmup",
      name: "Scapular Push-ups",
      sets: 1,
      reps: 10,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "warmup" as const,
      notes: "Protract and retract at top of push-up position",
    });
  }

  if (patterns.includes("pull")) {
    warmup.push({
      id: "warmup_band_pull",
      progressionId: "warmup",
      name: "Band Pull-Aparts",
      sets: 1,
      reps: 15,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "warmup" as const,
      notes: "Squeeze shoulder blades together",
    });
    warmup.push({
      id: "warmup_dead_hang",
      progressionId: "warmup",
      name: "Dead Hang",
      sets: 1,
      reps: 20,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "warmup" as const,
      notes: "20-second hang — open up the shoulders",
    });
  }

  if (patterns.includes("legs")) {
    warmup.push({
      id: "warmup_leg_swings",
      progressionId: "warmup",
      name: "Leg Swings",
      sets: 1,
      reps: 20,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "warmup" as const,
      notes: "10 per leg, front to back",
    });
  }

  if (patterns.includes("skill")) {
    warmup.push({
      id: "warmup_wrist_prep",
      progressionId: "warmup",
      name: "Wrist Preparation",
      sets: 1,
      reps: 10,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "warmup" as const,
      notes: "Circles, flexion, extension — protect your wrists",
    });
  }

  return warmup;
}

function buildCooldown(patterns: string[]): PlannedExercise[] {
  const cooldown: PlannedExercise[] = [];

  if (patterns.includes("push") || patterns.includes("pull")) {
    cooldown.push({
      id: "cool_shoulder",
      progressionId: "cooldown",
      name: "Shoulder Stretch",
      sets: 1,
      reps: 30,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "cooldown" as const,
      notes: "30 seconds per side — cross-body and overhead",
    });
  }

  if (patterns.includes("legs")) {
    cooldown.push({
      id: "cool_hip_flexor",
      progressionId: "cooldown",
      name: "Hip Flexor Stretch",
      sets: 1,
      reps: 30,
      restSeconds: 0,
      difficultyIntent: "easy",
      exerciseRole: "cooldown" as const,
      notes: "30 seconds per side — lunge position",
    });
  }

  cooldown.push({
    id: "cool_hang",
    progressionId: "cooldown",
    name: "Passive Hang / Stretch",
    sets: 1,
    reps: 30,
    restSeconds: 0,
    difficultyIntent: "easy",
    exerciseRole: "cooldown" as const,
    notes: "Decompress the spine. Breathe.",
  });

  return cooldown;
}

// ── Assessment Result Processing ────────────────────────────────────────────

export interface AssessmentResult {
  progressionId: string;
  pattern: string;
  repsCompleted: number;
  holdSeconds?: number;
  feltDifficulty: DifficultyIntent;
}

/**
 * Takes raw assessment results and determines the user's working level
 * for each movement pattern.
 *
 * Returns a map of pattern → progressionId (the level they should train at).
 */
export function processAssessmentResults(
  results: AssessmentResult[]
): Map<string, string> {
  const placements = new Map<string, string>();

  // Group by pattern
  const byPattern = new Map<string, AssessmentResult[]>();
  for (const r of results) {
    const existing = byPattern.get(r.pattern) || [];
    existing.push(r);
    byPattern.set(r.pattern, existing);
  }

  for (const [pattern, patternResults] of byPattern) {
    const tree = getProgressionTree(pattern);

    // Find the highest level they completed successfully
    // "Successfully" = completed target reps at moderate or easy difficulty
    let bestLevel = tree[0]; // default to entry

    for (const result of patternResults) {
      const prog = PROGRESSIONS.find((p) => p.id === result.progressionId);
      if (!prog) continue;

      const targetReps = prog.isIsometric
        ? prog.targetReps
        : Math.ceil(prog.targetReps * 0.75);

      const completed =
        result.repsCompleted >= targetReps &&
        result.feltDifficulty !== "challenging";

      if (completed && prog.order >= bestLevel.order) {
        // They passed this level — their working level is this or one above
        const nextInTree = tree.find((p) => p.order === prog.order + 1);
        bestLevel = nextInTree || prog;
      } else if (
        result.repsCompleted >= targetReps &&
        result.feltDifficulty === "challenging"
      ) {
        // Completed but found it hard — this IS their working level
        if (prog.order >= bestLevel.order) {
          bestLevel = prog;
        }
      }
    }

    placements.set(pattern, bestLevel.id);
  }

  return placements;
}
