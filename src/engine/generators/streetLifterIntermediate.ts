// =============================================================================
// ARNOLD — Street Lifter Intermediate Plan Generator
// 12-week Push/Pull/Push+Pull. Ramp-up sets, variation cycling, max(-2)
// finisher, phase-specific set/rep schemes. From Street Lifter Bible v1.1.
// =============================================================================

import {
  DifficultyIntent,
  ExerciseRole,
  Mesocycle,
  PlanPhase,
  PlanWeek,
  PlannedExercise,
  PlannedSession,
  Schedule,
  UserBenchmarks,
  UserProgression,
} from "../../types";
import { applyTierCutsToMesocycle } from "../planGenerator";
import { PROGRESSIONS } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";
import { buildE1RMProfile, getTargetWeight, E1RMProfile } from "../weightEngine";
import { getRampFloor } from "../exerciseFloors";
import { derivePatternsFromExercises } from "../../utils/sessionPatterns";

// ── Phase Template ──────────────────────────────────────────────────────────

const INTERMEDIATE_PHASES: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "accumulation", weeks: 4 },
  { phase: "deload", weeks: 1 },
  { phase: "strength", weeks: 4 },
  { phase: "deload", weeks: 1 },
  { phase: "peaking", weeks: 1 },
  { phase: "test", weeks: 1 },
];

// ── Phase Programming ───────────────────────────────────────────────────────

const PHASE_PROGRAMMING: Record<string, { sets: number; reps: number; rpe: number; intent: DifficultyIntent }> = {
  accumulation: { sets: 4, reps: 6, rpe: 7.5, intent: "moderate" },
  strength:     { sets: 4, reps: 4, rpe: 8.5, intent: "challenging" },
  peaking:      { sets: 3, reps: 1, rpe: 9, intent: "challenging" },
  test:         { sets: 1, reps: 1, rpe: 10, intent: "challenging" },
  deload:       { sets: 2, reps: 6, rpe: 5, intent: "easy" },
};

// ── Variation Cycling ───────────────────────────────────────────────────────

const DIP_VARIATIONS: Array<{ code: string; name: string; sets: number; reps: number }> = [
  { code: "double_pause", name: "Double Pause Dips", sets: 3, reps: 5 },
  { code: "tempo_4s", name: "Tempo Dips (4s eccentric)", sets: 3, reps: 6 },
  { code: "paused_bottom", name: "Paused Bottom Dips", sets: 3, reps: 5 },
  { code: "banded_neck", name: "Banded Dips", sets: 3, reps: 8 },
];

const PULLUP_VARIATIONS: Array<{ code: string; name: string; sets: number; reps: number }> = [
  { code: "paused_top", name: "Paused Pull-ups (3s top)", sets: 3, reps: 3 },
  { code: "deadstop", name: "Deadstop Pull-ups", sets: 3, reps: 4 },
  { code: "half_top", name: "Half-Rep Pull-ups (top)", sets: 3, reps: 4 },
  { code: "clean", name: "Clean Pull-ups (max volume)", sets: 3, reps: 7 },
];

// ── Wave Loading ────────────────────────────────────────────────────────────

