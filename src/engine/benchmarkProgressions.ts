// =============================================================================
// ARNOLD — Benchmark-Driven Progression Initialization (v2.4.12 Change 1)
//
// Intermediate/advanced users start at progression levels matching their
// assessed strength instead of order-0 beginner defaults. Produces the same
// shape as createBeginnerProgressions() — every exercise in every tree present,
// exactly one "active" per pattern — but the active level is chosen from the
// onboarding benchmarks.
//
// BELOW-ACTIVE STATUS DECISION
// ----------------------------
// ProgressionStatus is "locked" | "active" | "mastered" (src/types). Levels BELOW
// the chosen active level are marked "mastered" — the existing status that
// levelMapper.createProgressionsFromLevel already uses for the same "I've already
// cleared this" meaning. NOT a new status value. Generators are unaffected:
// generateStreetLifterIntermediate ignores progressions entirely (template +
// e1rm driven); hybridAthleteIntermediate.getActiveProgression selects only
// `status === "active"`. mastered/locked are never load-bearing for selection.
//
// MAPPING DECISIONS (benchmark fields ↔ levelMapper bands)
// --------------------------------------------------------
// Progression IDs and band intent are reused from levelMapper's LEVEL_QUESTIONS
// (mapsTo targets) — no new mappings invented. Where a benchmark field and a
// levelMapper band do not line up 1:1, the CONSERVATIVE (lower) level is chosen
// because under-loading is recoverable and over-loading is dangerous.
//
//   pull  (pullUpMaxReps / pullUpAddedKg) — exact ladder per brief:
//         added>0 → pull_06 | reps≥8 → pull_05 | reps≥5 → pull_04 |
//         reps≥1 → pull_03 | else → pull_01
//   push  (dipMaxReps / dipAddedKg) — levelMapper's push bands are push-up-centric
//         at the low end and dip/weighted at the top; the benchmark is dip-only,
//         so we map dips onto the dip/weighted bands and place sub-5-rep dippers
//         conservatively one band below the "5+ dips" target:
//         added>0 → push_08 (Ring/weighted Dips, top) | reps≥5 → push_07 (Dips,
//         levelMapper "5+ clean reps") | reps≥1 → push_04 (Diamond, below the dip
//         band — conservative) | else → push_01
//   legs  (squatMaxReps / squatAddedKg) — levelMapper's legs bands are pistol-
//         VARIATION based while the benchmark is rep/load based (no 1:1). Per the
//         brief's explicit "weighted → top legs target": added>0 → legs_06.
//         FLAG: a weighted barbell-squatter is not necessarily a pistol-squatter,
//         so legs_06 (Full Pistols) may over-place; surfaced in the report for
//         review. Non-weighted: reps≥20 → legs_03 (Bulgarian split, conservative
//         "solid volume" bump) | else → legs_01.
//   core  (lSitHoldSec) — sec≥10 → core_04 (Hanging Leg Raises; conservative —
//         a 10s L-sit could justify core_05/L-sit but we under-load one band) |
//         sec≥1 → core_02 (Hollow Hold) | else → core_01.
//   skill (handstandHoldSec / handstandWallOnly / frontLeverLevel / plancheLevel)
//         per levelMapper's skill bands (handstand/planche based):
//         planche≠none → skill_06 | freestanding (wallOnly===false) & sec≥5 →
//         skill_04 | wall & sec≥30 → skill_03 | else → skill_01.
//         FLAG: levelMapper's skill bands do not reference frontLeverLevel, so FL
//         is NOT used for skill placement (no invented mapping); a FL-only signal
//         conservatively resolves to skill_01.
//
// NO-DATA RULE (all relevant fields undefined for a pattern):
//   tier intermediate/advanced → one level above order-0 (tree[1]);
//   tier beginner → order-0 (tree[0]).
// ZERO RULE (a relevant field is present but 0 — "can't do this yet"):
//   falls through each ladder's else → order-0. Zero is information, not absence.
// =============================================================================

import { getProgressionTree } from "../data/progressions";
import type {
  UserProgression,
  MovementPattern,
  ProgramPath,
  TrainerTier,
  UserBenchmarks,
} from "../types";

interface PatternResolver {
  pattern: MovementPattern;
  /** Relevant benchmark field names for no-data detection + logging. */
  fields: (keyof UserBenchmarks)[];
  /** Resolve the target progressionId from benchmarks, or null when no data. */
  resolve: (b: UserBenchmarks) => string | null;
}

