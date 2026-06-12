

// =============================================================================
// ARNOLD — Guided Onboarding (Steps 0-9)
// Replaces chat-based onboarding with clean guided screens matching prototype.
// Steps 0-2: Splash + About You + Goals implemented first.
// =============================================================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../theme";
import ArnoldWaveform from "../../components/waveform/ArnoldWaveform";
import { useStore } from "../../store/useStore";
import { createBeginnerProgressions } from "../../engine/beginnerProgressions";
import { initializeProgressionsFromBenchmarks } from "../../engine/benchmarkProgressions";
import { generateStreetLifterBeginner } from "../../engine/generators/streetLifterBeginner";
import { generateSkillBuilderBeginner } from "../../engine/generators/skillBuilderBeginner";
import { generateHybridAthleteBeginner } from "../../engine/generators/hybridAthleteBeginner";
import { generateStreetLifterIntermediate } from "../../engine/generators/streetLifterIntermediate";
import { generateSkillBuilderIntermediate } from "../../engine/generators/skillBuilderIntermediate";
import { generateHybridAthleteIntermediate } from "../../engine/generators/hybridAthleteIntermediate";
import BenchmarkInput from "./BenchmarkInput";
import { assignTier } from "../../engine/tierAssignment";
import {
  captureOnboardingStarted,
  capturePathSelected,
  captureScheduleSet,
  captureSessionLengthSelected,
  captureAssessmentCompleted,
  capturePlanGenerated,
} from "../../services/analytics";
import type { UserBenchmarks } from "../../types";
import { isDevUser, DEV_PREFILL } from "../../config/devAccess";
import DisclaimerModal, { hasAcknowledgedDisclaimer } from "../../components/DisclaimerModal";

// ── Types ───────────────────────────────────────────────────────────────────

interface ProgramPathCard {
  id: string;
  label: string;
  desc: string;
  color: string;
  icon: string;
  info: string;
  available: boolean;
}

// ── Program Paths ──────────────────────────────────────────────────────────

const PROGRAM_PATHS: ProgramPathCard[] = [
  {
    id: "street_lifter",
    label: "Street Lifter",
    desc: "Weighted pull-ups, dips, squats — get strong",
    color: "#E63946",
    icon: "🏋️",
    info: "A strength program built around weighted calisthenics. Progressive overload with dip belts and weighted vests. Periodized intensity waves with PR attempts. Think powerlifting meets the pull-up bar.",
    available: true,
  },
  {
    id: "skill_builder",
    label: "Skill Builder",
    desc: "Muscle-ups, handstands, planche, levers",
    color: "#2A9D8F",
    icon: "🤸",
    info: "Technique-first training for advanced calisthenics movements. Dedicated skill practice when the CNS is fresh, followed by supporting strength work. Never train skills to failure.",
    available: true,
  },
  {
    id: "hybrid_athlete",
    label: "Hybrid Athlete",
    desc: "Weighted strength + advanced skills combined",
    color: "#F5A623",
    icon: "⚡",
    info: "The best of both worlds. Weighted pull-ups fuel your front lever. Weighted dips fuel your planche. Designed so strength and skills feed each other, not compete.",
    available: true,
  },
  {
    id: "endurance",
    label: "Endurance",
    desc: "High-rep circuits, AMRAP, conditioning",
    color: "#F77F00",
    icon: "🔥",
    info: "Circuits, AMRAP rounds, EMOM, and timed sets. Build muscular endurance and cardiovascular conditioning through calisthenics.",
    available: false, // Coming soon
  },
];

// ── Constants ───────────────────────────────────────────────────────────────

