// =============================================================================
// ARNOLD — Weight Engine
// e1RM calculation, phase-based target weights, ramp-up percentages.
// Formulas from Street Lifter Bible v1.1 + Hybrid Athlete Bible v1.1.
// =============================================================================

import type { UserBenchmarks } from "../types";

// ── Body-Load Coefficients ──────────────────────────────────────────────────

/**
 * Per the Street Lifter Bible:
 * Pull-ups: total load = added weight + (bodyweight × 0.65)
 * Dips: total load = added weight + (bodyweight × 0.70)
 * Squats: total load = added weight (standard barbell, BW not factored)
 */
const BW_COEFFICIENT: Record<string, number> = {
  pulling: 0.65,
  pushing: 0.70,
  legs: 0,
};

// ── e1RM Calculation ────────────────────────────────────────────────────────

/**
 * Epley formula: e1RM = weight × (1 + reps / 30)
 * Returns the estimated 1-rep max in total load (kg).
 */
export function calculateE1RM(totalLoad: number, reps: number): number {
  if (reps <= 0 || totalLoad <= 0) return 0;
  if (reps === 1) return totalLoad;
  return Math.round(totalLoad * (1 + reps / 30) * 10) / 10;
}

/**
 * Converts user benchmarks into total load, then e1RM.
 * Returns added-weight e1RM (subtracts BW contribution back out).
 */
export function benchmarkToE1RM(
  addedWeightKg: number,
  reps: number,
  bodyweightKg: number,
  pattern: "pulling" | "pushing" | "legs"
): { totalE1RM: number; addedE1RM: number; bwContribution: number } {
  const bwContribution = bodyweightKg * (BW_COEFFICIENT[pattern] ?? 0);
  const totalLoad = addedWeightKg + bwContribution;
  const totalE1RM = calculateE1RM(totalLoad, reps);
  const addedE1RM = Math.max(0, Math.round((totalE1RM - bwContribution) * 10) / 10);
  return { totalE1RM, addedE1RM, bwContribution };
}

// ── e1RM Profile ────────────────────────────────────────────────────────────

export interface E1RMProfile {
  pullUp: { totalE1RM: number; addedE1RM: number; bwContribution: number } | null;
  dip: { totalE1RM: number; addedE1RM: number; bwContribution: number } | null;
  squat: { totalE1RM: number; addedE1RM: number; bwContribution: number } | null;
  bodyweightKg: number;
}

/**
 * Extracts all e1RM values from user benchmarks.
 * Returns null for exercises where benchmarks are missing or bodyweight-only.
 */
export function buildE1RMProfile(benchmarks: UserBenchmarks): E1RMProfile {
  const bw = benchmarks.bodyweightKg ?? 70;

  const pullUp = (benchmarks.pullUpMaxReps && benchmarks.pullUpMaxReps > 0)
    ? benchmarkToE1RM(benchmarks.pullUpAddedKg ?? 0, benchmarks.pullUpMaxReps, bw, "pulling")
    : null;

  const dip = (benchmarks.dipMaxReps && benchmarks.dipMaxReps > 0)
    ? benchmarkToE1RM(benchmarks.dipAddedKg ?? 0, benchmarks.dipMaxReps, bw, "pushing")
    : null;

  const squat = (benchmarks.squatMaxReps && benchmarks.squatMaxReps > 0)
    ? benchmarkToE1RM(benchmarks.squatAddedKg ?? 0, benchmarks.squatMaxReps, bw, "legs")
    : null;

  return { pullUp, dip, squat, bodyweightKg: bw };
}

// ── Phase Intensity Zones ───────────────────────────────────────────────────

interface PhaseIntensity {
  workingPct: number;   // working set % of total e1RM
  backOffPct: number;   // back-off / variation set % of total e1RM
  finisherPct: number;  // max(-2) finisher % of total e1RM
}

const PHASE_INTENSITY: Record<string, PhaseIntensity> = {
  accumulation:     { workingPct: 0.81, backOffPct: 0.68, finisherPct: 0.50 },
  strength:         { workingPct: 0.88, backOffPct: 0.75, finisherPct: 0.55 },
  peaking:          { workingPct: 0.95, backOffPct: 0.82, finisherPct: 0.57 },
  test:             { workingPct: 0.98, backOffPct: 0.70, finisherPct: 0.0 },
  deload:           { workingPct: 0.60, backOffPct: 0.50, finisherPct: 0.0 },
  // Beginner phases (bodyweight only — no added weight)
  base_building:    { workingPct: 0, backOffPct: 0, finisherPct: 0 },
  base_conditioning:{ workingPct: 0, backOffPct: 0, finisherPct: 0 },
  hypertrophy:      { workingPct: 0.75, backOffPct: 0.62, finisherPct: 0 },
  skill_peaking:    { workingPct: 0, backOffPct: 0, finisherPct: 0 },
  specialization:   { workingPct: 0.93, backOffPct: 0.80, finisherPct: 0.55 },
};

