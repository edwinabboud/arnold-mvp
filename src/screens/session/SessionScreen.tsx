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
  AppState,
} from "react-native";
import * as Notifications from "expo-notifications";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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

// ── Notifications (MVP 1.16) ─────────────────────────────────────────────────
// Suppress in-app banner/sound while Arnold is foregrounded — the in-session
// Arnold message already cues the user, so a notification on top would double-cue.
// iOS still delivers the notification when the app is backgrounded/closed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Request notification permission lazily — the first time a timer needs to
// schedule one. Keeps onboarding clean. Returns false gracefully if denied;
// the timer still works, just with no OS notification (same UX as before 1.16).
async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  }
  return false;
}

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

/**
 * v2.4.1 grouped card — used for warm-up blocks and accessory supersets.
 * The whole block is one logical step; sub-items are display-only with no
 * per-set tracking. Active session advances on a single DONE tap.
 */
function GroupedExerciseCard({
  exercise,
  isCurrent,
  isDone,
  isFuture,
  onTapDetail,
}: {
  exercise: PlannedExercise;
  isCurrent: boolean;
  isDone: boolean;
  isFuture: boolean;
  onTapDetail: () => void;
}) {
  const subs = exercise.subExercises ?? [];
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
      <View style={cardStyles.groupHeader}>
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
            {exercise.groupLabel ?? exercise.name}
          </Text>
        </View>
        {exercise.notes && (
          <Text style={cardStyles.noteText}>{exercise.notes}</Text>
        )}
      </View>
      {subs.map((sub, i) => (
        <View
          key={sub.id}
          style={[
            cardStyles.groupSubRow,
            i === subs.length - 1 && cardStyles.groupSubRowLast,
          ]}
        >
          <Text style={cardStyles.groupSubName}>{sub.name}</Text>
          <Text style={cardStyles.groupSubPrescription}>{sub.prescription}</Text>
          {sub.notes && (
            <Text style={cardStyles.groupSubNotes}>{sub.notes}</Text>
          )}
        </View>
      ))}
    </TouchableOpacity>
  );
}

