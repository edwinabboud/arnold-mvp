// =============================================================================
// ARNOLD — Hybrid Athlete Intermediate Plan Generator
// 12-week periodized program combining weighted calisthenics (Street Lifter)
// with skill work. Structure A (bolt-on, 3-4 days) or B (PPL+skill, 5 days).
// Weighted work ALWAYS gets CNS priority — skills AFTER heavy lifting.
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
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";
import { buildE1RMProfile, getTargetWeight, E1RMProfile } from "../weightEngine";
import { getRampFloor } from "../exerciseFloors";
import { derivePatternsFromExercises } from "../../utils/sessionPatterns";

// ── Phase Template ──────────────────────────────────────────────────────────

const HYBRID_PHASES: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "base_building", weeks: 4 },
  { phase: "deload", weeks: 1 },
  { phase: "strength", weeks: 4 },
  { phase: "deload", weeks: 1 },
  { phase: "specialization", weeks: 1 },
  { phase: "test", weeks: 1 },
];

// ── Phase Programming (weighted) ────────────────────────────────────────────

const PHASE_PROGRAMMING: Record<string, { sets: number; reps: number; rpe: number; intent: DifficultyIntent }> = {
  base_building:  { sets: 4, reps: 6, rpe: 7.5, intent: "moderate" },
  strength:       { sets: 4, reps: 4, rpe: 8.5, intent: "challenging" },
  specialization: { sets: 3, reps: 1, rpe: 9, intent: "challenging" },
  test:           { sets: 1, reps: 1, rpe: 10, intent: "challenging" },
  deload:         { sets: 2, reps: 6, rpe: 5, intent: "easy" },
};

// ── Variation Cycling ───────────────────────────────────────────────────────

const DIP_VARIATIONS = [
  { code: "double_pause", name: "Double Pause Dips", sets: 3, reps: 5 },
  { code: "tempo_4s", name: "Tempo Dips (4s eccentric)", sets: 3, reps: 6 },
  { code: "paused_bottom", name: "Paused Bottom Dips", sets: 3, reps: 5 },
  { code: "banded_neck", name: "Banded Dips", sets: 3, reps: 8 },
];

const PULLUP_VARIATIONS = [
  { code: "paused_top", name: "Paused Pull-ups (3s top)", sets: 3, reps: 3 },
  { code: "deadstop", name: "Deadstop Pull-ups", sets: 3, reps: 4 },
  { code: "half_top", name: "Half-Rep Pull-ups (top)", sets: 3, reps: 4 },
  { code: "clean", name: "Clean Pull-ups (max volume)", sets: 3, reps: 7 },
];

// ── Wave Loading ────────────────────────────────────────────────────────────

function getWaveReps(phase: PlanPhase, weekInPhase: number): number {
  const base = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.base_building;
  if (phase === "base_building") return [6, 7, 8, 6][weekInPhase] || base.reps;
  if (phase === "strength") return [5, 4, 3, 4][weekInPhase] || base.reps;
  return base.reps;
}

// ── Prilepin (for skill day) ────────────────────────────────────────────────

function estimateMaxHold(progressionId: string): number {
  const prog = PROGRESSIONS.find(p => p.id === progressionId);
  if (!prog) return 8;
  if (prog.order <= 2) return 8;
  if (prog.order <= 5) return 15;
  return 25;
}

