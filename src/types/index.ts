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

export interface Schedule {
  daysPerWeek: number; // 2–6
  split: SplitType;
  preferredDays: number[]; // 0=Sun … 6=Sat
  sessionDurationMin: number; // target minutes per session
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
  | "ramp_up"        // Warm-up ramp sets before main lift
  | "finisher"       // Max(-2) fatigue gauge
  | "warmup"         // Warm-up exercises
  | "cooldown";      // Cooldown stretches

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
