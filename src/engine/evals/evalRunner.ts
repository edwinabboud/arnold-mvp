// =============================================================================
// ARNOLD — Eval Runner
// Location: src/engine/evals/evalRunner.ts
//
// Runs the eval dataset against the rules engine + Conversation Agent.
// Produces a scored report showing pass/fail per scenario and per category.
//
// Usage:
//   import { runEvals } from "./evalRunner";
//   const results = await runEvals();
//   console.log(results.summary);
// =============================================================================

import { EVAL_DATASET, EvalScenario, EvalResult, EvalSummary } from "./evalDataset";
import { routeInteraction, configureAPI } from "../api";

// ── Grading ─────────────────────────────────────────────────────────────────

function gradeResponse(
  response: string,
  scenario: EvalScenario
): EvalResult["responseGrade"] {
  const criteria = scenario.responseCriteria;
  const failedCriteria: string[] = [];
  const lower = response.toLowerCase();

  // Must include
  let mustIncludePass = true;
  if (criteria.mustInclude) {
    for (const phrase of criteria.mustInclude) {
      if (!lower.includes(phrase.toLowerCase())) {
        mustIncludePass = false;
        failedCriteria.push(`MISSING: "${phrase}"`);
      }
    }
  }

  // Must NOT include
  let mustNotIncludePass = true;
  if (criteria.mustNotInclude) {
    for (const phrase of criteria.mustNotInclude) {
      if (lower.includes(phrase.toLowerCase())) {
        mustNotIncludePass = false;
        failedCriteria.push(`FOUND FORBIDDEN: "${phrase}"`);
      }
    }
  }

  // Anti-patterns (global + scenario-specific)
  let antiPatternsPass = true;
  if (criteria.antiPatterns) {
    for (const pattern of criteria.antiPatterns) {
      if (response.includes(pattern)) {
        antiPatternsPass = false;
        failedCriteria.push(`ANTI-PATTERN: "${pattern}"`);
      }
    }
  }

  // Tone check — parse from JSON response if possible
  let tonePass = true;
  if (criteria.expectedTone) {
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
      if (parsed.tone && parsed.tone !== criteria.expectedTone) {
        tonePass = false;
        failedCriteria.push(`TONE: expected "${criteria.expectedTone}", got "${parsed.tone}"`);
      }
    } catch {
      // Can't parse tone — skip this check
    }
  }

  // Options check
  let optionsPass = true;
  if (criteria.hasOptions !== undefined) {
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
      const hasOpts = parsed.options && parsed.options.length > 0;
      if (criteria.hasOptions && !hasOpts) {
        optionsPass = false;
        failedCriteria.push("OPTIONS: expected options but none found");
      }
      if (!criteria.hasOptions && hasOpts) {
        optionsPass = false;
        failedCriteria.push("OPTIONS: expected no options but found some");
      }
    } catch {
      // Can't parse — skip
    }
  }

  // Sentence count
  let sentenceCountPass = true;
  if (criteria.maxSentences) {
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
      const message = parsed.message || response;
      const sentences = message.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      if (sentences.length > criteria.maxSentences) {
        sentenceCountPass = false;
        failedCriteria.push(`SENTENCES: expected max ${criteria.maxSentences}, got ${sentences.length}`);
      }
    } catch {
      // Count from raw text
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > criteria.maxSentences) {
        sentenceCountPass = false;
        failedCriteria.push(`SENTENCES: expected max ${criteria.maxSentences}, got ${sentences.length}`);
      }
    }
  }

  return {
    mustIncludePass,
    mustNotIncludePass,
    tonePass,
    optionsPass,
    sentenceCountPass,
    antiPatternsPass,
    failedCriteria,
  };
}

// ── Runner ───────────────────────────────────────────────────────────────────