/** Wave loading adjusts reps within a phase block */
function getWaveReps(phase: PlanPhase, weekInPhase: number): number {
  const base = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.accumulation;

  if (phase === "accumulation") {
    // Wk1: 6, Wk2: 7, Wk3: 8, Wk4: 6 (variation emphasis)
    return [6, 7, 8, 6][weekInPhase] || base.reps;
  }
  if (phase === "strength") {
    // Wk1: 5, Wk2: 4, Wk3: 3, Wk4: 4 (variation emphasis)
    return [5, 4, 3, 4][weekInPhase] || base.reps;
  }
  return base.reps;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeExercise(
  id: string,
  progressionId: string,
  name: string,
  role: ExerciseRole,
  sets: number,
  reps: number,
  restSeconds: number,
  intent: DifficultyIntent,
  opts?: { notes?: string; variationCode?: string; rpeTarget?: number; holdSeconds?: number },
): PlannedExercise {
  return {
    id,
    progressionId,
    name,
    sets,
    reps,
    restSeconds,
    difficultyIntent: intent,
    exerciseRole: role,
    ...(opts?.notes ? { notes: opts.notes } : {}),
    ...(opts?.variationCode ? { variationCode: opts.variationCode } : {}),
    ...(opts?.rpeTarget ? { rpeTarget: opts.rpeTarget } : {}),
    ...(opts?.holdSeconds ? { holdSeconds: opts.holdSeconds } : {}),
  };
}

function makeWarmup(id: string, name: string, sets: number, reps: number, isIsometric: boolean): PlannedExercise {
  // v2.4.5 §5.4: warm-ups are first-class steps with per-exercise duration
  // and 10s rest between same-exercise sets. Iso holds use their reps value
  // as the duration; rep-based warm-ups default to 30s.
  const warmupDurationSeconds = isIsometric ? reps : 30;
  return {
    id, progressionId: "warmup", name, sets, reps, restSeconds: 10,
    difficultyIntent: "easy", exerciseRole: "warmup",
    warmupDurationSeconds,
    ...(isIsometric ? { holdSeconds: reps } : {}),
  };
}

function makeCooldown(id: string, name: string, sets: number, holdSeconds: number): PlannedExercise {
  return {
    id, progressionId: "cooldown", name, sets, reps: holdSeconds, restSeconds: 0,
    difficultyIntent: "easy", exerciseRole: "cooldown", holdSeconds,
  };
}

// ── Ramp-up Sets ────────────────────────────────────────────────────────────

const RAMP_DESCRIPTIONS = [
  { reps: 10, rest: 90, note: "Light — technique focus" },
  { reps: 6, rest: 90, note: "Building" },
  { reps: 5, rest: 120, note: "Approaching working weight" },
  { reps: 3, rest: 150, note: "Final ramp" },
  { reps: 2, rest: 150, note: "Near-max ramp" },
];

function generateRampUpSets(
  prefix: string,
  progressionId: string,
  exerciseName: string,
  numSets: number,
): PlannedExercise[] {
  return RAMP_DESCRIPTIONS.slice(0, numSets).map((desc, i) =>
    makeExercise(
      `${prefix}_ramp${i}`, progressionId, `${exerciseName} (Ramp)`,
      "ramp_up", 1, desc.reps, desc.rest, "easy",
      { notes: desc.note },
    ),
  );
}

// ── Warm-ups & Cooldowns ────────────────────────────────────────────────────

function getWarmupExercises(sessionType: "push" | "pull", prefix: string): PlannedExercise[] {
  const p = `${prefix}_wu`;
  if (sessionType === "push") {
    return [
      makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
      makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
      makeWarmup(`${p}2`, "Scap Push-ups", 2, 10, false),
      makeWarmup(`${p}3`, "Band Pull-Aparts", 2, 15, false),
      makeWarmup(`${p}4`, "Shoulder Dislocates", 1, 15, false),
    ];
  }
  // pull
  return [
    makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
    makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
    makeWarmup(`${p}2`, "Band Pull-Aparts", 2, 15, false),
    makeWarmup(`${p}3`, "Dead Hang", 1, 30, true),
    makeWarmup(`${p}4`, "Scap Pulls", 2, 8, false),
  ];
}

function getCooldownExercises(sessionType: "push" | "pull", prefix: string): PlannedExercise[] {
  const p = `${prefix}_cd`;
  if (sessionType === "push") {
    return [
      makeCooldown(`${p}0`, "Chest Doorway Stretch", 1, 30),
      makeCooldown(`${p}1`, "Tricep Stretch", 1, 30),
      makeCooldown(`${p}2`, "Shoulder Sleeper Stretch", 1, 30),
    ];
  }
  return [
    makeCooldown(`${p}0`, "Dead Hang", 1, 60),
    makeCooldown(`${p}1`, "Lat Stretch", 1, 30),
    makeCooldown(`${p}2`, "Bicep Wall Stretch", 1, 30),
  ];
}

// ── Session Builders ────────────────────────────────────────────────────────

/** Day 1 — Heavy Dips (Push) */
function buildDay1(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekInPhase: number,
  isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_d1`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.accumulation;
  const topReps = getWaveReps(phase, weekInPhase);
  const variationIdx = weekInPhase % 4;
  const dipVar = DIP_VARIATIONS[variationIdx];

  const exercises: PlannedExercise[] = [];

  if (!isDeload && phase !== "test") {
    // Ramp-up sets
    exercises.push(...generateRampUpSets(prefix, "weighted_dip", "Weighted Dips", phase === "peaking" ? 5 : 4));
  }

  if (phase === "test") {
    // 1RM test protocol
    exercises.push(
      makeExercise(`${prefix}_t0`, "weighted_dip", "Weighted Dips", "ramp_up", 1, 3, 120, "easy", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t1`, "weighted_dip", "Weighted Dips", "ramp_up", 1, 2, 120, "easy", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t2`, "weighted_dip", "Weighted Dips", "ramp_up", 1, 1, 150, "moderate", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t3`, "weighted_dip", "Weighted Dips", "ramp_up", 1, 1, 180, "moderate", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t4`, "weighted_dip", "Weighted Dips", "ramp_up", 1, 1, 240, "challenging", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t5`, "weighted_dip", "Weighted Dips — 1RM ATTEMPT", "main", 1, 1, 300, "challenging", {
        notes: "MAX EFFORT. Full depth, controlled descent, explode up.", rpeTarget: 10,
      }),
    );
  } else if (phase === "peaking") {
    // Heavy singles
    exercises.push(
      makeExercise(`${prefix}_top`, "weighted_dip", "Weighted Dips (Heavy Singles)", "main",
        3, 1, 300, "challenging", { notes: "Heavy singles @RPE 9. Full control.", rpeTarget: 9 }),
    );
  } else {
    // Top sets
    exercises.push(
      makeExercise(`${prefix}_top`, "weighted_dip", "Weighted Dips", "main",
        isDeload ? 2 : prog.sets, isDeload ? 6 : topReps, 180, prog.intent,
        { rpeTarget: prog.rpe, notes: isDeload ? "Light — recovery week" : undefined }),
    );
  }

  // Back-offs with variation (not on deload, peaking, or test)
  if (!isDeload && phase !== "peaking" && phase !== "test") {
    exercises.push(
      makeExercise(`${prefix}_var`, "weighted_dip", dipVar.name, "volume",
        dipVar.sets, dipVar.reps, 120, "moderate",
        { variationCode: dipVar.code }),
    );
  } else if (isDeload) {
    exercises.push(
      makeExercise(`${prefix}_bo`, "weighted_dip", "Dips (Clean)", "volume",
        2, 8, 90, "easy"),
    );
  }

  // Finisher (accumulation and strength only)
  if (!isDeload && phase !== "peaking" && phase !== "test") {
    exercises.push(
      makeExercise(`${prefix}_fin`, "weighted_dip", "Dips — Max(-2)", "finisher",
        1, 15, 0, "moderate",
        { notes: "Max reps, stop 2 before failure. Track this number weekly." }),
    );
  }

  // Accessories
  exercises.push(
    makeExercise(`${prefix}_acc0`, "acc_weighted_pushups", "Weighted Push-ups", "accessory",
      isDeload ? 2 : 3, 10, 60, "easy"),
    makeExercise(`${prefix}_acc1`, "acc_face_pulls", "Face Pulls (Band)", "accessory",
      isDeload ? 2 : 3, 15, 60, "easy"),
  );

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Heavy Dips (Push)",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("push", prefix),
    cooldownExercises: getCooldownExercises("push", prefix),
  };
}

