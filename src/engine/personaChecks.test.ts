// =============================================================================
// ARNOLD — Persona Automated Checks + Chat Adapter — runnable test suite
//
// Run: `npx ts-node --skip-project src/engine/personaChecks.test.ts`
//
// Covers v2.4.8 §6.2 (length cap, blocklist, specificity) + §5.1/§5.2
// adapter mapping for the ChatWidget. The blocklist negative cases
// double as the §6.1 adversarial scenarios (medical claim attempts,
// empty praise, hedging, AI mention, etc.).
// =============================================================================

import type { ConversationContextPacket } from "../types";
import {
  checkBlocklist,
  checkLengthCap,
  checkSpecificity,
  countSentences,
  extractPacketTokens,
} from "./personaChecks";
import { reviewQuestionToChatMessage } from "./reviewChatAdapter";
import type { ReviewQuestion } from "./reviewOrchestrator";

// ── Minimal harness ─────────────────────────────────────────────────────────

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

// ── Fixture: minimal but non-empty packet for specificity tests ──────────────

function packetWithSomeData(): ConversationContextPacket {
  return {
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
    },
    goals: { pathGoals: [], activePR: null },
    completedSession: {
      sessionType: "heavy_compound",
      primaryPurposeMovement: "Weighted Dips",
      exercises: [
        {
          name: "Weighted Dips",
          role: "main",
          difficultyIntent: "challenging",
          unit: "reps",
          target: "3x6 @ +25kg",
          achieved: "3x6",
          completionRate: 1,
          rpeReported: null,
          rpeInferred: null,
          skipped: false,
        },
      ],
      finisherReps: 18,
      behavioralFlags: [],
    },
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
}

function emptyPacket(): ConversationContextPacket {
  return {
    user: {
      path: "street_lifter",
      tier: "beginner",
      trainingAgeMonths: null,
      sessionTier: "recommended",
      phase: "",
      weekInMeso: 0,
      isDeload: false,
      isTestWeek: false,
      bodyweightKg: null,
      e1rm: {},
    },
    goals: { pathGoals: [], activePR: null },
    completedSession: null,
    recentHistoryFull: [],
    recentHistoryCompressed: [],
    finisherTrend: [],
    recovery: {
      openPainFlags: [],
      daysSinceLastSession: -1,
      inReturnToTrain: false,
      sessionsThisWeek: 0,
      scheduledThisWeek: 0,
    },
    pendingAdaptations: [],
    knowledge: { phaseGuidance: "", currentVariationRationale: null, relevantProtocol: null },
  };
}

// ── §3.2 length cap ─────────────────────────────────────────────────────────

describe("countSentences — sentence approximation", () => {
  it("single sentence with terminal mark → 1", () => {
    eq(countSentences("Clean set at +25kg."), 1);
  });
  it("two sentences → 2", () => {
    eq(countSentences("Clean set. Bumping to +27.5kg next time."), 2);
  });
  it("trailing fragment without terminal mark counts → +1", () => {
    eq(countSentences("Clean set. Bumping next time"), 2);
  });
  it("question + statement → 2", () => {
    eq(countSentences("How'd it feel? Solid effort."), 2);
  });
  it("empty string → 0", () => {
    eq(countSentences(""), 0);
  });
});

describe("checkLengthCap — §3.2 hard caps", () => {
  it("mid_session 1 sentence → pass", () => {
    const r = checkLengthCap("Three sets left.", "mid_session");
    truthy(r.pass);
    eq(r.sentences, 1);
    eq(r.hardCap, 2);
  });
  it("mid_session 3 sentences → fail (cap 2)", () => {
    const r = checkLengthCap("Three sets left. Archer pulls next. Keep the scapulae tight.", "mid_session");
    eq(r.pass, false);
    eq(r.sentences, 3);
    truthy(r.reason);
  });
  it("adaptation_surfacing 1 sentence → pass (cap 1)", () => {
    const r = checkLengthCap("Bumped dip working weight to +27.5kg.", "adaptation_surfacing");
    truthy(r.pass);
  });
  it("adaptation_surfacing 2 sentences → fail", () => {
    const r = checkLengthCap("Bumped dip working weight to +27.5kg. Clean three sessions running.", "adaptation_surfacing");
    eq(r.pass, false);
  });
  it("explanation 4 sentences → pass (cap 4)", () => {
    const r = checkLengthCap("A. B. C. D.", "explanation");
    truthy(r.pass);
    eq(r.sentences, 4);
  });
  it("explanation 5 sentences → fail", () => {
    const r = checkLengthCap("A. B. C. D. E.", "explanation");
    eq(r.pass, false);
  });
  it("plan_change 3 sentences → pass (cap 3)", () => {
    const r = checkLengthCap("A. B. C.", "plan_change");
    truthy(r.pass);
  });
});

// ── §3.3 blocklist ──────────────────────────────────────────────────────────

