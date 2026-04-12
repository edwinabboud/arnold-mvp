// =============================================================================
// ARNOLD — Skill Builder Beginner Plan Generator
// 12-week full-body A/B/C rotation. Skills FIRST, then supporting strength.
// Double progression + handstand time accumulation.
// Deload every 4th week. Wave loading across 3-week blocks.
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
  UserProgression,
} from "../../types";
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { ACCESSORIES } from "../data/accessories";

// ── Phase Template ──────────────────────────────────────────────────────────

const BEGINNER_PHASES: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
  { phase: "base_building", weeks: 3 },
  { phase: "deload", weeks: 1 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Warm-ups & Cooldowns (Skill-Specific) ───────────────────────────────────

function makeWarmup(id: string, name: string, sets: number, reps: number, isIsometric: boolean): PlannedExercise {
  return {
    id,
    progressionId: "warmup",
    name,
    sets,
    reps,
    restSeconds: 0,
    difficultyIntent: "easy",
    exerciseRole: "warmup",
    ...(isIsometric ? { holdSeconds: reps } : {}),
  };
}

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

function getWarmupExercises(sessionType: "push_skill" | "pull_skill" | "legs", weekId: string): PlannedExercise[] {
  const prefix = `${weekId}_wu`;
  switch (sessionType) {
    case "push_skill":
      return [
        makeWarmup(`${prefix}0`, "Wrist Circles", 1, 15, false),
        makeWarmup(`${prefix}1`, "Wrist Rocks", 1, 10, false),
        makeWarmup(`${prefix}2`, "Shoulder Dislocates", 1, 15, false),
        makeWarmup(`${prefix}3`, "Scap Push-ups", 2, 10, false),
        makeWarmup(`${prefix}4`, "Hollow Body", 3, 15, true),
      ];
    case "pull_skill":
      return [
        makeWarmup(`${prefix}0`, "Band Pull-Aparts", 2, 15, false),
        makeWarmup(`${prefix}1`, "Active Hang", 1, 30, true),
        makeWarmup(`${prefix}2`, "Scap Pulls", 2, 8, false),
        makeWarmup(`${prefix}3`, "Cat-Cow", 1, 10, false),
      ];
    case "legs":
      return [
        makeWarmup(`${prefix}0`, "Arm Circles", 1, 20, false),
        makeWarmup(`${prefix}1`, "Jumping Jacks", 1, 30, false),
        makeWarmup(`${prefix}2`, "Bodyweight Squats", 2, 10, false),
        makeWarmup(`${prefix}3`, "Leg Swings", 1, 10, false),
        makeWarmup(`${prefix}4`, "Deep Squat Hold", 1, 30, true),
      ];
  }
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

// ── Session Builders ────────────────────────────────────────────────────────

/** Session A — Push + Skill: L-sit first, then push strength */
function buildSessionA(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  pullId: string,
  pushId: string,
  coreId: string,
  _legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const sets = isDeload ? 2 : 3;
  const diff: DifficultyIntent = isDeload ? "easy" : "challenging";
  const modDiff: DifficultyIntent = isDeload ? "easy" : "moderate";
  const lsitId = getLsitId(coreId);

  // Dip progression: use push tree, find dips (push_07) or fallback to current push level
  const pushTree = getProgressionTree("push");
  const pushIdx = pushTree.findIndex(p => p.id === pushId);
  const dipIdx = pushTree.findIndex(p => p.id === "push_07");
  // Use dips if user is at that level, otherwise use a push variant 2 below current (no duplicates)
  const dipId = (dipIdx >= 0 && pushIdx >= dipIdx) ? "push_07" : resolveVolume(pushId, 2);

  const exercises: PlannedExercise[] = [
    // Skill FIRST
    makeExercise(0, weekId, lsitId, null, "skill", sets, isDeload ? 15 : 20, 90, modDiff,
      { holdSeconds: isDeload ? 15 : 20, notes: "Max hold — stop before failure" }),
    // Main strength
    makeExercise(1, weekId, pushId, null, "main", sets, waveReps, 120, diff),
    makeExercise(2, weekId, dipId, null, "main", sets, waveReps, 120, diff),
    // Volume
    makeExercise(3, weekId, "supplementary_pike_pushups", "Pike Push-ups", "volume", sets, isDeload ? 8 : 10, 90, modDiff),
    // Accessories
    makeExercise(4, weekId, "supplementary_scap_pushups", "Scapular Push-ups (Protraction)", "accessory", sets, isDeload ? 10 : 12, 60, "easy"),
    makeExercise(5, weekId, "supplementary_plank", "Plank Hold", "accessory", sets, isDeload ? 30 : 40, 30, "easy",
      { holdSeconds: isDeload ? 30 : 40 }),
  ];

  return {
    id: `${weekId}_a`,
    weekId,
    dayOfWeek,
    label: "Push + Skill (A)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("push_skill", `${weekId}_a`),
    cooldownExercises: getCooldownExercises("push_skill", `${weekId}_a`),
  };
}

/** Session B — Pull + Skill: Skin the Cat first, then pull strength */
function buildSessionB(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  pullId: string,
  _pushId: string,
  _coreId: string,
  _legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const sets = isDeload ? 2 : 3;
  const diff: DifficultyIntent = isDeload ? "easy" : "challenging";
  const modDiff: DifficultyIntent = isDeload ? "easy" : "moderate";

  // Row: use pull tree 2 levels below, substitute accessory if duplicate
  const rowId = resolveVolume(pullId, 2);

  const exercises: PlannedExercise[] = [
    // Skill FIRST
    makeExercise(0, weekId, "skill_skin_the_cat", "Skin the Cat", "skill", sets, isDeload ? 3 : 5, 120, modDiff,
      { notes: "Slow and controlled — stop before failure" }),
    // Main strength
    makeExercise(1, weekId, pullId, null, "main", sets, waveReps, 120, diff),
    // Volume
    makeExercise(2, weekId, rowId, null, "volume", sets, isDeload ? 8 : 10, 90, modDiff),
    makeExercise(3, weekId, "supplementary_active_hang", "Dead Hang (Active Shoulders)", "volume", sets, isDeload ? 20 : 30, 60, modDiff,
      { holdSeconds: isDeload ? 20 : 30 }),
    // Accessories
    makeExercise(4, weekId, "core_02", null, "accessory", sets, isDeload ? 15 : 25, 60, "easy",
      { holdSeconds: isDeload ? 15 : 25 }),
    makeExercise(5, weekId, "acc_face_pulls", null, "accessory", sets, 15, 60, "easy"),
  ];

  return {
    id: `${weekId}_b`,
    weekId,
    dayOfWeek,
    label: "Pull + Skill (B)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("pull_skill", `${weekId}_b`),
    cooldownExercises: getCooldownExercises("pull_skill", `${weekId}_b`),
  };
}

/** Session C — Full Body + Legs: L-sit first, then full body strength */
function buildSessionC(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  pullId: string,
  pushId: string,
  coreId: string,
  legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const sets = isDeload ? 2 : 3;
  const diff: DifficultyIntent = isDeload ? "easy" : "challenging";
  const modDiff: DifficultyIntent = isDeload ? "easy" : "moderate";
  const lsitId = getLsitId(coreId);

  const exercises: PlannedExercise[] = [
    // Skill FIRST
    makeExercise(0, weekId, lsitId, null, "skill", sets, isDeload ? 15 : 20, 90, modDiff,
      { holdSeconds: isDeload ? 15 : 20, notes: "Max hold — stop before failure" }),
    // Main strength
    makeExercise(1, weekId, legsId, null, "main", sets, waveReps, 120, diff),
    makeExercise(2, weekId, pullId, null, "main", sets, waveReps, 120, diff),
    makeExercise(3, weekId, pushId, null, "main", sets, waveReps, 90, modDiff),
    // Accessories
    makeExercise(4, weekId, "acc_lunges", null, "accessory", sets, 10, 60, "easy"),
    makeExercise(5, weekId, "core_01", null, "accessory", sets, 10, 60, "easy",
      { notes: "10 per side" }),
  ];

  return {
    id: `${weekId}_c`,
    weekId,
    dayOfWeek,
    label: "Full Body + Legs (C)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("legs", `${weekId}_c`),
    cooldownExercises: getCooldownExercises("legs", `${weekId}_c`),
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
      const waveReps = isDeload ? 5 : getWaveReps(weekInBlock, 5, 8);

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