const SPLIT_OPTIONS = [
  { id: "ppl", label: "Push / Pull / Legs", sub: "Best for 4–6 days" },
  { id: "ul", label: "Upper / Lower", sub: "Best for 3–4 days" },
  { id: "fb", label: "Full Body", sub: "Best for 2–3 days" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const PATH_TARGETS: Record<string, string[]> = {
  street_lifter: [
    "+50% BW weighted pull-ups",
    "+60% BW weighted dips",
    "2x BW barbell squat",
    "100kg+ total weighted pull",
    "Compete in streetlifting",
    "20 strict pull-ups",
  ],
  skill_builder: [
    "30s free handstand",
    "Full front lever hold",
    "Tuck planche (5s)",
    "First clean muscle-up",
    "Back lever hold",
    "10s L-sit on floor",
  ],
  hybrid_athlete: [
    "+40% BW pull-ups AND front lever",
    "Handstand + heavy dips in same session",
    "Muscle-up with added weight",
    "Planche lean + 30% BW dips",
    "Full front lever + 50% BW pull",
    "30s handstand + heavy squats",
  ],
  endurance: [
    "50 push-ups unbroken",
    "20 pull-ups unbroken",
    "100 squats in 5 min",
    "30 dips unbroken",
    "5 min plank hold",
    "10 round circuit under 20 min",
  ],
};

// ── Reusable Components ─────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              width: i === current ? 16 : 5,
              backgroundColor: i <= current ? colors.accent : "rgba(255,255,255,0.05)",
            },
          ]}
        />
      ))}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ 
  label, 
  onPress, 
  disabled = false 
}: { 
  label: string; 
  onPress: () => void; 
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ConversationalOnboarding({ navigation }: any) {
  // Store hooks
  const {
    setProfile,
    setRankedGoals: storeSetRankedGoals,
    setSchedule,
    addTarget,
    completeOnboarding,
    setUserProgressions,
    setActiveMesocycle,
  } = useStore();

  // Step state (0-9, implementing 0-2 first)
  const [step, setStep] = useState(0);
  
  // Step 1 - About You
  const [useMetric, setUseMetric] = useState(true);
  const [userWeight, setUserWeight] = useState((__DEV__ || isDevUser()) && DEV_PREFILL ? "70" : "");
  const [userHeight, setUserHeight] = useState((__DEV__ || isDevUser()) && DEV_PREFILL ? "170" : "");
  
  // Step 2 - Program Path Selection
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPathInfo, setExpandedPathInfo] = useState<string | null>(null);

  // Keep for backward compat during migration (some handlers still reference these)
  const selectedGoals: string[] = selectedPath ? [selectedPath] : [];
  const rankedGoals: string[] = selectedPath ? [selectedPath] : [];
  const [trainingDays, setTrainingDays] = useState(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedSplit, setSelectedSplit] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  // v2.4.9 Part 1 — session-length picked in step 5. The user must select one
  // of the three options to advance; `standard` is just the initial-render
  // value before a tap (no Skip path exists anymore).
  const [sessionTier, setSessionTier] =
    useState<"compact" | "standard" | "recommended">("standard");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [collectedBenchmarks, setCollectedBenchmarks] = useState<UserBenchmarks | null>(null);
  const [collectedExperienceLevel, setCollectedExperienceLevel] = useState<"new" | "experienced" | null>(null);

  // Disclaimer modal — blocking, once-per-device gate before plan generation
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{
    exp: "new" | "experienced";
    bm: UserBenchmarks;
  } | null>(null);

  // Animation
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Navigation helpers
  const goToStep = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const goBack = () => {
    if (step > 0) {
      if (step === 4) {
        goToStep(2); // From schedule, go back to path selection
      } else if (step === 8) {
        goToStep(5); // Step 5 hosts the v2.4.9 session-length picker
      } else {
        goToStep(step - 1);
      }
    }
  };

  // Step 2 - Select program path (one tap)
  const handlePathTap = (pathId: string) => {
    const path = PROGRAM_PATHS.find(p => p.id === pathId);
    if (!path?.available) return;
    setSelectedPath(pathId);
    capturePathSelected({ path: pathId as any });
    goToStep(4); // Go straight to schedule, no follow-up
  };

  // Step 4 - Training days handler
  const handleTrainingDaysSelect = (days: number) => {
    setTrainingDays(days);
    captureScheduleSet({ days_per_week: days });
    // Auto-assign evenly spread days, skip day picker
    const autoSpread: Record<number, number[]> = {
      2: [1, 4],          // Mon, Thu
      3: [1, 3, 5],       // Mon, Wed, Fri
      4: [1, 2, 4, 5],    // Mon, Tue, Thu, Fri
      5: [1, 2, 3, 4, 5], // Mon-Fri
    };
    setSelectedDays(autoSpread[days] || [1, 3, 5]);
    goToStep(5); // v2.4.9 Part 1 — step 5 now hosts the session-length picker
  };

  // Step 5 - Session length pick (v2.4.9 Part 1). Tier is stored only —
  // Part 2 will materialise the cuts.
  const handleSessionTierSelect = (tier: "compact" | "standard" | "recommended") => {
    setSessionTier(tier);
    captureSessionLengthSelected({ session_tier: tier });
    goToStep(8);
  };

  // Step 5 - Day selection handlers
  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else if (prev.length < trainingDays) {
        return [...prev, dayIndex];
      }
      return prev;
    });
  };

  // Step 6 - Split selection handler
  const handleSplitSelect = (splitId: string) => {
    setSelectedSplit(splitId);
    goToStep(7);
  };

  // Step 7 - Duration selection handler
  const handleDurationSelect = (minutes: number) => {
    setSessionDuration(minutes);
    goToStep(8);
  };

  // Step 8 - Target handlers
  const handleTargetAdd = (target: string) => {
    setSelectedTargets(prev => [...prev, target]);
  };

  const handleTargetRemove = (target: string) => {
    setSelectedTargets(prev => prev.filter(t => t !== target));
  };

  // Disclaimer gate — runs before plan generation. If this device hasn't yet
  // acknowledged the disclaimer, stash the completion args and show the blocking
  // modal; otherwise proceed straight to plan generation as before.
  const gateAndComplete = async (exp: "new" | "experienced", bm: UserBenchmarks) => {
    const acknowledged = await hasAcknowledgedDisclaimer();
    if (acknowledged) {
      handleComplete(exp, bm);
    } else {
      setPendingCompletion({ exp, bm });
      setDisclaimerVisible(true);
    }
  };

  const handleDisclaimerAcknowledge = () => {
    setDisclaimerVisible(false);
    if (pendingCompletion) {
      handleComplete(pendingCompletion.exp, pendingCompletion.bm);
      setPendingCompletion(null);
    }
  };

  // Complete onboarding handler
  const handleComplete = (exp: "new" | "experienced", bm: UserBenchmarks) => {
    if (!selectedPath) return;

    // Fired here (not at BenchmarkInput.onComplete) so we know assessment
    // actually carried through the disclaimer gate into plan generation.
    captureAssessmentCompleted();

    const tier = assignTier(selectedPath as any, bm, exp);

    // Auto-select split based on path and training days
    const autoSplit = trainingDays <= 3 ? "full_body" : trainingDays <= 4 ? "upper_lower" : "push_pull_legs";
    const autoDuration = selectedPath === "endurance" ? 45 : 60;

    // Save profile
    setProfile({
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      displayName: 'Athlete',
      programPath: selectedPath as any,
      tier,
      experienceLevel: exp,
      benchmarks: bm,
      bodyweightKg: bm.bodyweightKg,
      goals: rankedGoals.length > 0
        ? rankedGoals.map((goalId, idx) => ({ goal: goalId as any, rank: idx + 1 }))
        : selectedGoals.map((goalId, idx) => ({ goal: goalId as any, rank: idx + 1 })),
      schedule: {
        daysPerWeek: trainingDays,
        split: autoSplit as any,
        preferredDays: selectedDays,
        sessionDurationMin: autoDuration,
        sessionTier,
      },
      targets: selectedTargets.map((t, idx) => ({
        id: `target_${idx}`,
        description: t,
        metric: 'reps',
        targetValue: 1,
        currentValue: 0,
      })),
      assessmentComplete: true,
      onboardingComplete: true,
    });

    // Save ranked goals
    const goals = rankedGoals.length > 0
      ? rankedGoals.map((goalId, idx) => ({ goal: goalId as any, rank: idx + 1 }))
      : selectedGoals.map((goalId, idx) => ({ goal: goalId as any, rank: idx + 1 }));
    storeSetRankedGoals(goals);

    // Save schedule
    setSchedule({
      daysPerWeek: trainingDays,
      split: autoSplit as any,
      preferredDays: selectedDays,
      sessionDurationMin: autoDuration,
      sessionTier,
    });

    // Save targets
    selectedTargets.forEach((t, idx) => {
      addTarget({
        id: `target_${idx}`,
        description: t,
        metric: 'reps',
        targetValue: 1,
        currentValue: 0,
      });
    });

    // Mark onboarding complete
    completeOnboarding();

    // === PLAN GENERATION ===
    // v2.4.12 Change 1: beginners keep order-0 defaults; intermediate/advanced
    // seed each pattern's active level from their assessed benchmarks.
    const userProgs =
      tier === "beginner"
        ? createBeginnerProgressions()
        : initializeProgressionsFromBenchmarks(selectedPath as any, bm, tier);
    setUserProgressions(userProgs);

    const planSchedule = {
      daysPerWeek: trainingDays,
      split: autoSplit as any,
      preferredDays: selectedDays,
      sessionDurationMin: autoDuration,
      sessionTier,
    };

    // Route to the correct generator based on path + tier
    let mesocycle;
    const userId = `user_${Date.now()}`;

    if (selectedPath === "street_lifter") {
      mesocycle = tier === "beginner"
        ? generateStreetLifterBeginner(userId, planSchedule, userProgs)
        : generateStreetLifterIntermediate(userId, planSchedule, userProgs, bm);
    } else if (selectedPath === "skill_builder") {
      mesocycle = tier === "beginner"
        ? generateSkillBuilderBeginner(userId, planSchedule, userProgs)
        : generateSkillBuilderIntermediate(userId, planSchedule, userProgs, bm);
    } else if (selectedPath === "hybrid_athlete") {
      mesocycle = tier === "beginner"
        ? generateHybridAthleteBeginner(userId, planSchedule, userProgs)
        : generateHybridAthleteIntermediate(userId, planSchedule, userProgs, bm);
    } else {
      // v2.4.12 §5: all three program paths have dedicated generators and path
      // selection only offers these three, so this branch is unreachable. Throw
      // explicitly rather than silently building a plan from a removed fallback.
      throw new Error("[ARNOLD] Unknown program path: " + selectedPath);
    }
    setActiveMesocycle(mesocycle);

    // `sessionTier` is the user's onboarding pick (compact|standard|recommended);
    // `tier` here is the experience tier returned by assignTier. Keep them
    // distinct on the wire so a persistence regression on either can be seen.
    capturePlanGenerated({
      path: selectedPath as any,
      experience_tier: tier,
      session_tier: sessionTier ?? null,
    });

    console.log('[ARNOLD] Plan generated:', {
      programPath: mesocycle.programPath,
      tier: mesocycle.tier,
      experienceLevel: exp,
      weeks: mesocycle.weeks.length,
      firstWeekSessions: mesocycle.weeks[0]?.sessions.length,
      firstSessionExercises: mesocycle.weeks[0]?.sessions[0]?.exercises.length,
      firstSessionWarmUp: mesocycle.weeks[0]?.sessions[0]?.warmUpExercises.length,
      firstSessionCooldown: mesocycle.weeks[0]?.sessions[0]?.cooldownExercises.length,
    });
  };

  // Dev skip function
  const skipToHome = () => {
    setProfile({
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      displayName: 'Athlete',
      programPath: 'street_lifter' as any,
      tier: 'beginner' as any,
      experienceLevel: 'new',
      benchmarks: { collectedAt: new Date().toISOString(), source: 'onboarding' },
      goals: [{ goal: 'street_lifter' as any, rank: 1 }],
      schedule: {
        daysPerWeek: 3,
        split: 'full_body',
        preferredDays: [1, 3, 5],
        sessionDurationMin: 60,
        sessionTier: "recommended",
      },
      targets: [],
      assessmentComplete: true,
      onboardingComplete: true,
    });
    completeOnboarding();

    const beginnerProgs = createBeginnerProgressions();
    setUserProgressions(beginnerProgs);

    const mesocycle = generateStreetLifterBeginner(
      `user_${Date.now()}`,
      { daysPerWeek: 3, split: 'full_body' as any, preferredDays: [1, 3, 5], sessionDurationMin: 60, sessionTier: "recommended" as const },
      beginnerProgs,
    );
    setActiveMesocycle(mesocycle);
    console.log('[ARNOLD] Dev skip — plan generated:', mesocycle.weeks.length, 'weeks');
  };

  // ── Render Steps ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // Step 0 - Splash Screen
      case 0:
        return (
          <View style={styles.splashContainer}>
            <ArnoldWaveform speaking={false} size="compact" />
            <Text style={styles.arnoldLabel}>ARNOLD</Text>
            <Text style={styles.splashTitle}>Your AI calisthenics coach</Text>
            <Text style={styles.splashSubtitle}>
              Adaptive training that adjusts every session based on how you perform.
            </Text>
            <PrimaryButton
              label="Get started"
              onPress={() => {
                captureOnboardingStarted();
                goToStep(1);
              }}
            />
            
            {/* Dev skip button — only visible in development builds */}
            {(__DEV__ || isDevUser()) && (
              <TouchableOpacity style={styles.devSkipButton} onPress={skipToHome}>
                <Text style={styles.devSkipText}>Skip to app (dev)</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      // Step 1 - About You
      case 1:
        return (
          <Pressable style={styles.stepContainer} onPress={() => Keyboard.dismiss()}>
            <BackButton onPress={goBack} />
            <StepDots current={1} total={10} />

            <Text style={styles.stepTitle}>About you</Text>
            <Text style={styles.stepSubtitle}>This helps Arnold calibrate your program.</Text>

            {/* Unit toggle */}
            <View style={styles.unitToggleContainer}>
              <View style={styles.unitToggle}>
                {["Metric", "Imperial"].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      (unit === "Metric" ? useMetric : !useMetric) && styles.unitButtonActive,
                    ]}
                    onPress={() => setUseMetric(unit === "Metric")}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        (unit === "Metric" ? useMetric : !useMetric) && styles.unitButtonTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weight input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WEIGHT</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={userWeight}
                  onChangeText={setUserWeight}
                  placeholder={useMetric ? "75" : "165"}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
                />
                <Text style={styles.inputUnit}>{useMetric ? "kg" : "lbs"}</Text>
              </View>
            </View>

            {/* Height input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HEIGHT</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={userHeight}
                  onChangeText={setUserHeight}
                  placeholder={useMetric ? "178" : "70"}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
                />
                <Text style={styles.inputUnit}>{useMetric ? "cm" : "in"}</Text>
              </View>
            </View>

            <View style={styles.spacer} />
            
            {userWeight && userHeight ? (
              <PrimaryButton label="Continue" onPress={() => { Keyboard.dismiss(); goToStep(2); }} />
            ) : (
              <PrimaryButton label="Enter weight and height" onPress={() => {}} disabled />
            )}
          </Pressable>
        );

      // Step 2 - Program Path Selection
      case 2:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={2} total={10} />

            <Text style={styles.stepTitle}>Choose your program</Text>
            <Text style={styles.stepSubtitle}>
              Each path is a complete training program designed by coaches.
            </Text>

            <ScrollView style={styles.goalsScrollView} showsVerticalScrollIndicator={false}>
              {PROGRAM_PATHS.map((path) => {
                const isExpanded = expandedPathInfo === path.id;
                const isLocked = !path.available;

                return (
                  <View key={path.id} style={styles.goalCardContainer}>
                    <TouchableOpacity
                      style={[
                        styles.goalCard,
                        isLocked && { opacity: 0.4 },
                      ]}
                      onPress={() => handlePathTap(path.id)}
                      activeOpacity={isLocked ? 1 : 0.7}
                    >
                      <View style={styles.goalIcon}>
                        <Text style={styles.goalEmoji}>{path.icon}</Text>
                      </View>
                      <View style={styles.goalTextContainer}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.goalTitle, { color: isLocked ? "rgba(255,255,255,0.3)" : "#fff" }]}>
                            {path.label}
                          </Text>
                          {isLocked && (
                            <View style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700" }}>COMING SOON</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.goalDescription}>{path.desc}</Text>
                      </View>
                    </TouchableOpacity>

                    {!isLocked && (
                      <TouchableOpacity
                        style={styles.goalInfoToggle}
                        onPress={() => setExpandedPathInfo(isExpanded ? null : path.id)}
                      >
                        <View style={styles.goalInfoToggleContent}>
                          <Text style={[styles.goalInfoArrow, { transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }]}>↓</Text>
                          <Text style={styles.goalInfoText}>{isExpanded ? "Less" : "What is this?"}</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {isExpanded && (
                      <View style={[styles.goalInfoExpanded, { borderColor: `${path.color}45`, backgroundColor: `${path.color}04` }]}>
                        <Text style={styles.goalInfoExpandedText}>{path.info}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

          </View>
        );

      // Step 3 - REMOVED (was goal ranking, now handled by smart follow-up in step 2)
      case 3:
        goToStep(4);
        return null;

      // Step 4 - Days Per Week
      case 4:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={4} total={10} />
            
            <Text style={styles.stepTitle}>How often can you train?</Text>
            <Text style={styles.stepSubtitle}>Days per week</Text>

            <View style={styles.daysPerWeekContainer}>
              {([
                { days: 2, label: "2", desc: "Push + Pull" },
                { days: 3, label: "3", desc: "Push + Pull + Peak" },
                { days: 4, label: "4", desc: "Full split", recommended: true },
                { days: 5, label: "5", desc: "Volume focus" },
              ] as const).map(opt => (
                <TouchableOpacity
                  key={opt.days}
                  style={[
                    styles.daysPerWeekButton,
                    'recommended' in opt && opt.recommended && styles.daysPerWeekButtonRecommended,
                  ]}
                  onPress={() => handleTrainingDaysSelect(opt.days)}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.daysPerWeekText,
                    'recommended' in opt && opt.recommended && styles.daysPerWeekTextActive,
                  ]}>{opt.label}</Text>
                  <Text style={[
                    styles.daysPerWeekDesc,
                    'recommended' in opt && opt.recommended && styles.daysPerWeekDescActive,
                  ]}>{opt.desc}</Text>
                  {'recommended' in opt && opt.recommended && (
                    <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 5 - Session length (v2.4.9 Part 1). Replaces the dead day-picker —
      // training days are auto-spread in step 4. User must pick one of the
      // three explicit options to advance (no Skip path — ~60 already covers
      // the "I'm not sure" middle).
      case 5:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={5} total={10} />

            <Text style={styles.stepTitle}>Session length</Text>
            <Text style={styles.stepSubtitle}>How much time do you have for a typical session?</Text>

            <View style={styles.sessionTierContainer}>
              <TouchableOpacity
                style={styles.sessionTierButton}
                onPress={() => handleSessionTierSelect("compact")}
              >
                <Text style={styles.sessionTierLabel}>~40 minutes</Text>
                <Text style={styles.sessionTierSub}>Compact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sessionTierButton}
                onPress={() => handleSessionTierSelect("standard")}
              >
                <Text style={styles.sessionTierLabel}>~60 minutes</Text>
                <Text style={styles.sessionTierSub}>Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sessionTierButton}
                onPress={() => handleSessionTierSelect("recommended")}
              >
                <Text style={styles.sessionTierLabel}>~90 minutes</Text>
                <Text style={styles.sessionTierSub}>Recommended</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 6 - Training Split
      case 6:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={6} total={10} />
            
            <Text style={styles.stepTitle}>Training split</Text>
            <Text style={styles.stepSubtitle}>How to structure your sessions</Text>

            <View style={styles.splitOptionsContainer}>
              {SPLIT_OPTIONS.map(split => (
                <TouchableOpacity
                  key={split.id}
                  style={styles.splitOptionButton}
                  onPress={() => handleSplitSelect(split.id)}
                >
                  <Text style={styles.splitOptionLabel}>{split.label}</Text>
                  <Text style={styles.splitOptionSub}>{split.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 7 - Session Duration
      case 7:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={7} total={10} />
            
            <Text style={styles.stepTitle}>Session length</Text>
            <Text style={styles.stepSubtitle}>Minutes per session</Text>

            <View style={styles.sessionDurationContainer}>
              {[30, 45, 60, 75, 90].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.sessionDurationButton}
                  onPress={() => handleDurationSelect(minutes)}
                >
                  <Text style={styles.sessionDurationText}>{minutes}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 8 - Set Your Targets
      case 8:
        return (
          <View style={styles.stepContainer}>
            <BackButton onPress={goBack} />
            <StepDots current={8} total={10} />
            
            <Text style={styles.stepTitle}>Set your targets</Text>
            <Text style={styles.stepSubtitle}>Optional — what do you want to achieve?</Text>

            <ScrollView style={styles.targetsScrollView} showsVerticalScrollIndicator={false}>
              {/* Selected targets */}
              {selectedTargets.map((target) => (
                <View key={target} style={styles.selectedTargetCard}>
                  <Text style={styles.selectedTargetText}>{target}</Text>
                  <TouchableOpacity onPress={() => handleTargetRemove(target)}>
                    <Text style={styles.selectedTargetRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Available targets */}
              <View style={styles.availableTargetsContainer}>
                {(PATH_TARGETS[selectedPath || "hybrid_athlete"] || PATH_TARGETS.hybrid_athlete).filter(t => !selectedTargets.includes(t)).map((target) => (
                  <TouchableOpacity
                    key={target}
                    style={styles.availableTargetChip}
                    onPress={() => handleTargetAdd(target)}
                  >
                    <Text style={styles.availableTargetText}>+ {target}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.targetsButtonsContainer}>
              {selectedTargets.length > 0 && (
                <PrimaryButton
                  label={`Continue with ${selectedTargets.length} target${selectedTargets.length > 1 ? "s" : ""}`}
                  onPress={() => goToStep(9)}
                />
              )}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => goToStep(9)}
              >
                <Text style={styles.secondaryButtonText}>
                  {selectedTargets.length > 0 ? "Skip targets" : "No specific goal — just train me"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 9 - Benchmark Input
      case 9:
        return (
          <BenchmarkInput
            programPath={(selectedPath || "hybrid_athlete") as any}
            onBack={() => goToStep(8)}
            onComplete={({ experienceLevel: exp, benchmarks: bm }) => {
              // Inject bodyweight from earlier onboarding step
              if (!bm.bodyweightKg && userWeight) {
                bm.bodyweightKg = parseFloat(userWeight) || undefined;
              }
              setCollectedExperienceLevel(exp);
              setCollectedBenchmarks(bm);
              gateAndComplete(exp, bm);
            }}
          />
        );

      // Steps 10+ - Placeholders  
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Step {step} — coming soon</Text>
            <TouchableOpacity onPress={() => goToStep(step + 1)}>
              <Text style={styles.placeholderNext}>Next →</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
      <DisclaimerModal
        visible={disclaimerVisible}
        onAcknowledge={handleDisclaimerAcknowledge}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },

  // Step 0 - Splash
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  arnoldLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 4,
    color: `${colors.accent}60`,
    marginTop: 12,
    marginBottom: 6,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 6,
  },
  splashSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 270,
    marginBottom: 32,
  },

  // Step container
  stepContainer: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Back button
  backButton: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 16,
    fontWeight: "600",
  },

  // Step dots
  stepDots: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    marginBottom: 20,
  },
  stepDot: {
    height: 5,
    borderRadius: 3,
  },

  // Step titles
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 24,
  },

  // Unit toggle
  unitToggleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 3,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: `${colors.accent}15`,
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
  },
  unitButtonTextActive: {
    color: colors.accent,
  },

  // Input groups
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.12)",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.2)",
    width: 30,
  },

  // Goal selection
  goalsScrollView: {
    flex: 1,
    marginBottom: 20,
  },
  goalCardContainer: {
    marginBottom: 7,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  goalCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  goalDescription: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    marginTop: 1,
  },
  goalCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCheckmarkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Goal info toggle
  goalInfoToggle: {
    width: "100%",
    paddingHorizontal: 14,
  },
  goalInfoToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
  },
  goalInfoArrow: {
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
  },
  goalInfoText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    fontWeight: "500",
  },

  // Goal expanded info
  goalInfoExpanded: {
    padding: 14,
    paddingTop: 0,
    paddingBottom: 12,
    borderRadius: 14,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.04)",
    borderTopWidth: 0,
    backgroundColor: "rgba(255,255,255,0.01)",
    marginTop: -1,
  },
  goalInfoExpandedText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.bg,
    letterSpacing: -0.3,
  },
  primaryButtonTextDisabled: {
    color: "rgba(255,255,255,0.12)",
  },

  // Dev skip
  devSkipButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
  },
  devSkipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.15)",
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Step 3 - Goal Ranking
  rankingContainer: {
    flex: 1,
    marginBottom: 20,
  },
  rankedGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 5,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.2)",
  },
  rankedGoalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  rankedGoalVolume: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
  },
  rankNextLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.12)",
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 7,
  },
  unrankedGoalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  unrankedGoalChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  unrankedGoalText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },

  // Step 4 - Days Per Week
  daysPerWeekContainer: {
    flexDirection: "column",
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  daysPerWeekButton: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  daysPerWeekButtonRecommended: {
    borderColor: "#F5A623",
    borderWidth: 1.5,
    backgroundColor: "rgba(245,166,35,0.06)",
  },
  recommendedBadge: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#F5A623",
    marginBottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "rgba(245,166,35,0.15)",
    overflow: "hidden",
  },
  daysPerWeekText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 28,
    minWidth: 24,
    textAlign: "center",
  },
  daysPerWeekTextActive: {
    color: "#F5A623",
  },
  daysPerWeekDesc: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.6)",
    textAlign: "left",
    lineHeight: 18,
  },
  daysPerWeekDescActive: {
    color: "rgba(255,255,255,0.9)",
  },

  // Step 5 - Which Days
  daySelectionContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: {
    borderColor: `${colors.accent}40`,
    backgroundColor: `${colors.accent}0A`,
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
  },
  dayButtonTextSelected: {
    color: colors.accent,
  },
  dayButtonTextDisabled: {
    color: "rgba(255,255,255,0.08)",
  },

  // Step 6 - Training Split
  splitOptionsContainer: {
    flex: 1,
    marginTop: 18,
  },
  splitOptionButton: {
    width: "100%",
    padding: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  splitOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  splitOptionSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    marginTop: 2,
  },

  // Step 5 - Session length (v2.4.9 Part 1). Bigger tap targets than the
  // split picker; accent-orange time labels signal these are the primary
  // choice driver, descriptors stay muted.
  sessionTierContainer: {
    flex: 1,
    marginTop: 18,
  },
  sessionTierButton: {
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
    minHeight: 72,
    justifyContent: "center",
  },
  sessionTierLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  sessionTierSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    marginTop: 4,
  },

  // Step 7 - Session Duration
  sessionDurationContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 24,
  },
  sessionDurationButton: {
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  sessionDurationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },

  // Step 8 - Targets
  targetsScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  selectedTargetCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: `${colors.accent}06`,
    borderWidth: 1,
    borderColor: `${colors.accent}18`,
  },
  selectedTargetText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },
  selectedTargetRemove: {
    fontSize: 16,
    color: `${colors.accent}40`,
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  availableTargetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  availableTargetChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  availableTargetText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  targetsButtonsContainer: {
    flexDirection: "column",
    gap: 7,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.01)",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
  },

  // Step 9 - Assessment Intro
  pathSelectionScrollView: {
    flex: 1,
    marginTop: 18,
  },
  pathCard: {
    width: "100%",
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  pathCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pathCardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  pathCardBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  pathCardBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  pathCardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    lineHeight: 18,
  },

  // Path confirmation
  pathConfirmationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pathConfirmationContent: {
    alignItems: "center",
    width: "100%",
  },
  pathConfirmationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 6,
  },
  pathConfirmationDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  pathStepsContainer: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
    maxWidth: 270,
    marginBottom: 28,
  },
  pathStepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pathStepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pathStepNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  pathStepText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },

  // Placeholders
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 16,
  },
  placeholderNext: {
    color: colors.accent,
    fontSize: 16,
    marginTop: 20,
  },
});