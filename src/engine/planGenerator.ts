// =============================================================================
// ARNOLD — Plan Generator (Section 8, Week 2)
// Assessment week → mesocycle → sessions → warm-ups → PR scheduling.
// Goal mixing is built in (60/30/10), not bolted on.
// =============================================================================

import {
  DifficultyIntent,
  GoalPriority,
  Mesocycle,
  MovementPattern,
  PlanPhase,
  PlanWeek,
  PlannedExercise,
  PlannedSession,
  Schedule,
  TrainingGoal,
  UserProgression,
} from "../types";
import {
  PROGRESSIONS,
  getProgressionTree,
  getNextProgression,
} from "../data/progressions";

// ── Constants ────────────────────────────────────────────────────────────────

const VOLUME_DISTRIBUTION: Record<number, number> = {
  1: 0.6,  // primary goal
  2: 0.3,  // secondary
  3: 0.1,  // tertiary
};

/** Which movement patterns each goal emphasizes */
const GOAL_PATTERNS: Record<string, MovementPattern[]> = {
  // New v2.0 path names
  street_lifter: ["pull", "push", "legs"],
  skill_builder: ["skill", "push", "core"],
  hybrid_athlete: ["pull", "push", "legs", "skill", "core"],
  endurance: ["pull", "push", "legs", "core"],
  // Old v1.1 names (backward compat)
  street_lifting: ["pull", "push", "legs"],
  skill_acquisition: ["skill", "push", "core"],
  mobility: ["core", "legs"],
};

/** How many weeks per phase (base mesocycle template) */
const PHASE_TEMPLATE: Array<{ phase: PlanPhase; weeks: number }> = [
  { phase: "base_building", weeks: 3 },
  { phase: "strength", weeks: 3 },
  { phase: "intensity", weeks: 2 },
  { phase: "deload", weeks: 1 },
  { phase: "peaking", weeks: 2 },
  { phase: "deload", weeks: 1 },
];

/** Rest seconds by difficulty intent */
const REST_BY_INTENT: Record<DifficultyIntent, number> = {
  challenging: 120,
  moderate: 90,
  easy: 60,
};

// ── 1. Assessment Week Builder ───────────────────────────────────────────────
// Generates a test week based on goals and schedule.
// After each exercise, Arnold asks through chat how it felt.

export interface AssessmentExercise {
  progressionId: string;
  name: string;
  pattern: MovementPattern;
  testType: "max_reps" | "max_hold" | "skill_check";
  /** What Arnold asks after this exercise */
  chatPrompt: string;
  chatOptions: string[];
}

export function buildAssessmentWeek(
  goals: GoalPriority[],
  schedule: Schedule
): AssessmentExercise[][] {
  // Get all relevant patterns based on goals
  const patterns = new Set<MovementPattern>();
  goals.forEach(g => {
    GOAL_PATTERNS[g.goal].forEach(p => patterns.add(p));
  });

  // Build assessment exercises — test entry & mid-level of each pattern
  const allTests: AssessmentExercise[] = [];
  patterns.forEach(pattern => {
    const tree = getProgressionTree(pattern);
    // Test 3 points: beginner, early-mid, mid
    const testPoints = [0, Math.floor(tree.length / 3), Math.floor(tree.length / 2)];
    testPoints.forEach(idx => {
      if (idx < tree.length) {
        const prog = tree[idx];
        allTests.push({
          progressionId: prog.id,
          name: prog.name,
          pattern: prog.pattern,
          testType: prog.isIsometric ? "max_hold" : "max_reps",
          chatPrompt: prog.isIsometric
            ? `How did ${prog.name} feel? How long could you hold it?`
            : `How did ${prog.name} feel? How many clean reps did you get?`,
          chatOptions: ["Easy — could do more", "Moderate — felt right", "Hard — barely finished", "Couldn't do it"],
        });
      }
    });
  });

  // Distribute across available days
  const days = schedule.daysPerWeek;
  const sessions: AssessmentExercise[][] = Array.from({ length: days }, () => []);
  allTests.forEach((test, i) => {
    sessions[i % days].push(test);
  });

  return sessions;
}

