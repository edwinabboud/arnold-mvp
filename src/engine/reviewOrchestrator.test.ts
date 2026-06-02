// =============================================================================
// ARNOLD — Review Orchestrator — runnable test suite
//
// Run: `npx ts-node --skip-project src/engine/reviewOrchestrator.test.ts`
//
// (--skip-project required — same reason as conversationContext.test.ts:
//  the project's tsconfig extends expo/tsconfig.base.json which sets
//  `module: "preserve"`, which standalone TypeScript can't parse.)
//
// Covers v2.4.8 §1.2 (priority resolver), §1.4 (intent framing),
// §1.5 (second-question gate + RPE-vs-secondary precedence),
// §1.6 (RPE calibration shape), and §1.7 (disengagement detection).
// =============================================================================

import type {
  ConversationContextPacket,
  DifficultyIntent,
  SessionSummaryExercise,
} from "../types";
import {
  buildSecondQuestion,
  getDifficultyIntentFraming,
  isDisengagementResponse,
  RPE_CALIBRATION_CHIPS,
  RPE_CALIBRATION_PROMPT,
  selectFirstReviewQuestion,
  shouldAskSecondQuestion,
} from "./reviewOrchestrator";

// ── Minimal harness (identical pattern to conversationContext.test.ts) ────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    failures.push(`${name}\n      ${msg}`);
    console.log(`  ✗ ${name}\n      ${msg}`);
  }
}

function describe(suite: string, fn: () => void) {
  console.log(`\n${suite}`);
  fn();
}

function eq<T>(actual: T, expected: T, label = "values"): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function truthy(v: unknown, label = "value"): void {
  if (!v) throw new Error(`${label}: expected truthy, got ${JSON.stringify(v)}`);
}

function deepEq(actual: unknown, expected: unknown, label = "values"): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ── Fixture builders ─────────────────────────────────────────────────────────

function ex(
  name: string,
  overrides: Partial<SessionSummaryExercise> = {},
): SessionSummaryExercise {
  return {
    name,
    role: overrides.role ?? "main",
    difficultyIntent: (overrides.difficultyIntent ?? "moderate") as DifficultyIntent,
    unit: overrides.unit ?? "reps",
    target: overrides.target ?? "3x6 @ +25kg",
    achieved: overrides.achieved ?? "3x6",
    completionRate: overrides.completionRate ?? 1,
    rpeReported: overrides.rpeReported ?? null,
    rpeInferred: overrides.rpeInferred ?? null,
    skipped: overrides.skipped ?? false,
  };
}

function packet(
  partial: Partial<ConversationContextPacket> & {
    completedSession?: ConversationContextPacket["completedSession"] | undefined;
  } = {},
): ConversationContextPacket {
  const base: ConversationContextPacket = {
    user: {
      path: "street_lifter",
      tier: "intermediate",
      trainingAgeMonths: null,
      sessionTier: "recommended",
      phase: "strength",
      weekInMeso: 4,
      isDeload: false,
      isTestWeek: false,
      bodyweightKg: 80,
      e1rm: { dip: 100, pull_up: 90, squat: 130 },
      compressionProfile: null,
    },
    goals: { pathGoals: [], activePR: null },
    completedSession: null,
    recentHistoryFull: [],
    recentHistoryCompressed: [],
    finisherTrend: [],
    recovery: {
      openPainFlags: [],
      daysSinceLastSession: 0,
      inReturnToTrain: false,
      sessionsThisWeek: 1,
      scheduledThisWeek: 4,
    },
    pendingAdaptations: [],
    knowledge: { phaseGuidance: "", currentVariationRationale: null, relevantProtocol: null },
  };
  return { ...base, ...partial } as ConversationContextPacket;
}

function postSession(args: {
  sessionType: string;
  primary: string;
  exercises: SessionSummaryExercise[];
  flags?: string[];
  finisherReps?: number | null;
}): ConversationContextPacket["completedSession"] {
  return {
    sessionType: args.sessionType,
    primaryPurposeMovement: args.primary,
    exercises: args.exercises,
    finisherReps: args.finisherReps ?? null,
    behavioralFlags: args.flags ?? [],
  };
}

// ── §1.2 priority resolver ────────────────────────────────────────────────────