function getPrilepin(maxHoldSeconds: number): { sets: number; holdTime: number } {
  if (maxHoldSeconds <= 10) return { sets: 6, holdTime: Math.round(maxHoldSeconds * 0.65) };
  if (maxHoldSeconds <= 20) return { sets: 5, holdTime: Math.round(maxHoldSeconds * 0.65) };
  if (maxHoldSeconds <= 30) return { sets: 4, holdTime: Math.round(maxHoldSeconds * 0.65) };
  return { sets: 3, holdTime: Math.round(maxHoldSeconds * 0.65) };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getActiveProgression(pattern: string, progressions: UserProgression[]): string {
  const active = progressions.find(p => {
    const prog = PROGRESSIONS.find(pr => pr.id === p.progressionId);
    return prog?.pattern === pattern && p.status === "active";
  });
  if (active) return active.progressionId;
  const defaults: Record<string, string> = {
    pull: "pull_01", push: "push_01", legs: "legs_01", core: "core_01", skill: "skill_01",
  };
  return defaults[pattern] || `${pattern}_01`;
}

function getVolumeFallback(progressionId: string, levelsBelow: number): string {
  const prog = PROGRESSIONS.find(p => p.id === progressionId);
  if (!prog) return progressionId;
  const tree = getProgressionTree(prog.pattern);
  const idx = tree.findIndex(p => p.id === progressionId);
  return tree[Math.max(0, idx - levelsBelow)].id;
}

function getName(id: string): string {
  const prog = PROGRESSIONS.find(p => p.id === id);
  if (prog) return prog.name;
  const acc = ACCESSORIES.find(a => a.id === id);
  return acc?.name || id;
}

function getLsitId(coreId: string): string {
  const tree = getProgressionTree("core");
  const userIdx = tree.findIndex(p => p.id === coreId);
  const lsitIdx = tree.findIndex(p => p.id === "core_06");
  if (lsitIdx >= 0 && userIdx >= lsitIdx) return "core_06";
  return coreId;
}

function makeEx(
  id: string, progressionId: string, name: string | null, role: ExerciseRole,
  sets: number, reps: number, restSeconds: number, intent: DifficultyIntent,
  opts?: { notes?: string; variationCode?: string; rpeTarget?: number; holdSeconds?: number },
): PlannedExercise {
  return {
    id, progressionId, name: name || getName(progressionId),
    sets, reps, restSeconds, difficultyIntent: intent, exerciseRole: role,
    ...(opts?.notes ? { notes: opts.notes } : {}),
    ...(opts?.variationCode ? { variationCode: opts.variationCode } : {}),
    ...(opts?.rpeTarget ? { rpeTarget: opts.rpeTarget } : {}),
    ...(opts?.holdSeconds ? { holdSeconds: opts.holdSeconds } : {}),
  };
}

function makeWarmup(id: string, name: string, sets: number, reps: number, iso: boolean): PlannedExercise {
  // v2.4.5 §5.4: per-exercise duration + 10s between-set rest.
  const warmupDurationSeconds = iso ? reps : 30;
  return {
    id, progressionId: "warmup", name, sets, reps, restSeconds: 10,
    difficultyIntent: "easy", exerciseRole: "warmup",
    warmupDurationSeconds,
    ...(iso ? { holdSeconds: reps } : {}),
  };
}

function makeCooldown(id: string, name: string, sets: number, hold: number): PlannedExercise {
  return {
    id, progressionId: "cooldown", name, sets, reps: hold, restSeconds: 0,
    difficultyIntent: "easy", exerciseRole: "cooldown", holdSeconds: hold,
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

function generateRampUpSets(prefix: string, progId: string, name: string, num: number): PlannedExercise[] {
  return RAMP_DESCRIPTIONS.slice(0, num).map((d, i) =>
    makeEx(`${prefix}_ramp${i}`, progId, `${name} (Ramp)`, "ramp_up", 1, d.reps, d.rest, "easy", { notes: d.note }),
  );
}

// ── Warm-ups & Cooldowns ────────────────────────────────────────────────────

type WUType = "push" | "pull" | "legs" | "skill";

function getWarmup(type: WUType, prefix: string): PlannedExercise[] {
  const p = `${prefix}_wu`;
  switch (type) {
    case "push": return [
      makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
      makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
      makeWarmup(`${p}2`, "Scap Push-ups", 2, 10, false),
      makeWarmup(`${p}3`, "Band Pull-Aparts", 2, 15, false),
      makeWarmup(`${p}4`, "Shoulder Dislocates", 1, 15, false),
    ];
    case "pull": return [
      makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
      makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
      makeWarmup(`${p}2`, "Band Pull-Aparts", 2, 15, false),
      makeWarmup(`${p}3`, "Dead Hang", 1, 30, true),
      makeWarmup(`${p}4`, "Scap Pulls", 2, 8, false),
    ];
    case "legs": return [
      makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
      makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
      makeWarmup(`${p}2`, "Bodyweight Squats", 2, 10, false),
      makeWarmup(`${p}3`, "Leg Swings", 1, 10, false),
      makeWarmup(`${p}4`, "Deep Squat Hold", 1, 30, true),
    ];
    case "skill": return [
      makeWarmup(`${p}0`, "Wrist Circles", 1, 15, false),
      makeWarmup(`${p}1`, "Wrist Rocks", 1, 10, false),
      makeWarmup(`${p}2`, "Wrist Loading", 1, 30, true),
      makeWarmup(`${p}3`, "Shoulder Dislocates", 1, 15, false),
      makeWarmup(`${p}4`, "Hip Circles", 1, 10, false),
      makeWarmup(`${p}5`, "Cat-Cow", 1, 10, false),
      makeWarmup(`${p}6`, "Hollow Body", 3, 15, true),
      makeWarmup(`${p}7`, "Active Hang", 1, 30, true),
    ];
  }
}

function getCooldown(type: WUType, prefix: string): PlannedExercise[] {
  const p = `${prefix}_cd`;
  switch (type) {
    case "push": return [
      makeCooldown(`${p}0`, "Chest Doorway Stretch", 1, 30),
      makeCooldown(`${p}1`, "Tricep Stretch", 1, 30),
      makeCooldown(`${p}2`, "Shoulder Sleeper Stretch", 1, 30),
    ];
    case "pull": return [
      makeCooldown(`${p}0`, "Dead Hang", 1, 60),
      makeCooldown(`${p}1`, "Lat Stretch", 1, 30),
      makeCooldown(`${p}2`, "Bicep Wall Stretch", 1, 30),
    ];
    case "legs": return [
      makeCooldown(`${p}0`, "Hip Flexor Stretch", 1, 30),
      makeCooldown(`${p}1`, "Quad Stretch", 1, 30),
      makeCooldown(`${p}2`, "Pigeon Pose", 1, 60),
    ];
    case "skill": return [
      makeCooldown(`${p}0`, "Pike Stretch", 1, 60),
      makeCooldown(`${p}1`, "Pancake Stretch", 1, 60),
      makeCooldown(`${p}2`, "Shoulder Extension Stretch", 1, 60),
      makeCooldown(`${p}3`, "Bridge Hold", 1, 30),
    ];
  }
}

// ── Weighted Session Builders (Street Lifter Intermediate logic) ────────────

function buildHeavyDips(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number, isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_hd`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.base_building;
  const topReps = getWaveReps(phase, weekInPhase);
  const dipVar = DIP_VARIATIONS[weekInPhase % 4];
  const exercises: PlannedExercise[] = [];

  if (!isDeload && phase !== "test") {
    exercises.push(...generateRampUpSets(prefix, "weighted_dip", "Weighted Dips", phase === "specialization" ? 5 : 4));
  }

  if (phase === "test") {
    exercises.push(
      makeEx(`${prefix}_t0`, "weighted_dip", "Weighted Dips (50%)", "ramp_up", 1, 3, 120, "easy", { notes: "~50% estimated 1RM" }),
      makeEx(`${prefix}_t1`, "weighted_dip", "Weighted Dips (70%)", "ramp_up", 1, 2, 120, "easy", { notes: "~70% estimated 1RM" }),
      makeEx(`${prefix}_t2`, "weighted_dip", "Weighted Dips (82%)", "ramp_up", 1, 1, 150, "moderate", { notes: "~82%" }),
      makeEx(`${prefix}_t3`, "weighted_dip", "Weighted Dips (90%)", "ramp_up", 1, 1, 180, "moderate", { notes: "~90%" }),
      makeEx(`${prefix}_t4`, "weighted_dip", "Weighted Dips (95%)", "ramp_up", 1, 1, 240, "challenging", { notes: "~95%" }),
      makeEx(`${prefix}_t5`, "weighted_dip", "Weighted Dips — 1RM ATTEMPT", "main", 1, 1, 300, "challenging", { notes: "MAX EFFORT.", rpeTarget: 10 }),
    );
  } else if (phase === "specialization") {
    exercises.push(makeEx(`${prefix}_top`, "weighted_dip", "Weighted Dips (Heavy Singles)", "main", 3, 1, 300, "challenging", { rpeTarget: 9 }));
  } else {
    exercises.push(makeEx(`${prefix}_top`, "weighted_dip", "Weighted Dips", "main",
      isDeload ? 2 : prog.sets, isDeload ? 6 : topReps, 180, prog.intent, { rpeTarget: prog.rpe, notes: isDeload ? "Light — recovery week" : undefined }));
  }

  if (!isDeload && phase !== "specialization" && phase !== "test") {
    exercises.push(makeEx(`${prefix}_var`, "weighted_dip", dipVar.name, "volume", dipVar.sets, dipVar.reps, 120, "moderate", { variationCode: dipVar.code }));
  } else if (isDeload) {
    exercises.push(makeEx(`${prefix}_bo`, "weighted_dip", "Dips (Clean)", "volume", 2, 8, 90, "easy"));
  }

  if (!isDeload && phase !== "specialization" && phase !== "test") {
    exercises.push(makeEx(`${prefix}_fin`, "weighted_dip", "Dips — Max(-2)", "finisher", 1, 15, 0, "moderate", { notes: "Max reps, stop 2 before failure." }));
  }

  exercises.push(
    makeEx(`${prefix}_acc0`, "acc_weighted_pushups", "Weighted Push-ups", "accessory", isDeload ? 2 : 3, 10, 60, "easy"),
    makeEx(`${prefix}_acc1`, "acc_face_pulls", "Face Pulls (Band)", "accessory", isDeload ? 2 : 3, 15, 60, "easy"),
  );

  return { id: prefix, weekId, dayOfWeek, label: "Hybrid Push (A)", phase, patterns: derivePatternsFromExercises(exercises, PROGRESSIONS), exercises, warmUpExercises: getWarmup("push", prefix), cooldownExercises: getCooldown("push", prefix) };
}

function buildHeavyPullups(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number, isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_hp`;
  const prog = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.base_building;
  const topReps = getWaveReps(phase, weekInPhase);
  const pullVar = PULLUP_VARIATIONS[weekInPhase % 4];
  const exercises: PlannedExercise[] = [];

  if (!isDeload && phase !== "test") {
    exercises.push(...generateRampUpSets(prefix, "weighted_pullup", "Weighted Pull-ups", phase === "specialization" ? 4 : 3));
  }

  if (phase === "test") {
    exercises.push(
      makeEx(`${prefix}_t0`, "weighted_pullup", "Weighted Pull-ups (50%)", "ramp_up", 1, 3, 120, "easy", { notes: "~50%" }),
      makeEx(`${prefix}_t1`, "weighted_pullup", "Weighted Pull-ups (70%)", "ramp_up", 1, 2, 120, "easy", { notes: "~70%" }),
      makeEx(`${prefix}_t2`, "weighted_pullup", "Weighted Pull-ups (82%)", "ramp_up", 1, 1, 150, "moderate", { notes: "~82%" }),
      makeEx(`${prefix}_t3`, "weighted_pullup", "Weighted Pull-ups (90%)", "ramp_up", 1, 1, 180, "moderate", { notes: "~90%" }),
      makeEx(`${prefix}_t4`, "weighted_pullup", "Weighted Pull-ups (95%)", "ramp_up", 1, 1, 240, "challenging", { notes: "~95%" }),
      makeEx(`${prefix}_t5`, "weighted_pullup", "Weighted Pull-ups — 1RM ATTEMPT", "main", 1, 1, 300, "challenging", { notes: "MAX EFFORT.", rpeTarget: 10 }),
    );
  } else if (phase === "specialization") {
    exercises.push(makeEx(`${prefix}_top`, "weighted_pullup", "Weighted Pull-ups (Heavy Singles)", "main", 3, 1, 300, "challenging", { rpeTarget: 9 }));
  } else {
    exercises.push(makeEx(`${prefix}_top`, "weighted_pullup", "Weighted Pull-ups", "main",
      isDeload ? 2 : prog.sets, isDeload ? 6 : topReps, 180, prog.intent, { rpeTarget: prog.rpe, notes: isDeload ? "Light — recovery week" : undefined }));
  }

  if (!isDeload && phase !== "specialization" && phase !== "test") {
    exercises.push(makeEx(`${prefix}_var`, "weighted_pullup", pullVar.name, "volume", pullVar.sets, pullVar.reps, 120, "moderate", { variationCode: pullVar.code }));
  } else if (isDeload) {
    exercises.push(makeEx(`${prefix}_bo`, "weighted_pullup", "Pull-ups (Clean)", "volume", 2, 8, 90, "easy"));
  }

  if (phase !== "test") {
    exercises.push(makeEx(`${prefix}_vol`, "weighted_pullup", "Pull-ups (Volume)", "volume", isDeload ? 2 : 3, isDeload ? 6 : 7, 120, "moderate"));
  }

  if (!isDeload && phase !== "test") {
    exercises.push(makeEx(`${prefix}_iso`, "acc_dead_hang_weighted", "Dead Hang (Weighted)", "accessory", 2, 20, 60, "moderate", { holdSeconds: 20 }));
  }

  exercises.push(makeEx(`${prefix}_acc0`, "acc_rows", "Rows (Band or Inverted)", "accessory", isDeload ? 2 : 3, isDeload ? 8 : 10, 90, "easy"));

  return { id: prefix, weekId, dayOfWeek, label: "Hybrid Pull (B)", phase, patterns: derivePatternsFromExercises(exercises, PROGRESSIONS), exercises, warmUpExercises: getWarmup("pull", prefix), cooldownExercises: getCooldown("pull", prefix) };
}

function buildPeakSingles(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number, isDeload: boolean,
): PlannedSession {
  const prefix = `${weekId}_pk`;
  const exercises: PlannedExercise[] = [];

  if (phase === "test") {
    // Skill PR test day
    exercises.push(
      makeEx(`${prefix}_skt0`, "skill_03", "Wall Handstand — MAX HOLD", "skill", 3, 60, 180, "challenging", { holdSeconds: 60, notes: "PR attempt — max hold time" }),
      makeEx(`${prefix}_skt1`, "supplementary_planche_lean", "Planche Lean — MAX HOLD", "skill", 3, 30, 180, "challenging", { holdSeconds: 30, notes: "PR attempt" }),
      makeEx(`${prefix}_skt2`, "core_06", "L-sit — MAX HOLD", "skill", 3, 30, 120, "challenging", { holdSeconds: 30, notes: "PR attempt" }),
    );
  } else if (isDeload) {
    exercises.push(
      makeEx(`${prefix}_dip`, "weighted_dip", "Dips (Light)", "volume", 2, 8, 90, "easy"),
      makeEx(`${prefix}_chin0`, "weighted_chinup", "Chin-ups", "main", 2, 6, 90, "easy"),
      makeEx(`${prefix}_chin1`, "weighted_chinup", "Chin-ups (Volume)", "volume", 2, 8, 90, "easy"),
    );
  } else {
    const rampCount = phase === "specialization" ? 5 : 4;
    exercises.push(...generateRampUpSets(prefix, "weighted_dip", "Weighted Dips", rampCount));

    if (phase === "specialization") {
      exercises.push(makeEx(`${prefix}_peak`, "weighted_dip", "Weighted Dips (Near-Max Singles)", "main", 2, 1, 300, "challenging", { rpeTarget: 9 }));
    } else {
      exercises.push(makeEx(`${prefix}_peak`, "weighted_dip", "Weighted Dips (Paused Singles)", "main",
        phase === "base_building" ? 3 : 4, 1, 300, "challenging", { variationCode: "paused_bottom", rpeTarget: 9 }));
    }

    exercises.push(
      makeEx(`${prefix}_chin0`, "weighted_chinup", "Chin-ups (Deadstop)", "main", 4, phase === "strength" ? 4 : 5, 120, "moderate", { variationCode: "deadstop" }),
      makeEx(`${prefix}_chin1`, "weighted_chinup", "Chin-ups (Volume)", "volume", 3, phase === "strength" ? 5 : 7, 90, "moderate"),
    );
  }

  return { id: prefix, weekId, dayOfWeek, label: phase === "test" ? "Skill PR Test" : "Hybrid Peak (C)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: phase === "test" ? getWarmup("skill", prefix) : getWarmup("push", prefix),
    cooldownExercises: phase === "test" ? getCooldown("skill", prefix) : getCooldown("pull", prefix) };
}

// ── Skill Day (shared by Structure A & B) ───────────────────────────────────

function buildSkillDay(
  weekId: string, dayOfWeek: number, phase: PlanPhase, isDeload: boolean,
  coreId: string, skillId: string,
): PlannedSession {
  const prefix = `${weekId}_sk`;
  const lsitId = getLsitId(coreId);
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";
  const plancheId = skillIdx >= 5 ? skillId : "skill_06";

  const hsPrilepin = getPrilepin(estimateMaxHold(hsId));
  const plPrilepin = getPrilepin(estimateMaxHold(plancheId));
  const lsitPrilepin = getPrilepin(estimateMaxHold(lsitId));

  // Front lever
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;
  const flPrilepin = getPrilepin(estimateMaxHold(flId));

  const isSpecOrTest = phase === "specialization" || phase === "test";
  // During specialization (weighted emphasis), skill day = maintenance
  const skillSetsMultiplier = isSpecOrTest && phase === "specialization" ? 0.6 : 1;

  const exercises: PlannedExercise[] = [
    makeEx(`${prefix}_sk0`, hsId, null, "skill",
      isDeload ? 3 : Math.round(hsPrilepin.sets * skillSetsMultiplier), isDeload ? 30 : hsPrilepin.holdTime,
      120, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 30 : hsPrilepin.holdTime, notes: phase === "test" ? "PR attempt — max hold" : "Focus on alignment and breathing" }),
    makeEx(`${prefix}_sk1`, plancheId, null, "skill",
      isDeload ? 2 : Math.round(plPrilepin.sets * skillSetsMultiplier), isDeload ? 5 : plPrilepin.holdTime,
      180, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : plPrilepin.holdTime, notes: "Prilepin-based. Never planche + FL same day — alternate weeks." }),
    makeEx(`${prefix}_sk2`, flId, null, "skill",
      isDeload ? 2 : Math.round(flPrilepin.sets * skillSetsMultiplier), isDeload ? 3 : flPrilepin.holdTime,
      180, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 3 : flPrilepin.holdTime }),
    makeEx(`${prefix}_sk3`, lsitId, null, "skill",
      isDeload ? 2 : Math.round(lsitPrilepin.sets * skillSetsMultiplier), isDeload ? 5 : lsitPrilepin.holdTime,
      90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : lsitPrilepin.holdTime }),
  ];

  if (phase === "specialization") {
    exercises[0].notes = "Specialization: weighted PRs emphasis. Skill maintenance only.";
  }

  return { id: prefix, weekId, dayOfWeek, label: "Skill Day", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmup("skill", prefix), cooldownExercises: getCooldown("skill", prefix) };
}

