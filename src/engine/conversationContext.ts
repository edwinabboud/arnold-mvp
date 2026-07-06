// =============================================================================
// ARNOLD — Conversation Context Packet v2 (spec amendment v2.4.8)
//
// Dense mandatory packet for the Conversation Agent.
// - Per §2.1 it attaches to EVERY conversation call (no lightweight path).
// - Per §2.3 it carries enough specific data that the agent is forced into
//   specificity rather than generic fitness-coach prose.
// - Per §1.3 it carries the resolved primary-purpose movement so the review
//   doesn't tunnel-vision onto the heavy compound on a skill day.
//
// This file is a sibling of the legacy `contextPacket.ts` — the Session
// Adapter and Progress Analyst keep using the v1 packet there. This file
// is read by the Conversation Agent only (wired in Prompt B / Part 2).
// =============================================================================

import type {
  AdaptationItem,
  AdaptationQueue,
  AdaptationType as InternalAdaptationType,
} from "./adaptationQueue";
import type { E1RMProfile } from "./weightEngine";
import type {
  CompletedSet,
  CompressedSummary,
  ConversationContextPacket,
  DifficultyIntent,
  ExerciseRole,
  Mesocycle,
  PainReport,
  PlanWeek,
  PlannedExercise,
  PlannedSession,
  ProgramPath,
  SessionLog,
  SessionSummary,
  SessionSummaryExercise,
  SessionTier,
  TrainerTier,
  UserBenchmarks,
  UserProfile,
} from "../types";

// v2.4.12 Change 4: which skills each path Prilepin-programs (so a 0/undefined
// assessed hold means the generator fell back to a 5s baseline). Kept in lockstep
// with the skill-day Prilepin work in the intermediate generators.
const PRILEPIN_HOLD_SKILLS_BY_PATH: Record<string, Array<{ skill: string; field: keyof UserBenchmarks }>> = {
  skill_builder: [
    { skill: "handstand", field: "handstandHoldSec" },
    { skill: "lsit", field: "lSitHoldSec" },
    { skill: "frontLever", field: "frontLeverHoldSec" },
  ],
  hybrid_athlete: [
    { skill: "handstand", field: "handstandHoldSec" },
    { skill: "lsit", field: "lSitHoldSec" },
    { skill: "frontLever", field: "frontLeverHoldSec" },
    { skill: "planche", field: "plancheHoldSec" },
  ],
};

function computeUnassessedHolds(profile: UserProfile): string[] {
  const programmed = PRILEPIN_HOLD_SKILLS_BY_PATH[profile.programPath] ?? [];
  const bm = profile.benchmarks;
  return programmed
    .filter(({ field }) => {
      const v = bm?.[field] as number | undefined;
      return !(typeof v === "number" && v > 0);
    })
    .map(({ skill }) => skill);
}

// ── Session-type resolver (§1.3 row identifier) ───────────────────────────────

/**
 * Canonical session-type identifier used by the primary-purpose resolver.
 * One value per row of the §1.3 table (Endurance row exists but is
 * future-spec and never reachable in MVP — no generator emits it).
 */
export type ResolvedSessionType =
  | "heavy_compound"        // Street Lifter Heavy Dips / Heavy Pull-ups; SL beginner Push/Pull Emphasis
  | "peak_singles"          // Street Lifter Peak Singles
  | "legs"                  // Any path, leg day (squat-dominant)
  | "upper_volume"          // Street Lifter Upper Volume
  | "skill_push_pull"       // Skill Builder Skill + Push / Skill + Pull
  | "pure_skill"            // Skill Builder Pure Skill
  | "strength_volume"       // Skill Builder Strength (Volume on complementary)
  | "heavy_skill_bolt_on"   // Hybrid Athlete heavy day with skill bolt-ons
  | "dedicated_skill"       // Hybrid Athlete Skill Day
  | "endurance_circuit"     // Endurance — future-spec, never resolved in MVP
  | "general";              // Safe fallback (resolver still picks a movement)

/**
 * Resolve a planned session's row in the §1.3 table from its label + path.
 * Labels matched are the actual strings emitted by the six generator files
 * (Street Lifter / Skill Builder / Hybrid × Beginner/Intermediate, plus
 * Hybrid Beginner which inherits Street Lifter Beginner labels).
 */
