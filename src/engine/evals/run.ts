// =============================================================================
// Run Arnold evals
//
// DRY RUN (no API key, tests grading logic):
//   npx ts-node src/engine/evals/run.ts
//
// FULL RUN (tests against Claude API):
//   ANTHROPIC_API_KEY=sk-ant-... npx ts-node src/engine/evals/run.ts
//
// RUN SPECIFIC SCENARIOS:
//   ANTHROPIC_API_KEY=sk-ant-... npx ts-node src/engine/evals/run.ts pain_01 easy_01 cant_03
// =============================================================================

import { runEvals, dryRunGrading } from "./evalRunner";

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const subset = process.argv.slice(2).length > 0 ? process.argv.slice(2) : undefined;

  if (!apiKey) {
    console.log("No ANTHROPIC_API_KEY found — running dry run (grading logic test only).\n");
    console.log("To test against Claude, run:");
    console.log("  ANTHROPIC_API_KEY=sk-ant-... npx ts-node src/engine/evals/run.ts\n");
    dryRunGrading();
    return;
  }

  const { summary } = await runEvals(apiKey, subset);

  // Exit with error code if below threshold
  if (summary.passRate < 0.9) {
    console.log(`\n⚠ Below 90% threshold. Fix failing scenarios before shipping.`);
    process.exit(1);
  } else {
    console.log(`\n✓ Pass rate above 90%. Ready for early access.`);
  }
}

main().catch(console.error);