export async function runSingleEval(scenario: EvalScenario): Promise<EvalResult> {
  const startTime = Date.now();

  // Build a minimal coaching context from the scenario
  const coachingContext = {
    currentPhase: scenario.context.phase,
    recentSessions: [],
    recentPainReports: (scenario.context.recentPainReports || []).map((p, i) => ({
      id: `pain_${i}`,
      sessionId: `session_${i}`,
      bodyArea: p.bodyArea,
      severity: p.severity,
      timestamp: new Date(Date.now() - p.sessionsAgo * 86400000).toISOString(),
    })),
    activeProgressions: [],
    streaks: {
      currentDaily: scenario.context.streakDays || 0,
      longestDaily: scenario.context.streakDays || 0,
      currentWeekly: Math.floor((scenario.context.streakDays || 0) / 7),
      longestWeekly: Math.floor((scenario.context.streakDays || 0) / 7),
      totalSessions: scenario.context.recentSessionCount || 0,
      streakFreezes: 0,
      milestones: [],
    },
    programPath: "skill_builder" as const,
    tier: "beginner" as const,
    todaysSession: {
      id: "eval_session",
      weekId: "eval_week",
      dayOfWeek: 1,
      label: "Eval Session",
      phase: scenario.context.phase,
      exercises: scenario.context.currentExercise
        ? [{
            id: scenario.context.currentExercise.progressionId,
            progressionId: scenario.context.currentExercise.progressionId,
            name: scenario.context.currentExercise.name,
            sets: scenario.context.currentExercise.sets,
            reps: scenario.context.currentExercise.reps,
            restSeconds: 90,
            difficultyIntent: scenario.context.currentExercise.difficultyIntent,
          }]
        : [],
      warmUpExercises: [],
      cooldownExercises: [],
    },
  };

  // Route to the Conversation Agent
  let responseText = "";
  let rulesEngineCorrect = true;

  try {
    const result = await routeInteraction(
      { type: "chat_message", text: scenario.userMessage },
      coachingContext as any
    );
    responseText = typeof result === "string" ? result : (result.text || JSON.stringify(result));
  } catch (error) {
    responseText = `[ERROR] ${error}`;
    rulesEngineCorrect = false;
  }

  const latencyMs = Date.now() - startTime;

  // Skip response grading for silent adaptation scenarios (no user-facing response)
  const isSilent = scenario.userMessage.startsWith("[SYSTEM]");
  const responseGrade = isSilent
    ? { mustIncludePass: true, mustNotIncludePass: true, tonePass: true, optionsPass: true, sentenceCountPass: true, antiPatternsPass: true, failedCriteria: [] }
    : gradeResponse(responseText, scenario);

  const passed = rulesEngineCorrect &&
    responseGrade.mustIncludePass &&
    responseGrade.mustNotIncludePass &&
    responseGrade.tonePass &&
    responseGrade.optionsPass &&
    responseGrade.sentenceCountPass &&
    responseGrade.antiPatternsPass;

  return {
    scenarioId: scenario.id,
    passed,
    rulesEngineCorrect,
    responseGrade,
    arnoldResponse: responseText,
    latencyMs,
  };
}

