// =============================================================================
// ARNOLD — Skill Builder Intermediate Plan Generator
// 12-week 4-day split: Push+Skill / Pull+Skill / Pure Skill / Strength.
// Prilepin table for isometric holds. Block periodization:
// Hypertrophy → Strength → Skill Peak → Test.
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
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";
import { buildE1RMProfile, getTargetWeight, E1RMProfile } from "../weightEngine";
import { derivePatternsFromExercises } from "../../utils/sessionPatterns";

// ── Phase Template ──────────────────────────────────────────────────────────

const INTERMEDIATE_PHASES: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "hypertrophy", weeks: 3 },
  { phase: "deload", weeks: 1 },
  { phase: "strength", weeks: 4 },
  { phase: "deload", weeks: 1 },
  { phase: "skill_peaking", weeks: 2 },
  { phase: "test", weeks: 1 },
];

// ── Prilepin Table ──────────────────────────────────────────────────────────

function getPrilepinHoldProgramming(maxHoldSeconds: number): { sets: number; holdTime: number } {
  if (maxHoldSeconds <= 10) return { sets: 6, holdTime: Math.round(maxHoldSeconds * 0.65) };
  if (maxHoldSeconds <= 20) return { sets: 5, holdTime: Math.round(maxHoldSeconds * 0.65) };
  if (maxHoldSeconds <= 30) return { sets: 4, holdTime: Math.round(maxHoldSeconds * 0.65) };
  return { sets: 3, holdTime: Math.round(maxHoldSeconds * 0.65) };
}

/** Estimate max hold from progression order since we don't have actual times */
function estimateMaxHold(progressionId: string): number {
  const prog = PROGRESSIONS.find(p => p.id === progressionId);
  if (!prog) return 8;
  if (prog.order <= 2) return 8;   // beginner: ~8s max
  if (prog.order <= 5) return 15;  // mid: ~15s max
  return 25;                        // advanced: ~25s max
}

// ── Phase-specific Programming ──────────────────────────────────────────────

const STRENGTH_BY_PHASE: Record<string, { sets: number; reps: number; intent: DifficultyIntent }> = {
  hypertrophy:  { sets: 4, reps: 10, intent: "moderate" },
  strength:     { sets: 4, reps: 5, intent: "challenging" },
  skill_peaking: { sets: 2, reps: 8, intent: "easy" },
  test:         { sets: 2, reps: 5, intent: "easy" },
  deload:       { sets: 2, reps: 8, intent: "easy" },
};

// ── Wave Loading ────────────────────────────────────────────────────────────

function getPhaseWaveReps(phase: PlanPhase, weekInPhase: number): number {
  const base = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  if (phase === "hypertrophy") {
    return [10, 11, 12][weekInPhase] || base.reps;
  }
  if (phase === "strength") {
    return [5, 4, 3, 4][weekInPhase] || base.reps;
  }
  return base.reps;
}

function getPhaseStrengthSets(phase: PlanPhase, weekInPhase: number): number {
  const base = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  if (phase === "strength" && weekInPhase === 2) return 5; // peak intensity week
  return base.sets;
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
  id: string,
  progressionId: string,
  name: string | null,
  role: ExerciseRole,
  sets: number,
  reps: number,
  restSeconds: number,
  intent: DifficultyIntent,
  opts?: { notes?: string; holdSeconds?: number },
): PlannedExercise {
  return {
    id, progressionId,
    name: name || getName(progressionId),
    sets, reps, restSeconds,
    difficultyIntent: intent,
    exerciseRole: role,
    ...(opts?.notes ? { notes: opts.notes } : {}),
    ...(opts?.holdSeconds ? { holdSeconds: opts.holdSeconds } : {}),
  };
}

// ── Warm-ups & Cooldowns ────────────────────────────────────────────────────

function makeWarmup(id: string, name: string, sets: number, reps: number, iso: boolean): PlannedExercise {
  return {
    id, progressionId: "warmup", name, sets, reps,
    restSeconds: 0, difficultyIntent: "easy", exerciseRole: "warmup",
    ...(iso ? { holdSeconds: reps } : {}),
  };
}

