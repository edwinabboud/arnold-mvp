// =============================================================================
// ARNOLD — Hybrid Athlete Beginner Plan Generator
// Street Lifter Beginner base + skill bolt-ons at the end of each session.
// Weighted strength gets CNS priority, skills come AFTER.
//
// Transition to Intermediate when:
//   8+ pull-ups, 12+ dips, 45s wall handstand, 10s tuck L-sit, 10 skin the cats
// =============================================================================

import {
  ExerciseRole,
  Mesocycle,
  PlannedExercise,
  Schedule,
  UserProgression,
} from "../../types";
import { PROGRESSIONS, getProgressionTree } from "../../data/progressions";
import { generateStreetLifterBeginner } from "./streetLifterBeginner";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Get L-sit progression ID — use core_06 if user is at that level, else current core */
function getLsitId(progressions: UserProgression[]): string {
  const activeCoreP = progressions.find(p => {
    const prog = PROGRESSIONS.find(pr => pr.id === p.progressionId);
    return prog?.pattern === "core" && p.status === "active";
  });
  const coreId = activeCoreP?.progressionId || "core_01";

  const tree = getProgressionTree("core");
  const userIdx = tree.findIndex(p => p.id === coreId);
  const lsitIdx = tree.findIndex(p => p.id === "core_06");

  if (lsitIdx >= 0 && userIdx >= lsitIdx) return "core_06";
  return coreId;
}

function getName(id: string): string {
  return PROGRESSIONS.find(p => p.id === id)?.name || id;
}

function makeSkillExercise(
  id: string,
  progressionId: string,
  name: string,
  sets: number,
  reps: number,
  restSeconds: number,
  notes: string,
  holdSeconds?: number,
): PlannedExercise {
  return {
    id,
    progressionId,
    name,
    sets,
    reps,
    restSeconds,
    difficultyIntent: "moderate",
    exerciseRole: "skill",
    notes,
    ...(holdSeconds ? { holdSeconds } : {}),
  };
}

// ── Main Generator ──────────────────────────────────────────────────────────

export function generateHybridAthleteBeginner(
  userId: string,
  schedule: Schedule,
  progressions: UserProgression[],
): Mesocycle {
  // Generate the Street Lifter base mesocycle
  const base = generateStreetLifterBeginner(userId, schedule, progressions);

  const lsitId = getLsitId(progressions);
  const lsitName = getName(lsitId);
  const lsitProg = PROGRESSIONS.find(p => p.id === lsitId);
  const lsitReps = lsitProg?.isIsometric ? 15 : (lsitProg?.targetReps || 15);

  // Walk through every session and add skill bolt-ons
  for (const week of base.weeks) {
    const isDeload = week.phase === "deload";

    for (const session of week.sessions) {
      const prefix = session.id;
      const isPullSession = session.label.includes("Pull");

      // Update label to reflect hybrid nature
      if (session.label.includes("Pull")) {
        session.label = "Hybrid Pull (A)";
      } else if (session.label.includes("Push")) {
        session.label = "Hybrid Push (B)";
      } else if (session.label.includes("Legs")) {
        session.label = "Hybrid Full Body (C)";
      }

      // Bolt-on 1: L-sit on every session
      const nextIdx = session.exercises.length;
      session.exercises.push(
        makeSkillExercise(
          `${prefix}_skill${nextIdx}`,
          lsitId,
          lsitName,
          isDeload ? 2 : 3,
          isDeload ? 10 : lsitReps,
          90,
          "Accumulate total hold time. Hip flexor cramping is normal.",
          isDeload ? 10 : lsitReps,
        ),
      );

      // Bolt-on 2: Skin the Cat on pull sessions only
      if (isPullSession) {
        const stcIdx = session.exercises.length;
        session.exercises.push(
          makeSkillExercise(
            `${prefix}_skill${stcIdx}`,
            "supplementary_skin_the_cat",
            "Skin the Cat",
            isDeload ? 2 : 3,
            isDeload ? 3 : 5,
            120,
            "Controlled rotation. Start with partial ROM, gradually increase.",
          ),
        );
      }

      // Bolt-on 3: Daily handstand practice reminder
      const hsIdx = session.exercises.length;
      session.exercises.push(
        makeSkillExercise(
          `${prefix}_skill${hsIdx}`,
          "skill_daily_handstand",
          "Wall Handstand Practice (Daily)",
          4,
          45,
          60,
          "Do this every day, not just training days. Chest-to-wall, focus on alignment.",
          45,
        ),
      );
    }
  }

  // Override metadata to Hybrid Athlete
  return {
    ...base,
    id: `meso_hyb_beg_${Date.now()}`,
    programPath: "hybrid_athlete",
    tier: "beginner",
  };
}
