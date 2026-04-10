// =============================================================================
// ARNOLD — Street Lifter Beginner Plan Generator
// 12-week full-body A/B/C rotation. Double progression 5-8 reps.
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

/** Find user's active progression for a pattern, fallback to level 1 */
function getActiveProgression(
  pattern: string,
  progressions: UserProgression[],
): string {
  const active = progressions.find(p => {
    const prog = PROGRESSIONS.find(pr => pr.id === p.progressionId);
    return prog?.pattern === pattern && p.status === "active";
  });
  if (active) return active.progressionId;

  // Fallback to first in pattern
  const defaults: Record<string, string> = {
    pull: "pull_01", push: "push_01", legs: "legs_01", core: "core_01",
  };
  return defaults[pattern] || `${pattern}_01`;
}

/** Get an exercise N levels below in the same tree (clamped to bottom) */
function getVolumeFallback(progressionId: string, levelsBelow: number): string {
  const prog = PROGRESSIONS.find(p => p.id === progressionId);
  if (!prog) return progressionId;

  const tree = getProgressionTree(prog.pattern);
  const idx = tree.findIndex(p => p.id === progressionId);
  const targetIdx = Math.max(0, idx - levelsBelow);
  return tree[targetIdx].id;
}

/** Look up a progression's name, fallback to ID */
function getName(id: string): string {
  const prog = PROGRESSIONS.find(p => p.id === id);
  if (prog) return prog.name;
  const acc = ACCESSORIES.find(a => a.id === id);
  return acc?.name || id;
}

/** Create a PlannedExercise */
function makeExercise(
  idx: number,
  weekId: string,
  progressionId: string,
  role: ExerciseRole,
  sets: number,
  reps: number,
  restSeconds: number,
  difficultyIntent: DifficultyIntent,
  notes?: string,
): PlannedExercise {
  return {
    id: `${weekId}_ex${idx}`,
    progressionId,
    name: getName(progressionId),
    sets,
    reps,
    restSeconds,
    difficultyIntent,
    exerciseRole: role,
    ...(notes ? { notes } : {}),
  };
}

// ── Wave Loading ────────────────────────────────────────────────────────────

/** Get reps for main/complementary exercises based on position in 3-week block */
function getWaveReps(weekInBlock: number, baseMin: number, baseMax: number): number {
  // weekInBlock: 0 = first week, 1 = second, 2 = third
  if (weekInBlock === 0) return baseMin;           // bottom of range
  if (weekInBlock === 1) return Math.round((baseMin + baseMax) / 2); // middle
  return baseMax;                                   // top of range
}

// ── Warm-ups & Cooldowns ────────────────────────────────────────────────────

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