describe("checkBlocklist — §3.3 banned constructions", () => {
  it("clean reply → no violations", () => {
    const r = checkBlocklist("Clean set at +25kg. Bumping to +27.5kg next time.");
    truthy(r.pass);
    eq(r.violations.length, 0);
  });

  it("medical diagnosis ('you have tendinitis') → flagged", () => {
    const r = checkBlocklist("Sounds like you have tendinitis — back off for now.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "medical_claim"));
  });

  it("medical diagnosis ('that's an impingement') → flagged", () => {
    const r = checkBlocklist("That's an impingement. Stop training shoulders for two weeks.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "medical_claim"));
  });

  it("hedge ('you might want to consider') → flagged", () => {
    const r = checkBlocklist("You might want to consider backing off the weight here.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "hedging"));
  });

  it("hedge ('perhaps') → flagged", () => {
    const r = checkBlocklist("Perhaps drop a rep on the last set.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "hedging"));
  });

  it("empty praise ('Great job!') → flagged", () => {
    const r = checkBlocklist("Great job!");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "empty_praise"));
  });

  it("empty praise ('You crushed it') → flagged", () => {
    const r = checkBlocklist("You crushed it. Keep going.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "empty_praise"));
  });

  it("apology for the program → flagged", () => {
    const r = checkBlocklist("Sorry if that's too hard today — we can back off.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "apology"));
  });

  it("user-decides-program → flagged", () => {
    const r = checkBlocklist("What weight do you want to use today?");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "user_decides_program"));
  });

  it("AI self-mention ('as an AI') → flagged", () => {
    const r = checkBlocklist("As an AI, I can't diagnose injuries.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "ai_mention"));
  });

  it("AI self-mention ('I'm an AI') → flagged", () => {
    const r = checkBlocklist("I'm an AI coach, not a physio.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "ai_mention"));
  });

  it("standalone filler ('trust the process') → flagged", () => {
    const r = checkBlocklist("Just trust the process.");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "filler"));
  });

  it("emoji → flagged", () => {
    const r = checkBlocklist("Solid set 💪");
    eq(r.pass, false);
    truthy(r.violations.find((v) => v.category === "emoji"));
  });
});

// ── §3.4 / §6.2 specificity ──────────────────────────────────────────────────

describe("checkSpecificity — §3.4 + §6.2", () => {
  it("reply names the primary movement → pass", () => {
    const p = packetWithSomeData();
    const r = checkSpecificity("Clean three sets of Weighted Dips at +25kg. Bumping to +27.5kg next time.", p);
    truthy(r.pass);
    truthy(r.matchedTokens.length > 0);
  });
  it("reply names the weight → pass", () => {
    const p = packetWithSomeData();
    const r = checkSpecificity("100kg dip e1RM is a real base now.", p);
    truthy(r.pass);
  });
  it("totally generic 'good set' reply with available data → fail", () => {
    const p = packetWithSomeData();
    const r = checkSpecificity("Good set. Keep going.", p);
    eq(r.pass, false);
    truthy(r.suggestedTokens.length > 0);
  });
  it("empty packet → abstain (pass with noDataToCheck)", () => {
    const p = emptyPacket();
    const r = checkSpecificity("Good set. Keep going.", p);
    truthy(r.pass);
    eq(r.noDataToCheck, true);
  });
  it("extractPacketTokens skips tokens shorter than 2 chars", () => {
    const p = packetWithSomeData();
    const tokens = extractPacketTokens(p);
    eq(tokens.every((t) => t.length >= 2), true);
  });
});

// ── §5 adapter — ReviewQuestion → ChatMessage ────────────────────────────────

describe("reviewQuestionToChatMessage — §5.1 input-mode mapping", () => {
  it("open question → inputMode 'open', no options", () => {
    const q: ReviewQuestion = {
      priority: 1,
      text: "Your Weighted Dips looked off today — anything bother you?",
      target: "Weighted Dips",
      kind: "open",
    };
    const m = reviewQuestionToChatMessage(q, "m1", "2026-05-31T00:00:00Z");
    eq(m.role, "arnold");
    eq(m.text, q.text);
    eq(m.inputMode, "open");
    eq(m.options, undefined);
    eq(m.source, "rules");
  });

  it("hybrid question → inputMode 'hybrid', chips mapped to options", () => {
    const q: ReviewQuestion = {
      priority: 2,
      text: "Weighted Dips: That top set was meant to be a grind — did you get all the reps, or did it break down?",
      target: "Weighted Dips",
      kind: "hybrid",
      chips: ["Smooth", "Grind but got them", "Missed reps"],
    };
    const m = reviewQuestionToChatMessage(q, "m2", "2026-05-31T00:00:00Z");
    eq(m.inputMode, "hybrid");
    truthy(m.options);
    eq(m.options!.length, 3);
    eq(m.options![0].label, "Smooth");
    eq(m.options![0].action, "followup");
    eq(m.options![0].id, "m2_opt_0");
  });

  it("tappable_rpe → inputMode 'tappable_only', composer must be hidden by ChatWidget", () => {
    const q: ReviewQuestion = {
      priority: 4,
      text: "Last hard set — how close to failure?",
      target: "Weighted Dips",
      kind: "tappable_rpe",
      chips: ["Had 3+ left", "1–2 left", "Last rep I could do", "Failed a rep"],
    };
    const m = reviewQuestionToChatMessage(q, "m3", "2026-05-31T00:00:00Z");
    eq(m.inputMode, "tappable_only");
    truthy(m.options);
    eq(m.options!.length, 4);
    eq(m.options![3].label, "Failed a rep");
  });
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
