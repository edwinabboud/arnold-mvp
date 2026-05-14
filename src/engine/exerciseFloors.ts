// =============================================================================
// ARNOLD — Ramp-up Exercise Floors (v2.4.5 §10.3)
//
// Set 1 of any ramp-up is a loaded warm-up at an absolute kg floor specific
// to the exercise + the user's tier — not a percentage of working weight.
// Joint prep needs are absolute, not relative.
//
// Only loaded bodyweight exercises define floors. Bodyweight-only exercises
// (no added weight) implicitly use floor 0.
// =============================================================================

import type { TrainerTier } from "../types";

export interface RampFloor {
  beginner: number;
  intermediate: number;
  advanced: number;
}

/** Floors in kg added on top of bodyweight, for set 1 of any ramp-up. */
export const EXERCISE_RAMP_FLOORS: Record<string, RampFloor> = {
  weighted_dip:    { beginner: 0, intermediate: 5, advanced: 10 },
  weighted_pullup: { beginner: 0, intermediate: 5, advanced: 10 },
  weighted_chinup: { beginner: 0, intermediate: 5, advanced: 10 },
};

/**
 * Returns the kg floor for the given exercise + tier. Returns 0 if the
 * exercise has no defined floor (bodyweight-only).
 */
export function getRampFloor(progressionId: string, tier: TrainerTier): number {
  const floor = EXERCISE_RAMP_FLOORS[progressionId];
  if (!floor) return 0;
  return floor[tier];
}