const RESOLVERS: PatternResolver[] = [
  {
    pattern: "pull",
    fields: ["pullUpMaxReps", "pullUpAddedKg"],
    resolve: (b) => {
      if (b.pullUpMaxReps === undefined && b.pullUpAddedKg === undefined) return null;
      const reps = b.pullUpMaxReps ?? 0;
      const added = b.pullUpAddedKg ?? 0;
      if (added > 0) return "pull_06";
      if (reps >= 8) return "pull_05";
      if (reps >= 5) return "pull_04";
      if (reps >= 1) return "pull_03";
      return "pull_01";
    },
  },
  {
    pattern: "push",
    fields: ["dipMaxReps", "dipAddedKg"],
    resolve: (b) => {
      if (b.dipMaxReps === undefined && b.dipAddedKg === undefined) return null;
      const reps = b.dipMaxReps ?? 0;
      const added = b.dipAddedKg ?? 0;
      if (added > 0) return "push_08";
      if (reps >= 5) return "push_07";
      if (reps >= 1) return "push_04";
      return "push_01";
    },
  },
  {
    pattern: "legs",
    fields: ["squatMaxReps", "squatAddedKg"],
    resolve: (b) => {
      if (b.squatMaxReps === undefined && b.squatAddedKg === undefined) return null;
      const reps = b.squatMaxReps ?? 0;
      const added = b.squatAddedKg ?? 0;
      if (added > 0) return "legs_06";
      if (reps >= 20) return "legs_03";
      return "legs_01";
    },
  },
  {
    pattern: "core",
    fields: ["lSitHoldSec"],
    resolve: (b) => {
      if (b.lSitHoldSec === undefined) return null;
      const sec = b.lSitHoldSec ?? 0;
      if (sec >= 10) return "core_04";
      if (sec >= 1) return "core_02";
      return "core_01";
    },
  },
  {
    pattern: "skill",
    fields: ["handstandHoldSec", "handstandWallOnly", "frontLeverLevel", "plancheLevel"],
    resolve: (b) => {
      if (
        b.handstandHoldSec === undefined &&
        b.handstandWallOnly === undefined &&
        b.frontLeverLevel === undefined &&
        b.plancheLevel === undefined
      ) {
        return null;
      }
      const sec = b.handstandHoldSec ?? 0;
      const wallOnly = b.handstandWallOnly ?? true;
      const planche = b.plancheLevel ?? "none";
      if (planche !== "none") return "skill_06";
      if (wallOnly === false && sec >= 5) return "skill_04";
      if (wallOnly === true && sec >= 30) return "skill_03";
      return "skill_01";
    },
  },
];

/**
 * Build benchmark-calibrated progressions for all movement patterns. Mirrors
 * createBeginnerProgressions' coverage (every exercise in every tree, one active
 * per pattern) but seeds the active level from the user's assessed strength.
 */
export function initializeProgressionsFromBenchmarks(
  path: ProgramPath,
  benchmarks: UserBenchmarks,
  tier: TrainerTier
): UserProgression[] {
  console.log(`[ARNOLD CALIBRATION] path=${path} tier=${tier} — seeding progressions from benchmarks`);

  const progressions: UserProgression[] = [];

  for (const r of RESOLVERS) {
    const tree = getProgressionTree(r.pattern);
    const raw = r.resolve(benchmarks);

    let targetId: string;
    if (raw === null) {
      // No relevant benchmark data for this pattern.
      targetId =
        tier === "beginner"
          ? tree[0].id
          : (tree[1] ?? tree[0]).id; // one level above order-0 for int/advanced
    } else {
      targetId = raw;
    }

    let targetIndex = tree.findIndex((p) => p.id === targetId);
    if (targetIndex < 0) targetIndex = 0; // defensive — unknown id falls back to order-0

    for (let i = 0; i < tree.length; i++) {
      const status: UserProgression["status"] =
        i < targetIndex ? "mastered" : i === targetIndex ? "active" : "locked";
      progressions.push({
        progressionId: tree[i].id,
        status,
        consecutiveSuccesses: 0,
      });
    }

    const fieldStr = r.fields
      .map((f) => `${f}=${benchmarks[f] === undefined ? "—" : String(benchmarks[f])}`)
      .join(", ");
    const name = tree[targetIndex]?.name ?? "?";
    console.log(
      `[ARNOLD CALIBRATION] pattern=${r.pattern} benchmarks={${fieldStr}} → start=${targetId} (${name})`
    );
  }

  return progressions;
}