// ── 2. Assessment Results → User Progressions ────────────────────────────────

export interface AssessmentResult {
  progressionId: string;
  repsCompleted?: number;
  holdSeconds?: number;
  perceivedDifficulty: "easy" | "moderate" | "hard" | "failed";
}

export function assessmentToProgressions(
  results: AssessmentResult[]
): UserProgression[] {
  const progressions: UserProgression[] = [];
  const patternLevels: Record<string, string> = {};

  // For each pattern, find the highest level the user can do at moderate difficulty
  results.forEach(r => {
    const prog = PROGRESSIONS.find(p => p.id === r.progressionId);
    if (!prog) return;

    if (r.perceivedDifficulty !== "failed") {
      const existing = patternLevels[prog.pattern];
      const existingProg = existing ? PROGRESSIONS.find(p => p.id === existing) : null;
      if (!existingProg || prog.order > existingProg.order) {
        patternLevels[prog.pattern] = prog.id;
      }
    }
  });

  // Set progressions: everything at/below user's level = mastered, current = active
  Object.entries(patternLevels).forEach(([pattern, activeId]) => {
    const tree = getProgressionTree(pattern);
    const activeIdx = tree.findIndex(p => p.id === activeId);

    tree.forEach((p, i) => {
      if (i < activeIdx) {
        progressions.push({ progressionId: p.id, status: "mastered", consecutiveSuccesses: 3 });
      } else if (i === activeIdx) {
        progressions.push({ progressionId: p.id, status: "active", consecutiveSuccesses: 0 });
      } else {
        progressions.push({ progressionId: p.id, status: "locked", consecutiveSuccesses: 0 });
      }
    });
  });

  return progressions;
}

// ── 3. Mesocycle Generator ───────────────────────────────────────────────────

export function generateMesocycle(
  userId: string,
  goals: GoalPriority[],
  schedule: Schedule,
  progressions: UserProgression[],
  durationWeeks?: number
): Mesocycle {
  const totalWeeks = durationWeeks || PHASE_TEMPLATE.reduce((a, p) => a + p.weeks, 0);
  const mesocycleId = `meso_${Date.now()}`;
  const primaryGoal = goals.find(g => g.rank === 1)?.goal || "hybrid_athlete";

  // Build weeks with phases
  const weeks: PlanWeek[] = [];
  let weekNum = 0;
  let phaseIdx = 0;
  let phaseWeekCount = 0;

  while (weekNum < totalWeeks) {
    const template = PHASE_TEMPLATE[phaseIdx % PHASE_TEMPLATE.length];
    const phase = template.phase;

    const week: PlanWeek = {
      id: `${mesocycleId}_w${weekNum + 1}`,
      mesocycleId,
      weekNumber: weekNum + 1,
      phase,
      sessions: buildWeekSessions(
        `${mesocycleId}_w${weekNum + 1}`,
        phase,
        goals,
        schedule,
        progressions,
        weekNum + 1
      ),
    };
    weeks.push(week);
    weekNum++;
    phaseWeekCount++;

    if (phaseWeekCount >= template.weeks) {
      phaseIdx++;
      phaseWeekCount = 0;
    }
  }

  // Schedule PR attempts
  schedulePRAttempts(weeks, goals, progressions);

  return {
    id: mesocycleId,
    userId,
    createdAt: new Date().toISOString(),
    durationWeeks: totalWeeks,
    primaryGoal,
    weeks,
    status: "active",
  };
}

// ── 4. Session Builder (Week → Daily Sessions) ──────────────────────────────

