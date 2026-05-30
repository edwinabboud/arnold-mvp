// =============================================================================
// ARNOLD — Conversation Context Packet v2 — runnable test suite
//
// Run: `npx ts-node --skip-project src/engine/conversationContext.test.ts`
//
// (--skip-project is required because the project's tsconfig extends
//  `expo/tsconfig.base.json` which sets `module: "preserve"` — a value
//  the standalone TypeScript embedded in ts-node refuses to parse.
//  --skip-project bypasses the project tsconfig and uses ts-node's
//  defaults, which compile this test file fine.)
//
// No jest. This is intentional: per the v2.4.8 Prompt A spec
// ("If there's no test runner configured, set up a minimal one OR write
// the tests as a runnable script and note that CI wiring is deferred"),
// the runnable-script path is chosen. CI wiring is deferred to whenever
// the project adopts a test runner more broadly.
//
// Process exit code is non-zero on any assertion failure so the script
// can be hooked into a future CI step without changes.
// =============================================================================

import type {
  CompletedSet,
  DifficultyIntent,
  ExerciseRole,
  PainReport,
  PlannedExercise,
  PlannedSession,
  ProgramPath,
  SessionLog,
} from "../types";
import {
  buildRecentHistory,
  deriveBehavioralFlags,
  resolvePrimaryPurposeMovement,
  resolveSessionType,
  type ResolvedSessionType,
} from "./conversationContext";

// ── Minimal test harness ──────────────────────────────────────────────────────

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

function deepEq(actual: unknown, expected: unknown, label = "values"): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

let exIdCounter = 0;
function mkEx(
  name: string,
  role: ExerciseRole,
  overrides: Partial<PlannedExercise> = {},
): PlannedExercise {
  return {
    id: `ex_${++exIdCounter}_${role}`,
    progressionId: overrides.progressionId ?? "p_x",
    name,
    sets: overrides.sets ?? 3,
    reps: overrides.reps ?? 8,
    restSeconds: overrides.restSeconds ?? 90,
    difficultyIntent: (overrides.difficultyIntent ?? "moderate") as DifficultyIntent,
    exerciseRole: role,
    ...overrides,
  };
}

function mkSession(
  label: string,
  exercises: PlannedExercise[],
  overrides: Partial<PlannedSession> = {},
): PlannedSession {
  return {
    id: overrides.id ?? `s_${label}`,
    weekId: overrides.weekId ?? "w_1",
    dayOfWeek: overrides.dayOfWeek ?? 1,
    label,
    phase: overrides.phase ?? "strength",
    patterns: overrides.patterns ?? ["push"],
    exercises,
    warmUpExercises: overrides.warmUpExercises ?? [],
    cooldownExercises: overrides.cooldownExercises ?? [],
  };
}

function mkSet(exerciseId: string, setNumber: number, reps = 8): CompletedSet {
  return {
    exerciseId,
    setNumber,
    repsCompleted: reps,
    timestamp: new Date().toISOString(),
  };
}

function mkLog(
  plannedSessionId: string,
  completedSets: CompletedSet[],
  overrides: Partial<SessionLog> = {},
): SessionLog {
  return {
    id: overrides.id ?? `log_${plannedSessionId}`,
    plannedSessionId,
    userId: overrides.userId ?? "u_test",
    startedAt: overrides.startedAt ?? new Date().toISOString(),
    completedAt: overrides.completedAt ?? new Date().toISOString(),
    status: overrides.status ?? "completed",
    warmUpChoice: overrides.warmUpChoice ?? "skip",
    cooldownChoice: overrides.cooldownChoice ?? "skip",
    completedSets,
    painReports: overrides.painReports ?? [],
    swaps: overrides.swaps ?? [],
    ...overrides,
  };
}

// ── §1.3 resolver: one assertion per row (the headline test) ─────────────────