function makeCooldown(id: string, name: string, sets: number, hold: number): PlannedExercise {
  return {
    id, progressionId: "cooldown", name, sets, reps: hold,
    restSeconds: 0, difficultyIntent: "easy", exerciseRole: "cooldown", holdSeconds: hold,
  };
}

type SessionType = "push_skill" | "pull_skill" | "pure_skill" | "strength";

function getWarmupExercises(type: SessionType, prefix: string): PlannedExercise[] {
  const p = `${prefix}_wu`;
  switch (type) {
    case "push_skill":
      return [
        makeWarmup(`${p}0`, "Wrist Circles", 1, 15, false),
        makeWarmup(`${p}1`, "Wrist Rocks", 1, 10, false),
        makeWarmup(`${p}2`, "Wrist Loading", 1, 30, true),
        makeWarmup(`${p}3`, "Shoulder Dislocates", 1, 15, false),
        makeWarmup(`${p}4`, "Scap Push-ups", 2, 10, false),
        makeWarmup(`${p}5`, "Cat-Cow", 1, 10, false),
        makeWarmup(`${p}6`, "Hollow Body", 3, 15, true),
      ];
    case "pull_skill":
      return [
        makeWarmup(`${p}0`, "Band Pull-Aparts", 2, 15, false),
        makeWarmup(`${p}1`, "Active Hang", 1, 30, true),
        makeWarmup(`${p}2`, "Scap Pulls", 2, 8, false),
        makeWarmup(`${p}3`, "Thoracic Rotation", 1, 10, false),
      ];
    case "pure_skill":
      return [
        makeWarmup(`${p}0`, "Wrist Circles", 1, 15, false),
        makeWarmup(`${p}1`, "Wrist Rocks", 1, 10, false),
        makeWarmup(`${p}2`, "Wrist Loading", 1, 30, true),
        makeWarmup(`${p}3`, "Shoulder Dislocates", 1, 15, false),
        makeWarmup(`${p}4`, "Hip Circles", 1, 10, false),
        makeWarmup(`${p}5`, "Cat-Cow", 1, 10, false),
        makeWarmup(`${p}6`, "Hollow Body", 3, 15, true),
        makeWarmup(`${p}7`, "Active Hang", 1, 30, true),
      ];
    case "strength":
      return [
        makeWarmup(`${p}0`, "Arm Circles", 1, 20, false),
        makeWarmup(`${p}1`, "Jumping Jacks", 1, 30, false),
        makeWarmup(`${p}2`, "Band Pull-Aparts", 2, 15, false),
        makeWarmup(`${p}3`, "Scap Push-ups", 2, 10, false),
        makeWarmup(`${p}4`, "Scap Pulls", 2, 8, false),
      ];
  }
}

function getCooldownExercises(type: SessionType, prefix: string): PlannedExercise[] {
  const p = `${prefix}_cd`;
  switch (type) {
    case "push_skill":
      return [
        makeCooldown(`${p}0`, "Wrist Stretch", 1, 30),
        makeCooldown(`${p}1`, "Chest Doorway Stretch", 1, 30),
        makeCooldown(`${p}2`, "Pike Stretch", 1, 30),
      ];
    case "pull_skill":
      return [
        makeCooldown(`${p}0`, "Lat Stretch", 1, 30),
        makeCooldown(`${p}1`, "Dead Hang", 1, 60),
        makeCooldown(`${p}2`, "Thoracic Rotation", 1, 10),
      ];
    case "pure_skill":
      return [
        makeCooldown(`${p}0`, "Pike Stretch", 1, 60),
        makeCooldown(`${p}1`, "Pancake Stretch", 1, 60),
        makeCooldown(`${p}2`, "Shoulder Extension Stretch", 1, 60),
        makeCooldown(`${p}3`, "Bridge Hold", 1, 30),
      ];
    case "strength":
      return [
        makeCooldown(`${p}0`, "Dead Hang", 1, 60),
        makeCooldown(`${p}1`, "Chest Doorway Stretch", 1, 30),
        makeCooldown(`${p}2`, "Lat Stretch", 1, 30),
      ];
  }
}