// ── Bolt-on Skill Blocks (appended to weighted sessions) ────────────────────

function appendPushSkillBoltOn(session: PlannedSession, isDeload: boolean, isSpecOrTest: boolean): void {
  const n = session.exercises.length;
  const sets = isDeload ? 2 : isSpecOrTest ? 2 : 3;
  session.exercises.push(
    makeEx(`${session.id}_bolt0`, "supplementary_planche_lean", "Planche Lean", "skill",
      sets, isDeload ? 10 : 20, 120, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 10 : 20 }),
    makeEx(`${session.id}_bolt1`, "supplementary_pike_pushups", "Pike Push-ups", "skill",
      sets, 8, 90, isDeload ? "easy" : "moderate"),
  );
}

function appendPullSkillBoltOn(session: PlannedSession, coreId: string, isDeload: boolean, isSpecOrTest: boolean): void {
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;
  const sets = isDeload ? 2 : isSpecOrTest ? 2 : 3;

  session.exercises.push(
    makeEx(`${session.id}_bolt0`, flId, null, "skill",
      sets, isDeload ? 3 : 8, 180, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 3 : 8, notes: "Front lever progression hold" }),
    makeEx(`${session.id}_bolt1`, "supplementary_skin_the_cat", "Skin the Cat", "skill",
      sets, isDeload ? 3 : 5, 120, isDeload ? "easy" : "moderate"),
  );
}

