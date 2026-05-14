// =============================================================================
// ARNOLD — Skill Builder Intermediate Plan Generator (v2.4.1 slim 7-card)
// 12-week 4-day split: Push+Skill / Pull+Skill / Pure Skill / Strength.
// 7-card session structure on screen:
//   1. Warm-up (grouped — single PlannedExercise w/ subExercises)
//   2. Skill practice  (slot 2 — submaximal CNS work, never autoregulated)
//   3. Skill isometric (slot 3 — Prilepin-driven primary hold)
//   4. Complementary lift (slot 4 — phase-aware reps/sets)
//   5. Accessories superset (slot 5 — grouped, 2 movements)
//   6. Core finisher (slot 6)
//   7. Cooldown (slot 7 — handled separately)
// Block periodization: Hypertrophy → Strength → Skill Peak → Test.
// Spec ref: arnold-product-spec-v2_4 §5.2 + v2.4.1 amendment.
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
  SubExercise,
  UserBenchmarks,
  UserProgression,
} from "../../types";
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";
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

// ── Prilepin Table (drives slot 3 skill_isometric) ──────────────────────────

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

// ── v2.4.1: Grouped Warm-up Block ───────────────────────────────────────────

type SessionType = "push_skill" | "pull_skill" | "pure_skill" | "strength";

/**
 * Returns a single PlannedExercise representing the entire warm-up. Sub-items
 * live in `subExercises`. UI renders this as one card. Per v2.4.1 amendment,
 * MVP uses existing v1.0 warm-up pools — canonical 7-drill wrist sequence is
 * deferred to v1.5.
 */