function ExerciseCard({
  exercise,
  isCurrent,
  isDone,
  currentSet,
  warmupTimerSeconds,
  onTapDetail,
}: {
  exercise: PlannedExercise;
  isCurrent: boolean;
  isDone: boolean;
  currentSet: number;
  warmupTimerSeconds?: number | null;
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
            {exercise.sets} sets × {
              exercise.exerciseRole === "warmup" && exercise.warmupDurationSeconds
                ? `${exercise.reps > 0 ? `${exercise.reps} reps` : `${exercise.warmupDurationSeconds}s`}`
                : (progression?.isIsometric || exercise.exerciseRole === "skill_isometric")
                  ? `${exercise.holdSeconds ?? exercise.reps}s hold`
                  : `${exercise.reps} reps`
            }
            {isCurrent && ` · ${exercise.restSeconds}s rest`}
          </Text>
          {isCurrent && exercise.exerciseRole === "warmup" && warmupTimerSeconds != null && (
            <Text style={cardStyles.warmupTimerText}>
              {Math.floor(warmupTimerSeconds / 60)}:{(warmupTimerSeconds % 60).toString().padStart(2, "0")}
            </Text>
          )}
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
  // v2.4.5 §5.4 — live warm-up countdown on the active card
  warmupTimerText: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  // v2.4.1 grouped card (warm-up, accessories superset)
  groupHeader: {
    marginBottom: spacing.sm,
  },
  groupSubRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  groupSubRowLast: {
    borderBottomWidth: 0,
  },
  groupSubName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  groupSubPrescription: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
    marginLeft: spacing.md,
  },
  groupSubNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
    flexBasis: "100%",
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
  const isIso = PROGRESSIONS.find(p => p.id === exercise.progressionId)?.isIsometric
    || exercise.exerciseRole === "skill_isometric";
  const holdValue = exercise.holdSeconds ?? exercise.reps;
  const repsLabel = isIso ? `${holdValue}s hold` : `${exercise.reps}`;
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

// ── Resume position (MVP 1.16.1) ─────────────────────────────────────────────
// When a session is resumed (activeSession persisted with prior completedSets),
// figure out where to drop the user back in so they continue instead of
// restarting — and so already-logged sets aren't re-logged as duplicates.
// Derived purely from completedSets; degrades to the top on any ambiguity.
// Grouped cards (warm-up blocks / supersets) don't log sets, so at worst one
// already-finished grouped card may be re-shown — harmless (no per-set logging).
type SessionPhase = "warmup" | "training" | "cooldown";

function computeResumePosition(
  planned: PlannedSession | null,
  completedSets: CompletedSet[],
): { phase: SessionPhase; exIdx: number; setIdx: number } {
  const TOP = { phase: "warmup" as SessionPhase, exIdx: 0, setIdx: 0 };
  if (!planned || completedSets.length === 0) return TOP;

  const phases: { phase: SessionPhase; list: PlannedExercise[] }[] = [
    { phase: "warmup", list: planned.warmUpExercises || [] },
    { phase: "training", list: planned.exercises || [] },
    { phase: "cooldown", list: planned.cooldownExercises || [] },
  ];

  // Find the exercise of the most-recently logged set.
  const lastExId = completedSets[completedSets.length - 1].exerciseId;
  let pi = -1;
  let ei = -1;
  for (let p = 0; p < phases.length; p++) {
    const idx = phases[p].list.findIndex((e) => e.id === lastExId);
    if (idx !== -1) { pi = p; ei = idx; break; }
  }
  if (pi === -1) return TOP; // unknown exercise — safest to restart at top

  const ex = phases[pi].list[ei];
  const doneForEx = completedSets.filter((cs) => cs.exerciseId === lastExId).length;

  // Sets remaining on this exercise → resume mid-exercise (no re-logging).
  if (doneForEx < ex.sets) {
    return { phase: phases[pi].phase, exIdx: ei, setIdx: doneForEx };
  }

  // Exercise finished → advance to the next exercise, crossing phases.
  let np = pi;
  let ne = ei + 1;
  while (np < phases.length) {
    if (ne < phases[np].list.length) {
      return { phase: phases[np].phase, exIdx: ne, setIdx: 0 };
    }
    np++;
    ne = 0;
  }
  // Nothing after — clamp to the final set of the last logged exercise.
  return { phase: phases[pi].phase, exIdx: ei, setIdx: Math.max(0, ex.sets - 1) };
}

// ── Main Session Screen ─────────────────────────────────────────────────────

export default function SessionScreen({ navigation, route }: any) {
  // Get session from route params or store
  const activeSession = useStore((s) => s.activeSession);
  const logSet = useStore((s) => s.logSet);
  const logPain = useStore((s) => s.logPain);
  const advanceExercise = useStore((s) => s.advanceExercise);
  const endSession = useStore((s) => s.endSession);

  // MVP 1.16.1 — when resuming an in-progress session, restore where the user
  // left off (derived once, on mount) so they continue instead of restarting.
  const [resumeInit] = useState(() =>
    computeResumePosition(activeSession?.plannedSession ?? null, activeSession?.completedSets ?? [])
  );

  // Local UI state
  const [currentExIdx, setCurrentExIdx] = useState(resumeInit.exIdx);
  const [currentSetIdx, setCurrentSetIdx] = useState(resumeInit.setIdx);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  // v2.4.5 §5.4 — active per-warmup countdown. Kept separate from `resting`
  // so the 10s between-set rest (which uses the existing rest-timer state)
  // never collides with the active-work countdown.
  const [warmupTiming, setWarmupTiming] = useState(false);
  const [warmupTime, setWarmupTime] = useState(0);
  const [warmupTotal, setWarmupTotal] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [arnoldMsg, setArnoldMsg] = useState("Let's get after it.");
  const [chatOpen, setChatOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<{ section: "warmUp" | "main" | "cooldown"; index: number } | null>(null);
  const [sessionPhase, setSessionPhase] = useState<"warmup" | "training" | "cooldown">(resumeInit.phase);
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

  // ── Timer lifecycle (MVP 1.16) ────────────────────────────────────────────
  // Source of truth is an absolute end timestamp held in a ref — NOT a
  // decrementing counter. A 250ms tick recomputes the visible remaining from
  // Date.now(), so the timer stays correct across backgrounding (iOS suspends
  // JS timers within ~30s). A local OS notification is scheduled when a timer
  // starts so it fires even if the app is closed, and is cancelled on
  // skip / manual DONE / navigation away / natural completion.
  const restEndsAtRef = useRef<number | null>(null);
  const warmupEndsAtRef = useRef<number | null>(null);
  const restNotifIdRef = useRef<string | null>(null);
  const warmupNotifIdRef = useRef<string | null>(null);
  // Latest completion handlers, read by the tick intervals + AppState listener
  // so those long-lived callbacks never capture stale state.
  const restCompleteRef = useRef<() => void>(() => {});
  const warmupCompleteRef = useRef<() => void>(() => {});

  const cancelRestNotification = () => {
    const id = restNotifIdRef.current;
    if (id) {
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      restNotifIdRef.current = null;
    }
  };

  const cancelWarmupNotification = () => {
    const id = warmupNotifIdRef.current;
    if (id) {
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      warmupNotifIdRef.current = null;
    }
  };

  const scheduleRestNotification = async (seconds: number, body: string) => {
    const granted = await ensureNotificationPermission();
    if (!granted) { restNotifIdRef.current = null; return; }
    try {
      restNotifIdRef.current = await Notifications.scheduleNotificationAsync({
        content: { title: "Rest's up", body, sound: "default" },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
      });
    } catch {
      restNotifIdRef.current = null;
    }
  };

  const scheduleWarmupNotification = async (seconds: number, exName: string) => {
    const granted = await ensureNotificationPermission();
    if (!granted) { warmupNotifIdRef.current = null; return; }
    try {
      warmupNotifIdRef.current = await Notifications.scheduleNotificationAsync({
        content: { title: `${exName} done`, body: "Next warm-up exercise", sound: "default" },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
      });
    } catch {
      warmupNotifIdRef.current = null;
    }
  };

  // Start a between-set rest: set the wall-clock end + schedule the OS notification.
  const startRest = (seconds: number, notifBody: string) => {
    restEndsAtRef.current = Date.now() + seconds * 1000;
    setRestTotal(seconds);
    setRestTime(seconds);
    setResting(true);
    scheduleRestNotification(seconds, notifBody);
  };

  const handleRestComplete = () => {
    if (restEndsAtRef.current == null) return; // guard against double-fire
    restEndsAtRef.current = null;
    cancelRestNotification();
    setResting(false);
    setRestTime(0);
    arnoldSay(`Set ${currentSetIdx + 1}. ${currentEx.name}. Go.`);
  };

  // Rest tick — recompute remaining from the wall clock every 250ms.
  useEffect(() => {
    if (!resting) return;
    const tick = () => {
      const endsAt = restEndsAtRef.current;
      if (endsAt == null) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRestTime(remaining);
      if (remaining <= 0) restCompleteRef.current();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [resting]);

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
    // v2.4.5 §5.4 — clear the active warm-up countdown so the timer effect
    // doesn't double-fire handleDone() a tick later. MVP 1.16: also cancel the
    // pending warm-up notification (manual DONE short-circuits the countdown).
    setWarmupTiming(false);
    setWarmupTime(0);
    warmupEndsAtRef.current = null;
    cancelWarmupNotification();

    // v2.4.1 grouped cards (warm-up, accessory superset): one DONE press
    // advances the whole block. Sub-items aren't individually tracked.
    const isGrouped = !!(currentEx?.subExercises && currentEx.subExercises.length > 0);
    const isLastSet = isGrouped ? true : currentSetIdx >= currentEx.sets - 1;
    const isLastExercise = currentExIdx >= currentPhaseExercises.length - 1;

    // Log the set (skip for grouped cards — sub-items aren't tracked).
    // perceivedDifficulty is NOT set here — it's user feedback, not planner
    // intent. It gets populated from the end-of-session review (or mid-session
    // chat). If the user skips review, it stays undefined and autoregulation
    // won't fire for that exercise.
    if (!isGrouped) {
      const completed: CompletedSet = {
        exerciseId: currentEx.id,
        setNumber: currentSetIdx,
        repsCompleted: currentEx.reps,
        addedWeightKg: currentEx.addedWeightKg,
        timestamp: new Date().toISOString(),
      };
      logSet(completed);
    }

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
        startRest(nextEx.restSeconds, `${nextEx.name} — set 1`);
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
        // currentSetIdx is pre-increment here, so the upcoming set (1-based) is +2.
        startRest(currentEx.restSeconds, `${currentEx.name} — set ${currentSetIdx + 2}`);
      }
    }
  };

  const skipRest = () => {
    restEndsAtRef.current = null;
    cancelRestNotification();
    setResting(false);
    setRestTime(0);
    arnoldSay("No rest? Respect. Go.");
  };

  // v2.4.5 §5.4 — skip the current warm-up exercise without logging sets.
  // Advances to the next warmup or transitions to training when on the last.
  const handleSkipWarmupExercise = () => {
    if (sessionPhase !== "warmup") return;
    setWarmupTiming(false);
    setWarmupTime(0);
    warmupEndsAtRef.current = null;
    cancelWarmupNotification();
    const isLastExercise = currentExIdx >= currentPhaseExercises.length - 1;
    if (resting) {
      restEndsAtRef.current = null;
      cancelRestNotification();
      setResting(false);
      setRestTime(0);
    }
    if (isLastExercise) {
      exerciseLayouts.current = {};
      setSessionPhase("training");
      setCurrentExIdx(0);
      setCurrentSetIdx(0);
      arnoldSay("Warm-up done. Let's work.");
    } else {
      setCurrentExIdx((i) => i + 1);
      setCurrentSetIdx(0);
    }
  };

  // v2.4.5 §5.4 — warm-up countdown completion. When it hits 0, auto-fires
  // handleDone() (same path as a manual DONE tap). MVP 1.16: wall-clock based.
  const handleWarmupComplete = () => {
    if (warmupEndsAtRef.current == null) return; // guard against double-fire
    warmupEndsAtRef.current = null;
    cancelWarmupNotification();
    setWarmupTiming(false);
    setWarmupTime(0);
    handleDone();
  };

  // Warm-up tick — recompute remaining from the wall clock every 250ms.
  useEffect(() => {
    if (!warmupTiming) return;
    const tick = () => {
      const endsAt = warmupEndsAtRef.current;
      if (endsAt == null) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setWarmupTime(remaining);
      if (remaining <= 0) warmupCompleteRef.current();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [warmupTiming]);

  // Keep the completion refs pointed at the latest handlers so the tick
  // intervals and the AppState listener never call stale closures.
  useEffect(() => {
    restCompleteRef.current = handleRestComplete;
    warmupCompleteRef.current = handleWarmupComplete;
  });

  // v2.4.5 §5.4 — kick off the countdown when a warm-up set becomes active.
  // Paused while between-set rest is running (the 10s rest takes precedence).
  useEffect(() => {
    if (sessionPhase !== "warmup") return;
    if (resting) return;
    if (!currentEx || currentEx.exerciseRole !== "warmup") return;
    const duration = currentEx.warmupDurationSeconds;
    if (!duration || duration <= 0) return;

    warmupEndsAtRef.current = Date.now() + duration * 1000;
    setWarmupTotal(duration);
    setWarmupTime(duration);
    setWarmupTiming(true);
    // Only schedule an OS notification for longer holds. Short warm-up
    // countdowns (<= 20s) don't give the user time to meaningfully background
    // the app, and a buzz a few seconds after they glance away feels wrong.
    if (duration > 20) {
      scheduleWarmupNotification(duration, currentEx.name);
    }

    return () => {
      warmupEndsAtRef.current = null;
      cancelWarmupNotification();
      setWarmupTiming(false);
      setWarmupTime(0);
    };
  }, [sessionPhase, currentExIdx, currentSetIdx, resting]);

  // MVP 1.16 — recompute remaining the instant the app returns to foreground.
  // iOS suspends JS timers while backgrounded, but the endsAt refs survive, so
  // we recover the exact remaining time (and fire completion if it already
  // elapsed while we were away).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (__DEV__) {
        console.log("[ARNOLD TIMER] AppState change:", next, "restEndsAt:", restEndsAtRef.current, "warmupEndsAt:", warmupEndsAtRef.current);
      }
      if (next !== "active") return;
      if (restEndsAtRef.current != null) {
        const rem = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
        if (__DEV__) {
          console.log("[ARNOLD TIMER] AppState active: recomputed rest remaining:", rem);
        }
        setRestTime(rem);
        if (rem <= 0) restCompleteRef.current();
      }
      if (warmupEndsAtRef.current != null) {
        const rem = Math.max(0, Math.ceil((warmupEndsAtRef.current - Date.now()) / 1000));
        if (__DEV__) {
          console.log("[ARNOLD TIMER] AppState active: recomputed warmup remaining:", rem);
        }
        setWarmupTime(rem);
        if (rem <= 0) warmupCompleteRef.current();
      }
    });
    return () => sub.remove();
  }, []);

  // MVP 1.16.2 — belt-and-suspenders for AppState miss. On iOS the JS engine
  // can be fully suspended when backgrounded; the AppState "active" event after
  // foregrounding can be missed. useFocusEffect fires reliably when the screen
  // regains focus via React Navigation, giving us a second recompute trigger.
  // (The tick interval keyed on `resting`/`warmupTiming` keeps owning the
  // per-second cadence; this just nudges remaining the instant we're visible.)
  useFocusEffect(
    React.useCallback(() => {
      if (__DEV__) {
        console.log("[ARNOLD TIMER] useFocusEffect fired. resting:", resting, "warmupTiming:", warmupTiming);
      }
      if (restEndsAtRef.current != null) {
        const rem = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
        if (__DEV__) {
          console.log("[ARNOLD TIMER] Focus recompute rest remaining:", rem);
        }
        setRestTime(rem);
        if (rem <= 0) restCompleteRef.current();
      }
      if (warmupEndsAtRef.current != null) {
        const rem = Math.max(0, Math.ceil((warmupEndsAtRef.current - Date.now()) / 1000));
        if (__DEV__) {
          console.log("[ARNOLD TIMER] Focus recompute warmup remaining:", rem);
        }
        setWarmupTime(rem);
        if (rem <= 0) warmupCompleteRef.current();
      }
      // No cleanup needed — recompute is fire-once on focus. The existing tick
      // effect (keyed on `resting`/`warmupTiming`) owns the interval lifecycle.
    }, [resting, warmupTiming])
  );

  // MVP 1.16 — leaving the session (back button, finish, or any unmount) must
  // cancel any pending OS notification so it doesn't fire after the user left.
  useEffect(() => {
    return () => {
      cancelRestNotification();
      cancelWarmupNotification();
      restEndsAtRef.current = null;
      warmupEndsAtRef.current = null;
    };
  }, []);



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
                      setWarmupTiming(false);
                      setWarmupTime(0);
                      warmupEndsAtRef.current = null;
                      cancelWarmupNotification();
                      if (resting) {
                        restEndsAtRef.current = null;
                        cancelRestNotification();
                        setResting(false);
                        setRestTime(0);
                      }
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
            {currentPhaseExercises.map((ex, i) => {
              const isCurrent = i === currentExIdx;
              const isDone = i < currentExIdx;
              const isFuture = i > currentExIdx;
              const isGrouped = !!(ex.subExercises && ex.subExercises.length > 0);
              return (
                <View
                  key={ex.id}
                  onLayout={(e) => {
                    exerciseLayouts.current[i] = {
                      y: e.nativeEvent.layout.y,
                      height: e.nativeEvent.layout.height,
                    };
                  }}
                >
                  {isGrouped ? (
                    <GroupedExerciseCard
                      exercise={ex}
                      isCurrent={isCurrent}
                      isDone={isDone}
                      isFuture={isFuture}
                      onTapDetail={() => setDetailExercise({
                        section: sessionPhase === "warmup" ? "warmUp" : sessionPhase === "training" ? "main" : "cooldown",
                        index: i,
                      })}
                    />
                  ) : (
                    <ExerciseCard
                      exercise={ex}
                      isCurrent={isCurrent}
                      isDone={isDone}
                      currentSet={isCurrent ? currentSetIdx : 0}
                      warmupTimerSeconds={
                        isCurrent && sessionPhase === "warmup" && warmupTiming && !resting
                          ? warmupTime
                          : null
                      }
                      onTapDetail={() => setDetailExercise({
                        section: sessionPhase === "warmup" ? "warmUp" : sessionPhase === "training" ? "main" : "cooldown",
                        index: i,
                      })}
                    />
                  )}
                  {sessionPhase === "warmup" && isCurrent && (
                    <TouchableOpacity
                      onPress={handleSkipWarmupExercise}
                      style={styles.skipWarmupExerciseBtn}
                      hitSlop={8}
                    >
                      <Text style={styles.skipWarmupExerciseText}>Skip this exercise</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
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
                {(PROGRESSIONS.find((p) => p.id === currentEx.progressionId)?.isIsometric
                  || currentEx.exerciseRole === "skill_isometric")
                  ? `${currentEx.holdSeconds ?? currentEx.reps}s hold`
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
                {(PROGRESSIONS.find((p) => p.id === currentEx.progressionId)?.isIsometric
                  || currentEx.exerciseRole === "skill_isometric")
                  ? `${currentEx.holdSeconds ?? currentEx.reps}s hold`
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
          const sourceArray =
            detailExercise.section === "warmUp" ? warmUpExercises :
            detailExercise.section === "main" ? mainExercises :
            cooldownExercises;
          const detailEx = sourceArray[detailExercise.index];
          if (!detailEx) return null;
          return (
            <ExerciseDetail
              progressionId={detailEx.progressionId}
              onClose={() => setDetailExercise(null)}
              isNew={false}
              sessionContext={detailEx.notes}
              exerciseName={detailEx.name}
              exerciseNotes={detailEx.notes}
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

  // v2.4.5 §5.4 — per-warmup-card skip button
  skipWarmupExerciseBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  skipWarmupExerciseText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

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
