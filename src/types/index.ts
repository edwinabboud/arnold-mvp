// =============================================================================
// ARNOLD — Core Data Models
// =============================================================================

// ── User Profile ─────────────────────────────────────────────────────────────

export type ProgramPath =
  | "street_lifter"
  | "skill_builder"
  | "hybrid_athlete"
  | "endurance";

export type TrainerTier = "beginner" | "intermediate" | "advanced";

export type SplitType =
  | "push_pull_legs"
  | "upper_lower"
  | "full_body"
  | "custom";

/**
 * Session-length preference (v2.4.7). Drives runtime cut rules per path:
 * Compact (~40 min) / Standard (~60 min) / Recommended (~90 min, default).
 * Same program for all tiers — only accessories/finisher get cut.
 * Main-lift ramp warm-up sets are NEVER cut (injury prevention).
 */
export type SessionTier = "compact" | "standard" | "recommended";

// ── v2.4.8 Conversation Context Packet ───────────────────────────────────────
// Dense mandatory packet attached to every Conversation Agent call (§2.1).
// Superseded the legacy `ContextPacket` (still in use by Session Adapter +
// Progress Analyst). Built by `src/engine/conversationContext.ts`.

/** One exercise's per-session summary inside SessionSummary. */
export interface SessionSummaryExercise {
  name: string;
  role: ExerciseRole;
  /** Planned difficulty intent; null only when the source is missing. */
  difficultyIntent: DifficultyIntent | null;
  unit: "reps" | "seconds";
  /** Human-readable target, e.g. "3x6 @ +25kg" or "4x12s tuck planche". */
  target: string;
  /** What actually happened, e.g. "3x6" or "skipped". */
  achieved: string;
  /** Completed sets / planned sets, clamped 0..1. */
  completionRate: number;
  /** Numeric RPE if the user explicitly reported one; null in MVP. */
  rpeReported: number | null;
  /** Crude RPE inference from behavior; null when no signal exists. */
  rpeInferred: number | null;
  skipped: boolean;
}

export interface SessionSummary {
  /** ISO date of session completion. */
  date: string;
  /** Resolved session type per v2.4.8 §1.3 (e.g. "heavy_compound", "pure_skill"). */
  sessionType: string;
  exercises: SessionSummaryExercise[];
  /** Reps on the session's finisher exercise, if present; null otherwise. */
  finisherReps: number | null;
  /** Body areas with reported pain in this session, e.g. ["left shoulder"]. */
  painFlags: string[];
}

export interface CompressedSummary {
  date: string;
  sessionType: string;
  /** One-line outcome — "clean" / "missed pull-up reps" / "deload" / etc. */
  headlineOutcome: string;
  /** Body area flagged; null if no pain reported. */
  painFlag: string | null;
}

/** v2.4.8 §2.3 — the full packet for the Conversation Agent. */
export interface ConversationContextPacket {
  user: {
    path: ProgramPath;
    tier: TrainerTier;
    /** From onboarding if collected; null otherwise. */
    trainingAgeMonths: number | null;
    sessionTier: SessionTier;
    /** PlanPhase as a free string (e.g. "accumulation", "strength", "deload"). */
    phase: string;
    weekInMeso: number;
    isDeload: boolean;
    isTestWeek: boolean;
    bodyweightKg: number | null;
    /** Flattened e1RMs keyed by lift slug — value null when not yet measured. */
    e1rm: Record<string, number | null>;
  };
  goals: {
    /** From `arnold-path-specific-goals` knowledge — empty in MVP (no source yet). */
    pathGoals: string[];
    /** Nearest upcoming PR/test attempt; null when none scheduled. */
    activePR: {
      lift_or_skill: string;
      targetValue: string;
      scheduledWeek: number;
    } | null;
  };
  /** Populated only for post-session context; null for mid-session / ad-hoc. */
  completedSession: {
    sessionType: string;
    /** Resolved per v2.4.8 §1.3 — NOT assumed to be the heavy compound. */
    primaryPurposeMovement: string;
    exercises: SessionSummaryExercise[];
    finisherReps: number | null;
    /** v2.4.8 §2.5 — skip-derived only in MVP (skipped, low-completion). */
    behavioralFlags: string[];
  } | null;
  /** Last 5 sessions in full detail (newest first). */
  recentHistoryFull: SessionSummary[];
  /** Sessions 6–10 compressed (newest first). */
  recentHistoryCompressed: CompressedSummary[];
  /** Chronological finisher reps (oldest → newest) for fatigue trend. */
  finisherTrend: number[];
  recovery: {
    openPainFlags: Array<{ area: string; severity: number; firstSeen: string }>;
    daysSinceLastSession: number;
    /** Reserved for §9.4 return-to-train logic; false in MVP. */
    inReturnToTrain: boolean;
    sessionsThisWeek: number;
    scheduledThisWeek: number;
  };
  pendingAdaptations: Array<{
    summary: string;
    reason: string;
    progressionId: string;
    type: "weight" | "progression" | "volume" | "deload";
  }>;
  knowledge: {
    phaseGuidance: string;
    currentVariationRationale: string | null;
    relevantProtocol: string | null;
  };
}