// ── Session Builders ────────────────────────────────────────────────────────

/** Session A — Push + Skill */
function buildSessionA(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, pushId: string, coreId: string, skillId: string,
): PlannedSession {
  const prefix = `${weekId}_sa`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const reps = getPhaseWaveReps(phase, weekInPhase);
  const sets = getPhaseStrengthSets(phase, weekInPhase);
  const lsitId = getLsitId(coreId);

  // Prilepin for L-sit
  const lsitMaxHold = estimateMaxHold(lsitId);
  const lsitPrilepin = getPrilepinHoldProgramming(lsitMaxHold);

  // Handstand: use skill progression (skill_03 Wall Handstand or higher)
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  // Planche lean / pseudo planche push-ups
  const pushTree = getProgressionTree("push");
  const pushIdx = pushTree.findIndex(p => p.id === pushId);
  const ppId = pushIdx >= 5 ? "push_06" : pushId; // Pseudo Planche Push-ups or current level

  const exercises: PlannedExercise[] = [
    // Skills FIRST
    makeEx(`${prefix}_sk0`, hsId, null, "skill",
      isDeload ? 2 : 4, isDeload ? 30 : 45, 120, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 30 : 45, notes: "Focus on alignment. Chest to wall." }),
    makeEx(`${prefix}_sk1`, lsitId, null, "skill",
      isDeload ? 2 : lsitPrilepin.sets, isDeload ? 5 : lsitPrilepin.holdTime, 90,
      isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : lsitPrilepin.holdTime, notes: "Prilepin-based hold time" }),
    // Strength
    makeEx(`${prefix}_m0`, ppId, null, "main",
      isDeload ? 2 : sets, isDeload ? 6 : reps, 180, sp.intent),
    makeEx(`${prefix}_m1`, "supplementary_pike_pushups", "Pike Push-ups", "volume",
      isDeload ? 2 : 3, isDeload ? 6 : Math.min(reps + 2, 12), 120, isDeload ? "easy" : "moderate"),
    // Accessories
    makeEx(`${prefix}_a0`, pushId, null, "accessory",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, "easy",
      { notes: "Bodyweight dips for volume" }),
    makeEx(`${prefix}_a1`, "supplementary_scap_pushups", "Scapular Push-ups (Protraction)", "accessory",
      2, 12, 60, "easy"),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Push + Skill (A)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("push_skill", prefix),
    cooldownExercises: getCooldownExercises("push_skill", prefix),
  };
}

/** Session B — Pull + Skill */
function buildSessionB(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, pullId: string, coreId: string,
): PlannedSession {
  const prefix = `${weekId}_sb`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const reps = getPhaseWaveReps(phase, weekInPhase);
  const sets = getPhaseStrengthSets(phase, weekInPhase);

  // Front lever — core_09 or user's core level
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;

  // Prilepin for front lever
  const flMaxHold = estimateMaxHold(flId);
  const flPrilepin = getPrilepinHoldProgramming(flMaxHold);

  // Row fallback
  const rowId = getVolumeFallback(pullId, 2);

  const exercises: PlannedExercise[] = [
    // Skills FIRST
    makeEx(`${prefix}_sk0`, flId, null, "skill",
      isDeload ? 2 : flPrilepin.sets, isDeload ? 3 : flPrilepin.holdTime,
      isDeload ? 120 : 240, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 3 : flPrilepin.holdTime, notes: "Prilepin-based. 60-70% max hold. Long rest between sets." }),
    makeEx(`${prefix}_sk1`, "supplementary_skin_the_cat", "Skin the Cat", "skill",
      isDeload ? 2 : 3, isDeload ? 3 : 5, 120, isDeload ? "easy" : "moderate",
      { notes: "Controlled rotation through full ROM" }),
    // Strength
    makeEx(`${prefix}_m0`, pullId, null, "main",
      isDeload ? 2 : sets, isDeload ? 6 : reps, 180, sp.intent),
    makeEx(`${prefix}_v0`, rowId, null, "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      rowId === pullId ? { notes: "Higher reps for volume" } : undefined),
    // Accessories
    makeEx(`${prefix}_a0`, "core_02", null, "accessory",
      isDeload ? 2 : 3, isDeload ? 15 : 25, 60, "easy",
      { holdSeconds: isDeload ? 15 : 25 }),
    makeEx(`${prefix}_a1`, "acc_face_pulls", null, "accessory",
      isDeload ? 2 : 3, 15, 60, "easy"),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Pull + Skill (B)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("pull_skill", prefix),
    cooldownExercises: getCooldownExercises("pull_skill", prefix),
  };
}