// ── Plate Rounding ──────────────────────────────────────────────────────────

/**
 * Rounds to nearest available plate increment.
 * Intermediate: 1.25kg increments (dip belt plates).
 * Below 2.5kg → round to 0 (bodyweight).
 */
function roundToPlate(kg: number): number {
  if (kg < 2.5) return 0;
  return Math.round(kg / 1.25) * 1.25;
}

// ── Target Weight Calculation ───────────────────────────────────────────────

/**
 * Calculates the added weight (kg) for a given exercise role in a given phase.
 * Returns 0 for bodyweight exercises or beginner phases.
 */
export function getTargetWeight(
  e1rmProfile: E1RMProfile,
  pattern: "pulling" | "pushing" | "legs",
  phase: string,
  role: string,
  rampUpSetIndex?: number,
  dayType?: "heavy" | "peak_singles",
  floorKg?: number,
  totalRampSets?: number,
): number {
  const e1rm = pattern === "pulling" ? e1rmProfile.pullUp
    : pattern === "pushing" ? e1rmProfile.dip
    : e1rmProfile.squat;

  if (!e1rm || e1rm.totalE1RM <= 0) return 0;

  const intensity = PHASE_INTENSITY[phase] ?? PHASE_INTENSITY.accumulation;

  // Day-type override: peak singles day always uses peaking intensity
  // regardless of mesocycle phase (weekly max expression per Bible Section 4, Day 3)
  const effectiveIntensity = dayType === "peak_singles"
    ? PHASE_INTENSITY.peaking
    : intensity;

  // Ramp-up sets (v2.4.5 §10.3):
  //   Stage 1 (set 0): loaded warm-up — always at the exercise/tier floor
  //   Stages 2+:       ramp from 50% → 90% of working added, distributed
  //                    across remaining sets; never falls below floor.
  if (role === "ramp_up" && rampUpSetIndex !== undefined) {
    const workingTotalLoad = e1rm.totalE1RM * effectiveIntensity.workingPct;
    const workingAdded = Math.max(0, workingTotalLoad - e1rm.bwContribution);
    const floor = floorKg ?? 0;
    const totalSets = totalRampSets ?? 4;

    if (rampUpSetIndex === 0) {
      return roundToPlate(floor);
    }

    const rampSetCount = totalSets - 1;
    const rampIdx = rampUpSetIndex - 1;
    const minPct = 0.50;
    const maxPct = 0.90;
    const pct = rampSetCount > 1
      ? minPct + ((maxPct - minPct) * (rampIdx / (rampSetCount - 1)))
      : maxPct;
    const rampAdded = Math.max(floor, workingAdded * pct);

    return roundToPlate(rampAdded);
  }

  let pct: number;
  switch (role) {
    case "main":
      pct = effectiveIntensity.workingPct;
      break;
    case "volume":
    case "complementary":
      pct = effectiveIntensity.backOffPct;
      break;
    case "finisher":
      pct = effectiveIntensity.finisherPct;
      break;
    case "accessory":
    case "warmup":
    case "cooldown":
    case "skill":
      return 0;
    default:
      pct = effectiveIntensity.workingPct;
  }

  if (pct <= 0) return 0;

  const targetTotalLoad = e1rm.totalE1RM * pct;
  const addedWeight = Math.max(0, targetTotalLoad - e1rm.bwContribution);
  return roundToPlate(addedWeight);
}

// ── Wave Loading ────────────────────────────────────────────────────────────

/**
 * Wave loading adjusts reps not weight within a phase (per Bible).
 * Weight stays constant — progression happens between phases.
 */
export function getWaveAdjustment(
  _weekInPhase: number,
  _phase: string,
): number {
  return 0;
}

// ── Session Weights ─────────────────────────────────────────────────────────

export interface ExerciseWeightTarget {
  exerciseId: string;
  role: string;
  addedWeightKg: number;
  rampUpSetIndex?: number;
}

/**
 * Given a list of exercises in a session, returns target weights for each.
 */
export function getSessionWeights(
  exercises: Array<{ id: string; role: string; pattern?: string; rampUpSetIndex?: number }>,
  e1rmProfile: E1RMProfile,
  phase: string,
  dayType?: "heavy" | "peak_singles",
): ExerciseWeightTarget[] {
  return exercises.map(ex => ({
    exerciseId: ex.id,
    role: ex.role,
    addedWeightKg: getTargetWeight(
      e1rmProfile,
      (ex.pattern as "pulling" | "pushing" | "legs") ?? "pulling",
      phase,
      ex.role,
      ex.rampUpSetIndex,
      dayType,
    ),
    rampUpSetIndex: ex.rampUpSetIndex,
  }));
}