describe("selectFirstReviewQuestion — §1.2 priorities", () => {
  it("returns null when not a post-session context", () => {
    const p = packet({ completedSession: null });
    eq(selectFirstReviewQuestion(p), null);
  });

  it("Priority 1: skipped:<name> → opens with 'your X looked off'", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips"), ex("Diamond Push-ups", { skipped: true, completionRate: 0 })],
        flags: ["skipped:Diamond Push-ups"],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 1);
    eq(q!.target, "Diamond Push-ups");
    eq(q!.kind, "open");
    truthy(q!.text.includes("Diamond Push-ups"));
    truthy(q!.text.includes("looked off"));
  });

  it("Priority 1: low-completion:<name> → same pattern", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips"), ex("Volume Pull-ups", { completionRate: 0.25 })],
        flags: ["low-completion:Volume Pull-ups"],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 1);
    eq(q!.target, "Volume Pull-ups");
  });

  it("Priority 2: headline missed + challenging intent → 'meant to be a grind' framing", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { difficultyIntent: "challenging", completionRate: 0.66 })],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 2);
    eq(q!.target, "Weighted Dips");
    truthy(q!.text.includes("meant to be a grind"));
  });

  it("Priority 2: headline missed + moderate intent → 'should've been controlled' framing", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { difficultyIntent: "moderate", completionRate: 0.66 })],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    eq(q!.priority, 2);
    truthy(q!.text.includes("controlled"));
  });

  it("Priority 2: headline missed + easy intent → 'weight you should own' framing", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { difficultyIntent: "easy", completionRate: 0.66 })],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    eq(q!.priority, 2);
    truthy(q!.text.includes("should own"));
  });

  it("Priority 3: PR scheduled this week + lift present → outcome question", () => {
    const p = packet({
      user: {
        path: "street_lifter",
        tier: "intermediate",
        trainingAgeMonths: null,
        sessionTier: "recommended",
        phase: "test",
        weekInMeso: 12,
        isDeload: false,
        isTestWeek: true,
        bodyweightKg: 80,
        e1rm: { dip: 100, pull_up: 90, squat: 130 },
        compressionProfile: null,
      },
      goals: {
        pathGoals: [],
        activePR: { lift_or_skill: "Weighted Dips", targetValue: "+40kg", scheduledWeek: 12 },
      },
      completedSession: postSession({
        sessionType: "peak_singles",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { difficultyIntent: "challenging" })],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 3);
    truthy(q!.text.includes("Weighted Dips"));
    truthy(q!.text.toLowerCase().includes("how'd"));
  });

  it("Priority 4: clean session → primary movement open check (Skill Builder skill day → isometric, NOT main)", () => {
    const p = packet({
      user: {
        path: "skill_builder",
        tier: "intermediate",
        trainingAgeMonths: null,
        sessionTier: "recommended",
        phase: "strength",
        weekInMeso: 5,
        isDeload: false,
        isTestWeek: false,
        bodyweightKg: 70,
        e1rm: { dip: null, pull_up: null, squat: null },
        compressionProfile: null,
      },
      completedSession: postSession({
        sessionType: "skill_push_pull",
        primary: "Tuck Planche Hold",
        exercises: [
          ex("Tuck Planche Practice", { role: "skill_practice", unit: "reps" }),
          ex("Tuck Planche Hold", { role: "skill_isometric", unit: "seconds", difficultyIntent: "challenging" }),
          ex("Weighted Dips", { role: "complementary" }),
        ],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 4);
    eq(q!.target, "Tuck Planche Hold");
    truthy(q!.text.includes("Tuck Planche Hold"));
    truthy(q!.text.includes("meant to be a grind")); // challenging intent framing
  });

  it("Priority 5: completedSession with empty exercises + degraded primary → generic open check", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "general",
        primary: "(no exercise resolved)",
        exercises: [],
      }),
    });
    const q = selectFirstReviewQuestion(p);
    truthy(q);
    eq(q!.priority, 5);
    eq(q!.target, null);
    eq(q!.kind, "open");
  });
});

// ── §1.4 framing table ──────────────────────────────────────────────────────

