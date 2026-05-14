// =============================================================================
// ARNOLD — Skill Builder Beginner Plan Generator (v2.4.1 slim 7-card)
// 12-week full-body A/B/C rotation. 7-card session structure on screen:
//   1. Warm-up (grouped — single PlannedExercise w/ subExercises)
//   2. Skill practice  (slot 2 — submaximal CNS work, never autoregulated)
//   3. Skill isometric (slot 3 — primary hold, holdSeconds scales by phase)
//   4. Complementary lift (slot 4)
//   5. Accessories superset (slot 5 — grouped, 2 movements)
//   6. Core finisher (slot 6)
//   7. Cooldown (slot 7 — handled separately, list of stretches)
// Deload every 4th week. Wave loading on the complementary lift.
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
  UserProgression,
} from "../../types";
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";
import { derivePatternsFromExercises } from "../../utils/sessionPatterns";

// ── Phase Template ──────────────────────────────────────────────────────────

const BEGINNER_PHASES: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
];

// ── Helpers (unchanged from v1.0) ───────────────────────────────────────────

function getActiveProgression(
  pattern: string,
  progressions: UserProgression[],
): string {
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
  const targetIdx = Math.max(0, idx - levelsBelow);
  return tree[targetIdx].id;
}

function resolveVolume(mainId: string, levelsBelow: number): string {
  const volumeId = getVolumeFallback(mainId, levelsBelow);
  if (volumeId === mainId) {
    const prog = PROGRESSIONS.find(p => p.id === mainId);
    if (prog?.pattern === "pull") return "acc_rows";
    if (prog?.pattern === "push") return "acc_weighted_pushups";
    if (prog?.pattern === "legs") return "acc_lunges";
  }
  return volumeId;
}

function getName(id: string): string {
  const prog = PROGRESSIONS.find(p => p.id === id);
  if (prog) return prog.name;
  const acc = ACCESSORIES.find(a => a.id === id);
  return acc?.name || id;
}

function makeExercise(
  idx: number,
  weekId: string,
  progressionId: string,
  name: string | null,
  role: ExerciseRole,
  sets: number,
  reps: number,
  restSeconds: number,
  difficultyIntent: DifficultyIntent,
  opts?: { notes?: string; holdSeconds?: number },
): PlannedExercise {
  return {
    id: `${weekId}_ex${idx}`,
    progressionId,
    name: name || getName(progressionId),
    sets,
    reps,
    restSeconds,
    difficultyIntent,
    exerciseRole: role,
    ...(opts?.notes ? { notes: opts.notes } : {}),
    ...(opts?.holdSeconds ? { holdSeconds: opts.holdSeconds } : {}),
  };
}

// ── Wave Loading ────────────────────────────────────────────────────────────

function getWaveReps(weekInBlock: number, baseMin: number, baseMax: number): number {
  if (weekInBlock === 0) return baseMin;
  if (weekInBlock === 1) return Math.round((baseMin + baseMax) / 2);
  return baseMax;
}

// ── Skill Exercise Helpers ──────────────────────────────────────────────────

/** Get L-sit skill exercise — uses core progression, ideally core_06 (L-Sit Progression) */
function getLsitId(coreId: string): string {
  const coreProg = PROGRESSIONS.find(p => p.id === coreId);
  if (!coreProg) return "core_01";

  // If user is at or above core_06 (L-Sit Progression), use core_06
  // Otherwise use their current core level as a skill building exercise
  const tree = getProgressionTree("core");
  const userIdx = tree.findIndex(p => p.id === coreId);
  const lsitIdx = tree.findIndex(p => p.id === "core_06");

  if (lsitIdx >= 0 && userIdx >= lsitIdx) {
    return "core_06";
  }
  return coreId;
}

// ── v2.4.1: Grouped Warm-up Block ───────────────────────────────────────────

/**
 * Returns the warm-up exercises for a session as individual vertical cards.
 * v2.4.5 Change 3: warmups are first-class steps — no grouped card, no
 * subExercises. Each exercise gets `restSeconds: 10` (§5.4 between-set rest)
 * and `warmupDurationSeconds` (per-exercise timer hint).
 */
