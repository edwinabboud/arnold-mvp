import type { UserBenchmarks, ProgramPath, TrainerTier, UserProfile } from "../types";

/**
 * Auto-assigns TrainerTier from collected benchmarks.
 * Conservative: when in doubt, route to beginner (safer).
 * Advanced routes to intermediate generator for now (no advanced generator exists yet).
 *
 * v2.4.12 §2 — thresholds audited against the program bibles; the bible wins on
 * any conflict. Street Lifter = Bible v1.1 §1; Hybrid Athlete = Bible v1.1 §2.
 * Skill Builder is left UNCHANGED: no Skill Builder bible is present in the repo
 * to audit against.
 */
export function assignTier(
  path: ProgramPath,
  benchmarks: UserBenchmarks,
  experienceLevel: "new" | "experienced"
): TrainerTier {
  // One parseable line per assignment (v2.4.12 §2): logs the verdict and the rule
  // that fired, with only the inputs relevant to the path.
  const log = (
    tier: TrainerTier,
    rule: string,
    inputs: Record<string, unknown>
  ): TrainerTier => {
    const inputStr = Object.entries(inputs)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(
      `[ARNOLD TIER] path=${path} inputs={${inputStr}} → tier=${tier} rule=${rule}`
    );
    return tier;
  };

  // "I'm new to calisthenics" → always beginner. Must stay first.
  if (experienceLevel === "new") {
    return log("beginner", "experienceLevel=new", { experienceLevel });
  }

  const bw = benchmarks.bodyweightKg ?? 70;

  if (path === "street_lifter") {
    const pullReps = benchmarks.pullUpMaxReps ?? 0;
    const pullAdded = benchmarks.pullUpAddedKg ?? 0;
    const dipReps = benchmarks.dipMaxReps ?? 0;
    const dipAdded = benchmarks.dipAddedKg ?? 0;
    const inputs = { bw, pullReps, pullAdded, dipReps, dipAdded };

    // Advanced (Bible v1.1 §1): added ≥50% BW pull-up OR ≥80% BW dip.
    if (pullAdded >= bw * 0.5 || dipAdded >= bw * 0.8) {
      return log("advanced", "SL advanced: pullAdded>=50%BW OR dipAdded>=80%BW", inputs);
    }

    // Intermediate (Bible v1.1 §1): ANY added working weight (the "I know my
    // weights" row), OR ≥10 pull-ups AND ≥12 dips.
    if (pullAdded > 0 || dipAdded > 0 || (pullReps >= 10 && dipReps >= 12)) {
      return log("intermediate", "SL intermediate: added>0 OR (PU>=10 AND dips>=12)", inputs);
    }

    // Beginner (Bible v1.1 §1): <10 pull-ups OR <12 dips, and no added weights.
    return log("beginner", "SL beginner: no added weight, PU<10 OR dips<12", inputs);
  }

  if (path === "skill_builder") {
    // UNCHANGED thresholds — no Skill Builder bible exists in the repo to audit
    // against (v2.4.12 §2). The boolean conditions below are byte-identical to
    // the pre-amendment code; only the tier log line was added.
    const handstand = benchmarks.handstandHoldSec ?? 0;
    const wallOnly = benchmarks.handstandWallOnly ?? true;
    const fl = benchmarks.frontLeverLevel ?? "none";
    const lsit = benchmarks.lSitHoldSec ?? 0;
    const planche = benchmarks.plancheLevel ?? "none";
    const inputs = { handstandSec: handstand, wallOnly, fl, lsit, planche };

    // Advanced: 30s+ free handstand AND straddle FL+ (and any planche progress)
    if (
      !wallOnly &&
      handstand >= 30 &&
      (fl === "straddle" || fl === "full") &&
      planche !== "none"
    ) {
      return log("advanced", "SB advanced: freeHS>=30 AND straddle+FL AND planche>0 (UNCHANGED)", inputs);
    }

    // Intermediate: any real skill progress
    if (
      (!wallOnly && handstand >= 15) ||
      fl === "tuck" || fl === "adv_tuck" || fl === "straddle" || fl === "full" ||
      lsit >= 10 ||
      planche !== "none"
    ) {
      return log("intermediate", "SB intermediate: any skill progress (UNCHANGED)", inputs);
    }

    return log("beginner", "SB beginner: no qualifying skill (UNCHANGED)", inputs);
  }

  if (path === "hybrid_athlete") {
    // Bible v1.1 §2 — implemented DIRECTLY. Hybrid uses ≥8 pull-ups, NOT the
    // street-lifter 10-PU threshold, so it does NOT reuse a nested assignTier call.
    const pullReps = benchmarks.pullUpMaxReps ?? 0;
    const pullAdded = benchmarks.pullUpAddedKg ?? 0;
    const dipReps = benchmarks.dipMaxReps ?? 0;
    const handstand = benchmarks.handstandHoldSec ?? 0;
    const wallOnly = benchmarks.handstandWallOnly ?? true;
    const inputs = { bw, pullReps, pullAdded, dipReps, handstandSec: handstand, wallOnly };
    // Wall-HS requirement of X seconds is met when handstandHoldSec >= X regardless
    // of wallOnly: a freestanding hold of equal/greater seconds is strictly harder
    // than the wall hold it must clear (v2.4.12 §2 handstand semantics).

    // Advanced (Bible v1.1 §2): "≥10 PU with +30% BW AND ≥5s freestanding HS".
    // Benchmark semantics are "max reps AT the entered added weight", so we cannot
    // faithfully verify "10 reps at +30%BW" — pullUpMaxReps is reps at
    // pullUpAddedKg, not specifically at 30%BW. Closest faithful check: the +30%BW
    // added load is the strength signal, plus a genuine freestanding
    // (wallOnly===false) hold of ≥5s. The literal 10-rep gate is intentionally
    // dropped as unverifiable against the available benchmark fields.
    if (pullAdded >= bw * 0.3 && wallOnly === false && handstand >= 5) {
      return log("advanced", "HY advanced: pullAdded>=30%BW AND freestanding HS>=5s", inputs);
    }

    // Intermediate (Bible v1.1 §2): ≥8 PU AND ≥12 dips AND ≥45s wall HS.
    if (pullReps >= 8 && dipReps >= 12 && handstand >= 45) {
      return log("intermediate", "HY intermediate: PU>=8 AND dips>=12 AND wallHS>=45s", inputs);
    }

    // Beginner (Bible v1.1 §2): <8 PU OR <12 dips OR <30s wall HS. The bible-
    // undefined 30–45s wall-HS band also falls through here, resolved to beginner
    // per the conservative default.
    return log("beginner", "HY beginner: PU<8 OR dips<12 OR wallHS<30s (or 30-45s gap)", inputs);
  }

  return log("beginner", "unknown path -> beginner default", {});
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