function buildWeekSessions(
  weekId: string,
  phase: PlanPhase,
  goals: GoalPriority[],
  schedule: Schedule,
  progressions: UserProgression[],
  weekNumber: number
): PlannedSession[] {
  const sessions: PlannedSession[] = [];
  const { preferredDays, split, daysPerWeek, sessionDurationMin } = schedule;

  // Get active progressions per pattern
  const activeByPattern: Record<string, UserProgression & { prog: typeof PROGRESSIONS[0] }> = {};
  progressions
    .filter(p => p.status === "active")
    .forEach(p => {
      const prog = PROGRESSIONS.find(pr => pr.id === p.progressionId);
      if (prog) activeByPattern[prog.pattern] = { ...p, prog };
    });

  // Determine session patterns based on split
  const sessionPatterns = getSplitPatterns(split, daysPerWeek);

  preferredDays.slice(0, daysPerWeek).forEach((day, idx) => {
    const patterns = sessionPatterns[idx % sessionPatterns.length];
    const label = patterns.label;
    const exercises: PlannedExercise[] = [];

    // Distribute exercises based on goal volume
    patterns.patterns.forEach(pattern => {
      const active = activeByPattern[pattern];
      if (!active) return;

      // How much volume does this pattern get?
      const goalForPattern = findGoalForPattern(pattern, goals);
      const volumeMultiplier = goalForPattern
        ? VOLUME_DISTRIBUTION[goalForPattern.rank] || 0.1
        : 0.2;

      const { sets, reps, intent } = getPhaseVolume(
        phase,
        active.prog,
        volumeMultiplier,
        weekNumber
      );

      exercises.push({
        id: `${weekId}_d${day}_${pattern}`,
        progressionId: active.prog.id,
        name: active.prog.name,
        sets,
        reps,
        restSeconds: REST_BY_INTENT[intent],
        difficultyIntent: intent,
        notes: active.prog.cues[0] || undefined,
      });

      // Add supporting exercise for primary goals
      if (goalForPattern && goalForPattern.rank <= 2) {
        const supporting = getSupportingExercise(pattern, active.prog, progressions);
        if (supporting) {
          exercises.push({
            id: `${weekId}_d${day}_${pattern}_sup`,
            progressionId: supporting.id,
            name: supporting.name,
            sets: Math.max(2, sets - 1),
            reps: supporting.isIsometric ? supporting.targetReps : reps + 2,
            restSeconds: 60,
            difficultyIntent: "moderate",
            notes: supporting.cues[0] || undefined,
          });
        }
      }
    });

    // Generate warm-up
    const warmUp = generateWarmUp(patterns.patterns, phase, []);

    sessions.push({
      id: `${weekId}_s${idx}`,
      weekId,
      dayOfWeek: day,
      label,
      phase,
      exercises,
      warmUpExercises: warmUp,
      cooldownExercises: generateCooldown(patterns.patterns),
    });
  });

  return sessions;
}

// ── 5. Dynamic Warm-Up Generator ─────────────────────────────────────────────
// Workout-dependent AND recovery-aware (adds prehab if discomfort logged).

interface WarmUpConfig {
  patterns: MovementPattern[];
  phase: PlanPhase;
  recentPainAreas: string[];
}