/** Day 2 — Heavy Pull-ups (Pull) */
function buildDay2(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekInPhase: number,
  isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_d2`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.accumulation;
  const topReps = getWaveReps(phase, weekInPhase);
  const variationIdx = weekInPhase % 4;
  const pullVar = PULLUP_VARIATIONS[variationIdx];

  const exercises: PlannedExercise[] = [];

  if (!isDeload && phase !== "test") {
    // Ramp-up sets
    exercises.push(...generateRampUpSets(prefix, "weighted_pullup", "Weighted Pull-ups", phase === "peaking" ? 4 : 3));
  }

  if (phase === "test") {
    // 1RM test protocol
    exercises.push(
      makeExercise(`${prefix}_t0`, "weighted_pullup", "Weighted Pull-ups", "ramp_up", 1, 3, 120, "easy", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t1`, "weighted_pullup", "Weighted Pull-ups", "ramp_up", 1, 2, 120, "easy", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t2`, "weighted_pullup", "Weighted Pull-ups", "ramp_up", 1, 1, 150, "moderate", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t3`, "weighted_pullup", "Weighted Pull-ups", "ramp_up", 1, 1, 180, "moderate", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t4`, "weighted_pullup", "Weighted Pull-ups", "ramp_up", 1, 1, 240, "challenging", { notes: "warm-up set" }),
      makeExercise(`${prefix}_t5`, "weighted_pullup", "Weighted Pull-ups — 1RM ATTEMPT", "main", 1, 1, 300, "challenging", {
        notes: "MAX EFFORT. Dead hang start, chin over bar, no kipping.", rpeTarget: 10,
      }),
    );
  } else if (phase === "peaking") {
    exercises.push(
      makeExercise(`${prefix}_top`, "weighted_pullup", "Weighted Pull-ups (Heavy Singles)", "main",
        3, 1, 300, "challenging", { notes: "Heavy singles @RPE 9. Dead hang, full ROM.", rpeTarget: 9 }),
    );
  } else {
    // Top sets
    exercises.push(
      makeExercise(`${prefix}_top`, "weighted_pullup", "Weighted Pull-ups", "main",
        isDeload ? 2 : prog.sets, isDeload ? 6 : topReps, 180, prog.intent,
        { rpeTarget: prog.rpe, notes: isDeload ? "Light — recovery week" : undefined }),
    );
  }

  // Variation work (not on deload, peaking, or test)
  if (!isDeload && phase !== "peaking" && phase !== "test") {
    exercises.push(
      makeExercise(`${prefix}_var`, "weighted_pullup", pullVar.name, "volume",
        pullVar.sets, pullVar.reps, 120, "moderate",
        { variationCode: pullVar.code }),
    );
  } else if (isDeload) {
    exercises.push(
      makeExercise(`${prefix}_bo`, "weighted_pullup", "Pull-ups (Clean)", "volume",
        2, 8, 90, "easy"),
    );
  }

  // Volume — clean pull-ups lighter (not on test)
  if (phase !== "test") {
    exercises.push(
      makeExercise(`${prefix}_vol`, "weighted_pullup", "Pull-ups (Volume)", "volume",
        isDeload ? 2 : 3, isDeload ? 6 : 7, 120, "moderate",
        { notes: "Lighter weight, focus on quality reps" }),
    );
  }

  // Isometric — dead hang (not on test/deload)
  if (!isDeload && phase !== "test") {
    exercises.push(
      makeExercise(`${prefix}_iso`, "acc_dead_hang_weighted", "Dead Hang (Weighted)", "accessory",
        2, 20, 60, "moderate", { holdSeconds: 20 }),
    );
  }

  // Accessory — rows
  exercises.push(
    makeExercise(`${prefix}_acc0`, "acc_rows", "Rows (Band or Inverted)", "accessory",
      isDeload ? 2 : 3, isDeload ? 8 : 10, 90, "easy"),
  );

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Heavy Pull-ups (Pull)",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("pull", prefix),
    cooldownExercises: getCooldownExercises("pull", prefix),
  };
}

/** Day 3 — Peak Singles + Secondary Pull */
function buildDay3(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekInPhase: number,
  isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_d3`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.accumulation;

  const exercises: PlannedExercise[] = [];

  if (phase === "test") {
    // Light recovery session on test week day 3
    exercises.push(
      makeExercise(`${prefix}_light0`, "weighted_dip", "Dips (Light)", "volume", 3, 8, 90, "easy",
        { notes: "Light technique work — no heavy loads" }),
      makeExercise(`${prefix}_light1`, "weighted_pullup", "Pull-ups (Light)", "volume", 3, 8, 90, "easy",
        { notes: "Light technique work — no heavy loads" }),
    );
  } else if (isDeload) {
    exercises.push(
      makeExercise(`${prefix}_dip`, "weighted_dip", "Dips (Light)", "volume", 2, 8, 90, "easy"),
      makeExercise(`${prefix}_chin0`, "weighted_chinup", "Chin-ups", "main", 2, 6, 90, "easy"),
      makeExercise(`${prefix}_chin1`, "weighted_chinup", "Chin-ups (Volume)", "volume", 2, 8, 90, "easy"),
    );
  } else {
    // Ramp to near-max dips
    const rampCount = phase === "peaking" ? 5 : 4;
    exercises.push(...generateRampUpSets(prefix, "weighted_dip", "Weighted Dips", rampCount));

    if (phase === "peaking") {
      // Near-max singles
      exercises.push(
        makeExercise(`${prefix}_peak`, "weighted_dip", "Weighted Dips (Near-Max Singles)", "main",
          2, 1, 300, "challenging", { notes: "Near-max singles @RPE 9. Controlled.", rpeTarget: 9 }),
      );
    } else {
      // Peak singles — paused bottom
      exercises.push(
        makeExercise(`${prefix}_peak`, "weighted_dip", "Weighted Dips (Paused Singles)", "main",
          phase === "accumulation" ? 3 : 4, 1, 300, "challenging",
          { variationCode: "paused_bottom", notes: "Weekly max expression. Controlled descent, pause, explode up.", rpeTarget: 9 }),
      );
    }

    // Chin-ups working sets — deadstop
    exercises.push(
      makeExercise(`${prefix}_chin0`, "weighted_chinup", "Chin-ups (Deadstop)", "main",
        4, phase === "strength" ? 4 : 5, 120, "moderate",
        { variationCode: "deadstop", notes: "Full dead hang between reps" }),
    );

    // Chin-ups volume
    exercises.push(
      makeExercise(`${prefix}_chin1`, "weighted_chinup", "Chin-ups (Volume)", "volume",
        3, phase === "strength" ? 5 : 7, 90, "moderate"),
    );
  }

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Peak Singles + Secondary Pull",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("push", prefix), // starts with dips
    cooldownExercises: getCooldownExercises("pull", prefix), // ends with pull work
  };
}