export function resolveSessionType(
  session: PlannedSession,
  path: ProgramPath,
): ResolvedSessionType {
  const label = (session.label ?? "").toLowerCase();

  if (path === "endurance") return "endurance_circuit"; // future-spec, unreachable in MVP

  if (path === "skill_builder") {
    if (label.includes("pure skill")) return "pure_skill";
    if (label.includes("skill") && (label.includes("push") || label.includes("pull"))) return "skill_push_pull";
    if (label.includes("strength")) return "strength_volume";
    if (label.includes("leg")) return "legs";
    return "general";
  }

  if (path === "hybrid_athlete") {
    // Hybrid Beginner inherits Street Lifter Beginner labels ("Pull Emphasis",
    // "Push Emphasis", "Legs + Full Body") via the inner base call — they're
    // heavy/strength days with skill bolt-ons appended at runtime.
    if (label.includes("skill day")) return "dedicated_skill";
    if (label.includes("leg")) return "legs";
    if (
      label.includes("heavy") ||
      label.includes("peak") ||
      label.includes("singles") ||
      label.includes("push") ||
      label.includes("pull") ||
      label.includes("upper volume")
    ) {
      return "heavy_skill_bolt_on";
    }
    return "general";
  }

  // street_lifter (Beginner labels: "Pull Emphasis", "Push Emphasis", "Legs + Full Body";
  // Intermediate labels: "Heavy Dips", "Heavy Pull-ups", "Peak Singles", "Legs", "Upper Volume").
  if (path === "street_lifter") {
    if (label.includes("peak") || label.includes("singles")) return "peak_singles";
    if (label.includes("upper volume")) return "upper_volume";
    if (label.includes("leg")) return "legs";
    if (label.includes("heavy") || label.includes("push") || label.includes("pull")) return "heavy_compound";
    return "general";
  }

  return "general";
}

// ── Primary-purpose-movement resolver (§1.3) ──────────────────────────────────

/**
 * Resolves which movement Arnold should review for a completed session,
 * per v2.4.8 §1.3. Path × session type → target exerciseRole, then walks
 * `exercises` to find the first match.
 *
 * Key correctness contract (Self-review checklist 4, §2.4):
 * "It must NOT assume 'heavy compound' universally — on a Skill Builder
 * skill day it returns the skill_isometric, on a legs day the squat, etc."
 *
 * Fallback when no row-specific match: first `main` exercise, then first
 * non-warmup/non-cooldown exercise. Returns `"(no exercise resolved)"`
 * only when the session has zero non-warmup/cooldown exercises at all.
 */
export function resolvePrimaryPurposeMovement(
  path: ProgramPath,
  sessionType: ResolvedSessionType,
  exercises: PlannedExercise[],
): string {
  // Target role priority per §1.3 row. First match wins.
  const targetRoles: ExerciseRole[] = (() => {
    switch (sessionType) {
      case "heavy_compound":
      case "peak_singles":
      case "heavy_skill_bolt_on":
      case "legs":
      case "endurance_circuit":
        // Heavy compound / squat (on legs) / peak attempt all live in the `main` role.
        return ["main"];
      case "upper_volume":
        // §1.3: "Aggregate volume tolerance" — first volume role exercise.
        return ["volume"];
      case "skill_push_pull":
        // §1.3: "Skill isometric (slot 3) — held in seconds".
        return ["skill_isometric"];
      case "pure_skill":
        // §1.3: "Skill practice quality (slot 2) — did it feel controlled".
        return ["skill_practice"];
      case "strength_volume":
        // §1.3: "Complementary lift".
        return ["complementary"];
      case "dedicated_skill":
        // §1.3: "Skill isometric / practice" — prefer isometric, fall through to practice.
        return ["skill_isometric", "skill_practice"];
      case "general":
      default:
        return [];
    }
  })();

  // First-match walk for the row's target roles.
  for (const role of targetRoles) {
    const hit = exercises.find((ex) => ex.exerciseRole === role);
    if (hit) return hit.name;
  }

  // Fallback 1 — first `main` role exercise.
  const main = exercises.find((ex) => ex.exerciseRole === "main");
  if (main) return main.name;

  // Fallback 2 — first non-warmup/non-cooldown exercise.
  const working = exercises.find(
    (ex) => ex.exerciseRole !== "warmup" && ex.exerciseRole !== "cooldown",
  );
  if (working) return working.name;

  return "(no exercise resolved)";
}

// ── Behavioral flags (§2.5, MVP scope: skip-derived only) ─────────────────────

/**
 * Skip-derived behavioral flags per v2.4.8 §2.5.
 *
 * In scope (deterministic reads of existing log data):
 *   - `skipped:<exercise>`         — zero completed sets on a working movement.
 *   - `low-completion:<exercise>`  — completionRate < 0.5 on a working movement.
 *
 * Deferred (need infra not yet built):
 *   - `rest-spike-on-<exercise>`   — needs per-exercise rest-time baselining.
 *   - `abandoned-set-N`            — needs partial-set event logging.
 *
 * §2.5 Priority-1 degradation: an empty array is the common, correct case,
 * not a failure — the priority resolver simply falls through to Priority 2+.
 */
export function deriveBehavioralFlags(
  log: SessionLog,
  planned: PlannedSession,
): string[] {
  const flags: string[] = [];

  const counts = countCompletedSetsByExerciseId(log.completedSets);

  for (const ex of planned.exercises) {
    if (ex.exerciseRole === "warmup" || ex.exerciseRole === "cooldown") continue;
    if (ex.sets <= 0) continue; // defensive; shouldn't happen for working exercises
    const done = counts.get(ex.id) ?? 0;
    if (done === 0) {
      flags.push(`skipped:${ex.name}`);
    } else if (done / ex.sets < 0.5) {
      flags.push(`low-completion:${ex.name}`);
    }
  }

  return flags;
}

// ── Per-exercise summary helpers ──────────────────────────────────────────────

function countCompletedSetsByExerciseId(sets: CompletedSet[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sets) m.set(s.exerciseId, (m.get(s.exerciseId) ?? 0) + 1);
  return m;
}