/** Session C — Pure Skill Day */
function buildSessionC(
  weekId: string, dayOfWeek: number, phase: PlanPhase, _weekInPhase: number,
  isDeload: boolean, coreId: string, skillId: string,
): PlannedSession {
  const prefix = `${weekId}_sc`;
  const lsitId = getLsitId(coreId);

  // Handstand
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  // Planche progression
  const plancheId = skillIdx >= 5 ? skillId : "skill_06";

  // Front lever
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;

  // Prilepin for all isometric skills
  const hsPrilepin = getPrilepinHoldProgramming(estimateMaxHold(hsId));
  const planchePrilepin = getPrilepinHoldProgramming(estimateMaxHold(plancheId));
  const lsitPrilepin = getPrilepinHoldProgramming(estimateMaxHold(lsitId));

  const holdMultiplier = phase === "skill_peaking" ? 1.15 : phase === "test" ? 1.0 : 1.0;
  const setsMultiplier = phase === "skill_peaking" ? 1 : 0; // extra set during peaking

  const exercises: PlannedExercise[] = [
    // Handstand — longest block
    makeEx(`${prefix}_sk0`, hsId, null, "skill",
      isDeload ? 3 : (hsPrilepin.sets + setsMultiplier), isDeload ? 30 : Math.round(hsPrilepin.holdTime * holdMultiplier),
      120, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 30 : Math.round(hsPrilepin.holdTime * holdMultiplier),
        notes: phase === "test" ? "PR attempt — max hold" : "Focus on alignment and breathing" }),
    // Planche progression
    makeEx(`${prefix}_sk1`, plancheId, null, "skill",
      isDeload ? 2 : (planchePrilepin.sets + setsMultiplier), isDeload ? 5 : Math.round(planchePrilepin.holdTime * holdMultiplier),
      180, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : Math.round(planchePrilepin.holdTime * holdMultiplier),
        notes: phase === "test" ? "PR attempt — hardest progression you can hold" : "Prilepin-based. Quality over duration." }),
    // L-sit / V-sit
    makeEx(`${prefix}_sk2`, lsitId, null, "skill",
      isDeload ? 2 : (lsitPrilepin.sets + setsMultiplier), isDeload ? 5 : Math.round(lsitPrilepin.holdTime * holdMultiplier),
      90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : Math.round(lsitPrilepin.holdTime * holdMultiplier),
        notes: phase === "test" ? "PR attempt — max hold" : "Accumulate total hold time" }),
  ];

  // No strength exercises on pure skill day — flexibility handled by cooldown

  return {
    id: prefix, weekId, dayOfWeek, label: "Pure Skill (C)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("pure_skill", prefix),
    cooldownExercises: getCooldownExercises("pure_skill", prefix),
  };
}