function appendLsitBoltOn(session: PlannedSession, coreId: string, isDeload: boolean): void {
  const lsitId = getLsitId(coreId);
  session.exercises.push(
    makeEx(`${session.id}_bolt_ls`, lsitId, null, "skill",
      isDeload ? 2 : 3, isDeload ? 10 : 15, 90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 10 : 15, notes: "L-sit max hold" }),
  );
}

// ── Structure B — Legs Day ──────────────────────────────────────────────────

function buildLegsDay(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, legsId: string, coreId: string,
): PlannedSession {
  const prefix = `${weekId}_lg`;
  const sp = PHASE_PROGRAMMING[phase] || PHASE_PROGRAMMING.base_building;
  const reps = isDeload ? 6 : getWaveReps(phase, weekInPhase);

  const exercises: PlannedExercise[] = [
    makeEx(`${prefix}_m0`, legsId, null, "main", isDeload ? 2 : 3, reps, 120, sp.intent),
    makeEx(`${prefix}_v0`, "acc_lunges", null, "volume", isDeload ? 2 : 3, 10, 90, isDeload ? "easy" : "moderate"),
    makeEx(`${prefix}_a0`, "acc_rdl", null, "accessory", isDeload ? 2 : 3, 8, 90, isDeload ? "easy" : "moderate"),
    makeEx(`${prefix}_a1`, coreId, null, "accessory", isDeload ? 2 : 3, 10, 60, "easy"),
  ];

  // L-sit bolt-on at end
  const lsitId = getLsitId(coreId);
  exercises.push(
    makeEx(`${prefix}_sk0`, lsitId, null, "skill", isDeload ? 2 : 3, isDeload ? 10 : 15, 90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 10 : 15 }),
  );

  return { id: prefix, weekId, dayOfWeek, label: "Legs", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmup("legs", prefix), cooldownExercises: getCooldown("legs", prefix) };
}