export function generateWarmUp(
  patterns: MovementPattern[],
  phase: PlanPhase,
  recentPainAreas: string[]
): PlannedExercise[] {
  const warmUp: PlannedExercise[] = [];
  let exId = 0;

  // General activation (always)
  warmUp.push({
    id: `warmup_general_${exId++}`,
    progressionId: "warmup",
    name: "Arm Circles & Shoulder Rolls",
    sets: 1, reps: 20, restSeconds: 0,
    difficultyIntent: "easy",
    notes: "Forward and backward, 10 each direction",
  });
  warmUp.push({
    id: `warmup_general_${exId++}`,
    progressionId: "warmup",
    name: "Jumping Jacks",
    sets: 1, reps: 30, restSeconds: 0,
    difficultyIntent: "easy",
    notes: "Get the heart rate up",
  });

  // Session-specific warm-up movements
  if (patterns.includes("push")) {
    warmUp.push({
      id: `warmup_push_${exId++}`,
      progressionId: "warmup",
      name: "Scapular Push-ups",
      sets: 2, reps: 10, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Protract and retract at top of push-up position",
    });
    warmUp.push({
      id: `warmup_push_${exId++}`,
      progressionId: "warmup",
      name: "Shoulder Dislocates",
      sets: 1, reps: 15, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Use band or towel, wide grip, slow and controlled",
    });
  }

  if (patterns.includes("pull")) {
    warmUp.push({
      id: `warmup_pull_${exId++}`,
      progressionId: "warmup",
      name: "Band Pull-Aparts",
      sets: 2, reps: 15, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Squeeze shoulder blades together",
    });
    warmUp.push({
      id: `warmup_pull_${exId++}`,
      progressionId: "warmup",
      name: "Dead Hang",
      sets: 1, reps: 30, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Full dead hang, relax shoulders, decompress spine",
    });
  }

  if (patterns.includes("legs")) {
    warmUp.push({
      id: `warmup_legs_${exId++}`,
      progressionId: "warmup",
      name: "Leg Swings",
      sets: 1, reps: 10, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Front-to-back and side-to-side, 10 each leg",
    });
    warmUp.push({
      id: `warmup_legs_${exId++}`,
      progressionId: "warmup",
      name: "Deep Squat Hold",
      sets: 1, reps: 30, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Hold at bottom, push knees out with elbows",
    });
  }

  if (patterns.includes("skill") || patterns.includes("core")) {
    warmUp.push({
      id: `warmup_skill_${exId++}`,
      progressionId: "warmup",
      name: "Wrist Circles & Stretches",
      sets: 1, reps: 10, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Both directions, then wrist flexor/extensor stretches",
    });
    warmUp.push({
      id: `warmup_skill_${exId++}`,
      progressionId: "warmup",
      name: "Cat-Cow Stretches",
      sets: 1, reps: 10, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Slow, full range through spine",
    });
  }

  // Recovery-aware: add prehab for recent pain areas
  if (recentPainAreas.includes("shoulder")) {
    warmUp.push({
      id: `warmup_prehab_${exId++}`,
      progressionId: "prehab",
      name: "Rotator Cuff Band Work",
      sets: 2, reps: 15, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Internal and external rotation. Light band. Recovery focus",
    });
  }
  if (recentPainAreas.includes("elbow") || recentPainAreas.includes("wrist")) {
    warmUp.push({
      id: `warmup_prehab_${exId++}`,
      progressionId: "prehab",
      name: "Wrist Flexor/Extensor Curls",
      sets: 2, reps: 15, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Light weight or band. Full range of motion. Slow",
    });
  }
  if (recentPainAreas.includes("knee")) {
    warmUp.push({
      id: `warmup_prehab_${exId++}`,
      progressionId: "prehab",
      name: "Terminal Knee Extensions",
      sets: 2, reps: 15, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Band around knee, extend against resistance",
    });
  }
  if (recentPainAreas.includes("lower_back") || recentPainAreas.includes("lower back")) {
    warmUp.push({
      id: `warmup_prehab_${exId++}`,
      progressionId: "prehab",
      name: "Bird Dogs",
      sets: 2, reps: 8, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Opposite arm/leg extension. Hold 3 seconds each side",
    });
  }

  return warmUp;
}

