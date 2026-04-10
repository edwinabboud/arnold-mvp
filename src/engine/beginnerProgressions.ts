// =============================================================================
// ARNOLD — Beginner Progressions
// Creates default UserProgression[] for users who skip assessment.
// Sets order-0 (easiest) exercise in each pattern as "active".
// =============================================================================

import { UserProgression, MovementPattern } from "../types";
import { getProgressionTree } from "../data/progressions";

const ALL_PATTERNS: MovementPattern[] = ["pull", "push", "legs", "core", "skill"];

/**
 * Creates beginner-level progressions for all movement patterns.
 * The first exercise in each tree is set to "active", all others "locked".
 * Used when user selects "Complete Beginner" or any path that skips assessment.
 */
export function createBeginnerProgressions(): UserProgression[] {
  const progressions: UserProgression[] = [];

  ALL_PATTERNS.forEach(pattern => {
    const tree = getProgressionTree(pattern);
    tree.forEach((exercise, index) => {
      progressions.push({
        progressionId: exercise.id,
        status: index === 0 ? "active" : "locked",
        consecutiveSuccesses: 0,
      });
    });
  });

  return progressions;
}