describe("resolveSessionType + resolvePrimaryPurposeMovement (§1.3 rows)", () => {
  const resolverCases: Array<{
    label: string;
    path: ProgramPath;
    sessionLabel: string;
    exercises: PlannedExercise[];
    expectType: ResolvedSessionType;
    expectMovementName: string;
  }> = [
    // ── Street Lifter rows ─────────────────────────────────────────────────
    {
      label: "Street Lifter / Heavy Dips → main compound",
      path: "street_lifter",
      sessionLabel: "Heavy Dips (Push)",
      exercises: [mkEx("Weighted Dips", "main"), mkEx("Diamond Push-ups", "volume")],
      expectType: "heavy_compound",
      expectMovementName: "Weighted Dips",
    },
    {
      label: "Street Lifter / Heavy Pull-ups → main compound",
      path: "street_lifter",
      sessionLabel: "Heavy Pull-ups (Pull)",
      exercises: [mkEx("Weighted Pull-ups", "main"), mkEx("Rows", "complementary")],
      expectType: "heavy_compound",
      expectMovementName: "Weighted Pull-ups",
    },
    {
      label: "Street Lifter / Peak Singles → the single (main)",
      path: "street_lifter",
      sessionLabel: "Peak Singles + Secondary Pull",
      exercises: [mkEx("Weighted Pull-up Single", "main", { sets: 1, reps: 1 })],
      expectType: "peak_singles",
      expectMovementName: "Weighted Pull-up Single",
    },
    {
      label: "Street Lifter / Legs → squat (main)",
      path: "street_lifter",
      sessionLabel: "Legs",
      exercises: [mkEx("Pistol Squat", "main"), mkEx("Bulgarian Split Squat", "accessory")],
      expectType: "legs",
      expectMovementName: "Pistol Squat",
    },
    {
      label: "Street Lifter / Upper Volume → first volume role",
      path: "street_lifter",
      sessionLabel: "Upper Volume",
      exercises: [mkEx("Volume Pull-ups", "volume"), mkEx("Volume Dips", "volume")],
      expectType: "upper_volume",
      expectMovementName: "Volume Pull-ups",
    },
    // ── Skill Builder rows ─────────────────────────────────────────────────
    {
      label: "Skill Builder / Skill+Push → skill_isometric (NOT main)",
      path: "skill_builder",
      sessionLabel: "Push + Skill (A)",
      exercises: [
        mkEx("Tuck Planche Practice", "skill_practice"),
        mkEx("Tuck Planche Hold", "skill_isometric"),
        mkEx("Weighted Dips", "complementary"),
      ],
      expectType: "skill_push_pull",
      expectMovementName: "Tuck Planche Hold",
    },
    {
      label: "Skill Builder / Skill+Pull → skill_isometric (NOT main)",
      path: "skill_builder",
      sessionLabel: "Pull + Skill (B)",
      exercises: [
        mkEx("Front Lever Practice", "skill_practice"),
        mkEx("Front Lever Hold", "skill_isometric"),
        mkEx("Weighted Pull-ups", "complementary"),
      ],
      expectType: "skill_push_pull",
      expectMovementName: "Front Lever Hold",
    },
    {
      label: "Skill Builder / Pure Skill → skill_practice (slot 2)",
      path: "skill_builder",
      sessionLabel: "Pure Skill (C)",
      exercises: [
        mkEx("Handstand Practice", "skill_practice"),
        mkEx("Wall Handstand Hold", "skill_isometric"),
      ],
      expectType: "pure_skill",
      expectMovementName: "Handstand Practice",
    },
    {
      label: "Skill Builder / Strength → complementary",
      path: "skill_builder",
      sessionLabel: "Strength (D)",
      exercises: [
        mkEx("Weighted Dips", "complementary"),
        mkEx("Hollow Body Hold", "finisher"),
      ],
      expectType: "strength_volume",
      expectMovementName: "Weighted Dips",
    },
    {
      label: "Skill Builder / Legs → squat (main)",
      path: "skill_builder",
      sessionLabel: "Legs + Core (E)",
      exercises: [mkEx("Pistol Squat", "main")],
      expectType: "legs",
      expectMovementName: "Pistol Squat",
    },
    // ── Hybrid Athlete rows ────────────────────────────────────────────────
    {
      label: "Hybrid / Heavy + skill bolt-on → main compound",
      path: "hybrid_athlete",
      sessionLabel: "Heavy Dips (Push)",
      exercises: [
        mkEx("Weighted Dips", "main"),
        mkEx("Handstand Practice", "skill"),
      ],
      expectType: "heavy_skill_bolt_on",
      expectMovementName: "Weighted Dips",
    },
    {
      label: "Hybrid / Dedicated Skill → skill_isometric preferred",
      path: "hybrid_athlete",
      sessionLabel: "Skill Day",
      exercises: [
        mkEx("Tuck Planche Practice", "skill_practice"),
        mkEx("Tuck Planche Hold", "skill_isometric"),
      ],
      expectType: "dedicated_skill",
      expectMovementName: "Tuck Planche Hold",
    },
    {
      label: "Hybrid / Dedicated Skill → falls through to skill_practice if no isometric",
      path: "hybrid_athlete",
      sessionLabel: "Skill Day",
      exercises: [mkEx("Skill Practice Only", "skill_practice")],
      expectType: "dedicated_skill",
      expectMovementName: "Skill Practice Only",
    },
    {
      label: "Hybrid / Legs → squat (main)",
      path: "hybrid_athlete",
      sessionLabel: "Legs",
      exercises: [mkEx("Pistol Squat", "main")],
      expectType: "legs",
      expectMovementName: "Pistol Squat",
    },
  ];

  for (const c of resolverCases) {
    it(c.label, () => {
      const session = mkSession(c.sessionLabel, c.exercises);
      const t = resolveSessionType(session, c.path);
      eq(t, c.expectType, "sessionType");
      const m = resolvePrimaryPurposeMovement(c.path, t, c.exercises);
      eq(m, c.expectMovementName, "primaryPurposeMovement");
    });
  }

  // Fallbacks
  it("fallback: no row match + main exists → first main", () => {
    const exercises = [
      mkEx("Some Accessory", "accessory"),
      mkEx("Some Main", "main"),
      mkEx("Some Finisher", "finisher"),
    ];
    const m = resolvePrimaryPurposeMovement("street_lifter", "general", exercises);
    eq(m, "Some Main");
  });

  it("fallback: no main, no row match → first non-warmup/cooldown", () => {
    const exercises = [
      mkEx("Warmup Mover", "warmup"),
      mkEx("Some Volume", "volume"),
      mkEx("Cooldown Mover", "cooldown"),
    ];
    const m = resolvePrimaryPurposeMovement("street_lifter", "general", exercises);
    eq(m, "Some Volume");
  });
});