/** Session D — Strength Day */
function buildSessionD(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, pullId: string, pushId: string, coreId: string,
): PlannedSession {
  const prefix = `${weekId}_sd`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const reps = getPhaseWaveReps(phase, weekInPhase);
  const sets = getPhaseStrengthSets(phase, weekInPhase);

  const pullVolId = getVolumeFallback(pullId, 2);
  const pushVolId = getVolumeFallback(pushId, 2);

  const exercises: PlannedExercise[] = [
    // Main lifts
    makeEx(`${prefix}_m0`, pullId, null, "main",
      isDeload ? 2 : sets, isDeload ? 6 : reps, 180, sp.intent),
    makeEx(`${prefix}_m1`, pushId, null, "main",
      isDeload ? 2 : sets, isDeload ? 6 : reps, 180, sp.intent),
    // Volume
    makeEx(`${prefix}_v0`, pullVolId, null, "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      pullVolId === pullId ? { notes: "Higher reps for volume" } : undefined),
    makeEx(`${prefix}_v1`, pushVolId, null, "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      pushVolId === pushId ? { notes: "Higher reps for volume" } : undefined),
    // Accessories
    makeEx(`${prefix}_a0`, coreId, null, "accessory",
      isDeload ? 2 : 3, 8, 60, "easy"),
    makeEx(`${prefix}_a1`, "acc_face_pulls", null, "accessory",
      2, 15, 60, "easy"),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Strength (D)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: getWarmupExercises("strength", prefix),
    cooldownExercises: getCooldownExercises("strength", prefix),
  };
}

/** Session E — Legs + Core */
function buildSessionE(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, coreId: string,
): PlannedSession {
  const prefix = `${weekId}_se`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const reps = getPhaseWaveReps(phase, weekInPhase);

  const lsitId = getLsitId(coreId);
  const lsitPrilepin = getPrilepinHoldProgramming(estimateMaxHold(lsitId));

  const exercises: PlannedExercise[] = [
    makeEx(`${prefix}_sk0`, lsitId, null, "skill",
      isDeload ? 2 : lsitPrilepin.sets, isDeload ? 5 : lsitPrilepin.holdTime,
      90, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 5 : lsitPrilepin.holdTime, notes: "Compression work — skill first" }),
    makeEx(`${prefix}_sq`, "legs_01", getName("legs_01"), "main",
      isDeload ? 2 : sp.sets, isDeload ? 6 : reps, 120, sp.intent),
    makeEx(`${prefix}_lu`, "acc_lunges", "Bulgarian Split Squats", "volume",
      isDeload ? 2 : 3, isDeload ? 6 : 10, 90, isDeload ? "easy" : "moderate",
      { notes: "Per leg" }),
    makeEx(`${prefix}_core`, coreId, null, "accessory",
      isDeload ? 2 : 3, isDeload ? 8 : 12, 60, "easy"),
    makeEx(`${prefix}_calf`, "acc_calf_raises", "Calf Raises", "accessory",
      isDeload ? 2 : 3, isDeload ? 10 : 20, 45, "easy"),
  ];

  const warmUp: PlannedExercise[] = [
    makeWarmup(`${prefix}_wu0`, "Bodyweight Squats", 2, 10, false),
    makeWarmup(`${prefix}_wu1`, "Hip Circles", 1, 10, false),
    makeWarmup(`${prefix}_wu2`, "Leg Swings", 1, 10, false),
    makeWarmup(`${prefix}_wu3`, "Deep Squat Hold", 1, 60, true),
    makeWarmup(`${prefix}_wu4`, "Wrist Circles", 1, 15, false),
  ];

  const coolDown: PlannedExercise[] = [
    makeCooldown(`${prefix}_cd0`, "Quad Stretch", 1, 30),
    makeCooldown(`${prefix}_cd1`, "Hamstring Stretch", 1, 30),
    makeCooldown(`${prefix}_cd2`, "Hip Flexor Stretch", 1, 30),
    makeCooldown(`${prefix}_cd3`, "Pike Stretch", 1, 60),
    makeCooldown(`${prefix}_cd4`, "Deep Squat Hold", 1, 90),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Legs + Core (E)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: warmUp,
    cooldownExercises: coolDown,
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

function stampWeights(session: PlannedSession, e1rm: E1RMProfile): void {
  for (const ex of session.exercises) {
    const pattern = getPattern(ex.progressionId);
    if (!pattern) continue;
    if (ex.exerciseRole === "warmup" || ex.exerciseRole === "cooldown" || ex.exerciseRole === "skill") continue;
    ex.addedWeightKg = getTargetWeight(e1rm, pattern, session.phase, ex.exerciseRole);
  }
}

// ── Main Generator ──────────────────────────────────────────────────────────

export function generateSkillBuilderIntermediate(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
  benchmarks?: UserBenchmarks,
): Mesocycle {
  const mesoId = `meso_skb_int_${Date.now()}`;
  const daysPerWeek = Math.min(Math.max(schedule.daysPerWeek, 2), 5);
  const sessionsPerWeek = daysPerWeek;
  const e1rm = benchmarks ? buildE1RMProfile(benchmarks) : null;

  const pullId = getActiveProgression("pull", progressions);
  const pushId = getActiveProgression("push", progressions);
  const coreId = getActiveProgression("core", progressions);
  const skillId = getActiveProgression("skill", progressions);

  const weeks: PlanWeek[] = [];
  let weekNumber = 1;

  for (const block of INTERMEDIATE_PHASES) {
    for (let w = 0; w < block.weeks; w++) {
      const weekId = `${mesoId}_w${weekNumber}`;
      const isDeload = block.phase === "deload";
      const weekInPhase = w;

      const sessions: PlannedSession[] = [];
      const days = schedule.preferredDays.slice(0, sessionsPerWeek);

      let builders: Array<(d: number) => PlannedSession>;

      switch (daysPerWeek) {
        case 2:
          builders = [
            (d: number) => buildSessionA(weekId, d, block.phase, weekInPhase, isDeload, pushId, coreId, skillId),
            (d: number) => buildSessionB(weekId, d, block.phase, weekInPhase, isDeload, pullId, coreId),
          ];
          break;
        case 4:
          builders = [
            (d: number) => buildSessionA(weekId, d, block.phase, weekInPhase, isDeload, pushId, coreId, skillId),
            (d: number) => buildSessionB(weekId, d, block.phase, weekInPhase, isDeload, pullId, coreId),
            (d: number) => buildSessionC(weekId, d, block.phase, weekInPhase, isDeload, coreId, skillId),
            (d: number) => buildSessionD(weekId, d, block.phase, weekInPhase, isDeload, pullId, pushId, coreId),
          ];
          break;
        case 5:
          builders = [
            (d: number) => buildSessionA(weekId, d, block.phase, weekInPhase, isDeload, pushId, coreId, skillId),
            (d: number) => buildSessionB(weekId, d, block.phase, weekInPhase, isDeload, pullId, coreId),
            (d: number) => buildSessionC(weekId, d, block.phase, weekInPhase, isDeload, coreId, skillId),
            (d: number) => buildSessionD(weekId, d, block.phase, weekInPhase, isDeload, pullId, pushId, coreId),
            (d: number) => buildSessionE(weekId, d, block.phase, weekInPhase, isDeload, coreId),
          ];
          break;
        default: // 3-day
          builders = [
            (d: number) => buildSessionA(weekId, d, block.phase, weekInPhase, isDeload, pushId, coreId, skillId),
            (d: number) => buildSessionB(weekId, d, block.phase, weekInPhase, isDeload, pullId, coreId),
            (d: number) => buildSessionD(weekId, d, block.phase, weekInPhase, isDeload, pullId, pushId, coreId),
          ];
      }

      for (let s = 0; s < days.length; s++) {
        const session = builders[s % builders.length](days[s]);
        if (e1rm) stampWeights(session, e1rm);
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

  return {
    id: mesoId,
    userId,
    createdAt: new Date().toISOString(),
    durationWeeks: 12,
    programPath: "skill_builder",
    tier: "intermediate",
    weeks,
    status: "active",
  };
}
