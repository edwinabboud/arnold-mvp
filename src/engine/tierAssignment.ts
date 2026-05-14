import type { UserBenchmarks, ProgramPath, TrainerTier, UserProfile } from "../types";

/**
 * Auto-assigns TrainerTier from collected benchmarks.
 * Conservative: when in doubt, route to beginner (safer).
 * Advanced routes to intermediate generator for now (no advanced generator exists yet).
 */
export function assignTier(
  path: ProgramPath,
  benchmarks: UserBenchmarks,
  experienceLevel: "new" | "experienced"
): TrainerTier {
  // "I'm new to calisthenics" → always beginner
  if (experienceLevel === "new") return "beginner";

  const bw = benchmarks.bodyweightKg ?? 70;

  if (path === "street_lifter") {
    const pullReps = benchmarks.pullUpMaxReps ?? 0;
    const pullAdded = benchmarks.pullUpAddedKg ?? 0;
    const dipReps = benchmarks.dipMaxReps ?? 0;
    const dipAdded = benchmarks.dipAddedKg ?? 0;

    // Advanced: +50% BW pull-up AND +80% BW dip
    if (pullAdded >= bw * 0.5 && dipAdded >= bw * 0.8) return "advanced";

    // Intermediate: any added weight OR 10+ pull-ups / 12+ dips
    if (pullAdded > 0 || dipAdded > 0 || pullReps >= 10 || dipReps >= 12) {
      return "intermediate";
    }
    return "beginner";
  }

  if (path === "skill_builder") {
    const handstand = benchmarks.handstandHoldSec ?? 0;
    const wallOnly = benchmarks.handstandWallOnly ?? true;
    const fl = benchmarks.frontLeverLevel ?? "none";
    const lsit = benchmarks.lSitHoldSec ?? 0;
    const planche = benchmarks.plancheLevel ?? "none";

    // Advanced: 30s+ free handstand AND straddle FL+ (and any planche progress)
    if (
      !wallOnly &&
      handstand >= 30 &&
      (fl === "straddle" || fl === "full") &&
      planche !== "none"
    ) {
      return "advanced";
    }

    // Intermediate: any real skill progress
    if (
      (!wallOnly && handstand >= 15) ||
      fl === "tuck" || fl === "adv_tuck" || fl === "straddle" || fl === "full" ||
      lsit >= 10 ||
      planche !== "none"
    ) {
      return "intermediate";
    }
    return "beginner";
  }

  if (path === "hybrid_athlete") {
    // Hybrid requires intermediate on BOTH sides for intermediate generator
    const weightedTier = assignTier("street_lifter", benchmarks, experienceLevel);
    // Reuse skill logic inline since hybrid only collects handstand + front lever
    const handstand = benchmarks.handstandHoldSec ?? 0;
    const wallOnly = benchmarks.handstandWallOnly ?? true;
    const fl = benchmarks.frontLeverLevel ?? "none";
    const skillIntermediate =
      (!wallOnly && handstand >= 15) ||
      fl === "tuck" || fl === "adv_tuck" || fl === "straddle" || fl === "full";

    if (weightedTier === "advanced" && skillIntermediate) return "advanced";
    if (
      (weightedTier === "intermediate" || weightedTier === "advanced") &&
      skillIntermediate
    ) {
      return "intermediate";
    }
    return "beginner";
  }

  return "beginner";
}

/**
 * Returns the user's current tier from their profile. Falls back to
 * "intermediate" when the profile or tier is unset — a safe middle default
 * (beginner would under-load, advanced would over-load).
 */
export function getCurrentTier(profile: UserProfile | null | undefined): TrainerTier {
  const tier = profile?.tier;
  if (tier === "beginner" || tier === "intermediate" || tier === "advanced") return tier;
  return "intermediate";
}