export interface Schedule {
  daysPerWeek: number; // 2–6
  split: SplitType;
  preferredDays: number[]; // 0=Sun … 6=Sat
  sessionDurationMin: number; // target minutes per session
  /** v2.4.7. Default "recommended" for new users; legacy profiles migrate to
   *  "recommended" on rehydration (see store onRehydrateStorage). */
  sessionTier: SessionTier;
}

export interface UserGoalTarget {
  id: string;
  description: string; // e.g. "10 clean muscle-ups"
  metric: string; // e.g. "reps" | "hold_seconds"
  targetValue: number;
  currentValue: number;
  achievedAt?: string; // ISO date
}

export type FrontLeverLevel = "none" | "tuck" | "adv_tuck" | "straddle" | "full";
export type PlancheLevel = "none" | "lean" | "tuck" | "adv_tuck" | "straddle" | "full";

export interface UserBenchmarks {
  // Universal
  bodyweightKg?: number;

  // Street Lifter / Hybrid (weighted)
  pullUpMaxReps?: number;
  pullUpAddedKg?: number;
  dipMaxReps?: number;
  dipAddedKg?: number;
  squatMaxReps?: number;
  squatAddedKg?: number;

  // Skill Builder / Hybrid (skills)
  handstandHoldSec?: number;
  handstandWallOnly?: boolean;
  frontLeverLevel?: FrontLeverLevel;
  plancheLevel?: PlancheLevel;
  lSitHoldSec?: number;

  // Meta
  collectedAt?: string; // ISO timestamp
  source?: "onboarding" | "manual_update";
}

export interface UserProfile {
  id: string;
  createdAt: string;
  displayName: string;
  programPath: ProgramPath;
  tier: TrainerTier;
  bodyweightKg?: number;
  benchmarks?: UserBenchmarks;
  experienceLevel?: "new" | "experienced";
  schedule: Schedule;
  targets: UserGoalTarget[];
  assessmentComplete: boolean;
  onboardingComplete: boolean;
}

// ── Progression System ───────────────────────────────────────────────────────

export type MovementPattern =
  | "pull"
  | "push"
  | "legs"
  | "core"
  | "skill";

export interface ProgressionLevel {
  id: string;
  pattern: MovementPattern;
  name: string; // e.g. "Archer Pull-ups"
  order: number; // position in the tree (0 = easiest)
  prerequisites: string[]; // IDs of levels that must be mastered first
  cues: string[]; // form cues for coaching
  targetSets: number;
  targetReps: number; // or hold seconds for isometrics
  isIsometric: boolean;
}

export type ProgressionStatus =
  | "locked" // prerequisites not met
  | "active" // currently training
  | "mastered"; // completed criteria

export interface UserProgression {
  progressionId: string;
  status: ProgressionStatus;
  /** Consecutive sessions where sets/reps completed at moderate/easy */
  consecutiveSuccesses: number;
  lastAttemptedAt?: string;
}

// ── Plan Structure ───────────────────────────────────────────────────────────

export type PlanPhase =
  | "assessment"
  | "base_building"
  | "accumulation"     // Street Lifter: volume accumulation
  | "strength"
  | "intensity"
  | "deload"
  | "peaking"
  | "test"             // PR / 1RM test week
  | "hypertrophy"      // Skill Builder: muscle building phase
  | "skill_peaking"    // Skill Builder: reduce volume, maximize skill practice
  | "base_conditioning" // Endurance: aerobic base
  | "volume_ramping"   // Endurance: progressive overload on volume
  | "specialization";  // Hybrid: choose weighted or skill emphasis

export type DifficultyIntent = "easy" | "moderate" | "challenging";

export type ExerciseRole =
  | "main"           // Heavy compound — drives progression
  | "volume"         // Mastered exercise for hypertrophy
  | "complementary"  // Different movement plane, balanced development
  | "accessory"      // Weak links, stabilizers, antagonists
  | "skill"          // Skill practice (Skill Builder + Hybrid only)
  | "skill_practice"   // Slot 2: submaximal CNS work, never autoregulated
  | "skill_isometric"  // Slot 3: primary skill hold, unit=seconds, "Hold X seconds"
  | "ramp_up"        // Warm-up ramp sets before main lift
  | "finisher"       // Max(-2) fatigue gauge
  | "warmup"         // Warm-up exercises
  | "cooldown";      // Cooldown stretches

/** A sub-item inside a grouped PlannedExercise (warm-up block, accessories
 *  superset). Lighter than PlannedExercise — no progression tracking, no
 *  autoregulation, no role. Pure display. */
export interface SubExercise {
  id: string;
  name: string;
  /** Display string for the prescription, e.g. "10 reps", "30s", "10 each side", "10 reps + 10s hold" */
  prescription: string;
  /** Optional cue or note (e.g. "controlled tempo", "palms down") */
  notes?: string;
}

