// =============================================================================
// ARNOLD — Accessory & Supplementary Exercises
// Exercises not in the progression trees, used by plan generators
// =============================================================================

import { ExerciseRole } from "../../types";

export interface AccessoryExercise {
  id: string;
  name: string;
  pattern: "pull" | "push" | "legs" | "core" | "general";
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  isIsometric: boolean;
  cues: string[];
  role: ExerciseRole;
  priority: "high" | "medium" | "low";
}

export const ACCESSORIES: AccessoryExercise[] = [
  // ── Pull Accessories ──
  {
    id: "acc_face_pulls",
    name: "Face Pulls (Band)",
    pattern: "pull",
    defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60,
    isIsometric: false,
    cues: ["Pull band to face level", "Squeeze shoulder blades", "Elbows high"],
    role: "accessory", priority: "high",
  },
  {
    id: "acc_band_external_rotation",
    name: "Band External Rotations",
    pattern: "pull",
    defaultSets: 2, defaultReps: 15, defaultRestSeconds: 45,
    isIsometric: false,
    cues: ["Elbow pinned to side", "Rotate outward against band", "Slow and controlled"],
    role: "accessory", priority: "high",
  },
  {
    id: "acc_bicep_curls",
    name: "Bicep Curls",
    pattern: "pull",
    defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60,
    isIsometric: false,
    cues: ["Full range of motion", "Control the negative", "No swinging"],
    role: "accessory", priority: "medium",
  },
  {
    id: "acc_rows",
    name: "Rows (Band or Inverted)",
    pattern: "pull",
    defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90,
    isIsometric: false,
    cues: ["Squeeze shoulder blades", "Pull to chest", "Controlled descent"],
    role: "volume", priority: "medium",
  },

  // ── Push Accessories ──
  {
    id: "acc_tricep_extensions",
    name: "Tricep Extensions",
    pattern: "push",
    defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60,
    isIsometric: false,
    cues: ["Lock elbows in place", "Full extension", "Control the negative"],
    role: "accessory", priority: "medium",
  },
  {
    id: "acc_lateral_raises",
    name: "Lateral Raises",
    pattern: "push",
    defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60,
    isIsometric: false,
    cues: ["Slight bend in elbows", "Raise to shoulder height", "Control the descent"],
    role: "accessory", priority: "medium",
  },
  {
    id: "acc_weighted_pushups",
    name: "Weighted Push-ups",
    pattern: "push",
    defaultSets: 3, defaultReps: 10, defaultRestSeconds: 60,
    isIsometric: false,
    cues: ["Plate on upper back", "Full range of motion", "Core tight"],
    role: "volume", priority: "medium",
  },

  // ── Leg Accessories ──
  {
    id: "acc_lunges",
    name: "Lunges",
    pattern: "legs",
    defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90,
    isIsometric: false,
    cues: ["Back knee to floor", "Upright torso", "Drive through front heel"],
    role: "volume", priority: "medium",
  },
  {
    id: "acc_calf_raises",
    name: "Calf Raises",
    pattern: "legs",
    defaultSets: 2, defaultReps: 18, defaultRestSeconds: 45,
    isIsometric: false,
    cues: ["Full range — heel below platform", "Pause at top", "Control the negative"],
    role: "accessory", priority: "low",
  },
  {
    id: "acc_rdl",
    name: "Romanian Deadlift",
    pattern: "legs",
    defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90,
    isIsometric: false,
    cues: ["Hinge at hips", "Slight knee bend", "Feel hamstring stretch"],
    role: "accessory", priority: "high",
  },
  {
    id: "acc_nordic_curls",
    name: "Nordic Curls",
    pattern: "legs",
    defaultSets: 3, defaultReps: 5, defaultRestSeconds: 90,
    isIsometric: false,
    cues: ["Control the descent", "Use hands to push back up if needed", "Keep hips extended"],
    role: "accessory", priority: "medium",
  },

  // ── Core Accessories ──
  {
    id: "acc_dead_hang_weighted",
    name: "Dead Hang (Weighted)",
    pattern: "core",
    defaultSets: 2, defaultReps: 30, defaultRestSeconds: 60,
    isIsometric: true,
    cues: ["Relax shoulders", "Full dead hang", "Decompress spine"],
    role: "accessory", priority: "medium",
  },
];

/** Find an accessory by ID */
export function getAccessory(id: string): AccessoryExercise | undefined {
  return ACCESSORIES.find(a => a.id === id);
}

/** Get accessories for a pattern */
export function getAccessoriesForPattern(pattern: string): AccessoryExercise[] {
  return ACCESSORIES.filter(a => a.pattern === pattern);
}