function buildWarmupExercises(
  sessionType: "push_skill" | "pull_skill" | "legs",
  weekId: string,
): PlannedExercise[] {
  const p = `${weekId}_wu`;
  type Item = { name: string; sets: number; reps: number; durationSeconds: number; notes?: string };
  let items: Item[];

  switch (sessionType) {
    case "push_skill":
      items = [
        { name: "Wrist Circles", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Wrist Rocks", sets: 1, reps: 10, durationSeconds: 30 },
        { name: "Shoulder Dislocates", sets: 1, reps: 15, durationSeconds: 30 },
        { name: "Scap Push-ups", sets: 2, reps: 10, durationSeconds: 30 },
        { name: "Hollow Body", sets: 3, reps: 15, durationSeconds: 15, notes: "15s hold" },
      ];
      break;
    case "pull_skill":
      items = [
        { name: "Band Pull-Aparts", sets: 2, reps: 15, durationSeconds: 30 },
        { name: "Active Hang", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
        { name: "Scap Pulls", sets: 2, reps: 8, durationSeconds: 30 },
        { name: "Cat-Cow", sets: 1, reps: 10, durationSeconds: 30 },
      ];
      break;
    case "legs":
      items = [
        { name: "Arm Circles", sets: 1, reps: 20, durationSeconds: 30 },
        { name: "Jumping Jacks", sets: 1, reps: 30, durationSeconds: 30 },
        { name: "Bodyweight Squats", sets: 2, reps: 10, durationSeconds: 30 },
        { name: "Leg Swings", sets: 1, reps: 10, durationSeconds: 30, notes: "each side" },
        { name: "Deep Squat Hold", sets: 1, reps: 30, durationSeconds: 30, notes: "30s hold" },
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

function makeCooldown(id: string, name: string, sets: number, holdSeconds: number): PlannedExercise {
  return {
    id,
    progressionId: "cooldown",
    name,
    sets,
    reps: holdSeconds,
    restSeconds: 0,
    difficultyIntent: "easy",
    exerciseRole: "cooldown",
    holdSeconds,
  };
}

function getCooldownExercises(sessionType: "push_skill" | "pull_skill" | "legs", weekId: string): PlannedExercise[] {
  const prefix = `${weekId}_cd`;
  switch (sessionType) {
    case "push_skill":
      return [
        makeCooldown(`${prefix}0`, "Wrist Stretch", 1, 30),
        makeCooldown(`${prefix}1`, "Chest Doorway Stretch", 1, 30),
        makeCooldown(`${prefix}2`, "Pike Stretch", 1, 30),
      ];
    case "pull_skill":
      return [
        makeCooldown(`${prefix}0`, "Lat Stretch", 1, 30),
        makeCooldown(`${prefix}1`, "Thoracic Rotation", 1, 10),
        makeCooldown(`${prefix}2`, "Dead Hang", 1, 60),
      ];
    case "legs":
      return [
        makeCooldown(`${prefix}0`, "Hip Flexor Stretch", 1, 30),
        makeCooldown(`${prefix}1`, "Quad Stretch", 1, 30),
        makeCooldown(`${prefix}2`, "Pigeon Pose", 1, 60),
      ];
  }
}

// ── v2.4.1: Skill Isometric Hold Scheme (Slot 3) ────────────────────────────

/**
 * Returns the prescription for the primary skill isometric per the v2.4.1
 * §5.2 hold tables.
 *   Weeks 1–4 build:  6 × 5s (mid of 4–6s range)   | deload: 3 × 3s
 *   Weeks 5–8 build:  5 × 8s (mid of 6–10s range)  | deload: 3 × 5s
 *   Weeks 9–12 build: 4 × 10s (mid of 8–12s range) | deload: 3 × 6s
 *   Rest 180s build / 120s deload between sets.
 */
function getSkillIsometricScheme(
  weekNumber: number,
  isDeload: boolean,
): { sets: number; holdSeconds: number; restSeconds: number } {
  const restSeconds = isDeload ? 120 : 180;
  if (weekNumber <= 4) {
    return isDeload
      ? { sets: 3, holdSeconds: 3, restSeconds }
      : { sets: 6, holdSeconds: 5, restSeconds };
  }
  if (weekNumber <= 8) {
    return isDeload
      ? { sets: 3, holdSeconds: 5, restSeconds }
      : { sets: 5, holdSeconds: 8, restSeconds };
  }
  return isDeload
    ? { sets: 3, holdSeconds: 6, restSeconds }
    : { sets: 4, holdSeconds: 10, restSeconds };
}

// ── v2.4.1: Accessories Superset Block (Slot 5) ─────────────────────────────

/**
 * Returns a single grouped PlannedExercise containing two supersetted
 * accessory movements as subExercises. Sets/reps on the parent represent
 * rounds × per-movement reps. Inter-superset rest lives in restSeconds;
 * intra-superset rest is zero (communicated in notes).
 */
function buildAccessoryBlock(
  weekId: string,
  isDeload: boolean,
  accessories: Array<{ id: string; name: string }>,
): PlannedExercise {
  const rounds = isDeload ? 2 : 3;
  const reps = isDeload ? 10 : 12;
  const subs: SubExercise[] = accessories.map((a, i) => ({
    id: `${weekId}_acc_sub${i}`,
    name: a.name,
    prescription: `${reps} reps`,
  }));
  return {
    id: `${weekId}_acc_block`,
    progressionId: "accessory_block",
    name: "Accessories (superset)",
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

/** Session A — Push focus. */
function buildSessionA(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekNumber: number,
  pullId: string,
  pushId: string,
  coreId: string,
  _legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const prefix = `${weekId}_a`;
  const lsitId = getLsitId(coreId);
  const iso = getSkillIsometricScheme(weekNumber, isDeload);

  // Slot 4 complementary: dip variant if user has progressed there, else
  // a push variant 2 levels below current to avoid duplicating the
  // dominant push movement of the day.
  const pushTree = getProgressionTree("push");
  const pushIdx = pushTree.findIndex(p => p.id === pushId);
  const dipIdx = pushTree.findIndex(p => p.id === "push_07");
  const dipId = (dipIdx >= 0 && pushIdx >= dipIdx) ? "push_07" : resolveVolume(pushId, 2);

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice
    makeExercise(0, weekId, lsitId, null, "skill_practice",
      isDeload ? 1 : 2, 10, 60, "easy",
      { holdSeconds: 10, notes: "Submaximal — practice technique, stop before failure" }),
    // Slot 3 — skill isometric
    makeExercise(1, weekId, lsitId, null, "skill_isometric",
      iso.sets, iso.holdSeconds, iso.restSeconds, isDeload ? "easy" : "moderate",
      { holdSeconds: iso.holdSeconds }),
    // Slot 4 — complementary lift
    makeExercise(2, weekId, dipId, null, "complementary",
      isDeload ? 2 : 3, isDeload ? 6 : waveReps, 120, isDeload ? "easy" : "moderate"),
    // Slot 5 — accessories grouped (skill-adjacent + antagonist)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "supplementary_scap_pushups", name: "Scapular Push-ups (Protraction)" },
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
    ]),
    // Slot 6 — core finisher
    makeExercise(4, weekId, "core_02", "Hollow Body Hold", "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30 }),
  ];

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Push + Skill (A)",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("push_skill", prefix),
    cooldownExercises: getCooldownExercises("push_skill", prefix),
  };
}

/** Session B — Pull focus. */
function buildSessionB(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekNumber: number,
  pullId: string,
  _pushId: string,
  _coreId: string,
  _legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const prefix = `${weekId}_b`;
  const iso = getSkillIsometricScheme(weekNumber, isDeload);

  // Slot 4 complementary: pull/row variant 2 levels below current.
  const rowId = resolveVolume(pullId, 2);

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice (Skin the Cat — dynamic, reps-based not hold)
    makeExercise(0, weekId, "skill_skin_the_cat", "Skin the Cat", "skill_practice",
      isDeload ? 1 : 2, 3, 60, "easy",
      { notes: "Submaximal — practice technique, stop before failure" }),
    // Slot 3 — skill isometric (Active Hang — pull-side hold)
    makeExercise(1, weekId, "supplementary_active_hang", "Dead Hang (Active Shoulders)",
      "skill_isometric", iso.sets, iso.holdSeconds, iso.restSeconds,
      isDeload ? "easy" : "moderate",
      { holdSeconds: iso.holdSeconds }),
    // Slot 4 — complementary lift
    makeExercise(2, weekId, rowId, null, "complementary",
      isDeload ? 2 : 3, isDeload ? 6 : waveReps, 120, isDeload ? "easy" : "moderate"),
    // Slot 5 — accessories grouped (skill-adjacent + antagonist)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "acc_face_pulls", name: "Face Pulls (Band)" },
      { id: "supplementary_scap_pushups", name: "Scapular Push-ups (Protraction)" },
    ]),
    // Slot 6 — core finisher (plank hold)
    makeExercise(4, weekId, "supplementary_plank", "Plank Hold", "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30 }),
  ];

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Pull + Skill (B)",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("pull_skill", prefix),
    cooldownExercises: getCooldownExercises("pull_skill", prefix),
  };
}

/** Session C — Full body / Legs focus. */
function buildSessionC(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  weekNumber: number,
  _pullId: string,
  _pushId: string,
  coreId: string,
  legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const prefix = `${weekId}_c`;
  const lsitId = getLsitId(coreId);
  const iso = getSkillIsometricScheme(weekNumber, isDeload);

  const exercises: PlannedExercise[] = [
    // Slot 2 — skill practice
    makeExercise(0, weekId, lsitId, null, "skill_practice",
      isDeload ? 1 : 2, 10, 60, "easy",
      { holdSeconds: 10, notes: "Submaximal — practice technique, stop before failure" }),
    // Slot 3 — skill isometric
    makeExercise(1, weekId, lsitId, null, "skill_isometric",
      iso.sets, iso.holdSeconds, iso.restSeconds, isDeload ? "easy" : "moderate",
      { holdSeconds: iso.holdSeconds }),
    // Slot 4 — complementary lift (legs progression directly)
    makeExercise(2, weekId, legsId, null, "complementary",
      isDeload ? 2 : 3, isDeload ? 6 : waveReps, 120, isDeload ? "easy" : "moderate"),
    // Slot 5 — accessories grouped (legs + core)
    buildAccessoryBlock(prefix, isDeload, [
      { id: "acc_lunges", name: "Lunges" },
      { id: "supplementary_plank", name: "Plank Hold" },
    ]),
    // Slot 6 — core finisher (max-effort L-sit attempt)
    makeExercise(4, weekId, lsitId, null, "finisher",
      isDeload ? 2 : 3, isDeload ? 20 : 30, 60, isDeload ? "easy" : "moderate",
      { holdSeconds: isDeload ? 20 : 30, notes: "Max effort — go close to failure" }),
  ];

  return {
    id: prefix,
    weekId,
    dayOfWeek,
    label: "Full Body + Legs (C)",
    phase,
    patterns: derivePatternsFromExercises(exercises, PROGRESSIONS),
    exercises,
    warmUpExercises: buildWarmupExercises("legs", prefix),
    cooldownExercises: getCooldownExercises("legs", prefix),
  };
}

// ── Main Generator ──────────────────────────────────────────────────────────

const SESSION_BUILDERS = [buildSessionA, buildSessionB, buildSessionC];

export function generateSkillBuilderBeginner(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
): Mesocycle {
  const mesoId = `meso_skb_beg_${Date.now()}`;
  const sessionsPerWeek = Math.min(schedule.daysPerWeek, 3);

  // Resolve active progressions
  const pullId = getActiveProgression("pull", progressions);
  const pushId = getActiveProgression("push", progressions);
  const legsId = getActiveProgression("legs", progressions);
  const coreId = getActiveProgression("core", progressions);

  // Build weeks from phase template
  const weeks: PlanWeek[] = [];
  let weekNumber = 1;
  let sessionRotation = 0;

  for (const block of BEGINNER_PHASES) {
    for (let w = 0; w < block.weeks; w++) {
      const weekId = `${mesoId}_w${weekNumber}`;
      const isDeload = block.phase === "deload";

      const weekInBlock = isDeload ? 0 : w;
      const waveReps = isDeload ? 6 : getWaveReps(weekInBlock, 6, 10);

      const sessions: PlannedSession[] = [];
      const days = schedule.preferredDays.slice(0, sessionsPerWeek);

      for (let s = 0; s < days.length; s++) {
        const builderIdx = sessionRotation % 3;
        const builder = SESSION_BUILDERS[builderIdx];

        sessions.push(
          builder(
            weekId,
            days[s],
            block.phase,
            weekNumber,
            pullId,
            pushId,
            coreId,
            legsId,
            isDeload,
            waveReps,
          ),
        );

        sessionRotation++;
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
    tier: "beginner",
    weeks,
    status: "active",
  };
}