function generateCooldown(patterns: MovementPattern[]): PlannedExercise[] {
  const cooldown: PlannedExercise[] = [];
  let exId = 0;

  if (patterns.includes("push") || patterns.includes("pull")) {
    cooldown.push({
      id: `cooldown_${exId++}`,
      progressionId: "cooldown",
      name: "Chest & Shoulder Stretch",
      sets: 1, reps: 30, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Doorway stretch, 30 seconds each side",
    });
    cooldown.push({
      id: `cooldown_${exId++}`,
      progressionId: "cooldown",
      name: "Lat Stretch",
      sets: 1, reps: 30, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Hang from bar or use doorframe, 30 seconds",
    });
  }
  if (patterns.includes("legs")) {
    cooldown.push({
      id: `cooldown_${exId++}`,
      progressionId: "cooldown",
      name: "Hip Flexor Stretch",
      sets: 1, reps: 30, restSeconds: 0,
      difficultyIntent: "easy",
      notes: "Half-kneeling, push hips forward, 30 seconds each side",
    });
  }

  return cooldown;
}

// ── 6. PR Scheduling ─────────────────────────────────────────────────────────

function schedulePRAttempts(
  weeks: PlanWeek[],
  goals: GoalPriority[],
  progressions: UserProgression[]
): void {
  // Schedule PR attempts in peaking phases
  weeks.forEach(week => {
    if (week.phase !== "peaking") return;

    week.sessions.forEach(session => {
      // Pick the hardest exercise in the session for a PR attempt
      const challenging = session.exercises.find(
        e => e.difficultyIntent === "challenging"
      );
      if (challenging) {
        session.prAttempt = {
          exerciseId: challenging.id,
          targetValue: challenging.reps + 1, // one more than current target
        };
      }
    });
  });
}

// ── 7. Cascading Changes ─────────────────────────────────────────────────────

export interface PlanChange {
  type: "reschedule_pr" | "adjust_volume" | "swap_exercise" | "add_prehab" | "shift_plan";
  description: string;
  affectedWeeks: number[]; // week numbers affected
  details: Record<string, unknown>;
}

