// =============================================================================
// ARNOLD — Session Screen (The Main Workout Loop)
// Exercise cards stacked, current highlighted with amber border.
// Difficulty tag chip, coaching note, DONE button, rest timer.
// Chat widget bottom-right. Waveform compact at top.
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors, typography, spacing, radius } from "../../theme";
import {
  CompletedSet,
  DifficultyIntent,
  PainReport,
  PlannedExercise,
  PlannedSession,
  WarmUpLength,
} from "../../types";
import { ChatMessage, ChatOption } from "../../types/logging";
import { PROGRESSIONS } from "../../data/progressions";
import { EXERCISE_KB } from "../../data/exerciseKnowledge";
import { tryQuickResponse, routeInteraction } from "../../engine/api";
import { useChatService } from '../../hooks/useChatService';
import ArnoldWaveform from "../../components/waveform/ArnoldWaveform";
import ChatWidget from "../../components/chat/ChatWidget";
import ExerciseDetail from "../../components/exercise/ExerciseDetail";

// ── Intent colors ───────────────────────────────────────────────────────────

const INTENT_COLORS: Record<DifficultyIntent, string> = {
  challenging: "#E63946",
  moderate: "#F5A623",
  easy: "#34C759",
};

// ── Rest Timer Ring ─────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const size = 56;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const progress = total > 0 ? seconds / total : 0;

  return (
    <View style={[timerStyles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[timerStyles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Progress — simplified as opacity since RN doesn't have SVG built in */}
        <View
          style={[
            timerStyles.progressRing,
            {
              width: size - 6,
              height: size - 6,
              borderRadius: (size - 6) / 2,
              borderWidth: 3,
              borderColor: colors.accent,
              opacity: progress,
            },
          ]}
        />
      </View>
      <Text style={timerStyles.time}>
        {min}:{sec.toString().padStart(2, "0")}
      </Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRing: { position: "absolute" },
  time: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
    fontVariant: ["tabular-nums"],
  },
});

// ── Exercise Card ───────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  isCurrent,
  isDone,
  currentSet,
  onTapDetail,
}: {
  exercise: PlannedExercise;
  isCurrent: boolean;
  isDone: boolean;
  currentSet: number;
  onTapDetail: () => void;
}) {
  const isFuture = !isCurrent && !isDone;
  const progression = PROGRESSIONS.find((p) => p.id === exercise.progressionId);
  const knowledge = EXERCISE_KB[exercise.progressionId];

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        isCurrent && cardStyles.cardCurrent,
        isDone && cardStyles.cardDone,
        isFuture && cardStyles.cardFuture,
      ]}
      onPress={onTapDetail}
      activeOpacity={0.8}
    >
      <View style={cardStyles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={cardStyles.nameRow}>
            {isDone && <Text style={cardStyles.checkmark}>✓</Text>}
            <Text
              style={[
                cardStyles.name,
                isDone && cardStyles.nameDone,
                isCurrent && cardStyles.nameCurrent,
                isFuture && cardStyles.nameFuture,
              ]}
            >
              {exercise.name}
            </Text>
          </View>
          {exercise.addedWeightKg != null && exercise.addedWeightKg > 0 && (
            <Text style={isCurrent ? cardStyles.activeWeight : cardStyles.inactiveWeight}>
              +{exercise.addedWeightKg}kg
            </Text>
          )}
          <Text style={[cardStyles.meta, isCurrent && cardStyles.metaCurrent, isDone && { opacity: 0.4 }]}>
            {exercise.sets} sets × {progression?.isIsometric ? `${exercise.reps}s hold` : `${exercise.reps} reps`}
            {isCurrent && ` · ${exercise.restSeconds}s rest`}
          </Text>
        </View>

        {/* Difficulty tag — only on current exercise */}
        {isCurrent && (
          <View
            style={[
              cardStyles.intentTag,
              {
                borderColor: `${INTENT_COLORS[exercise.difficultyIntent]}30`,
                backgroundColor: `${INTENT_COLORS[exercise.difficultyIntent]}10`,
              },
            ]}
          >
            <Text
              style={[
                cardStyles.intentText,
                { color: INTENT_COLORS[exercise.difficultyIntent] },
              ]}
            >
              {exercise.difficultyIntent.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Set progress dots — current exercise only */}
      {isCurrent && (
        <View style={cardStyles.setDots}>
          {Array.from({ length: exercise.sets }).map((_, i) => (
            <View
              key={i}
              style={[
                cardStyles.dot,
                {
                  backgroundColor:
                    i < currentSet
                      ? colors.accent
                      : i === currentSet
                      ? `${colors.accent}50`
                      : "rgba(255,255,255,0.06)",
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Coaching note — current exercise only */}
      {isCurrent && exercise.notes && (
        <View style={cardStyles.noteBox}>
          <Text style={cardStyles.noteText}>{exercise.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  cardCurrent: {
    borderColor: `${colors.accent}50`,
    backgroundColor: `${colors.accent}0A`,
    padding: 20,
    marginVertical: 8,
  },
  cardDone: { opacity: 0.25, padding: 10 },
  cardFuture: { opacity: 0.3, padding: 10 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkmark: { fontSize: 13, color: colors.success },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  activeWeight: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
    marginTop: 4,
    marginBottom: 2,
  },
  inactiveWeight: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 2,
  },
  nameDone: {
    color: "rgba(255,255,255,0.25)",
    textDecorationLine: "line-through",
    fontSize: 13,
  },
  nameCurrent: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  nameFuture: { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  meta: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 },
  metaCurrent: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  intentTag: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  intentText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  setDots: {
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  noteBox: {
    marginTop: 8,
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  noteText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
    lineHeight: 18,
  },
});

// ── Full Workout Modal ──────────────────────────────────────────────────────

interface FullWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  session: PlannedSession;
  sessionDurationMin?: number;
}

function ExerciseRow({ exercise, showRest }: { exercise: PlannedExercise; showRest: boolean }) {
  const isIso = PROGRESSIONS.find(p => p.id === exercise.progressionId)?.isIsometric;
  const repsLabel = isIso ? `${exercise.reps}s hold` : `${exercise.reps}`;
  const setsReps = `${exercise.sets}×${repsLabel}`;
  const weight = exercise.addedWeightKg && exercise.addedWeightKg > 0 ? `+${exercise.addedWeightKg}kg` : null;

  return (
    <View style={fwStyles.exerciseRow}>
      <View style={{ flex: 1 }}>
        <Text style={fwStyles.exerciseName}>{exercise.name}</Text>
        {weight && <Text style={fwStyles.weightText}>{weight}</Text>}
        {showRest && exercise.restSeconds > 0 && (
          <Text style={fwStyles.restText}>{exercise.restSeconds}s rest</Text>
        )}
      </View>
      <Text style={fwStyles.setsReps}>{setsReps}</Text>
    </View>
  );
}

function FullWorkoutModal({ visible, onClose, session, sessionDurationMin = 60 }: FullWorkoutModalProps) {
  const insets = useSafeAreaInsets();
  const warmUp = session.warmUpExercises || [];
  const main = session.exercises;
  const cooldown = session.cooldownExercises || [];
  const allEx = [...warmUp, ...main, ...cooldown];
  const totalSetsCount = allEx.reduce((a, e) => a + e.sets, 0);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[fwStyles.container, { paddingTop: insets.top }]}>
        <View style={fwStyles.header}>
          <TouchableOpacity onPress={onClose} style={fwStyles.closeButton}>
            <Text style={fwStyles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={fwStyles.headerLabel}>{session.label.toUpperCase()}</Text>
          <View style={fwStyles.closeButton} />
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {warmUp.length > 0 && (
            <>
              <View style={fwStyles.sectionHeader}>
                <Text style={[fwStyles.sectionTitle, { color: colors.textSecondary }]}>WARM-UP</Text>
              </View>
              {warmUp.map((ex) => (
                <ExerciseRow key={ex.id} exercise={ex} showRest={false} />
              ))}
            </>
          )}
          {main.length > 0 && (
            <>
              <View style={fwStyles.sectionHeader}>
                <Text style={[fwStyles.sectionTitle, { color: colors.accent }]}>MAIN WORKOUT</Text>
              </View>
              {main.map((ex) => (
                <ExerciseRow key={ex.id} exercise={ex} showRest={true} />
              ))}
            </>
          )}
          {cooldown.length > 0 && (
            <>
              <View style={fwStyles.sectionHeader}>
                <Text style={[fwStyles.sectionTitle, { color: colors.textSecondary }]}>COOLDOWN</Text>
              </View>
              {cooldown.map((ex) => (
                <ExerciseRow key={ex.id} exercise={ex} showRest={false} />
              ))}
            </>
          )}
          <View style={fwStyles.summary}>
            <Text style={fwStyles.summaryText}>
              Total: {totalSetsCount} sets · ~{sessionDurationMin} min
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const fwStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 18, color: colors.textSecondary },
  headerLabel: { fontSize: 18, fontWeight: "800", color: colors.text },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 2 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  exerciseName: { fontSize: 16, fontWeight: "600", color: colors.text },
  restText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  setsReps: { fontSize: 14, color: colors.textSecondary },
  weightText: { fontSize: 16, fontWeight: "700", color: colors.accent, marginTop: 2 },
  summary: { paddingHorizontal: 20, paddingVertical: 24, alignItems: "center" },
  summaryText: { fontSize: 14, color: colors.textMuted },
});

// ── Main Session Screen ─────────────────────────────────────────────────────

export default function SessionScreen({ navigation, route }: any) {
  // Get session from route params or store
  const activeSession = useStore((s) => s.activeSession);
  const logSet = useStore((s) => s.logSet);
  const logPain = useStore((s) => s.logPain);
  const advanceExercise = useStore((s) => s.advanceExercise);
  const endSession = useStore((s) => s.endSession);

  // Local UI state
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [arnoldMsg, setArnoldMsg] = useState("Let's get after it.");
  const [chatOpen, setChatOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<string | null>(null);
  const [sessionPhase, setSessionPhase] = useState<"warmup" | "training" | "cooldown">("warmup");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewInitiated, setReviewInitiated] = useState(false);
  const [showFullWorkout, setShowFullWorkout] = useState(false);
  const { messages: chatMessages, isLoading: chatLoading, sendText, tapOption, reportPain, addSystemMessage, addArnoldReply } = useChatService();
  const exerciseScrollRef = useRef<ScrollView>(null);
  const exerciseLayouts = useRef<Record<number, { y: number; height: number }>>({});

  // Mock session data if no active session in store
  const session: PlannedSession = activeSession?.plannedSession || {
    id: "demo",
    weekId: "w1",
    dayOfWeek: 1,
    label: "Push Day A",
    phase: "strength",
    patterns: ["push", "skill", "core"],
    exercises: [
      { id: "e1", progressionId: "push_06", name: "Pseudo Planche Push-ups", sets: 4, reps: 6, restSeconds: 120, difficultyIntent: "challenging", notes: "Lean forward, hands by hips" },
      { id: "e2", progressionId: "push_08", name: "Ring Dips", sets: 3, reps: 8, restSeconds: 90, difficultyIntent: "moderate", notes: "Turn rings out at top" },
      { id: "e3", progressionId: "push_04", name: "Diamond Push-ups", sets: 3, reps: 12, restSeconds: 60, difficultyIntent: "easy", notes: "Hands together, full range" },
      { id: "e4", progressionId: "skill_03", name: "Wall Handstand", sets: 4, reps: 30, restSeconds: 90, difficultyIntent: "challenging", notes: "Chest to wall, push through shoulders" },
      { id: "e5", progressionId: "core_02", name: "Hollow Body Hold", sets: 3, reps: 45, restSeconds: 60, difficultyIntent: "moderate", notes: "Lower back flat, squeeze everything" },
    ],
    warmUpExercises: [],
    cooldownExercises: [],
  };

  // Determine which exercises to show based on session phase
  const warmUpExercises = session.warmUpExercises || [];
  const mainExercises = session.exercises;
  const cooldownExercises = session.cooldownExercises || [];

  // Skip warmup phase if no warm-up exercises
  React.useEffect(() => {
    if (sessionPhase === "warmup" && warmUpExercises.length === 0) {
      setSessionPhase("training");
    }
  }, []);

  // Get current phase's exercises
  const currentPhaseExercises =
    sessionPhase === "warmup" ? warmUpExercises :
    sessionPhase === "training" ? mainExercises :
    cooldownExercises;

  const currentEx = currentPhaseExercises[currentExIdx];

  // Total sets across ALL phases for progress bar
  const allExercises = [...warmUpExercises, ...mainExercises, ...cooldownExercises];
  const totalSets = allExercises.reduce((a, e) => a + e.sets, 0);

  // Completed sets calculation
  let completedSets = 0;
  if (sessionPhase === "warmup") {
    completedSets = currentPhaseExercises.slice(0, currentExIdx).reduce((a, e) => a + e.sets, 0) + currentSetIdx;
  } else if (sessionPhase === "training") {
    completedSets = warmUpExercises.reduce((a, e) => a + e.sets, 0)
      + currentPhaseExercises.slice(0, currentExIdx).reduce((a, e) => a + e.sets, 0) + currentSetIdx;
  } else {
    completedSets = warmUpExercises.reduce((a, e) => a + e.sets, 0)
      + mainExercises.reduce((a, e) => a + e.sets, 0)
      + currentPhaseExercises.slice(0, currentExIdx).reduce((a, e) => a + e.sets, 0) + currentSetIdx;
  }
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  // Arnold speaks
  const arnoldSay = useCallback((msg: string) => {
    setArnoldMsg(msg);
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), msg.length * 35 + 600);
  }, []);

  // Rest timer
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (resting && restTime > 0) {
      timerRef.current = setTimeout(() => setRestTime((t) => t - 1), 1000);
    } else if (resting && restTime === 0) {
      setResting(false);
      arnoldSay(`Set ${currentSetIdx + 1}. ${currentEx.name}. Go.`);
    }
    return () => clearTimeout(timerRef.current);
  }, [resting, restTime]);

  // Auto-scroll to center current exercise
  useEffect(() => {
    const layout = exerciseLayouts.current[currentExIdx];
    if (layout && exerciseScrollRef.current) {
      const screenHeight = Dimensions.get("window").height;
      const scrollAreaHeight = screenHeight * 0.5;
      const targetY = layout.y - scrollAreaHeight / 2 + layout.height / 2;
      exerciseScrollRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
    }
  }, [currentExIdx, sessionPhase]);

  // DONE button handler
  const handleDone = () => {
    const isLastSet = currentSetIdx >= currentEx.sets - 1;
    const isLastExercise = currentExIdx >= currentPhaseExercises.length - 1;

    // Log the set.
    // perceivedDifficulty is NOT set here — it's user feedback, not planner
    // intent. It gets populated from the end-of-session review (or mid-session
    // chat). If the user skips review, it stays undefined and autoregulation
    // won't fire for that exercise.
    const completed: CompletedSet = {
      exerciseId: currentEx.id,
      setNumber: currentSetIdx,
      repsCompleted: currentEx.reps,
      addedWeightKg: currentEx.addedWeightKg,
      timestamp: new Date().toISOString(),
    };
    logSet(completed);

    if (isLastSet && isLastExercise) {
      // End of current phase — transition to next
      if (sessionPhase === "warmup") {
        arnoldSay("Warm-up done. Let's work.");
        exerciseLayouts.current = {};
        setSessionPhase("training");
        setCurrentExIdx(0);
        setCurrentSetIdx(0);
        return;
      } else if (sessionPhase === "training") {
        if (cooldownExercises.length > 0) {
          arnoldSay("Main work done. Cool down.");
          exerciseLayouts.current = {};
          setSessionPhase("cooldown");
          setCurrentExIdx(0);
          setCurrentSetIdx(0);
          return;
        } else {
          setSessionComplete(true);
          arnoldSay("Session done. Good work today.");
          return;
        }
      } else {
        // End of cooldown
        setSessionComplete(true);
        arnoldSay("Session done. Good work today.");
        return;
      }
    }

    if (isLastSet) {
      arnoldSay("Done. Moving on.");
      setCurrentExIdx((i) => i + 1);
      setCurrentSetIdx(0);
      const nextEx = currentPhaseExercises[currentExIdx + 1];
      if (nextEx && nextEx.restSeconds > 0) {
        setResting(true);
        setRestTotal(nextEx.restSeconds);
        setRestTime(nextEx.restSeconds);
      }
    } else {
      if (currentSetIdx === currentEx.sets - 2) {
        arnoldSay("Last set. Make it count.");
      } else {
        const quick = tryQuickResponse("set_done", {
          exerciseName: currentEx.name,
          setsRemaining: currentEx.sets - currentSetIdx - 1,
          restSeconds: currentEx.restSeconds,
        });
        arnoldSay(quick?.text || "Done. Rest up.");
      }
      setCurrentSetIdx((i) => i + 1);
      if (currentEx.restSeconds > 0) {
        setResting(true);
        setRestTotal(currentEx.restSeconds);
        setRestTime(currentEx.restSeconds);
      }
    }
  };

  const skipRest = () => {
    setResting(false);
    setRestTime(0);
    arnoldSay("No rest? Respect. Go.");
  };



  const handleFinish = () => {
    endSession();
    navigation.goBack();
  };

  // When the user closes the chat after tapping "Yes" on the review
  // screen, finish the session instead of reverting to the review buttons.
  useEffect(() => {
    if (reviewInitiated && !chatOpen) {
      handleFinish();
    }
  }, [chatOpen, reviewInitiated]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back / Close button */}
      <TouchableOpacity
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: "600" }}>
          ← Back
        </Text>
      </TouchableOpacity>

      {/* Session progress bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressRow}>
          <Text style={styles.sessionLabel}>{session.label.toUpperCase()}</Text>
          <Text style={styles.setCount}>{completedSets}/{totalSets} sets</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Arnold waveform + message (compact) */}
      <View style={styles.arnoldRow}>
        <ArnoldWaveform speaking={speaking} size="compact" />
        <View style={styles.arnoldMsgBox}>
          <Text style={styles.arnoldName}>ARNOLD</Text>
          <Text style={styles.arnoldMsg} numberOfLines={2}>{arnoldMsg}</Text>
        </View>
      </View>

      {/* Exercise cards */}
      <ScrollView
        ref={exerciseScrollRef}
        style={styles.exerciseScroll}
        contentContainerStyle={styles.exerciseContent}
        showsVerticalScrollIndicator={false}
      >
        {sessionComplete ? (
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Session Complete</Text>
            <Text style={styles.completeSub}>{completedSets} sets logged</Text>

            <Text style={styles.reviewPrompt}>Want to review your training?</Text>
            <Text style={styles.reviewSubtext}>
              Arnold adapts based on how it actually felt. Tap No if all good.
            </Text>

            <View style={styles.reviewButtonsRow}>
              <TouchableOpacity
                style={styles.reviewButtonYes}
                onPress={() => {
                  const sessionName = activeSession?.plannedSession?.label ?? "your session";
                  const setsLogged = activeSession?.completedSets?.length ?? 0;

                  addArnoldReply(
                    `Nice work finishing ${sessionName} — ${setsLogged} sets logged. How did it feel overall?`,
                    "quick",
                    [
                      { id: "review_easy", label: "Way too easy", action: "followup", value: "The session felt way too easy today." },
                      { id: "review_solid", label: "Felt solid", action: "followup", value: "The session felt about right, solid effort." },
                      { id: "review_hard", label: "Way too hard", action: "followup", value: "The session felt way too hard today." },
                    ],
                  );
                  setReviewInitiated(true);
                  setChatOpen(true);
                }}
              >
                <Text style={styles.reviewButtonYesText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewButtonNo}
                onPress={handleFinish}
              >
                <Text style={styles.reviewButtonNoText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewButtonMaybe}
                onPress={handleFinish}
              >
                <Text style={styles.reviewButtonMaybeText}>Not sure</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Phase label + skip button */}
            {sessionPhase === "warmup" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textSecondary, letterSpacing: 2 }}>WARM-UP</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setShowFullWorkout(true)}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Full Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      arnoldSay("Skipping warm-up. Let's go.");
                      exerciseLayouts.current = {};
                      setSessionPhase("training");
                      setCurrentExIdx(0);
                      setCurrentSetIdx(0);
                    }}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Skip warm-up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {sessionPhase === "training" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.accent, letterSpacing: 2 }}>MAIN WORKOUT</Text>
                <TouchableOpacity
                  onPress={() => setShowFullWorkout(true)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Full Workout</Text>
                </TouchableOpacity>
              </View>
            )}
            {sessionPhase === "cooldown" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textSecondary, letterSpacing: 2 }}>COOLDOWN</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setShowFullWorkout(true)}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Full Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSessionComplete(true);
                      arnoldSay("Session done. Good work today.");
                    }}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Skip & finish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Exercise cards for current phase */}
            {currentPhaseExercises.map((ex, i) => (
              <View
                key={ex.id}
                onLayout={(e) => {
                  exerciseLayouts.current[i] = {
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  };
                }}
              >
                <ExerciseCard
                  exercise={ex}
                  isCurrent={i === currentExIdx}
                  isDone={i < currentExIdx}
                  currentSet={i === currentExIdx ? currentSetIdx : 0}
                  onTapDetail={() => setDetailExercise(ex.progressionId)}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom controls */}
      {!sessionComplete && currentEx && (
        <View style={styles.bottomControls}>
          {resting ? (
            <>
              <Text style={styles.restingLabel}>RESTING</Text>
              <Text style={styles.restingTimer}>
                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, "0")}
              </Text>
              <Text style={styles.restingNext}>
                Next: Set {currentSetIdx + 1} of {currentEx.sets} ·{" "}
                {PROGRESSIONS.find((p) => p.id === currentEx.progressionId)?.isIsometric
                  ? `${currentEx.reps}s hold`
                  : `${currentEx.reps} reps`}
              </Text>
              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.painButton}
                  onPress={() => {
                    setChatOpen(true);
                    sendText("Something hurts");
                  }}
                >
                  <Text style={styles.painIcon}>!</Text>
                </TouchableOpacity>

                {/* SKIP REST occupies the DONE slot during rest phase */}
                <TouchableOpacity
                  style={styles.skipRestButton}
                  onPress={skipRest}
                  activeOpacity={0.8}
                >
                  <Text style={styles.skipRestText}>SKIP REST</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => setChatOpen(true)}
                >
                  <Text style={styles.chatIcon}>💬</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.setInfo}>
                Set {currentSetIdx + 1} of {currentEx.sets} ·{" "}
                {PROGRESSIONS.find((p) => p.id === currentEx.progressionId)?.isIsometric
                  ? `${currentEx.reps}s hold`
                  : `${currentEx.reps} reps`}
                {currentEx.addedWeightKg != null && currentEx.addedWeightKg > 0
                  ? ` · +${currentEx.addedWeightKg}kg`
                  : ""}
              </Text>
              <View style={styles.controlRow}>
                {/* Pain button — opens chat with pain flow */}
                <TouchableOpacity
                  style={styles.painButton}
                  onPress={() => {
                    setChatOpen(true);
                    sendText("Something hurts");
                  }}
                >
                  <Text style={styles.painIcon}>!</Text>
                </TouchableOpacity>

                {/* DONE button */}
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleDone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneText}>DONE</Text>
                </TouchableOpacity>

                {/* Chat button */}
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => setChatOpen(true)}
                >
                  <Text style={styles.chatIcon}>💬</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Chat Widget */}
      <ChatWidget
        messages={chatMessages}
        onSendText={(text) => sendText(text)}
        onTapOption={(option, msgId) => tapOption(option, msgId)}
        onClose={() => setChatOpen(false)}
        isOpen={chatOpen}
        loading={chatLoading}
      />

      {/* Exercise Detail Modal */}
      <Modal visible={detailExercise !== null} animationType="slide">
        {detailExercise && (() => {
          const detailEx = [...warmUpExercises, ...mainExercises, ...cooldownExercises].find(e => e.progressionId === detailExercise);
          return (
            <ExerciseDetail
              progressionId={detailExercise}
              onClose={() => setDetailExercise(null)}
              isNew={false}
              sessionContext={detailEx?.notes}
              exerciseName={detailEx?.name}
              exerciseNotes={detailEx?.notes}
            />
          );
        })()}
      </Modal>

      {/* Full Workout Overview Modal */}
      <FullWorkoutModal
        visible={showFullWorkout}
        onClose={() => setShowFullWorkout(false)}
        session={session}
        sessionDurationMin={60}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Progress header
  progressHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: `${colors.accent}90`,
    letterSpacing: 2,
  },
  setCount: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },

  // Arnold row (compact during session)
  arnoldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  arnoldMsgBox: { flex: 1 },
  arnoldName: {
    fontSize: 9,
    fontWeight: "700",
    color: `${colors.accent}60`,
    letterSpacing: 2,
    marginBottom: 2,
  },
  arnoldMsg: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },

  // Exercise list
  exerciseScroll: { flex: 1 },
  exerciseContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // Session complete
  completeContainer: {
    alignItems: "center",
    paddingTop: spacing.xxl * 2,
  },
  completeTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  completeSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  finishButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 16,
  },
  finishText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.bg,
  },
  reviewPrompt: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: 32,
    marginBottom: 6,
  },
  reviewSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  reviewButtonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    width: "100%",
  },
  reviewButtonYes: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#34C759",
    alignItems: "center",
  },
  reviewButtonYesText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  reviewButtonNo: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#E63946",
    alignItems: "center",
  },
  reviewButtonNoText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  reviewButtonMaybe: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  reviewButtonMaybeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Bottom controls
  bottomControls: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  setInfo: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  restingLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  restingTimer: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.accent,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    marginBottom: 8,
  },
  restingNext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  skipRestButton: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#3A3A3C",
    alignItems: "center",
    justifyContent: "center",
  },
  skipRestText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  controlRow: {
    flexDirection: "row",
    gap: 8,
  },
  painButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.danger}25`,
    backgroundColor: `${colors.danger}08`,
    alignItems: "center",
    justifyContent: "center",
  },
  painIcon: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.danger,
  },
  doneButton: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.bg,
    letterSpacing: -0.5,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatIcon: { fontSize: 22 },
});