/** Day 4 — Legs */
function buildLegDay(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekInPhase: number,
  isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_d4`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.accumulation;

  const exercises: PlannedExercise[] = [
    makeExercise(`${prefix}_sq`, "weighted_squat", "Barbell Back Squat", "main",
      isDeload ? 2 : prog.sets, isDeload ? 6 : getWaveReps(phase, weekInPhase), 180, prog.intent,
      { rpeTarget: prog.rpe }),
    makeExercise(`${prefix}_lu`, "acc_lunges", "Bulgarian Split Squats", "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      { notes: "Per leg" }),
    makeExercise(`${prefix}_rdl`, "acc_rdl", "Romanian Deadlift", "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate"),
    makeExercise(`${prefix}_core`, "acc_hanging_leg_raises", "Hanging Leg Raises", "accessory",
      isDeload ? 2 : 3, isDeload ? 8 : 12, 60, "easy"),
    makeExercise(`${prefix}_calf`, "acc_calf_raises", "Calf Raises", "accessory",
      isDeload ? 2 : 3, isDeload ? 10 : 20, 45, "easy"),
  ];

  const warmUp: PlannedExercise[] = [
    makeWarmup(`${prefix}_wu0`, "Bodyweight Squats", 2, 10, false),
    makeWarmup(`${prefix}_wu1`, "Hip Circles", 1, 10, false),
    makeWarmup(`${prefix}_wu2`, "Leg Swings", 1, 10, false),
    makeWarmup(`${prefix}_wu3`, "Deep Squat Hold", 1, 60, true),
    makeWarmup(`${prefix}_wu4`, "Ankle Circles", 1, 10, false),
  ];

  const cooldown: PlannedExercise[] = [
    makeCooldown(`${prefix}_cd0`, "Quad Stretch", 1, 30),
    makeCooldown(`${prefix}_cd1`, "Hamstring Stretch", 1, 30),
    makeCooldown(`${prefix}_cd2`, "Hip Flexor Stretch", 1, 30),
    makeCooldown(`${prefix}_cd3`, "Calf Stretch", 1, 30),
    makeCooldown(`${prefix}_cd4`, "Pigeon Pose", 1, 60),
    makeCooldown(`${prefix}_cd5`, "Deep Squat Hold", 1, 90),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Legs", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: warmUp,
    cooldownExercises: cooldown,
  };
}

/** Day 5 — Upper Volume */
function buildUpperVolume(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekInPhase: number,
  isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_d5`;

  const exercises: PlannedExercise[] = [
    makeExercise(`${prefix}_dip`, "weighted_dip", "Dips (Volume)", "volume",
      isDeload ? 2 : 4, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      { notes: "Lighter weight, higher reps. Building volume." }),
    makeExercise(`${prefix}_pull`, "weighted_pullup", "Pull-ups (Volume)", "volume",
      isDeload ? 2 : 4, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      { notes: "Lighter weight, higher reps." }),
    makeExercise(`${prefix}_pushup`, "acc_weighted_pushups", "Weighted Push-ups", "accessory",
      isDeload ? 2 : 3, 12, 60, "easy"),
    makeExercise(`${prefix}_row`, "acc_rows", "Rows (Band or Inverted)", "accessory",
      isDeload ? 2 : 3, 12, 60, "easy"),
    makeExercise(`${prefix}_fp`, "acc_face_pulls", "Face Pulls (Band)", "accessory",
      3, 15, 60, "easy"),
    makeExercise(`${prefix}_core`, "acc_hollow_body", "Hollow Body Hold", "accessory",
      3, 30, 60, "easy", { holdSeconds: 30 }),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Upper Volume", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("push", prefix),
    cooldownExercises: getCooldownExercises("push", prefix),
  };
}