describe("getDifficultyIntentFraming — §1.4", () => {
  it("challenging → grind framing + Don't-alarm stance", () => {
    const f = getDifficultyIntentFraming("challenging");
    truthy(f.framing.includes("meant to be a grind"));
    truthy(f.stance.includes("point"));
  });
  it("moderate → controlled framing + Yellow-flag stance", () => {
    const f = getDifficultyIntentFraming("moderate");
    truthy(f.framing.includes("controlled"));
    truthy(f.stance.toLowerCase().includes("yellow"));
  });
  it("easy → should-own framing + Red-flag stance", () => {
    const f = getDifficultyIntentFraming("easy");
    truthy(f.framing.includes("should own"));
    truthy(f.stance.toLowerCase().includes("red"));
  });
  it("null intent → safe fallback", () => {
    const f = getDifficultyIntentFraming(null);
    truthy(f.framing.toLowerCase().includes("how'd"));
  });
});

// ── §1.5 + §1.6 second-question gate ─────────────────────────────────────────

describe("shouldAskSecondQuestion + buildSecondQuestion — §1.5/§1.6", () => {
  it("disengaged user → false", () => {
    const p = packet({ completedSession: postSession({ sessionType: "heavy_compound", primary: "Weighted Dips", exercises: [ex("Weighted Dips")] }) });
    eq(shouldAskSecondQuestion(p, false, 4), false);
  });

  it("engaged + RPE missing on headline → true, builds RPE calibration", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound",
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { rpeReported: null, rpeInferred: null })],
      }),
    });
    eq(shouldAskSecondQuestion(p, true, 4), true);
    const first = selectFirstReviewQuestion(p)!;
    const second = buildSecondQuestion(p, first);
    truthy(second);
    eq(second!.kind, "tappable_rpe");
    eq(second!.text, RPE_CALIBRATION_PROMPT);
    deepEq(second!.chips, [...RPE_CALIBRATION_CHIPS]);
  });

  it("engaged + RPE already inferred + secondary exists → builds secondary movement question", () => {
    const p = packet({
      completedSession: postSession({
        sessionType: "heavy_compound", // SECONDARY_BY_TYPE → "back-off / volume feel"
        primary: "Weighted Dips",
        exercises: [ex("Weighted Dips", { rpeReported: 8, rpeInferred: null })],
      }),
    });
    eq(shouldAskSecondQuestion(p, true, 4), true);
    const first = selectFirstReviewQuestion(p)!;
    const second = buildSecondQuestion(p, first);
    truthy(second);
    eq(second!.kind, "open");
    truthy(second!.text.includes("back-off / volume feel"));
  });

  it("engaged + RPE inferred + sessionType has no secondary → false (no second)", () => {
    // Skill Builder Legs row has no "—" secondary per §1.3. Wait — actually
    // SB Legs is mapped to ResolvedSessionType "legs", which DOES have a
    // secondary ("knee/hip comfort"). To test the no-secondary case we use
    // "general" which is the only mapping with null secondary.
    const p = packet({
      completedSession: postSession({
        sessionType: "general",
        primary: "Some Movement",
        exercises: [ex("Some Movement", { rpeReported: 8 })],
      }),
    });
    eq(shouldAskSecondQuestion(p, true, 5), false);
  });

  it("RPE_CALIBRATION_CHIPS order matches §1.6", () => {
    deepEq([...RPE_CALIBRATION_CHIPS], ["Had 3+ left", "1–2 left", "Last rep I could do", "Failed a rep"]);
  });
});

// ── §1.7 disengagement detection ─────────────────────────────────────────────

describe("isDisengagementResponse — §1.7", () => {
  const closers = ["fine", "good", "ok", "Okay", "yep", "yeah", "sure", " all good", "all done", "no issues", "felt fine.", ""];
  for (const s of closers) {
    it(`closer: "${s}" → true`, () => eq(isDisengagementResponse(s), true));
  }

  const engaged = [
    "my left shoulder hurt on the last set",
    "the dips felt heavy after the third",
    "what should I do tomorrow",
    "actually that was great because I beat my last attempt",
    "why?",
  ];
  for (const s of engaged) {
    it(`engaged: "${s}" → false`, () => eq(isDisengagementResponse(s), false));
  }
});

// ── Summary + exit ──────────────────────────────────────────────────────────

console.log(`\n────────────────────────────────────────────`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log(`\nFailures:`);
  failures.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));
  process.exit(1);
} else {
  console.log(`All assertions passed.`);
  process.exit(0);
}