// ── Structure B — Upper Volume + Skills ─────────────────────────────────────

function buildUpperVolume(
  weekId: string, dayOfWeek: number, phase: PlanPhase, isDeload: boolean,
  coreId: string, skillId: string,
): PlannedSession {
  const prefix = `${weekId}_uv`;
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  const exercises: PlannedExercise[] = [
    makeEx(`${prefix}_v0`, "weighted_dip", "Dips (Moderate)", "volume", isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate"),
    makeEx(`${prefix}_v1`, "weighted_pullup", "Pull-ups (Moderate)", "volume", isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate"),
    makeEx(`${prefix}_a0`, "acc_face_pulls", "Face Pulls (Band)", "accessory", 3, 15, 60, "easy"),
    makeEx(`${prefix}_a1`, "acc_lateral_raises", "Lateral Raises", "accessory", 3, 15, 60, "easy"),
    // Skill work
    makeEx(`${prefix}_sk0`, hsId, null, "skill", isDeload ? 2 : 3, isDeload ? 20 : 30, 90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30 }),
    makeEx(`${prefix}_sk1`, "supplementary_planche_lean", "Planche Lean", "skill", isDeload ? 2 : 3, isDeload ? 10 : 15, 120, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 10 : 15 }),
  ];

  return { id: prefix, weekId, dayOfWeek, label: "Upper Volume + Skills", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmup("push", prefix), cooldownExercises: getCooldown("push", prefix) };
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

export function generateHybridAthleteIntermediate(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
  benchmarks?: UserBenchmarks,
): Mesocycle {
  const mesoId = `meso_hyb_int_${Date.now()}`;
  const daysPerWeek = schedule.daysPerWeek;
  const structure = daysPerWeek >= 5 ? "B" : "A";
  const e1rm = benchmarks ? buildE1RMProfile(benchmarks) : null;

  const coreId = getActiveProgression("core", progressions);
  const skillId = getActiveProgression("skill", progressions);
  const legsId = getActiveProgression("legs", progressions);

  const weeks: PlanWeek[] = [];
  let weekNumber = 1;

  for (const block of HYBRID_PHASES) {
    for (let w = 0; w < block.weeks; w++) {
      const weekId = `${mesoId}_w${weekNumber}`;
      const isDeload = block.phase === "deload";
      const weekInPhase = w;
      const isSpecOrTest = block.phase === "specialization" || block.phase === "test";

      const sessions: PlannedSession[] = [];
      const days = schedule.preferredDays.slice(0, Math.min(daysPerWeek, structure === "B" ? 5 : 4));

      const stamp = (s: PlannedSession, dt?: "heavy" | "peak_singles") => {
        if (e1rm) stampWeights(s, e1rm, dt);
        return s;
      };

      if (structure === "A") {
        // Structure A: bolt-on (3-4 days)
        if (days.length >= 1) {
          const s1 = buildHeavyDips(weekId, days[0], block.phase, weekInPhase, isDeload);
          appendPushSkillBoltOn(s1, isDeload, isSpecOrTest);
          sessions.push(stamp(s1, "heavy"));
        }
        if (days.length >= 2) {
          const s2 = buildHeavyPullups(weekId, days[1], block.phase, weekInPhase, isDeload);
          appendPullSkillBoltOn(s2, coreId, isDeload, isSpecOrTest);
          sessions.push(stamp(s2, "heavy"));
        }
        if (days.length >= 3) {
          const s3 = buildPeakSingles(weekId, days[2], block.phase, weekInPhase, isDeload);
          appendLsitBoltOn(s3, coreId, isDeload);
          sessions.push(stamp(s3, "peak_singles"));
        }
        if (days.length >= 4) {
          sessions.push(stamp(buildSkillDay(weekId, days[3], block.phase, isDeload, coreId, skillId)));
        }
      } else {
        // Structure B: PPL + Skill + Upper Volume (5 days)
        if (days.length >= 1) sessions.push(stamp(buildHeavyDips(weekId, days[0], block.phase, weekInPhase, isDeload), "heavy"));
        if (days.length >= 2) sessions.push(stamp(buildLegsDay(weekId, days[1], block.phase, weekInPhase, isDeload, legsId, coreId), "heavy"));
        if (days.length >= 3) sessions.push(stamp(buildHeavyPullups(weekId, days[2], block.phase, weekInPhase, isDeload), "heavy"));
        if (days.length >= 4) sessions.push(stamp(buildSkillDay(weekId, days[3], block.phase, isDeload, coreId, skillId)));
        if (days.length >= 5) sessions.push(stamp(buildUpperVolume(weekId, days[4], block.phase, isDeload, coreId, skillId), "heavy"));
      }

      weeks.push({ id: weekId, mesocycleId: mesoId, weekNumber, phase: block.phase, sessions });
      weekNumber++;
    }
  }

  const mesocycle: Mesocycle = {
    id: mesoId,
    userId,
    createdAt: new Date().toISOString(),
    durationWeeks: 12,
    programPath: "hybrid_athlete",
    tier: "intermediate",
    weeks,
    status: "active",
  };
  return applyTierCutsToMesocycle(mesocycle, schedule.sessionTier ?? "recommended", "hybrid_athlete");
}