// ── Weight Stamping ─────────────────────────────────────────────────────────

function getPattern(exerciseId: string): "pulling" | "pushing" | "legs" | null {
  const id = exerciseId.toLowerCase();
  if (id.includes("pull") || id.includes("chin") || id.includes("row")) return "pulling";
  if (id.includes("dip") || id.includes("push") || id.includes("hspu")) return "pushing";
  if (id.includes("squat") || id.includes("lunge") || id.includes("pistol")) return "legs";
  return null;
}

function stampWeights(session: PlannedSession, e1rm: E1RMProfile, dayType?: "heavy" | "peak_singles"): void {
  // Pre-scan: count ramp_up sets per progressionId so getTargetWeight can
  // distribute the 50% → 90% scale across the correct number of stages.
  const rampCounts = new Map<string, number>();
  for (const ex of session.exercises) {
    if (ex.exerciseRole === "ramp_up") {
      rampCounts.set(ex.progressionId, (rampCounts.get(ex.progressionId) ?? 0) + 1);
    }
  }

  let rampIdx = 0;
  let lastRampProgId = "";
  for (const ex of session.exercises) {
    const pattern = getPattern(ex.progressionId);
    if (!pattern) continue;
    if (ex.exerciseRole === "warmup" || ex.exerciseRole === "cooldown" || ex.exerciseRole === "skill") continue;

    if (ex.exerciseRole === "ramp_up") {
      if (ex.progressionId !== lastRampProgId) {
        rampIdx = 0;
        lastRampProgId = ex.progressionId;
      }
      const floor = getRampFloor(ex.progressionId, "intermediate");
      const total = rampCounts.get(ex.progressionId);
      ex.addedWeightKg = getTargetWeight(e1rm, pattern, session.phase, "ramp_up", rampIdx, dayType, floor, total);
      rampIdx++;
    } else {
      ex.addedWeightKg = getTargetWeight(e1rm, pattern, session.phase, ex.exerciseRole, undefined, dayType);
    }
  }
}