export function cascadeChange(
  mesocycle: Mesocycle,
  change: PlanChange
): Mesocycle {
  const updated = { ...mesocycle, weeks: [...mesocycle.weeks] };

  switch (change.type) {
    case "shift_plan": {
      const shiftWeeks = (change.details.shiftBy as number) || 1;
      // Insert deload/recovery weeks and push everything forward
      const insertAt = change.details.afterWeek as number || updated.weeks.length;
      const recoveryWeeks: PlanWeek[] = Array.from({ length: shiftWeeks }, (_, i) => ({
        id: `recovery_${Date.now()}_${i}`,
        mesocycleId: updated.id,
        weekNumber: insertAt + i + 1,
        phase: "deload" as PlanPhase,
        sessions: [],
      }));
      updated.weeks.splice(insertAt, 0, ...recoveryWeeks);
      // Renumber
      updated.weeks.forEach((w, i) => { w.weekNumber = i + 1; });
      updated.durationWeeks = updated.weeks.length;
      break;
    }

    case "adjust_volume": {
      const { weekNumbers, exercisePattern, setsDelta, repsDelta } = change.details as {
        weekNumbers: number[];
        exercisePattern: string;
        setsDelta: number;
        repsDelta: number;
      };
      updated.weeks.forEach(week => {
        if (!weekNumbers.includes(week.weekNumber)) return;
        week.sessions.forEach(session => {
          session.exercises.forEach(ex => {
            if (ex.progressionId.startsWith(exercisePattern)) {
              ex.sets = Math.max(1, ex.sets + (setsDelta || 0));
              ex.reps = Math.max(1, ex.reps + (repsDelta || 0));
            }
          });
        });
      });
      break;
    }

    case "reschedule_pr": {
      const { fromWeek, toWeek } = change.details as { fromWeek: number; toWeek: number };
      // Remove PR from original week
      const origWeek = updated.weeks.find(w => w.weekNumber === fromWeek);
      origWeek?.sessions.forEach(s => { s.prAttempt = undefined; });
      // Add PR to new week
      const newWeek = updated.weeks.find(w => w.weekNumber === toWeek);
      if (newWeek) {
        const targetSession = newWeek.sessions[0];
        if (targetSession && targetSession.exercises.length > 0) {
          targetSession.prAttempt = {
            exerciseId: targetSession.exercises[0].id,
            targetValue: targetSession.exercises[0].reps + 1,
          };
        }
      }
      break;
    }
  }

  return updated;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface SplitPattern {
  label: string;
  patterns: MovementPattern[];
}

function getSplitPatterns(split: string, days: number): SplitPattern[] {
  switch (split) {
    case "push_pull_legs":
      return [
        { label: "Push Day", patterns: ["push", "skill"] },
        { label: "Pull Day", patterns: ["pull", "core"] },
        { label: "Leg Day", patterns: ["legs", "core"] },
        { label: "Push Day B", patterns: ["push", "skill"] },
        { label: "Pull Day B", patterns: ["pull", "core"] },
        { label: "Skill Day", patterns: ["skill", "push"] },
      ].slice(0, days);

    case "upper_lower":
      return [
        { label: "Upper A", patterns: ["push", "pull"] },
        { label: "Lower + Core", patterns: ["legs", "core"] },
        { label: "Upper B", patterns: ["push", "pull", "skill"] },
        { label: "Lower + Skills", patterns: ["legs", "skill"] },
      ].slice(0, days);

    case "full_body":
    default:
      return Array.from({ length: days }, (_, i) => ({
        label: `Full Body ${String.fromCharCode(65 + i)}`,
        patterns: ["push", "pull", "legs", "core", "skill"] as MovementPattern[],
      }));
  }
}

function findGoalForPattern(
  pattern: MovementPattern,
  goals: GoalPriority[]
): GoalPriority | null {
  for (const goal of goals.sort((a, b) => a.rank - b.rank)) {
    if (GOAL_PATTERNS[goal.goal].includes(pattern)) return goal;
  }
  return null;
}

function getPhaseVolume(
  phase: PlanPhase,
  prog: typeof PROGRESSIONS[0],
  volumeMultiplier: number,
  weekNumber: number
): { sets: number; reps: number; intent: DifficultyIntent } {
  const baseSets = prog.targetSets;
  const baseReps = prog.targetReps;

  switch (phase) {
    case "assessment":
      return { sets: 3, reps: baseReps, intent: "moderate" };

    case "base_building":
      return {
        sets: Math.max(1, Math.round(baseSets * volumeMultiplier * 1.2)),
        reps: Math.max(1, Math.round(baseReps * 1.1)),
        intent: "moderate",
      };

    case "strength":
      return {
        sets: Math.max(1, Math.round(baseSets * volumeMultiplier * 1.0)),
        reps: Math.max(1, Math.round(baseReps * 0.85)),
        intent: "challenging",
      };

    case "intensity":
      return {
        sets: Math.max(1, Math.round(baseSets * volumeMultiplier * 0.9)),
        reps: Math.max(1, Math.round(baseReps * 0.7)),
        intent: "challenging",
      };

    case "deload":
      return {
        sets: Math.max(2, Math.round(baseSets * volumeMultiplier * 0.6)),
        reps: Math.max(1, Math.round(baseReps * 0.6)),
        intent: "easy",
      };

    case "peaking":
      return {
        sets: Math.max(1, Math.round(baseSets * volumeMultiplier * 0.8)),
        reps: Math.max(1, Math.round(baseReps * 0.6)),
        intent: "challenging",
      };

    default:
      return { sets: baseSets, reps: baseReps, intent: "moderate" };
  }
}

function getSupportingExercise(
  pattern: MovementPattern,
  mainExercise: typeof PROGRESSIONS[0],
  progressions: UserProgression[]
): typeof PROGRESSIONS[0] | null {
  const tree = getProgressionTree(pattern);
  // Find an exercise 1-2 levels below the main one as supporting work
  const mainIdx = tree.findIndex(p => p.id === mainExercise.id);
  if (mainIdx <= 0) return null;

  const supportIdx = Math.max(0, mainIdx - 2);
  return tree[supportIdx];
}