function getWarmupExercises(sessionType: "pull" | "push" | "legs", weekId: string): PlannedExercise[] {
  const prefix = `${weekId}_wu`;
  switch (sessionType) {
    case "pull":
      return [
        makeWarmup(`${prefix}0`, "Arm Circles", 1, 20, false),
        makeWarmup(`${prefix}1`, "Jumping Jacks", 1, 30, false),
        makeWarmup(`${prefix}2`, "Band Pull-Aparts", 2, 15, false),
        makeWarmup(`${prefix}3`, "Dead Hang", 1, 30, true),
        makeWarmup(`${prefix}4`, "Scap Pulls", 2, 8, false),
      ];
    case "push":
      return [
        makeWarmup(`${prefix}0`, "Arm Circles", 1, 20, false),
        makeWarmup(`${prefix}1`, "Jumping Jacks", 1, 30, false),
        makeWarmup(`${prefix}2`, "Scap Push-ups", 2, 10, false),
        makeWarmup(`${prefix}3`, "Band Pull-Aparts", 2, 15, false),
        makeWarmup(`${prefix}4`, "Shoulder Dislocates", 1, 15, false),
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

function getCooldownExercises(sessionType: "pull" | "push" | "legs", weekId: string): PlannedExercise[] {
  const prefix = `${weekId}_cd`;
  switch (sessionType) {
    case "pull":
      return [
        makeCooldown(`${prefix}0`, "Dead Hang", 1, 60),
        makeCooldown(`${prefix}1`, "Lat Stretch", 1, 30),
        makeCooldown(`${prefix}2`, "Bicep Wall Stretch", 1, 30),
      ];
    case "push":
      return [
        makeCooldown(`${prefix}0`, "Chest Doorway Stretch", 1, 30),
        makeCooldown(`${prefix}1`, "Tricep Stretch", 1, 30),
        makeCooldown(`${prefix}2`, "Shoulder Sleeper Stretch", 1, 30),
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

function buildSessionA(
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
  const pullVolumeId = getVolumeFallback(pullId, 2);

  const exercises: PlannedExercise[] = [
    makeExercise(0, weekId, pullId, "main", sets, waveReps, 180, diff),
    makeExercise(1, weekId, pullVolumeId, "volume", sets, isDeload ? 8 : 10, 90, modDiff,
      pullVolumeId === pullId ? "Higher reps for volume" : undefined),
    makeExercise(2, weekId, pushId, "complementary", sets, waveReps, 120, modDiff),
    makeExercise(3, weekId, coreId, "accessory", sets, isDeload ? 10 : 12, 60, "easy"),
    makeExercise(4, weekId, legsId, "accessory", sets, isDeload ? 10 : 12, 60, "easy"),
  ];

  return {
    id: `${weekId}_a`,
    weekId,
    dayOfWeek,
    label: "Pull Emphasis (A)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("pull", `${weekId}_a`),
    cooldownExercises: getCooldownExercises("pull", `${weekId}_a`),
  };
}

function buildSessionB(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  pullId: string,
  pushId: string,
  _coreId: string,
  _legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const sets = isDeload ? 2 : 3;
  const diff: DifficultyIntent = isDeload ? "easy" : "challenging";
  const modDiff: DifficultyIntent = isDeload ? "easy" : "moderate";
  const pushVolumeId = getVolumeFallback(pushId, 2);

  // core_02 = Hollow Body Hold (isometric, 20-30s)
  const hollowId = "core_02";

  const exercises: PlannedExercise[] = [
    makeExercise(0, weekId, pushId, "main", sets, waveReps, 180, diff),
    makeExercise(1, weekId, pushVolumeId, "volume", sets, isDeload ? 8 : 10, 90, modDiff,
      pushVolumeId === pushId ? "Higher reps for volume" : undefined),
    makeExercise(2, weekId, pullId, "complementary", sets, waveReps, 120, modDiff),
    makeExercise(3, weekId, "acc_face_pulls", "accessory", sets, 15, 60, "easy"),
    makeExercise(4, weekId, hollowId, "accessory", sets, isDeload ? 20 : 25, 60, "easy"),
  ];

  return {
    id: `${weekId}_b`,
    weekId,
    dayOfWeek,
    label: "Push Emphasis (B)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("push", `${weekId}_b`),
    cooldownExercises: getCooldownExercises("push", `${weekId}_b`),
  };
}

function buildSessionC(
  weekId: string,
  dayOfWeek: number,
  phase: PlanPhase,
  pullId: string,
  pushId: string,
  _coreId: string,
  legsId: string,
  isDeload: boolean,
  waveReps: number,
): PlannedSession {
  const sets = isDeload ? 2 : 3;
  const diff: DifficultyIntent = isDeload ? "easy" : "challenging";
  const modDiff: DifficultyIntent = isDeload ? "easy" : "moderate";

  const exercises: PlannedExercise[] = [
    makeExercise(0, weekId, legsId, "main", sets, waveReps, 120, diff),
    makeExercise(1, weekId, "acc_lunges", "volume", sets, isDeload ? 8 : 10, 90, modDiff),
    makeExercise(2, weekId, pullId, "complementary", sets, waveReps, 120, modDiff),
    makeExercise(3, weekId, pushId, "complementary", sets, waveReps, 90, modDiff),
    makeExercise(4, weekId, "acc_calf_raises", "accessory", 2, isDeload ? 12 : 18, 45, "easy"),
    makeExercise(5, weekId, "core_01", "accessory", sets, 10, 60, "easy"),
  ];

  return {
    id: `${weekId}_c`,
    weekId,
    dayOfWeek,
    label: "Legs + Full Body (C)",
    phase,
    exercises,
    warmUpExercises: getWarmupExercises("legs", `${weekId}_c`),
    cooldownExercises: getCooldownExercises("legs", `${weekId}_c`),
  };
}

// ── Main Generator ──────────────────────────────────────────────────────────

const SESSION_BUILDERS = [buildSessionA, buildSessionB, buildSessionC];

export function generateStreetLifterBeginner(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
): Mesocycle {
  const mesoId = `meso_sl_beg_${Date.now()}`;
  const sessionsPerWeek = Math.min(schedule.daysPerWeek, 3); // beginner caps at 3

  // Resolve active progressions
  const pullId = getActiveProgression("pull", progressions);
  const pushId = getActiveProgression("push", progressions);
  const legsId = getActiveProgression("legs", progressions);
  const coreId = getActiveProgression("core", progressions);

  // Build weeks from phase template
  const weeks: PlanWeek[] = [];
  let weekNumber = 1;
  let sessionRotation = 0; // tracks A/B/C rotation across entire meso

  for (const block of BEGINNER_PHASES) {
    for (let w = 0; w < block.weeks; w++) {
      const weekId = `${mesoId}_w${weekNumber}`;
      const isDeload = block.phase === "deload";

      // Wave loading: position within 3-week training block (0, 1, 2)
      const weekInBlock = isDeload ? 0 : w;
      const waveReps = isDeload ? 5 : getWaveReps(weekInBlock, 5, 8);

      // Build sessions for this week
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
    programPath: "street_lifter",
    tier: "beginner",
    weeks,
    status: "active",
  };
}