// ── Main Generator ──────────────────────────────────────────────────────────

function getSessionBuilders(daysPerWeek: number) {
  switch (daysPerWeek) {
    case 2: return [buildDay1, buildDay2];
    case 4: return [buildDay1, buildDay2, buildDay3, buildLegDay];
    case 5: return [buildDay1, buildDay2, buildDay3, buildLegDay, buildUpperVolume];
    default: return [buildDay1, buildDay2, buildDay3]; // 3-day is the base
  }
}

export function generateStreetLifterIntermediate(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
  benchmarks?: UserBenchmarks,
): Mesocycle {
  const mesoId = `meso_sl_int_${Date.now()}`;
  const daysPerWeek = Math.min(Math.max(schedule.daysPerWeek, 2), 5);
  const sessionsPerWeek = daysPerWeek;
  const sessionBuilders = getSessionBuilders(daysPerWeek);
  const e1rm = benchmarks ? buildE1RMProfile(benchmarks) : null;

  const weeks: PlanWeek[] = [];
  let weekNumber = 1;

  for (const block of INTERMEDIATE_PHASES) {
    for (let w = 0; w < block.weeks; w++) {
      const weekId = `${mesoId}_w${weekNumber}`;
      const isDeload = block.phase === "deload";
      const weekInPhase = w;

      const sessions: PlannedSession[] = [];
      const days = schedule.preferredDays.slice(0, sessionsPerWeek);

      for (let s = 0; s < days.length; s++) {
        const builder = sessionBuilders[s % sessionBuilders.length];
        const session = builder(weekId, days[s], block.phase, weekInPhase, isDeload);
        if (e1rm) {
          const dayType = (s % sessionBuilders.length === 2 && daysPerWeek >= 3) ? "peak_singles" as const : "heavy" as const;
          stampWeights(session, e1rm, dayType);
        }
        sessions.push(session);
      }

      weeks.push({
        id: weekId,
        mesocycleId: mesoId,
        weekNumber,
        phase: block.phase,
        sessions,
      });

      weekNumber++;
    }
  }

  const mesocycle: Mesocycle = {
    id: mesoId,
    userId,
    createdAt: new Date().toISOString(),
    durationWeeks: 12,
    programPath: "street_lifter",
    tier: "intermediate",
    weeks,
    status: "active",
  };
  return applyTierCutsToMesocycle(mesocycle, schedule.sessionTier ?? "recommended", "street_lifter");
}