function buildWarmupExercises(type: SessionType, prefix: string): PlannedExercise[] {
  const p = `${prefix}_wu`;
  type Item = { name: string; sets: number; reps: number; durationSeconds: number; notes?: string };
  let items: Item[];

  switch (type) {
    case "push_skill":
      items = [
        { name: "Wrist Circles", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Wrist Rocks", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Wrist Loading", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
        { name: "Shoulder Dislocates", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Scap Push-ups", sets: 2, reps: 10, durationSeconds: 30 },
        { name: "Cat-Cow", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Hollow Body", sets: 3, reps: 15, durationSeconds: 15, notes: "15s hold" },
      ];
      break;
    case "pull_skill":
      items = [
        { name: "Band Pull-Aparts", sets: 2, reps: 15, durationSeconds: 30 },
        { name: "Active Hang", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
        { name: "Scap Pulls", sets: 2, reps: 8, durationSeconds: 30 },
        { name: "Thoracic Rotation", sets: 1, reps: 10, durationSeconds: 30 },
      ];
      break;
    case "pure_skill":
      items = [
        { name: "Wrist Circles", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Wrist Rocks", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Wrist Loading", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
        { name: "Shoulder Dislocates", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Hip Circles", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Cat-Cow", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Hollow Body", sets: 3, reps: 15, durationSeconds: 15, notes: "15s hold" },
        { name: "Active Hang", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
      ];
      break;
    case "strength":
      items = [
        { name: "Arm Circles", sets: 1, reps: 20, durationSeconds: 30 },
        { name: "Jumping Jacks", sets: 1, reps: 30, durationSeconds: 30 },
        { name: "Band Pull-Aparts", sets: 2, reps: 15, durationSeconds: 30 },
        { name: "Scap Push-ups", sets: 2, reps: 10, durationSeconds: 30 },
        { name: "Scap Pulls", sets: 2, reps: 8, durationSeconds: 30 },
      ];
      break;
  }

  return items.map((item, i) => ({
    id: `${p}${i}`,
    progressionId: "warmup",
    name: item.name,
    sets: item.sets,
    reps: item.reps,
    restSeconds: 10,
    difficultyIntent: "easy" as const,
    exerciseRole: "warmup" as const,
    warmupDurationSeconds: item.durationSeconds,
    ...(item.notes ? { notes: item.notes } : {}),
  }));
}

// ── Cooldown (unchanged from v1.0) ──────────────────────────────────────────

function makeCooldown(id: string, name: string, sets: number, hold: number): PlannedExercise {
  return {
    id, progressionId: "cooldown", name, sets, reps: hold,
    restSeconds: 0, difficultyIntent: "easy", exerciseRole: "cooldown", holdSeconds: hold,
  };
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

// ── v2.4.1: Skill Practice (Slot 2) ─────────────────────────────────────────

/**
 * Returns slot 2 for an isometric-style skill practice. holdSeconds is half
 * the user's estimated max — submaximal preparatory work that tunes the
 * nervous system without accumulating fatigue. Never autoregulated.
 */
function makeSkillPracticeIso(
  id: string,
  progressionId: string,
  name: string | null,
  isDeload: boolean,
): PlannedExercise {
  const halfMax = Math.max(3, Math.round(estimateMaxHold(progressionId) / 2));
  return makeEx(id, progressionId, name, "skill_practice",
    isDeload ? 1 : 2, halfMax, 60, "easy",
    { holdSeconds: halfMax, notes: "Submaximal — practice technique, stop before failure" });
}

/**
 * Returns slot 2 for a dynamic skill practice (reps-based, e.g. Skin the Cat).
 * 3 controlled reps per set. Same submaximal philosophy.
 */
function makeSkillPracticeDynamic(
  id: string,
  progressionId: string,
  name: string | null,
  isDeload: boolean,
): PlannedExercise {
  return makeEx(id, progressionId, name, "skill_practice",
    isDeload ? 1 : 2, 3, 60, "easy",
    { notes: "Submaximal — practice technique, stop before failure" });
}

// ── v2.4.1: Skill Isometric (Slot 3) — Prilepin-driven ──────────────────────

function makeSkillIsometric(
  id: string,
  progressionId: string,
  name: string | null,
  isDeload: boolean,
): PlannedExercise {
  const prilepin = getPrilepinHoldProgramming(estimateMaxHold(progressionId));
  const sets = isDeload ? 2 : prilepin.sets;
  const holdSeconds = isDeload
    ? Math.max(3, Math.round(prilepin.holdTime / 2))
    : prilepin.holdTime;
  return makeEx(id, progressionId, name, "skill_isometric",
    sets, holdSeconds, isDeload ? 120 : 180, isDeload ? "easy" : "moderate",
    {
      holdSeconds,
      notes: `Prilepin-based. ${prilepin.holdTime}s × ${prilepin.sets} sets at ~65% max hold.`,
    });
}

// ── v2.4.1: Accessories Superset Block (Slot 5) ─────────────────────────────

/**
 * Returns a single grouped PlannedExercise with two supersetted accessory
 * movements as subExercises. Sets/reps on the parent represent rounds and
 * per-movement target reps. Inter-superset rest in restSeconds; intra-superset
 * rest is zero (communicated in notes).
 */
function buildAccessoryBlock(
  prefix: string,
  isDeload: boolean,
  accessories: Array<{ id: string; name: string; prescription?: string }>,
): PlannedExercise {
  const rounds = isDeload ? 2 : 3;
  const reps = isDeload ? 10 : 12;
  const subs: SubExercise[] = accessories.map((a, i) => ({
    id: `${prefix}_acc_sub${i}`,
    name: a.name,
    prescription: a.prescription ?? "10–15 reps",
  }));
  return {
    id: `${prefix}_acc`,
    progressionId: "accessory_block",
    name: "Accessories",
    groupLabel: "Accessories (superset)",
    sets: rounds,
    reps,
    restSeconds: 60,
    difficultyIntent: "easy",
    exerciseRole: "accessory",
    subExercises: subs,
    notes: "Superset — no rest between movements, 60s between rounds",
  };
}

// ── Session Builders (5-entry exercises[] per v2.4.1) ───────────────────────

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

  // Slot 2: handstand practice (submaximal). Use skill_03 (Wall Handstand)
  // or higher if user has progressed.
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  // Slot 4: pseudo planche push-ups (push variant from existing pool).
  const pushTree = getProgressionTree("push");
  const pushIdx = pushTree.findIndex(p => p.id === pushId);
  const ppId = pushIdx >= 5 ? "push_06" : pushId;

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (handstand, submaximal)
    makeSkillPracticeIso(`${prefix}_sk_p`, hsId, null, isDeload),
    // Slot 3 — skill isometric (L-sit, Prilepin)
    makeSkillIsometric(`${prefix}_sk_i`, lsitId, null, isDeload),
    // Slot 4 — complementary lift (phase-aware)
    makeEx(`${prefix}_comp`, ppId, null, "complementary",
      isDeload ? 2 : sets, isDeload ? 6 : reps, isDeload ? 120 : 180,
      isDeload ? "easy" : sp.intent),
    // Slot 5 — accessories grouped (skill-adjacent + antagonist)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "supplementary_scap_pushups", name: "Scapular Push-ups (Protraction)" },
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
    ]),
    // Slot 6 — core finisher (Hollow Body)
    makeEx(`${prefix}_fin`, "core_01", "Hollow Body Hold", "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30 }),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Push + Skill (A)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("push_skill", prefix),
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

  // Slot 3: front lever isometric — use core_09 if user has progressed,
  // else their current core level.
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;

  // Slot 4: row variant (existing pool, 2 levels below the main pull lift).
  const rowId = getVolumeFallback(pullId, 2);

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (Skin the Cat — dynamic, reps-based)
    makeSkillPracticeDynamic(`${prefix}_sk_p`, "supplementary_skin_the_cat", "Skin the Cat", isDeload),
    // Slot 3 — skill isometric (front lever, Prilepin)
    makeSkillIsometric(`${prefix}_sk_i`, flId, null, isDeload),
    // Slot 4 — complementary lift (row variant)
    makeEx(`${prefix}_comp`, rowId, null, "complementary",
      isDeload ? 2 : sets, isDeload ? 6 : reps, isDeload ? 120 : 180,
      isDeload ? "easy" : sp.intent),
    // Slot 5 — accessories grouped
    buildAccessoryBlock(prefix, isDeload, [
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
      { id: "supplementary_scap_pushups", name: "Scapular Push-ups (Protraction)" },
    ]),
    // Slot 6 — core finisher (Plank)
    makeEx(`${prefix}_fin`, "core_02", "Plank Hold", "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30 }),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Pull + Skill (B)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("pull_skill", prefix),
    cooldownExercises: getCooldownExercises("pull_skill", prefix),
  };
}

/** Session C — Pure Skill Day */
function buildSessionC(
  weekId: string, dayOfWeek: number, phase: PlanPhase, _weekInPhase: number,
  isDeload: boolean, coreId: string, skillId: string,
): PlannedSession {
  const prefix = `${weekId}_sc`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const lsitId = getLsitId(coreId);

  // Handstand
  const skillTree = getProgressionTree("skill");
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  // Front lever for slot 4 complementary (a different upper-body skill from
  // slot 3's L-sit primary)
  const coreTree = getProgressionTree("core");
  const coreIdx = coreTree.findIndex(p => p.id === coreId);
  const flIdx = coreTree.findIndex(p => p.id === "core_09");
  const flId = (flIdx >= 0 && coreIdx >= flIdx) ? "core_09" : coreId;
  const flPrilepin = getPrilepinHoldProgramming(estimateMaxHold(flId));

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (handstand submaximal)
    makeSkillPracticeIso(`${prefix}_sk_p`, hsId, null, isDeload),
    // Slot 3 — skill isometric (L-sit, primary, Prilepin)
    makeSkillIsometric(`${prefix}_sk_i`, lsitId, null, isDeload),
    // Slot 4 — complementary (front lever variant — itself an isometric, but
    // running it as the "complementary" slot keeps the 5-entry shape and
    // gives the user a second skill movement on this dedicated skill day)
    makeEx(`${prefix}_comp`, flId, null, "complementary",
      isDeload ? 2 : flPrilepin.sets,
      isDeload ? Math.max(3, Math.round(flPrilepin.holdTime / 2)) : flPrilepin.holdTime,
      isDeload ? 120 : 180, isDeload ? "easy" : sp.intent,
      { holdSeconds: isDeload ? Math.max(3, Math.round(flPrilepin.holdTime / 2)) : flPrilepin.holdTime,
        notes: phase === "test" ? "PR attempt — hardest progression you can hold" : "Front lever progression — Prilepin-based" }),
    // Slot 5 — accessories grouped
    buildAccessoryBlock(prefix, isDeload, [
      { id: "supplementary_scap_pushups", name: "Scapular Push-ups (Protraction)" },
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
    ]),
    // Slot 6 — core finisher (max-effort L-sit attempt)
    makeEx(`${prefix}_fin`, lsitId, null, "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30,
        notes: phase === "test" ? "PR attempt — max hold" : "Max effort — go close to failure" }),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Pure Skill (C)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("pure_skill", prefix),
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
  const lsitId = getLsitId(coreId);

  // Slot 3: handstand hold as the primary isometric for strength day.
  const skillTree = getProgressionTree("skill");
  const skillId = getActiveProgression("skill", []); // fallback only — we don't have benchmarks here
  const skillIdx = skillTree.findIndex(p => p.id === skillId);
  const hsId = skillIdx >= 2 ? skillId : "skill_03";

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (L-sit submaximal)
    makeSkillPracticeIso(`${prefix}_sk_p`, lsitId, null, isDeload),
    // Slot 3 — skill isometric (handstand, Prilepin)
    makeSkillIsometric(`${prefix}_sk_i`, hsId, null, isDeload),
    // Slot 4 — complementary (heavy push pulled into D for strength focus)
    makeEx(`${prefix}_comp`, pushId, null, "complementary",
      isDeload ? 2 : sets, isDeload ? 6 : reps, isDeload ? 120 : 180,
      isDeload ? "easy" : sp.intent),
    // Slot 5 — accessories grouped (core hold + antagonist)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "core_02", name: "Plank Hold", prescription: "20s hold" },
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
    ]),
    // Slot 6 — core finisher (hanging knee raises / leg raises if available,
    // else fall back to the user's coreId)
    makeEx(`${prefix}_fin`, coreId, null, "finisher",
      isDeload ? 2 : 3, isDeload ? 8 : 12, 60, isDeload ? "easy" : "moderate",
      { notes: "Slow, controlled — full ROM" }),
  ];
  // Note: pullId is intentionally unused on D in v2.4.1 (push is the
  // dominant pattern of the slot 4 complementary). Keep it in the
  // signature for compatibility with the existing call site.
  void pullId;

  return {
    id: prefix, weekId, dayOfWeek, label: "Strength (D)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("strength", prefix),
    cooldownExercises: getCooldownExercises("strength", prefix),
  };
}

/** Session E — Legs + Core (used only in 5-day mode) */
function buildSessionE(
  weekId: string, dayOfWeek: number, phase: PlanPhase, weekInPhase: number,
  isDeload: boolean, coreId: string,
): PlannedSession {
  const prefix = `${weekId}_se`;
  const sp = STRENGTH_BY_PHASE[phase] || STRENGTH_BY_PHASE.hypertrophy;
  const reps = getPhaseWaveReps(phase, weekInPhase);
  const lsitId = getLsitId(coreId);

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (L-sit submaximal)
    makeSkillPracticeIso(`${prefix}_sk_p`, lsitId, null, isDeload),
    // Slot 3 — skill isometric (L-sit, Prilepin)
    makeSkillIsometric(`${prefix}_sk_i`, lsitId, null, isDeload),
    // Slot 4 — complementary (squat, phase-aware)
    makeEx(`${prefix}_comp`, "legs_01", getName("legs_01"), "complementary",
      isDeload ? 2 : sp.sets, isDeload ? 6 : reps, isDeload ? 120 : 180,
      isDeload ? "easy" : sp.intent),
    // Slot 5 — accessories grouped (lunges + calf raises)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "acc_lunges", name: "Bulgarian Split Squats", prescription: "10 each leg" },
      { id: "acc_calf_raises", name: "Calf Raises" },
    ]),
    // Slot 6 — core finisher
    makeEx(`${prefix}_fin`, coreId, null, "finisher",
      isDeload ? 2 : 3, isDeload ? 8 : 12, 60, isDeload ? "easy" : "moderate"),
  ];

  return {
    id: prefix, weekId, dayOfWeek, label: "Legs + Core (E)", phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("strength", prefix),
    cooldownExercises: getCooldownExercises("strength", prefix),
  };
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
