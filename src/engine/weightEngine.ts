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
  accumulation:     { workingPct: 0.74, backOffPct: 0.62, finisherPct: 0.50 },
  strength:         { workingPct: 0.83, backOffPct: 0.72, finisherPct: 0.55 },
  peaking:          { workingPct: 0.92, backOffPct: 0.80, finisherPct: 0.57 },
  test:             { workingPct: 0.95, backOffPct: 0.70, finisherPct: 0.0 },
  deload:           { workingPct: 0.57, backOffPct: 0.50, finisherPct: 0.0 },
  // Beginner phases (bodyweight only — no added weight)
  base_building:    { workingPct: 0, backOffPct: 0, finisherPct: 0 },
  base_conditioning:{ workingPct: 0, backOffPct: 0, finisherPct: 0 },
  hypertrophy:      { workingPct: 0.70, backOffPct: 0.58, finisherPct: 0 },
  skill_peaking:    { workingPct: 0, backOffPct: 0, finisherPct: 0 },
  specialization:   { workingPct: 0.90, backOffPct: 0.78, finisherPct: 0.55 },
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
): number {
  const e1rm = pattern === "pulling" ? e1rmProfile.pullUp
    : pattern === "pushing" ? e1rmProfile.dip
    : e1rmProfile.squat;

  if (!e1rm || e1rm.totalE1RM <= 0) return 0;

  const intensity = PHASE_INTENSITY[phase] ?? PHASE_INTENSITY.accumulation;

  // Ramp-up sets: percentage of WORKING weight, not e1RM
  if (role === "ramp_up" && rampUpSetIndex !== undefined) {
    const workingTotalLoad = e1rm.totalE1RM * intensity.workingPct;
    const rampPcts = [0.20, 0.40, 0.60, 0.75]; // per Bible Section 7
    const pct = rampPcts[Math.min(rampUpSetIndex, rampPcts.length - 1)];
    const rampTotalLoad = workingTotalLoad * pct;
    const addedWeight = Math.max(0, rampTotalLoad - e1rm.bwContribution);
    return roundToPlate(addedWeight);
  }

  let pct: number;
  switch (role) {
    case "main":
      pct = intensity.workingPct;
      break;
    case "volume":
    case "complementary":
      pct = intensity.backOffPct;
      break;
    case "finisher":
      pct = intensity.finisherPct;
      break;
    case "accessory":
    case "warmup":
    case "cooldown":
    case "skill":
      return 0;
    default:
      pct = intensity.workingPct;
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
    ),
    rampUpSetIndex: ex.rampUpSetIndex,
  }));
}