function isIsometricByRole(role: ExerciseRole): boolean {
  return role === "skill_isometric";
}

function formatPlannedTarget(ex: PlannedExercise): string {
  const sets = ex.sets;
  if (isIsometricByRole(ex.exerciseRole) || ex.holdSeconds != null) {
    const hold = ex.holdSeconds ?? ex.reps;
    return `${sets}x${hold}s`;
  }
  const reps = ex.reps;
  const weight = ex.addedWeightKg != null && ex.addedWeightKg > 0 ? ` @ +${ex.addedWeightKg}kg` : "";
  return `${sets}x${reps}${weight}`;
}

function formatAchieved(
  ex: PlannedExercise,
  completedForEx: CompletedSet[],
): string {
  if (completedForEx.length === 0) return "skipped";
  const isIso = isIsometricByRole(ex.exerciseRole) || ex.holdSeconds != null;
  const sets = completedForEx.length;
  // For non-iso: repsCompleted is the canonical unit. For iso: hold seconds
  // aren't logged separately in CompletedSet, so we fall back to the planned
  // hold value as a best-effort display.
  if (isIso) {
    const hold = ex.holdSeconds ?? ex.reps;
    return `${sets}x${hold}s`;
  }
  // If all completed sets hit planned reps, render uniform "NxR".
  const sample = completedForEx[0]?.repsCompleted ?? ex.reps;
  const uniform = completedForEx.every((s) => s.repsCompleted === sample);
  return uniform ? `${sets}x${sample}` : `${sets} sets (${completedForEx.map((s) => s.repsCompleted).join(",")})`;
}

function buildExerciseSummary(
  ex: PlannedExercise,
  log: SessionLog,
): SessionSummaryExercise {
  const completedForEx = log.completedSets.filter((s) => s.exerciseId === ex.id);
  const completionRate = ex.sets > 0 ? Math.min(1, completedForEx.length / ex.sets) : 0;
  const skipped = completedForEx.length === 0;

  const unit: "reps" | "seconds" =
    isIsometricByRole(ex.exerciseRole) || ex.holdSeconds != null ? "seconds" : "reps";

  return {
    name: ex.name,
    role: ex.exerciseRole,
    difficultyIntent: ex.difficultyIntent ?? null,
    unit,
    target: formatPlannedTarget(ex),
    achieved: formatAchieved(ex, completedForEx),
    completionRate,
    // Numeric RPE is not captured directly in MVP — CompletedSet only carries
    // a DifficultyIntent (easy/moderate/challenging), not an RPE number.
    // Per §2.1, explicit null with reason; agent UI surfaces "RPE: not reported".
    rpeReported: null,
    rpeInferred: null,
    skipped,
  };
}

// ── SessionSummary builder for one log ────────────────────────────────────────

function painFlagsForLog(log: SessionLog): string[] {
  const areas = new Set<string>();
  for (const p of log.painReports) areas.add(p.bodyArea);
  return Array.from(areas);
}

function finisherRepsForLog(log: SessionLog, planned: PlannedSession | undefined): number | null {
  if (!planned) return null;
  const finisher = planned.exercises.find((e) => e.exerciseRole === "finisher");
  if (!finisher) return null;
  const sets = log.completedSets.filter((s) => s.exerciseId === finisher.id);
  if (sets.length === 0) return null;
  return sets.reduce((a, s) => a + (s.repsCompleted ?? 0), 0);
}

function headlineOutcomeFor(
  log: SessionLog,
  planned: PlannedSession | undefined,
): string {
  if (!planned) return log.status === "completed" ? "completed" : log.status;
  // Look for the primary purpose movement; report how it went in one line.
  // We don't have ProgramPath here — caller passes via wrapper.
  // For compressed summary we settle for a coarse signal: completion vs. miss.
  const primary = planned.exercises.find((e) => e.exerciseRole === "main");
  if (!primary) {
    const flags = deriveBehavioralFlags(log, planned);
    return flags.length > 0 ? flags[0] : "clean";
  }
  const completedForEx = log.completedSets.filter((s) => s.exerciseId === primary.id);
  const rate = primary.sets > 0 ? completedForEx.length / primary.sets : 0;
  if (rate === 0) return `skipped ${primary.name}`;
  if (rate < 0.5) return `missed reps on ${primary.name}`;
  if (rate < 1) return `partial reps on ${primary.name}`;
  return "clean";
}

/**
 * Build a `SessionSummary` for one log + its planned session.
 * If the planned session can't be resolved (older mesocycle, etc.) the
 * summary degrades gracefully — exercises array is empty, painFlags are
 * still derived from the log, finisherReps is null.
 */
function buildSessionSummary(
  log: SessionLog,
  planned: PlannedSession | undefined,
  path: ProgramPath,
): SessionSummary {
  const date = log.completedAt ?? log.startedAt;
  const sessionType: string = planned ? resolveSessionType(planned, path) : "general";
  const exercises: SessionSummaryExercise[] = planned
    ? planned.exercises
        .filter((ex) => ex.exerciseRole !== "warmup" && ex.exerciseRole !== "cooldown")
        .map((ex) => buildExerciseSummary(ex, log))
    : [];

  return {
    date,
    sessionType,
    exercises,
    finisherReps: finisherRepsForLog(log, planned),
    painFlags: painFlagsForLog(log),
  };
}