// ── Behavioral flags (§2.5 — skip-derived only) ──────────────────────────────

describe("deriveBehavioralFlags (§2.5)", () => {
  it("clean session → empty flags", () => {
    const main = mkEx("Main", "main", { sets: 3 });
    const comp = mkEx("Comp", "complementary", { sets: 3 });
    const session = mkSession("Heavy Dips", [main, comp]);
    const log = mkLog(session.id, [
      mkSet(main.id, 0), mkSet(main.id, 1), mkSet(main.id, 2),
      mkSet(comp.id, 0), mkSet(comp.id, 1), mkSet(comp.id, 2),
    ]);
    const flags = deriveBehavioralFlags(log, session);
    deepEq(flags, []);
  });

  it("0 sets on a working exercise → skipped:<name>", () => {
    const main = mkEx("Main", "main", { sets: 3 });
    const acc = mkEx("Accessory X", "accessory", { sets: 3 });
    const session = mkSession("Heavy Dips", [main, acc]);
    const log = mkLog(session.id, [
      mkSet(main.id, 0), mkSet(main.id, 1), mkSet(main.id, 2),
    ]);
    const flags = deriveBehavioralFlags(log, session);
    deepEq(flags, ["skipped:Accessory X"]);
  });

  it("<50% completion on a working exercise → low-completion:<name>", () => {
    const main = mkEx("Main", "main", { sets: 4 });
    const session = mkSession("Heavy Dips", [main]);
    const log = mkLog(session.id, [mkSet(main.id, 0)]); // 1/4 = 0.25
    const flags = deriveBehavioralFlags(log, session);
    deepEq(flags, ["low-completion:Main"]);
  });

  it("warmup / cooldown skips do NOT emit flags", () => {
    const main = mkEx("Main", "main", { sets: 3 });
    const wu = mkEx("Skipped warmup", "warmup", { sets: 2 });
    const cd = mkEx("Skipped cooldown", "cooldown", { sets: 1 });
    const session = mkSession("Heavy Dips", [main, wu, cd]);
    const log = mkLog(session.id, [mkSet(main.id, 0), mkSet(main.id, 1), mkSet(main.id, 2)]);
    const flags = deriveBehavioralFlags(log, session);
    deepEq(flags, []);
  });
});

