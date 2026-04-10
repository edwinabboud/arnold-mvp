// =============================================================================
// ARNOLD — Level Mapping Engine
// Takes user self-reported exercise abilities and outputs UserProgression[].
// Used by "I Know My Level" onboarding path to replace createBeginnerProgressions().
// =============================================================================

import { UserProgression, MovementPattern } from "../types";
import { getProgressionTree } from "../data/progressions";

// ── Level Options ──────────────────────────────────────────────────────────
// Each option is what the user sees. `mapsTo` is the progression ID they start at.

export interface LevelOption {
  id: string;
  label: string;           // What the user sees
  description: string;     // Short context
  mapsTo: string;          // Progression ID — becomes "active"
}

export interface PatternQuestion {
  pattern: MovementPattern;
  question: string;         // What Arnold asks
  options: LevelOption[];
}

export const LEVEL_QUESTIONS: PatternQuestion[] = [
  {
    pattern: "pull",
    question: "What's your pulling strength?",
    options: [
      {
        id: "pull_none",
        label: "Can't do pull-ups yet",
        description: "Rows and negatives are where you're at",
        mapsTo: "pull_01",
      },
      {
        id: "pull_learning",
        label: "Working on pull-ups (1-4 reps)",
        description: "Getting there but not consistent yet",
        mapsTo: "pull_03",
      },
      {
        id: "pull_solid",
        label: "Solid pull-ups (5-8 strict)",
        description: "Clean reps, full range, no kipping",
        mapsTo: "pull_04",
      },
      {
        id: "pull_strong",
        label: "Strong pull-ups (8+ strict)",
        description: "Pull-ups are easy, ready for more",
        mapsTo: "pull_05",
      },
      {
        id: "pull_advanced",
        label: "Advanced (weighted / archer / muscle-up)",
        description: "You know what you're doing",
        mapsTo: "pull_06",
      },
    ],
  },
  {
    pattern: "push",
    question: "What's your pushing strength?",
    options: [
      {
        id: "push_none",
        label: "Can't do full push-ups yet",
        description: "Wall or incline push-ups",
        mapsTo: "push_01",
      },
      {
        id: "push_basic",
        label: "Full push-ups (5-10 reps)",
        description: "Chest to floor, full lockout",
        mapsTo: "push_03",
      },
      {
        id: "push_intermediate",
        label: "Diamond / archer push-ups",
        description: "Beyond basics, working on harder variations",
        mapsTo: "push_04",
      },
      {
        id: "push_dips",
        label: "Dips (5+ clean reps)",
        description: "Parallel bar dips with good form",
        mapsTo: "push_07",
      },
      {
        id: "push_advanced",
        label: "Ring dips / weighted dips / HSPU",
        description: "Advanced pushing strength",
        mapsTo: "push_08",
      },
    ],
  },
  {
    pattern: "legs",
    question: "What's your leg strength?",
    options: [
      {
        id: "legs_none",
        label: "Bodyweight squats",
        description: "Starting with the basics",
        mapsTo: "legs_01",
      },
      {
        id: "legs_split",
        label: "Split / Bulgarian split squats",
        description: "Single-leg work with support",
        mapsTo: "legs_03",
      },
      {
        id: "legs_pistol_work",
        label: "Working on pistol squats",
        description: "Negatives or assisted pistols",
        mapsTo: "legs_04",
      },
      {
        id: "legs_pistol",
        label: "Full pistol squats",
        description: "Clean, no support, full depth",
        mapsTo: "legs_06",
      },
    ],
  },
  {
    pattern: "core",
    question: "What's your core strength?",
    options: [
      {
        id: "core_basic",
        label: "Basics (planks, dead bugs)",
        description: "Building a foundation",
        mapsTo: "core_01",
      },
      {
        id: "core_hollow",
        label: "Hollow body hold (30s+)",
        description: "Solid static hold",
        mapsTo: "core_02",
      },
      {
        id: "core_hanging",
        label: "Hanging leg raises",
        description: "Straight legs, controlled",
        mapsTo: "core_04",
      },
      {
        id: "core_advanced",
        label: "Toes to bar / L-sit / dragon flags",
        description: "Advanced core strength",
        mapsTo: "core_05",
      },
    ],
  },
  {
    pattern: "skill",
    question: "Where are you with skills?",
    options: [
      {
        id: "skill_none",
        label: "No handstand or balance work",
        description: "Starting from scratch",
        mapsTo: "skill_01",
      },
      {
        id: "skill_wall",
        label: "Wall handstand (30s+ hold)",
        description: "Comfortable upside down against a wall",
        mapsTo: "skill_03",
      },
      {
        id: "skill_free",
        label: "Free handstand (5s+)",
        description: "Can balance without the wall",
        mapsTo: "skill_04",
      },
      {
        id: "skill_planche",
        label: "Planche / advanced balance work",
        description: "Working on planche leans or tuck planche",
        mapsTo: "skill_06",
      },
    ],
  },
];

// ── Mapping Function ───────────────────────────────────────────────────────

/**
 * Takes a map of { pattern: selectedOptionId } and produces UserProgression[].
 * Everything below the selected level = "mastered"
 * The selected level = "active"
 * Everything above = "locked"
 */
export function createProgressionsFromLevel(
  selections: Record<MovementPattern, string>  // pattern → optionId
): UserProgression[] {
  const progressions: UserProgression[] = [];

  for (const question of LEVEL_QUESTIONS) {
    const selectedOptionId = selections[question.pattern];
    const selectedOption = question.options.find(o => o.id === selectedOptionId);

    // Default to first option (beginner) if selection not found
    const targetProgressionId = selectedOption?.mapsTo || question.options[0].mapsTo;

    const tree = getProgressionTree(question.pattern);
    const targetIndex = tree.findIndex(p => p.id === targetProgressionId);

    for (let i = 0; i < tree.length; i++) {
      let status: "mastered" | "active" | "locked";

      if (i < targetIndex) {
        status = "mastered";
      } else if (i === targetIndex) {
        status = "active";
      } else {
        status = "locked";
      }

      progressions.push({
        progressionId: tree[i].id,
        status,
        consecutiveSuccesses: 0,
      });
    }
  }

  return progressions;
}