function buildCompressedSummary(
  log: SessionLog,
  planned: PlannedSession | undefined,
  path: ProgramPath,
): CompressedSummary {
  const date = log.completedAt ?? log.startedAt;
  const sessionType: string = planned ? resolveSessionType(planned, path) : "general";
  const painAreas = painFlagsForLog(log);
  return {
    date,
    sessionType,
    headlineOutcome: headlineOutcomeFor(log, planned),
    painFlag: painAreas.length > 0 ? painAreas[0] : null,
  };
}

// ── Recent-history split (§2.2 — 5 full + 5 compressed, newest first) ────────

/**
 * Split sessionHistory into the §2.2 window: last 5 sessions full detail,
 * sessions 6-10 compressed, beyond 10 dropped. Sorted newest first.
 */
export function buildRecentHistory(
  sessionHistory: SessionLog[],
  plannedSessionsById: Map<string, PlannedSession>,
  path: ProgramPath,
): { full: SessionSummary[]; compressed: CompressedSummary[] } {
  const sorted = [...sessionHistory].sort((a, b) => {
    const aT = new Date(a.completedAt ?? a.startedAt).getTime();
    const bT = new Date(b.completedAt ?? b.startedAt).getTime();
    return bT - aT; // newest first
  });

  const fullSlice = sorted.slice(0, 5);
  const compressedSlice = sorted.slice(5, 10);

  const full = fullSlice.map((log) =>
    buildSessionSummary(log, plannedSessionsById.get(log.plannedSessionId), path),
  );
  const compressed = compressedSlice.map((log) =>
    buildCompressedSummary(log, plannedSessionsById.get(log.plannedSessionId), path),
  );

  return { full, compressed };
}

// ── Recovery block ────────────────────────────────────────────────────────────

const OPEN_PAIN_WINDOW_DAYS = 14;