// ── Recent-history split (§2.2 — 5 full + 5 compressed) ──────────────────────

describe("buildRecentHistory (§2.2)", () => {
  it("12 sessions → 5 full + 5 compressed + 2 dropped, newest first", () => {
    const planned = mkSession("Heavy Dips", [mkEx("Main", "main", { sets: 3 })]);
    const mapById = new Map<string, PlannedSession>();
    mapById.set(planned.id, planned);

    // 12 logs, oldest to newest by completedAt
    const logs: SessionLog[] = [];
    for (let i = 0; i < 12; i++) {
      const ts = new Date(2026, 0, i + 1).toISOString();
      logs.push(mkLog(planned.id, [mkSet(planned.exercises[0].id, 0)], { id: `log_${i}`, completedAt: ts, startedAt: ts }));
    }

    const { full, compressed } = buildRecentHistory(logs, mapById, "street_lifter");
    eq(full.length, 5, "full count");
    eq(compressed.length, 5, "compressed count");

    // Newest first
    eq(full[0].date, logs[11].completedAt!);
    eq(full[4].date, logs[7].completedAt!);
    eq(compressed[0].date, logs[6].completedAt!);
    eq(compressed[4].date, logs[2].completedAt!);
    // logs[0] and logs[1] are dropped — total above 10 falls off.
  });

  it("fewer than 5 sessions → all full, compressed empty", () => {
    const planned = mkSession("Heavy Dips", [mkEx("Main", "main", { sets: 3 })]);
    const mapById = new Map<string, PlannedSession>([[planned.id, planned]]);
    const logs = [
      mkLog(planned.id, [], { id: "a", completedAt: "2026-01-01T00:00:00Z" }),
      mkLog(planned.id, [], { id: "b", completedAt: "2026-01-02T00:00:00Z" }),
    ];
    const { full, compressed } = buildRecentHistory(logs, mapById, "street_lifter");
    eq(full.length, 2);
    eq(compressed.length, 0);
    eq(full[0].date, "2026-01-02T00:00:00Z"); // newest first
  });

  it("missing plannedSession (older mesocycle) → degrades to empty exercises but preserves pain", () => {
    const mapById = new Map<string, PlannedSession>(); // empty — planned not found
    const pain: PainReport = {
      id: "p1", sessionId: "s1", bodyArea: "right shoulder", severity: 6, timestamp: new Date().toISOString(),
    };
    const log = mkLog("unknown_session", [], { id: "x", painReports: [pain], completedAt: "2026-02-01T00:00:00Z" });
    const { full } = buildRecentHistory([log], mapById, "street_lifter");
    eq(full.length, 1);
    eq(full[0].exercises.length, 0);
    deepEq(full[0].painFlags, ["right shoulder"]);
  });
});

// ── Summary + exit ────────────────────────────────────────────────────────────

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
