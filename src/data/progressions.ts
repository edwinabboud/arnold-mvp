import { ProgressionLevel } from "../types";

// =============================================================================
// Calisthenics Progression Trees (Section 6 of spec)
// =============================================================================

export const PROGRESSIONS: ProgressionLevel[] = [
  // ── PULL ──────────────────────────────────────────────────────────────────
  { id: "pull_01", pattern: "pull", name: "Australian Rows", order: 0, prerequisites: [], cues: ["Straight body line", "Pull chest to bar", "Squeeze shoulder blades"], targetSets: 3, targetReps: 12, isIsometric: false },
  { id: "pull_02", pattern: "pull", name: "Negative Pull-ups", order: 1, prerequisites: ["pull_01"], cues: ["5-second descent", "Full range of motion", "Control the lowering"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "pull_03", pattern: "pull", name: "Band-Assisted Pull-ups", order: 2, prerequisites: ["pull_02"], cues: ["Dead hang start", "Chin over bar", "No kipping"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "pull_04", pattern: "pull", name: "Full Pull-ups", order: 3, prerequisites: ["pull_03"], cues: ["Dead hang start", "Chin over bar", "Controlled descent"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "pull_05", pattern: "pull", name: "Chest-to-Bar Pull-ups", order: 4, prerequisites: ["pull_04"], cues: ["Pull higher", "Touch chest to bar", "Elbows back"], targetSets: 3, targetReps: 6, isIsometric: false },
  { id: "pull_06", pattern: "pull", name: "Archer Pull-ups", order: 5, prerequisites: ["pull_05"], cues: ["One arm pulls, one assists", "Full extension on assist arm", "Alternate sides"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "pull_07", pattern: "pull", name: "L-Sit Pull-ups", order: 6, prerequisites: ["pull_05", "core_04"], cues: ["Hold L-sit throughout", "No swinging", "Legs parallel to ground"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "pull_08", pattern: "pull", name: "Weighted Pull-ups", order: 7, prerequisites: ["pull_05"], cues: ["Add weight progressively", "Same form as bodyweight", "No momentum"], targetSets: 4, targetReps: 5, isIsometric: false },
  { id: "pull_09", pattern: "pull", name: "Muscle-up Transition Drills", order: 8, prerequisites: ["pull_05"], cues: ["Explosive pull", "Lean over the bar", "Smooth transition"], targetSets: 3, targetReps: 3, isIsometric: false },

  // ── PUSH ──────────────────────────────────────────────────────────────────
  { id: "push_01", pattern: "push", name: "Wall Push-ups", order: 0, prerequisites: [], cues: ["Straight body", "Full range of motion", "Elbows at 45°"], targetSets: 3, targetReps: 15, isIsometric: false },
  { id: "push_02", pattern: "push", name: "Incline Push-ups", order: 1, prerequisites: ["push_01"], cues: ["Lower the surface gradually", "Full lockout", "Core tight"], targetSets: 3, targetReps: 12, isIsometric: false },
  { id: "push_03", pattern: "push", name: "Full Push-ups", order: 2, prerequisites: ["push_02"], cues: ["Chest to floor", "Full lockout", "No sagging hips"], targetSets: 3, targetReps: 10, isIsometric: false },
  { id: "push_04", pattern: "push", name: "Diamond Push-ups", order: 3, prerequisites: ["push_03"], cues: ["Hands together", "Elbows close to body", "Full range"], targetSets: 3, targetReps: 10, isIsometric: false },
  { id: "push_05", pattern: "push", name: "Archer Push-ups", order: 4, prerequisites: ["push_03"], cues: ["One arm pushes, one slides out", "Full depth", "Alternate sides"], targetSets: 3, targetReps: 6, isIsometric: false },
  { id: "push_06", pattern: "push", name: "Pseudo Planche Push-ups", order: 5, prerequisites: ["push_04"], cues: ["Hands by hips", "Lean forward", "Protract shoulders at top"], targetSets: 3, targetReps: 6, isIsometric: false },
  { id: "push_07", pattern: "push", name: "Dips", order: 6, prerequisites: ["push_04"], cues: ["Shoulders below elbows", "Full lockout", "Slight forward lean"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "push_08", pattern: "push", name: "Ring Dips", order: 7, prerequisites: ["push_07"], cues: ["Stabilize rings", "Turn rings out at top", "Controlled descent"], targetSets: 3, targetReps: 6, isIsometric: false },
  { id: "push_09", pattern: "push", name: "Handstand Push-up Progression", order: 8, prerequisites: ["push_07", "skill_03"], cues: ["Wall supported to start", "Head to floor", "Press to lockout"], targetSets: 3, targetReps: 3, isIsometric: false },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  { id: "legs_01", pattern: "legs", name: "Bodyweight Squats", order: 0, prerequisites: [], cues: ["Below parallel", "Knees track toes", "Weight in heels"], targetSets: 3, targetReps: 15, isIsometric: false },
  { id: "legs_02", pattern: "legs", name: "Split Squats", order: 1, prerequisites: ["legs_01"], cues: ["Back knee to floor", "Upright torso", "Even weight distribution"], targetSets: 3, targetReps: 10, isIsometric: false },
  { id: "legs_03", pattern: "legs", name: "Bulgarian Split Squats", order: 2, prerequisites: ["legs_02"], cues: ["Rear foot elevated", "Full depth", "Control the eccentric"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "legs_04", pattern: "legs", name: "Pistol Squat Negatives", order: 3, prerequisites: ["legs_03"], cues: ["5-second descent", "Leg extended forward", "Use support if needed"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "legs_05", pattern: "legs", name: "Assisted Pistol Squats", order: 4, prerequisites: ["legs_04"], cues: ["Hold support for balance", "Full range", "Drive through heel"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "legs_06", pattern: "legs", name: "Full Pistol Squats", order: 5, prerequisites: ["legs_05"], cues: ["No support", "Full depth", "Stand without wobble"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "legs_07", pattern: "legs", name: "Weighted Pistol Squats", order: 6, prerequisites: ["legs_06"], cues: ["Hold weight at chest", "Same depth as bodyweight", "Controlled"], targetSets: 3, targetReps: 3, isIsometric: false },
  { id: "legs_08", pattern: "legs", name: "Shrimp Squats", order: 7, prerequisites: ["legs_06"], cues: ["Grab rear foot", "Knee to floor", "Upright torso"], targetSets: 3, targetReps: 5, isIsometric: false },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { id: "core_01", pattern: "core", name: "Dead Bugs", order: 0, prerequisites: [], cues: ["Lower back pressed to floor", "Opposite arm/leg extend", "Slow and controlled"], targetSets: 3, targetReps: 12, isIsometric: false },
  { id: "core_02", pattern: "core", name: "Hollow Body Hold", order: 1, prerequisites: ["core_01"], cues: ["Lower back flat", "Arms overhead", "Squeeze everything"], targetSets: 3, targetReps: 30, isIsometric: true },
  { id: "core_03", pattern: "core", name: "Hanging Knee Raises", order: 2, prerequisites: ["core_02", "pull_04"], cues: ["No swinging", "Curl pelvis up", "Controlled descent"], targetSets: 3, targetReps: 10, isIsometric: false },
  { id: "core_04", pattern: "core", name: "Hanging Leg Raises", order: 3, prerequisites: ["core_03"], cues: ["Straight legs", "Toes to bar height", "No momentum"], targetSets: 3, targetReps: 8, isIsometric: false },
  { id: "core_05", pattern: "core", name: "Toes to Bar", order: 4, prerequisites: ["core_04"], cues: ["Touch toes to bar", "Controlled negative", "No kipping"], targetSets: 3, targetReps: 6, isIsometric: false },
  { id: "core_06", pattern: "core", name: "L-Sit Progression", order: 5, prerequisites: ["core_04"], cues: ["Locked elbows", "Legs parallel to ground", "Depress shoulders"], targetSets: 3, targetReps: 20, isIsometric: true },
  { id: "core_07", pattern: "core", name: "Dragon Flag Negatives", order: 6, prerequisites: ["core_05"], cues: ["Straight body line", "5-second descent", "Only shoulders on bench"], targetSets: 3, targetReps: 5, isIsometric: false },
  { id: "core_08", pattern: "core", name: "Full Dragon Flags", order: 7, prerequisites: ["core_07"], cues: ["Raise and lower with control", "No bending at hips", "Full range"], targetSets: 3, targetReps: 3, isIsometric: false },
  { id: "core_09", pattern: "core", name: "Front Lever Progression", order: 8, prerequisites: ["core_08", "pull_06"], cues: ["Tuck to advance", "Straight body line", "Depress and retract scapula"], targetSets: 3, targetReps: 15, isIsometric: true },

  // ── SKILLS ────────────────────────────────────────────────────────────────
  { id: "skill_01", pattern: "skill", name: "Crow Pose", order: 0, prerequisites: [], cues: ["Knees on triceps", "Lean forward", "Round upper back"], targetSets: 3, targetReps: 15, isIsometric: true },
  { id: "skill_02", pattern: "skill", name: "Frogstand", order: 1, prerequisites: ["skill_01"], cues: ["Hands shoulder width", "Knees inside elbows", "Hold balance"], targetSets: 3, targetReps: 20, isIsometric: true },
  { id: "skill_03", pattern: "skill", name: "Wall Handstand", order: 2, prerequisites: ["skill_02", "push_04"], cues: ["Chest to wall", "Straight line", "Push through shoulders"], targetSets: 3, targetReps: 30, isIsometric: true },
  { id: "skill_04", pattern: "skill", name: "Free Handstand", order: 3, prerequisites: ["skill_03"], cues: ["Balance through fingers", "Tight core", "Breathe"], targetSets: 5, targetReps: 15, isIsometric: true },
  { id: "skill_05", pattern: "skill", name: "Handstand Walk", order: 4, prerequisites: ["skill_04"], cues: ["Shift weight side to side", "Small steps", "Eyes between hands"], targetSets: 3, targetReps: 10, isIsometric: false },
  { id: "skill_06", pattern: "skill", name: "Planche Lean", order: 5, prerequisites: ["push_06"], cues: ["Lean forward on hands", "Protracted shoulders", "Straight arms"], targetSets: 3, targetReps: 20, isIsometric: true },
  { id: "skill_07", pattern: "skill", name: "Tuck Planche", order: 6, prerequisites: ["skill_06"], cues: ["Tuck knees to chest", "Round upper back", "Push floor away"], targetSets: 3, targetReps: 10, isIsometric: true },
  { id: "skill_08", pattern: "skill", name: "Advanced Tuck Planche", order: 7, prerequisites: ["skill_07"], cues: ["Open hip angle", "Back parallel to ground", "Straight arms"], targetSets: 3, targetReps: 8, isIsometric: true },
  { id: "skill_09", pattern: "skill", name: "Full Planche", order: 8, prerequisites: ["skill_08"], cues: ["Straight body", "Parallel to ground", "Insane shoulder strength"], targetSets: 3, targetReps: 5, isIsometric: true },
];

/** Helper: get the full tree for a movement pattern */
export function getProgressionTree(pattern: string): ProgressionLevel[] {
  return PROGRESSIONS.filter((p) => p.pattern === pattern).sort(
    (a, b) => a.order - b.order
  );
}

/** Helper: get the next progression in a tree */
export function getNextProgression(
  currentId: string
): ProgressionLevel | null {
  const current = PROGRESSIONS.find((p) => p.id === currentId);
  if (!current) return null;
  const tree = getProgressionTree(current.pattern);
  const idx = tree.findIndex((p) => p.id === currentId);
  return idx < tree.length - 1 ? tree[idx + 1] : null;
}

/** Helper: get the previous progression in a tree */
export function getPreviousProgression(
  currentId: string
): ProgressionLevel | null {
  const current = PROGRESSIONS.find((p) => p.id === currentId);
  if (!current) return null;
  const tree = getProgressionTree(current.pattern);
  const idx = tree.findIndex((p) => p.id === currentId);
  return idx > 0 ? tree[idx - 1] : null;
}

// ── Goal metadata ───────────────────────────────────────────────────────────

export const PATH_META: Record<
  string,
  { label: string; emoji: string; description: string; color: string; available: boolean }
> = {
  street_lifter: {
    label: "Street Lifter",
    emoji: "🏋️",
    description:
      "Weighted pull-ups, dips, and squats. Strength sport periodization with progressive overload.",
    color: "#E63946",
    available: true,
  },
  skill_builder: {
    label: "Skill Builder",
    emoji: "🤸",
    description:
      "Master muscle-ups, handstands, planche, and front lever. Technique-first with supporting strength.",
    color: "#2A9D8F",
    available: true,
  },
  hybrid_athlete: {
    label: "Hybrid Athlete",
    emoji: "⚡",
    description:
      "Build weighted strength AND unlock advanced skills. The best of both worlds.",
    color: "#F5A623",
    available: true,
  },
  endurance: {
    label: "Endurance",
    emoji: "🔥",
    description:
      "High-rep circuits, AMRAP, EMOM. Build conditioning and muscular endurance.",
    color: "#F77F00",
    available: false, // Coming soon — no program bible yet
  },
};