export interface PlannedExercise {
  id: string;
  progressionId: string;
  name: string;
  sets: number;
  reps: number; // or seconds for isometrics
  restSeconds: number;
  difficultyIntent: DifficultyIntent;
  exerciseRole: ExerciseRole;
  notes?: string;
  /** For weighted calisthenics */
  addedWeightKg?: number;
  /** Variation code for main lifts (e.g. "paused_bottom", "tempo_4s") */
  variationCode?: string;
  /** Target RPE for autoregulated sets */
  rpeTarget?: number;
  /** Hold time in seconds for isometric exercises */
  holdSeconds?: number;
  /** Per-exercise countdown for warmup phase; only set when exerciseRole === "warmup". v2.4.5 §5.4. */
  warmupDurationSeconds?: number;
  /** For grouped cards (warm-up block, accessories superset). When present,
   *  the UI renders this PlannedExercise as a single card with the sub-items
   *  listed inside. The parent's name becomes the card header. */
  subExercises?: SubExercise[];
  /** Optional label rendered on the card header for grouped cards.
   *  E.g. "Warm-up" or "Accessories (superset)". When undefined, falls
   *  back to the exercise's `name`. */
  groupLabel?: string;
}

export type WarmUpLength = "short" | "long" | "skip";

export interface PlannedSession {
  id: string;
  weekId: string;
  dayOfWeek: number; // 0–6
  label: string; // e.g. "Push Day A"
  phase: PlanPhase;
  /** Movement patterns trained in this session, used by cascade to avoid back-to-back same-pattern days. Derived at session construction time. */
  patterns: MovementPattern[];
  exercises: PlannedExercise[];
  warmUpExercises: PlannedExercise[];
  cooldownExercises: PlannedExercise[];
  /** Scheduled PR attempt? */
  prAttempt?: {
    exerciseId: string;
    targetValue: number;
  };
}

export interface PlanWeek {
  id: string;
  mesocycleId: string;
  weekNumber: number;
  phase: PlanPhase;
  sessions: PlannedSession[];
}

export interface Mesocycle {
  id: string;
  userId: string;
  createdAt: string;
  durationWeeks: number;
  programPath: ProgramPath;
  tier: TrainerTier;
  weeks: PlanWeek[];
  status: "active" | "completed" | "paused";
}

// ── Live Session ─────────────────────────────────────────────────────────────

export type SessionStatus =
  | "warmup"
  | "training"
  | "cooldown"
  | "completed"
  | "cancelled";

export interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
  /** User's subjective difficulty */
  perceivedDifficulty?: DifficultyIntent;
  addedWeightKg?: number;
  timestamp: string;
}

export interface PainReport {
  id: string;
  sessionId: string;
  bodyArea: string;
  severity: number; // 1–10
  exerciseId?: string; // which exercise triggered it
  timestamp: string;
  note?: string;
}

export interface SessionLog {
  id: string;
  plannedSessionId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  status: SessionStatus;
  warmUpChoice: WarmUpLength;
  cooldownChoice: WarmUpLength;
  completedSets: CompletedSet[];
  painReports: PainReport[];
  /** Post-session feedback */
  overallFeeling?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  /** Exercises that were swapped mid-session */
  swaps: Array<{
    originalExerciseId: string;
    replacementExerciseId: string;
    reason: string;
  }>;
}

// ── Streaks ──────────────────────────────────────────────────────────────────

export interface StreakData {
  currentDaily: number;
  longestDaily: number;
  currentWeekly: number;
  longestWeekly: number;
  totalSessions: number;
  streakFreezes: number; // remaining
  milestones: string[]; // IDs of achieved milestones
}

// ── Coaching Engine I/O ──────────────────────────────────────────────────────

/** What the rules engine feeds to the LLM for conversational output */
export interface CoachingContext {
  currentPhase: PlanPhase;
  recentSessions: SessionLog[]; // last 3–5
  recentPainReports: PainReport[];
  activeProgressions: UserProgression[];
  streaks: StreakData;
  programPath: ProgramPath;
  tier: TrainerTier;
  todaysSession: PlannedSession;
}

/** A decision the rules engine has already made */
export type CoachingDecision =
  | { type: "no_change"; reason: string }
  | { type: "progress_exercise"; exerciseId: string; toProgressionId: string }
  | { type: "regress_exercise"; exerciseId: string; toProgressionId: string }
  | { type: "swap_exercise"; exerciseId: string; alternatives: string[] }
  | { type: "adjust_volume"; exerciseId: string; newSets: number; newReps: number }
  | { type: "reschedule_pr"; originalDate: string; newDate: string; reason: string }
  | { type: "stop_exercise"; exerciseId: string; reason: string }
  | { type: "add_prehab"; exercises: PlannedExercise[] };

export interface CoachingResponse {
  decision: CoachingDecision;
  /** The conversational message Arnold says/shows to the user */
  message: string;
  tone: "encouraging" | "neutral" | "firm" | "cautious";
}

// ── Deprecated (v1.1 compat — remove after full migration) ──────────────
/** @deprecated Use ProgramPath instead */
export type TrainingGoal = ProgramPath;
/** @deprecated Use programPath on UserProfile instead */
export interface GoalPriority {
  goal: ProgramPath;
  rank: number;
}