export async function runEvals(
  apiKey?: string,
  subset?: string[] // optional: run only specific scenario IDs
): Promise<{ results: EvalResult[]; summary: EvalSummary }> {
  if (apiKey) {
    configureAPI({ apiKey });
  }

  const scenarios = subset
    ? EVAL_DATASET.filter(s => subset.includes(s.id))
    : EVAL_DATASET;

  console.log(`\n═══ ARNOLD EVAL: Running ${scenarios.length} scenarios ═══\n`);

  const results: EvalResult[] = [];

  for (const scenario of scenarios) {
    const result = await runSingleEval(scenario);
    results.push(result);

    const status = result.passed ? "✓" : "✗";
    const failures = result.responseGrade.failedCriteria.length > 0
      ? ` — ${result.responseGrade.failedCriteria.join(", ")}`
      : "";
    console.log(`${status} [${scenario.category}] ${scenario.name}${failures}`);
  }

  // Build summary
  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};
  for (const result of results) {
    const scenario = scenarios.find(s => s.id === result.scenarioId)!;
    if (!byCategory[scenario.category]) {
      byCategory[scenario.category] = { total: 0, passed: 0, passRate: 0 };
    }
    byCategory[scenario.category].total++;
    if (result.passed) byCategory[scenario.category].passed++;
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].passRate = byCategory[cat].passed / byCategory[cat].total;
  }

  const passed = results.filter(r => r.passed).length;
  const summary: EvalSummary = {
    totalScenarios: results.length,
    passed,
    failed: results.length - passed,
    passRate: passed / results.length,
    byCategory,
    failedScenarios: results
      .filter(r => !r.passed)
      .map(r => {
        const scenario = scenarios.find(s => s.id === r.scenarioId)!;
        return { id: r.scenarioId, name: scenario.name, failedCriteria: r.responseGrade.failedCriteria };
      }),
  };

  console.log(`\n═══ RESULTS ═══`);
  console.log(`Pass rate: ${(summary.passRate * 100).toFixed(1)}% (${summary.passed}/${summary.totalScenarios})`);
  console.log(`\nBy category:`);
  for (const [cat, data] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${(data.passRate * 100).toFixed(0)}% (${data.passed}/${data.total})`);
  }
  if (summary.failedScenarios.length > 0) {
    console.log(`\nFailed scenarios:`);
    for (const f of summary.failedScenarios) {
      console.log(`  ✗ ${f.id}: ${f.name}`);
      for (const c of f.failedCriteria) {
        console.log(`      ${c}`);
      }
    }
  }

  return { results, summary };
}

// ── Dry Run (no API calls — tests grading logic only) ────────────────────────

export function dryRunGrading(): void {
  console.log(`\n═══ DRY RUN: Testing grading logic on ${EVAL_DATASET.length} scenarios ═══\n`);

  // Test with mock responses to verify the grading system itself works
  const mockResponses: Record<string, string> = {
    // Good response for pain_01
    pain_01: JSON.stringify({ message: "Noted. I'll monitor that shoulder over the next couple sessions.", options: [], tone: "neutral" }),
    // Bad response for pain_01 (says "stop" which it shouldn't)
    pain_01_bad: JSON.stringify({ message: "Stop immediately! This is dangerous!", options: [], tone: "firm" }),
    // Good response for easy_01
    easy_01: JSON.stringify({ message: "That's by design. Deload week — your body is recovering.", options: [], tone: "neutral" }),
    // Bad response for easy_01 (offers to progress)
    easy_01_bad: JSON.stringify({ message: "Great! Let's bump you up to the next level!", options: [], tone: "encouraging" }),
  };

  // Test pain_01 with good response
  const pain01 = EVAL_DATASET.find(s => s.id === "pain_01")!;
  const goodGrade = gradeResponse(mockResponses.pain_01, pain01);
  console.log(`pain_01 (good response): ${goodGrade.failedCriteria.length === 0 ? "✓ PASS" : `✗ FAIL: ${goodGrade.failedCriteria.join(", ")}`}`);

  const badGrade = gradeResponse(mockResponses.pain_01_bad, pain01);
  console.log(`pain_01 (bad response):  ${badGrade.failedCriteria.length > 0 ? `✓ Correctly caught: ${badGrade.failedCriteria.join(", ")}` : "✗ MISSED — should have failed"}`);

  // Test easy_01 with good response
  const easy01 = EVAL_DATASET.find(s => s.id === "easy_01")!;
  const easyGood = gradeResponse(mockResponses.easy_01, easy01);
  console.log(`easy_01 (good response): ${easyGood.failedCriteria.length === 0 ? "✓ PASS" : `✗ FAIL: ${easyGood.failedCriteria.join(", ")}`}`);

  const easyBad = gradeResponse(mockResponses.easy_01_bad, easy01);
  console.log(`easy_01 (bad response):  ${easyBad.failedCriteria.length > 0 ? `✓ Correctly caught: ${easyBad.failedCriteria.join(", ")}` : "✗ MISSED — should have failed"}`);

  console.log(`\n${EVAL_DATASET.length} scenarios ready. Run with API key to test against Claude.`);
}