function buildRecoveryBlock(
  sessionHistory: SessionLog[],
  scheduledDaysPerWeek: number,
  now: Date,
): ConversationContextPacket["recovery"] {
  const nowMs = now.getTime();

  // Open pain flags = unique bodyArea reports inside the recency window;
  // we keep the highest severity seen and the earliest sighting.
  const byArea = new Map<string, { area: string; severity: number; firstSeen: string }>();
  const cutoffMs = nowMs - OPEN_PAIN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  for (const log of sessionHistory) {
    for (const p of log.painReports) {
      const t = new Date(p.timestamp).getTime();
      if (t < cutoffMs) continue;
      const prev = byArea.get(p.bodyArea);
      if (!prev) {
        byArea.set(p.bodyArea, { area: p.bodyArea, severity: p.severity, firstSeen: p.timestamp });
      } else {
        if (p.severity > prev.severity) prev.severity = p.severity;
        if (new Date(p.timestamp).getTime() < new Date(prev.firstSeen).getTime()) prev.firstSeen = p.timestamp;
      }
    }
  }

  const lastLog = sessionHistory.length
    ? [...sessionHistory].sort((a, b) => {
        const aT = new Date(a.completedAt ?? a.startedAt).getTime();
        const bT = new Date(b.completedAt ?? b.startedAt).getTime();
        return bT - aT;
      })[0]
    : null;
  const daysSinceLastSession = lastLog
    ? Math.floor((nowMs - new Date(lastLog.completedAt ?? lastLog.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  // Mon-start week per the codebase convention.
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  const daysSinceMon = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysSinceMon);
  weekStart.setHours(0, 0, 0, 0);
  const sessionsThisWeek = sessionHistory.filter((log) => {
    const t = new Date(log.startedAt).getTime();
    return t >= weekStart.getTime();
  }).length;

  return {
    openPainFlags: Array.from(byArea.values()),
    daysSinceLastSession,
    // Reserved for §9.4. No source yet — MVP false, documented in JSDoc.
    inReturnToTrain: false,
    sessionsThisWeek,
    scheduledThisWeek: scheduledDaysPerWeek,
  };
}

// ── Pending adaptations ──────────────────────────────────────────────────────

function mapAdaptationType(t: InternalAdaptationType): "weight" | "progression" | "volume" | "deload" {
  switch (t) {
    case "weight_increase":
    case "weight_decrease":
    case "weight_hold":
      return "weight";
    case "progression_advance":
    case "progression_regress":
      return "progression";
    case "volume_adjustment":
      return "volume";
    case "deload_trigger":
    case "finisher_trend":
      return "deload";
  }
}

function buildPendingAdaptations(queue: AdaptationQueue): ConversationContextPacket["pendingAdaptations"] {
  return queue.items
    .filter((it) => !it.applied && it.userResponse !== "rejected")
    .map((it: AdaptationItem) => ({
      summary: `${it.exerciseName} ${it.change}`.trim(),
      reason: it.reason,
      progressionId: it.exerciseKey,
      type: mapAdaptationType(it.type),
    }));
}

// ── Goals (no source in MVP — pathGoals empty, activePR scanned) ─────────────

function findActivePR(
  mesocycle: Mesocycle | null,
  currentWeekNumber: number,
): ConversationContextPacket["goals"]["activePR"] {
  if (!mesocycle) return null;
  // Scan from the current week forward for the first session carrying a prAttempt.
  for (const w of mesocycle.weeks as PlanWeek[]) {
    if (w.weekNumber < currentWeekNumber) continue;
    for (const s of w.sessions) {
      if (s.prAttempt) {
        // exercise name lookup for friendlier surfacing
        const ex = s.exercises.find((e) => e.id === s.prAttempt!.exerciseId);
        return {
          lift_or_skill: ex?.name ?? s.prAttempt.exerciseId,
          targetValue: String(s.prAttempt.targetValue),
          scheduledWeek: w.weekNumber,
        };
      }
    }
  }
  return null;
}

// ── E1RM flattening ───────────────────────────────────────────────────────────

function flattenE1RM(profile: E1RMProfile | null): Record<string, number | null> {
  if (!profile) {
    return { dip: null, pull_up: null, squat: null };
  }
  return {
    dip: profile.dip?.totalE1RM ?? null,
    pull_up: profile.pullUp?.totalE1RM ?? null,
    squat: profile.squat?.totalE1RM ?? null,
  };
}

// ── Knowledge block (routed from existing snippet logic) ─────────────────────

interface KnowledgeInputs {
  phaseGuidance: string;
  currentVariationRationale: string | null;
  relevantProtocol: string | null;
}

// ── Assembler ─────────────────────────────────────────────────────────────────

export interface BuildConversationPacketParams {
  profile: UserProfile;
  mesocycle: Mesocycle | null;
  /** Current week (1-based) inside the mesocycle for phase / PR scan. */
  currentWeekNumber: number;
  /** "deload" | "test" if the current week is one of those, else falsy. */
  weekFlavor?: "deload" | "test" | null;
  e1rmProfile: E1RMProfile | null;
  sessionHistory: SessionLog[];
  /**
   * Map from `plannedSessionId` → planned session. Caller assembles by
   * iterating the active mesocycle's weeks; older sessions from prior
   * mesocycles may not be present, and SessionSummary degrades gracefully.
   */
  plannedSessionsById: Map<string, PlannedSession>;
  adaptationQueue: AdaptationQueue;
  /** Pre-fetched knowledge snippets for the new `knowledge` block. */
  knowledge: KnowledgeInputs;
  /** Optional — present only on post-session calls. */
  completedSession?: {
    log: SessionLog;
    planned: PlannedSession;
  };
  /** Injectable clock for tests; defaults to `new Date()`. */
  now?: Date;
}

/**
 * Build the v2.4.8 Conversation Context Packet. Attaches the dense mandatory
 * fields per §2.3 and §2.1's no-omit rule (missing fields surface as
 * explicit `null` in the serializer rather than being dropped).
 */
export function buildConversationContextPacket(
  params: BuildConversationPacketParams,
): ConversationContextPacket {
  const {
    profile,
    mesocycle,
    currentWeekNumber,
    weekFlavor,
    e1rmProfile,
    sessionHistory,
    plannedSessionsById,
    adaptationQueue,
    knowledge,
    completedSession,
    now,
  } = params;

  const path = profile.programPath;
  const tier = profile.tier;
  const sessionTier: SessionTier = profile.schedule.sessionTier;

  // Phase + week. mesocycle.weeks[i].phase is the source of truth.
  const currentWeek = mesocycle?.weeks.find((w) => w.weekNumber === currentWeekNumber);
  const phase = currentWeek?.phase ?? "unknown";
  const isDeload = phase === "deload" || weekFlavor === "deload";
  const isTestWeek = (phase as string) === "test" || weekFlavor === "test";

  const { full: recentHistoryFull, compressed: recentHistoryCompressed } = buildRecentHistory(
    sessionHistory,
    plannedSessionsById,
    path,
  );

  // Finisher trend: chronological (oldest → newest) finisher reps across history.
  const sortedHistOldFirst = [...sessionHistory].sort((a, b) => {
    const aT = new Date(a.completedAt ?? a.startedAt).getTime();
    const bT = new Date(b.completedAt ?? b.startedAt).getTime();
    return aT - bT;
  });
  const finisherTrend: number[] = [];
  for (const log of sortedHistOldFirst) {
    const planned = plannedSessionsById.get(log.plannedSessionId);
    const reps = finisherRepsForLog(log, planned);
    if (reps != null) finisherTrend.push(reps);
  }

  const completedBlock: ConversationContextPacket["completedSession"] = completedSession
    ? (() => {
        const sessionType = resolveSessionType(completedSession.planned, path);
        const primary = resolvePrimaryPurposeMovement(
          path,
          sessionType,
          completedSession.planned.exercises,
        );
        const exercises = completedSession.planned.exercises
          .filter((ex) => ex.exerciseRole !== "warmup" && ex.exerciseRole !== "cooldown")
          .map((ex) => buildExerciseSummary(ex, completedSession.log));
        return {
          sessionType,
          primaryPurposeMovement: primary,
          exercises,
          finisherReps: finisherRepsForLog(completedSession.log, completedSession.planned),
          behavioralFlags: deriveBehavioralFlags(completedSession.log, completedSession.planned),
        };
      })()
    : null;

  return {
    user: {
      path,
      tier,
      // Lifecycle flags, disclosed so the agent never reads a fresh-but-valid
      // account (saved profile, 0 sessions, null e1RM) as a failed setup.
      onboardingComplete: profile.onboardingComplete,
      assessmentComplete: profile.assessmentComplete,
      // No explicit trainingAgeMonths field in UserProfile; experienceLevel exists
      // but is categorical ("new" / "experienced") rather than numeric. MVP leaves
      // this null; the agent reads `tier` as a proxy per §4.
      trainingAgeMonths: null,
      sessionTier,
      phase,
      weekInMeso: currentWeekNumber,
      isDeload,
      isTestWeek,
      bodyweightKg: profile.bodyweightKg ?? null,
      e1rm: flattenE1RM(e1rmProfile),
      // Components for self-explanatory e1RM reporting. Reuses already-computed
      // totalE1RM + bwContribution (no recomputation) and the raw benchmark
      // inputs (added load + reps). reps is what lets the serializer show the
      // exact added+bodyweight split only for true 1-rep maxes.
      e1rmBreakdown: {
        dip: e1rmProfile?.dip
          ? { totalE1RM: e1rmProfile.dip.totalE1RM, bwContributionKg: e1rmProfile.dip.bwContribution, addedKg: profile.benchmarks?.dipAddedKg ?? 0, reps: profile.benchmarks?.dipMaxReps ?? 0 }
          : null,
        pull_up: e1rmProfile?.pullUp
          ? { totalE1RM: e1rmProfile.pullUp.totalE1RM, bwContributionKg: e1rmProfile.pullUp.bwContribution, addedKg: profile.benchmarks?.pullUpAddedKg ?? 0, reps: profile.benchmarks?.pullUpMaxReps ?? 0 }
          : null,
        squat: e1rmProfile?.squat
          ? { totalE1RM: e1rmProfile.squat.totalE1RM, bwContributionKg: e1rmProfile.squat.bwContribution, addedKg: profile.benchmarks?.squatAddedKg ?? 0, reps: profile.benchmarks?.squatMaxReps ?? 0 }
          : null,
      },
      // v2.4.9 Part 1: compression is disabled (all tiers → full sessions).
      // Part 2 populates this from the per-path × session-type compression
      // profile so Arnold can name the lever combination ("we're holding
      // the heavy work and trimming the volume work today").
      compressionProfile: null,
      // v2.4.12 Change 4: Prilepin-programmed skills with no assessed hold (the
      // generator used a 5s baseline for these). Computed from benchmarks + path.
      unassessedHolds: computeUnassessedHolds(profile),
    },
    goals: {
      // Ranked goals captured at onboarding (profile.goals), ordered by rank and
      // flattened to goal ids for the agent. Empty array when none were captured
      // (early/dev profiles) — the serializer then prints the "no goals" line.
      pathGoals: (profile.goals ?? [])
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((g) => g.goal),
      activePR: findActivePR(mesocycle, currentWeekNumber),
    },
    completedSession: completedBlock,
    recentHistoryFull,
    recentHistoryCompressed,
    finisherTrend,
    recovery: buildRecoveryBlock(sessionHistory, profile.schedule.daysPerWeek, now ?? new Date()),
    pendingAdaptations: buildPendingAdaptations(adaptationQueue),
    knowledge,
  };
}

// ── Serializer for prompt injection ──────────────────────────────────────────

const N = (v: unknown, missingReason = "data unavailable"): string =>
  v == null || v === "" ? `null (${missingReason})` : String(v);

function formatExerciseLine(ex: SessionSummaryExercise): string {
  const intent = ex.difficultyIntent ?? "intent: null";
  const rpeRep = ex.rpeReported == null ? "RPE: not reported" : `RPE: ${ex.rpeReported}`;
  const skipped = ex.skipped ? " [SKIPPED]" : "";
  return `  - ${ex.name} (${ex.role}, ${intent}) target ${ex.target} → ${ex.achieved} | rate ${Math.round(ex.completionRate * 100)}% | ${rpeRep}${skipped}`;
}

/**
 * Serialize the packet for prompt injection. Prompt B (Part 2/3) consumes
 * this at the `{{KNOWLEDGE_CONTEXT}}` injection point. Per §2.1, missing
 * fields surface as explicit `null (reason)` rather than being omitted,
 * so the agent can distinguish "no pain reported" from "pain data unavailable".
 */
export function conversationContextPacketToString(packet: ConversationContextPacket): string {
  const out: string[] = [];

  out.push(`=== ARNOLD CONVERSATION CONTEXT (v2.4.8) ===`);

  // User block
  const u = packet.user;
  out.push(``);
  out.push(`USER`);
  out.push(`  path: ${u.path} | tier: ${u.tier} | sessionTier: ${u.sessionTier}`);
  // Explicit lifecycle disclosure. Without it the agent inferred "your account
  // setup didn't save — contact support" from the empty history / null e1RM
  // below, on every new user's first chat. A saved profile must say so
  // authoritatively so empty fields read as "fresh start," not "data loss".
  const onbState = u.onboardingComplete
    ? "account setup SAVED — profile is valid; treat any empty/null fields below as a fresh start, NOT failed or lost setup"
    : u.onboardingComplete === false
      ? "onboarding INCOMPLETE — setup did not finish"
      : "onboarding state unknown";
  out.push(`  onboardingComplete: ${u.onboardingComplete ?? "unknown"} | assessmentComplete: ${u.assessmentComplete ?? "unknown"} — ${onbState}`);
  out.push(`  trainingAgeMonths: ${N(u.trainingAgeMonths, "not in MVP schema — use tier as the experience proxy (not a missing-data signal)")}`);
  out.push(`  phase: ${u.phase} | week: ${u.weekInMeso} | deload: ${u.isDeload} | test: ${u.isTestWeek}`);
  out.push(`  bodyweightKg: ${N(u.bodyweightKg, "not measured")}`);
  // On skill-day session types the e1rm load block is the most numerically
  // dense thing in the packet (three kg values), and the conversation prompt
  // rewards specificity — so it pulled the model's coaching toward load even
  // when the actual primary purpose was an isometric hold or skill practice.
  // Suppress the per-lift e1rm line on those session types and tell the
  // agent explicitly where to anchor instead. The numeric profile stays on
  // the packet object for any non-prompt consumer.
  const SKILL_DAY_TYPES: ReadonlySet<string> = new Set([
    "pure_skill",
    "skill_push_pull",
    "dedicated_skill",
  ]);
  const completedSessionType = packet.completedSession?.sessionType;
  if (completedSessionType && SKILL_DAY_TYPES.has(completedSessionType)) {
    out.push(`  e1rm: omitted on skill days — anchor on hold time, skill quality, control`);
  } else {
    // Disclosure only (math unchanged): these e1RM values are TOTAL-LOAD
    // estimates. For dip/pull-up they already INCLUDE the bodyweight
    // contribution (×0.70 / ×0.65 body-load coefficients), so they are NOT
    // comparable to a session's added "+Xkg" working weight. Squat e1RM is
    // barbell added load (bodyweight not factored). Without these labels the
    // agent read "dip=62kg" as a plain added 1RM and contradicted the
    // added-only planned weights.
    const allE1rmNull = Object.values(u.e1rm).every((v) => v == null);
    if (allE1rmNull) {
      // Bare "dip=null, pull-up=null, squat=null" stacked onto the "no data"
      // pile and helped the agent conclude setup failed. Name the actual
      // reason: a fresh account whose benchmarks carry no reps yet.
      out.push(
        `  e1RM: not estimable yet — benchmarks recorded without reps (expected for a new account; NOT a data error)`,
      );
    } else if (u.e1rmBreakdown) {
      // Self-explanatory breakdown so the total is never a surprise: show the
      // components (added load + bodyweight contribution). The added+bodyweight
      // sum is exact ONLY for a true 1-rep max; multi-rep totals are Epley
      // estimates and are labeled as such rather than faking an A+B sum.
      const LIFT_NAME: Record<string, string> = { dip: "dip", pull_up: "pull-up", squat: "squat" };
      out.push(`  e1RM (estimated 1-rep max = total load; NOT a bare added-weight number — report the breakdown to the user):`);
      for (const [k, b] of Object.entries(u.e1rmBreakdown)) {
        const name = LIFT_NAME[k] ?? k;
        if (!b) {
          out.push(`    ${name}: null (not measured)`);
        } else if (b.bwContributionKg <= 0) {
          // squat / legs — bodyweight is not factored into the load
          out.push(`    ${name}: ${b.totalE1RM}kg (added barbell load only; bodyweight not counted for this lift)`);
        } else if (b.reps === 1) {
          const bw = u.bodyweightKg;
          const pct = bw && bw > 0 ? ` (${Math.round((b.bwContributionKg / bw) * 100)}% of your ${bw}kg)` : "";
          out.push(`    ${name}: ${b.totalE1RM}kg total = ${b.addedKg}kg added + ${b.bwContributionKg}kg from bodyweight${pct}`);
        } else {
          out.push(`    ${name}: ${b.totalE1RM}kg total — estimated from ${b.reps} reps at +${b.addedKg}kg added (Epley estimate; does NOT split cleanly into added+bodyweight)`);
        }
      }
    } else {
      // Fallback for non-chat packet consumers that don't populate e1rmBreakdown.
      const E1RM_LABEL: Record<string, string> = {
        dip: "dip(incl.bodyweight)",
        pull_up: "pull-up(incl.bodyweight)",
        squat: "squat(barbell-added)",
      };
      const e1rmLines = Object.entries(u.e1rm).map(
        ([k, v]) => `${E1RM_LABEL[k] ?? k}=${v == null ? "null" : `${v}kg`}`,
      );
      out.push(
        `  e1RM (total-load estimates incl. bodyweight for dip/pull-up; NOT added working weight): ${e1rmLines.join(", ")}`,
      );
    }
  }
  if (u.compressionProfile) {
    out.push(`  compression: levers=[${u.compressionProfile.leversApplied.join(", ")}] — ${u.compressionProfile.rationale}`);
  } else {
    out.push(`  compression: null (full session — v2.4.9 Part 1 has compression disabled)`);
  }
  if (u.unassessedHolds && u.unassessedHolds.length > 0) {
    out.push(`  unassessedHolds: ${u.unassessedHolds.join(", ")} — max hold not assessed at onboarding; skill-day Prilepin used a 5s baseline (suggest reassessing)`);
  }

  // Goals
  out.push(``);
  out.push(`GOALS`);
  out.push(`  pathGoals: ${packet.goals.pathGoals.length === 0 ? "not in MVP schema (no goals source yet — not user-data loss)" : packet.goals.pathGoals.join("; ")}`);
  if (packet.goals.activePR) {
    out.push(`  activePR: ${packet.goals.activePR.lift_or_skill} target ${packet.goals.activePR.targetValue} (week ${packet.goals.activePR.scheduledWeek})`);
  } else {
    out.push(`  activePR: null (none scheduled)`);
  }

  // Completed session (post-session contexts only)
  out.push(``);
  if (packet.completedSession) {
    const cs = packet.completedSession;
    out.push(`JUST-COMPLETED SESSION`);
    out.push(`  type: ${cs.sessionType} | primaryPurposeMovement: ${cs.primaryPurposeMovement}`);
    out.push(`  exercises:`);
    cs.exercises.forEach((ex) => out.push(formatExerciseLine(ex)));
    out.push(`  finisherReps: ${N(cs.finisherReps, "no finisher in this session")}`);
    out.push(`  behavioralFlags: ${cs.behavioralFlags.length === 0 ? "[] (clean — Priority 1 resolver falls through)" : cs.behavioralFlags.join(", ")}`);
  } else {
    out.push(`JUST-COMPLETED SESSION`);
    out.push(`  null (not a post-session context)`);
  }

  // Recent history
  out.push(``);
  out.push(`RECENT HISTORY (last 5 full + 6-10 compressed, newest first)`);
  if (packet.recentHistoryFull.length === 0) {
    out.push(`  full: ${u.onboardingComplete ? "[] (no sessions yet — new account, onboarding complete; NOT a data error)" : "[] (no prior sessions)"}`);
  } else {
    packet.recentHistoryFull.forEach((s, i) => {
      const pain = s.painFlags.length === 0 ? "no pain" : `pain: ${s.painFlags.join(", ")}`;
      out.push(`  [full ${i + 1}] ${s.date} ${s.sessionType} | finisher ${N(s.finisherReps, "n/a")} | ${pain}`);
      s.exercises.forEach((ex) => out.push(formatExerciseLine(ex)));
    });
  }
  if (packet.recentHistoryCompressed.length > 0) {
    packet.recentHistoryCompressed.forEach((c, i) => {
      out.push(`  [compressed ${i + 1}] ${c.date} ${c.sessionType} | ${c.headlineOutcome} | pain: ${c.painFlag ?? "none"}`);
    });
  }

  // Finisher trend
  out.push(``);
  out.push(`FINISHER TREND (chronological): ${packet.finisherTrend.length === 0 ? "null (no finisher data)" : packet.finisherTrend.join(" → ")}`);

  // Recovery
  out.push(``);
  out.push(`RECOVERY`);
  const r = packet.recovery;
  if (r.openPainFlags.length === 0) {
    out.push(`  openPainFlags: none reported`);
  } else {
    r.openPainFlags.forEach((f) => out.push(`  openPainFlag: ${f.area} severity=${f.severity} firstSeen=${f.firstSeen}`));
  }
  out.push(`  daysSinceLastSession: ${r.daysSinceLastSession === -1 ? (u.onboardingComplete ? "null (no sessions yet — new account)" : "null (no prior session)") : r.daysSinceLastSession}`);
  out.push(`  inReturnToTrain: ${r.inReturnToTrain} (MVP: always false — §9.4 logic deferred)`);
  const freshWeekNote = r.sessionsThisWeek === 0 && packet.recentHistoryFull.length === 0 && u.onboardingComplete ? " (new account — training not started yet)" : "";
  out.push(`  sessionsThisWeek: ${r.sessionsThisWeek}/${r.scheduledThisWeek}${freshWeekNote}`);

  // Pending adaptations
  out.push(``);
  if (packet.pendingAdaptations.length === 0) {
    out.push(`PENDING ADAPTATIONS: none`);
  } else {
    out.push(`PENDING ADAPTATIONS (surface first per §1.1):`);
    packet.pendingAdaptations.forEach((a) => out.push(`  - ${a.summary} — ${a.reason} [${a.type}, ${a.progressionId}]`));
  }

  // Knowledge
  out.push(``);
  out.push(`KNOWLEDGE`);
  out.push(`  phase: ${packet.knowledge.phaseGuidance || "null (no phase guidance available)"}`);
  out.push(`  variationRationale: ${N(packet.knowledge.currentVariationRationale, "no variation cycling this phase")}`);
  out.push(`  relevantProtocol: ${N(packet.knowledge.relevantProtocol, "no specific protocol matched")}`);

  return out.join("\n");
}
