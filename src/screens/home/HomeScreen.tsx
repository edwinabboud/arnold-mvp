// =============================================================================
// HomeScreen — Main dashboard after onboarding
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "../../store/useStore";
import { colors, typography, spacing, radius } from "../../theme";
import { findCurrentSession, getCascadeCandidate, getSessionSummary, getWeekSessions } from "../../utils/sessionFinder";
import { PlannedSession } from "../../types";
import { supabase } from "../../config/supabase";
import { isDevUser, DEV_PREFILL, toggleDevPrefill } from "../../config/devAccess";

const formatPathName = (path: string): string => {
  switch (path) {
    case "street_lifter": return "Street Lifter";
    case "skill_builder": return "Skill Builder";
    case "hybrid_athlete": return "Hybrid Athlete";
    case "endurance": return "Endurance";
    default: return path;
  }
};

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const formatPhaseName = (phase: string): string =>
  phase.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const getSessionType = (sessionName: string): string => {
  const name = sessionName.toLowerCase();

  if (name.includes("pull") && name.includes("push")) return "push + pull";
  if (name.includes("pull")) return "pull";
  if (name.includes("push")) return "push";
  if (name.includes("peak")) return "peak";
  if (name.includes("full body")) return "full body";
  if (name.includes("legs") || name.includes("leg")) return "legs";
  if (name.includes("skill")) return "skill";
  if (name.includes("upper")) return "upper";
  if (name.includes("hybrid")) return "hybrid";

  const match = sessionName.match(/\(([^)]+)\)$/);
  if (match) {
    const inner = match[1].toLowerCase();
    if (inner.length > 1) return inner;
  }

  return "full body";
};

export default function HomeScreen({ navigation }: any) {
  const profile = useStore((s) => s.profile);
  const streaks = useStore((s) => s.streaks);
  const activeMesocycle = useStore((s) => s.activeMesocycle);
  const startSession = useStore((s) => s.startSession);
  const activeSession = useStore((s) => s.activeSession);
  const sessionHistory = useStore((s) => s.sessionHistory);
  const adaptationQueue = useStore((s) => s.adaptationQueue);
  const lastAppliedAdjustments = useStore((s) => s.lastAppliedAdjustments);
  const [debugOpen, setDebugOpen] = useState(false);
  // Mirror of the module-level DEV_PREFILL flag so the DEBUG row re-renders when
  // toggled (the flag itself is non-reactive).
  const [devPrefillOn, setDevPrefillOn] = useState(DEV_PREFILL);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [overrideSession, setOverrideSession] = useState<PlannedSession | null>(null);
  // When the user taps "Undo" on the cascade pill, suppress cascade for
  // the rest of this component's lifetime. Reverts to the rest-day card.
  const [cascadeUndone, setCascadeUndone] = useState(false);
  // DEV-only: when true, force the cascade pill to render even if no real
  // miss occurred. Lets devs verify the pill UI without a real calendar
  // alignment. Toggled by the "Sim cascade" button in the DEBUG panel.
  const [forceCascade, setForceCascade] = useState(false);

  const checkAndResetWeeklyStreak = useStore((s) => s.checkAndResetWeeklyStreak);
  const checkAndIncrementWeekly = useStore((s) => s.checkAndIncrementWeekly);

  // Streak reset check on mount. Idempotent — only resets if previous
  // Mon-Sun week was fully missed and user has prior session history.
  useEffect(() => {
    checkAndIncrementWeekly();
  }, [checkAndIncrementWeekly]);

  const schedule = profile?.schedule;

  const defaultSessionInfo = activeMesocycle
    ? findCurrentSession(activeMesocycle, sessionHistory, { skipCascade: cascadeUndone })
    : null;

  // When user long-presses and picks a different session, override the
  // displayed one. Not persisted — lives for this render only.
  const baseSessionInfo = overrideSession && defaultSessionInfo
    ? { ...defaultSessionInfo, session: overrideSession, dayLabel: "Swapped" }
    : defaultSessionInfo;

  // DEV-only: force the cascade pill to render so devs can verify the UI
  // without waiting for a real calendar miss. Real cascade still works
  // through baseSessionInfo's cascadedFromDayLabel (set by findCurrentSession).
  const sessionInfo = ((__DEV__ || isDevUser()) && forceCascade && baseSessionInfo && !overrideSession && !cascadeUndone)
    ? { ...baseSessionInfo, cascadedFromDayLabel: baseSessionInfo.cascadedFromDayLabel ?? "earlier this week" }
    : baseSessionInfo;

  const handleStartSession = () => {
    if (!sessionInfo) return;
    startSession(sessionInfo.session, "long");
    navigation.getParent()?.navigate("Session");
  };

  // MVP 1.16.1 — resume an in-progress session instead of clobbering it.
  // activeSession is persisted (Zustand partialize), so it survives leaving the
  // Session screen and even an app restart. Offer Resume only when the active
  // session matches today's session AND was started within the last 24h.
  // A staler session falls through to the normal Start flow, whose
  // startSession() naturally overwrites it on the next tap.
  const STALE_HOURS = 24;
  const isResumable = (() => {
    if (!activeSession || !sessionInfo) return false;
    if (activeSession.plannedSession.id !== sessionInfo.session.id) return false;
    const hoursAgo = (Date.now() - new Date(activeSession.startedAt).getTime()) / (1000 * 60 * 60);
    return hoursAgo <= STALE_HOURS;
  })();

  const handleResumeSession = () => {
    // Do NOT call startSession() — it creates a fresh ActiveSession and would
    // wipe in-progress state. SessionScreen reads activeSession from the store.
    navigation.getParent()?.navigate("Session");
  };

  // MVP 1.16.2 — diagnostic for the "no Resume button after hard close" bug.
  // Logs every time HomeScreen mounts or these values change so we can verify
  // what activeSession looks like across cold start / rehydration.
  useEffect(() => {
    if (__DEV__) {
      console.log("[ARNOLD ACTIVESESSION] HomeScreen mount/update: activeSession exists?", !!activeSession, "isResumable?", isResumable);
    }
  }, [activeSession, isResumable]);

  const handleDevReset = () => {
    Alert.alert(
      "Reset all state?",
      "This destroys your training history, profile, and progressions. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { session: s } } = await supabase.auth.getSession();
              const userId = s?.user?.id;

              if (userId) {
                await Promise.all([
                  supabase.from('session_logs').delete().eq('user_id', userId),
                  supabase.from('mesocycles').delete().eq('user_id', userId),
                  supabase.from('user_progressions').delete().eq('user_id', userId),
                  supabase.from('streaks').delete().eq('user_id', userId),
                  supabase.from('profiles').update({
                    onboarding_complete: false,
                    assessment_complete: false,
                  }).eq('id', userId),
                ]);
                console.log('[ARNOLD] Supabase data wiped for user:', userId);
              }

              await AsyncStorage.clear();
              console.log('[ARNOLD] AsyncStorage cleared');

              useStore.getState().resetStore();
              console.log('[ARNOLD] Zustand store reset');
            } catch (err) {
              console.warn('[ARNOLD] Dev reset error:', err);
              await AsyncStorage.clear();
              useStore.getState().resetStore();
            }
          },
        },
      ]
    );
  };

  // DEV-only: simulate a full session with a chosen difficulty for every set.
  // Picks the FIRST undone session in the current week so consecutive taps
  // chain through Push/Pull/Peak/Legs without waiting for clock days.
  const handleSimulateSession = (difficulty: "easy" | "moderate" | "challenging") => {
    if (!activeMesocycle) {
      console.warn("[ARNOLD] No active mesocycle to simulate.");
      return;
    }

    const weekSessions = getWeekSessions(activeMesocycle, sessionHistory);
    const next = weekSessions.find(s => !s.completedThisWeek);

    if (!next) {
      console.warn("[ARNOLD] All sessions in this week already done. DEV RESET to start over.");
      return;
    }

    const session = next.session;
    console.log(`[ARNOLD DEBUG] Sim picked session: "${session.label}" (${session.exercises.length} exercises, id: ${session.id})`);

    // Start the session — this also applies any queued weight adaptations.
    startSession(session, "long");

    // Build CompletedSet entries for every set of every exercise.
    const allExercises = [
      ...session.warmUpExercises,
      ...session.exercises,
      ...session.cooldownExercises,
    ];
    const completedSets: any[] = [];
    for (const ex of allExercises) {
      for (let setIdx = 0; setIdx < ex.sets; setIdx++) {
        completedSets.push({
          exerciseId: ex.id,
          setNumber: setIdx,
          repsCompleted: ex.reps,
          perceivedDifficulty: difficulty,
          addedWeightKg: ex.addedWeightKg,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Inject the simulated completed sets, then end.
    useStore.setState((s) => ({
      activeSession: s.activeSession ? {
        ...s.activeSession,
        completedSets,
      } : null,
    }));

    useStore.getState().endSession();

    console.log(`[ARNOLD] SIMULATED session "${session.label}" — all sets at "${difficulty}" difficulty.`);
  };

  // DEV-only: force-show the cascade pill. Tap-to-show; dismiss via the
  // pill's own Undo button (production code path). Re-tap to show again.
  const handleSimCascade = () => {
    setForceCascade(true);
    setCascadeUndone(false);
    console.log("[ARNOLD] DEV — forcing cascade pill on. Tap Undo on the pill to dismiss.");
  };

  // DEV-only: backdate all session logs to 14 days ago, set a non-zero
  // streak if needed, then trigger the reset check.
  const handleSimMissedWeek = () => {
    const state = useStore.getState();
    if (state.sessionHistory.length === 0) {
      console.warn("[ARNOLD] Sim missed week: no session history. Run Sim Easy first.");
      return;
    }
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const backdated = state.sessionHistory.map(log => ({
      ...log,
      completedAt: fourteenDaysAgo,
      startedAt: fourteenDaysAgo,
    }));
    const fakeStreaks =
      state.streaks.currentDaily === 0 && state.streaks.currentWeekly === 0
        ? { ...state.streaks, currentDaily: 5, currentWeekly: 1 }
        : state.streaks;
    useStore.setState({
      sessionHistory: backdated,
      streaks: fakeStreaks,
    });
    // Clear the gate so checkAndIncrementWeekly fires even if already ran this week
    useStore.setState({ lastStreakCheckWeek: null });
    state.checkAndIncrementWeekly();
    console.log("[ARNOLD] Sim missed week: backdated logs, ran increment/reset check.");
  };

  // DEV-only: insert a fake "yesterday" SessionLog whose plannedSession shares
  // patterns with the cascade candidate, then re-evaluate cascade. Verifies
  // pattern-conflict suppression (spec v2.3.1 §4.5.2).
  const handleSimPatternConflict = () => {
    const state = useStore.getState();
    if (!state.activeMesocycle) {
      console.warn("[ARNOLD] Sim pattern conflict: no active mesocycle.");
      return;
    }
    const candidate = getCascadeCandidate(state.activeMesocycle, state.sessionHistory);
    if (!candidate) {
      console.log("[ARNOLD] Sim pattern conflict: no missed session to cascade. Run Sim missed week or skip days first.");
      return;
    }
    const allSessions = state.activeMesocycle.weeks.flatMap(w => w.sessions);
    const partner = allSessions.find(s =>
      s.id !== candidate.session.id &&
      s.patterns.some(p => candidate.session.patterns.includes(p))
    );
    if (!partner) {
      console.log("[ARNOLD] Sim pattern conflict: no conflict candidate found, retry needed");
      return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const userId = useStore.getState().profile?.id ?? "dev_user";
    const fakeLog = {
      id: `sim_conflict_${Date.now()}`,
      plannedSessionId: partner.id,
      userId,
      startedAt: yesterday.toISOString(),
      completedAt: yesterday.toISOString(),
      status: "completed" as const,
      warmUpChoice: "short" as const,
      cooldownChoice: "short" as const,
      completedSets: [],
      painReports: [],
      swaps: [],
    };
    useStore.setState({
      sessionHistory: [...state.sessionHistory, fakeLog],
    });
    setForceCascade(false);
    setCascadeUndone(false);
    const reEval = getCascadeCandidate(state.activeMesocycle, [...state.sessionHistory, fakeLog]);
    if (reEval && reEval.conflict) {
      console.log(`[ARNOLD] Sim pattern conflict: cascade suppressed for ${reEval.session.label} (${reEval.conflictReason})`);
    } else {
      console.log("[ARNOLD] Sim pattern conflict: no conflict candidate found, retry needed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {isResumable ? "Pick up where you left off" : sessionInfo?.isToday ? "Ready to train" : "Rest & recover"}
              </Text>
              <Text style={styles.title}>Arnold</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate("Settings")}
              hitSlop={12}
              style={styles.gearButton}
            >
              <Text style={styles.gearIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
          {(__DEV__ || isDevUser()) && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              <TouchableOpacity onPress={handleDevReset} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>DEV RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "#E63946" }}>SIGN OUT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDebugOpen(o => !o)} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(245,166,35,0.08)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "#F5A623" }}>
                  {debugOpen ? "DEBUG \u25BC" : "DEBUG \u25B6"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {(__DEV__ || isDevUser()) && debugOpen && (
          <View style={debugStyles.panel}>
            <Text style={debugStyles.heading}>Autoregulation Loop</Text>

            <Text style={debugStyles.section}>Real-user mode</Text>
            <TouchableOpacity
              style={[debugStyles.simButton, { alignSelf: "flex-start", marginBottom: 8, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 14 }]}
              onPress={() => setDevPrefillOn(toggleDevPrefill())}
            >
              <Text style={debugStyles.simButtonText}>
                Dev pre-fill: {devPrefillOn ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>

            <Text style={debugStyles.section}>Simulate session</Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
              <TouchableOpacity
                style={[debugStyles.simButton, { backgroundColor: "rgba(52,199,89,0.15)" }]}
                onPress={() => handleSimulateSession("easy")}
                disabled={!activeMesocycle}
              >
                <Text style={[debugStyles.simButtonText, { color: "#34C759" }]}>Sim Easy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[debugStyles.simButton, { backgroundColor: "rgba(245,166,35,0.15)" }]}
                onPress={() => handleSimulateSession("moderate")}
                disabled={!activeMesocycle}
              >
                <Text style={[debugStyles.simButtonText, { color: "#F5A623" }]}>Sim Solid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[debugStyles.simButton, { backgroundColor: "rgba(230,57,70,0.15)" }]}
                onPress={() => handleSimulateSession("challenging")}
                disabled={!activeMesocycle}
              >
                <Text style={[debugStyles.simButtonText, { color: "#E63946" }]}>Sim Hard</Text>
              </TouchableOpacity>
            </View>

            <Text style={debugStyles.section}>Cascade pill</Text>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
              <TouchableOpacity
                style={[
                  debugStyles.simButton,
                  {
                    backgroundColor: "rgba(245,166,35,0.15)",
                    paddingHorizontal: 14,
                  },
                ]}
                onPress={handleSimCascade}
                disabled={!activeMesocycle}
              >
                <Text style={[debugStyles.simButtonText, { color: "#F5A623" }]}>
                  Sim cascade
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  debugStyles.simButton,
                  {
                    backgroundColor: "rgba(74,144,217,0.15)",
                    paddingHorizontal: 14,
                  },
                ]}
                onPress={handleSimPatternConflict}
                disabled={!activeMesocycle}
              >
                <Text style={[debugStyles.simButtonText, { color: "#4A90D9" }]}>
                  Sim pattern conflict
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={debugStyles.section}>Streak reset</Text>
            <TouchableOpacity
              style={[
                debugStyles.simButton,
                {
                  backgroundColor: "rgba(230,57,70,0.15)",
                  alignSelf: "flex-start",
                  paddingHorizontal: 14,
                  marginBottom: 8,
                },
              ]}
              onPress={handleSimMissedWeek}
            >
              <Text style={[debugStyles.simButtonText, { color: "#E63946" }]}>
                Sim missed week
              </Text>
            </TouchableOpacity>

            <Text style={debugStyles.section}>Last applied on session start</Text>
            {lastAppliedAdjustments.length === 0 ? (
              <Text style={debugStyles.empty}>(nothing applied yet — finish a session, then start the next)</Text>
            ) : (
              lastAppliedAdjustments.map((line, i) => (
                <Text key={i} style={debugStyles.line}>{"\u2022"} {line}</Text>
              ))
            )}

            <Text style={debugStyles.section}>
              Adaptation queue ({adaptationQueue.items.length} items)
            </Text>
            {adaptationQueue.items.length === 0 ? (
              <Text style={debugStyles.empty}>(empty)</Text>
            ) : (
              adaptationQueue.items.map((item) => (
                <View key={item.id} style={debugStyles.item}>
                  <Text style={debugStyles.itemTitle}>
                    {item.exerciseName} — {item.type}
                  </Text>
                  <Text style={debugStyles.itemMeta}>
                    change: {item.change}
                    {item.weightDeltaKg != null ? ` (${item.weightDeltaKg > 0 ? "+" : ""}${item.weightDeltaKg}kg)` : ""}
                  </Text>
                  <Text style={[
                    debugStyles.itemFlags,
                    { color: item.applied ? "#5A5A5E" : "#F5A623" },
                  ]}>
                    applied: {item.applied ? "YES" : "NO"}  {"\u00B7"}  surfaced: {item.surfaced ? "yes" : "no"}  {"\u00B7"}  response: {item.userResponse ?? "none"}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{streaks.currentDaily}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{streaks.currentWeekly}</Text>
              <Text style={styles.streakLabel}>Week Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{streaks.totalSessions}</Text>
              <Text style={styles.streakLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Program Status */}
        {activeMesocycle && profile?.programPath && (
          <View style={styles.programStatusRow}>
            <Text style={styles.programStatusText}>
              {formatPathName(profile.programPath)}
              {profile.tier ? ` · ${capitalize(profile.tier)}` : ""}
              {sessionInfo ? ` · Week ${sessionInfo.weekNumber}` : ""}
            </Text>
            {sessionInfo?.session?.phase && (
              <Text style={styles.programStatusPhase}>
                {formatPhaseName(sessionInfo.session.phase)}
              </Text>
            )}
          </View>
        )}

        {/* Cascade pill — shows when an earlier missed session was rolled forward to today */}
        {sessionInfo?.cascadedFromDayLabel && !overrideSession && (
          <View style={styles.cascadePill}>
            <Text style={styles.cascadePillText}>
              Moved from {sessionInfo.cascadedFromDayLabel}
            </Text>
            <TouchableOpacity onPress={() => setCascadeUndone(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cascadePillUndo}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Session CTA */}
        {sessionInfo ? (
          <TouchableOpacity
            style={[
              styles.sessionCard,
              !sessionInfo.isToday && { borderColor: colors.border },
              sessionInfo.isCompleted && { borderColor: "#34C75930" },
              isResumable && { backgroundColor: "rgba(245,166,35,0.06)", borderColor: colors.accent },
            ]}
            activeOpacity={0.8}
            onPress={!sessionInfo.isCompleted ? (isResumable ? handleResumeSession : handleStartSession) : undefined}
            onLongPress={!sessionInfo.isCompleted && !isResumable ? () => setSwapModalOpen(true) : undefined}
            delayLongPress={350}
          >
            <View style={[
              styles.sessionBadge,
              !sessionInfo.isToday && { backgroundColor: "rgba(255,255,255,0.06)" },
              sessionInfo.isCompleted && { backgroundColor: "#34C75915" },
              { marginBottom: spacing.sm },
            ]}>
              <Text style={[
                styles.sessionBadgeText,
                !sessionInfo.isToday && { color: colors.textSecondary },
                sessionInfo.isCompleted && { color: "#34C759" },
              ]}>
                {sessionInfo.isCompleted ? "COMPLETED ✓" : isResumable ? "IN PROGRESS" : sessionInfo.isToday ? "TODAY" : "REST DAY"}
              </Text>
            </View>
            <Text style={styles.sessionTitle}>{sessionInfo.session.label}</Text>
            {!sessionInfo.isToday && !sessionInfo.isCompleted && (
              <Text style={styles.nextDayNote}>Next: {sessionInfo.dayLabel}</Text>
            )}
            <Text style={styles.sessionSubtitle}>
              {getSessionSummary(sessionInfo)}
            </Text>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionMetaText}>
                ~{schedule?.sessionDurationMin || 60} min
              </Text>
              <Text style={styles.sessionMetaDot}>·</Text>
              <Text style={styles.sessionMetaText}>
                {getSessionType(sessionInfo.session.label)}
              </Text>
            </View>
            {!sessionInfo.isCompleted && (
              <View style={styles.startRow}>
                <Text style={styles.startText}>
                  {isResumable ? "Resume session →" : sessionInfo.isToday ? "Start Session →" : "Train anyway →"}
                </Text>
                {isResumable && (
                  <Text style={styles.resumeSubtext}>
                    {activeSession!.completedSets.length} {activeSession!.completedSets.length === 1 ? "set" : "sets"} logged so far
                  </Text>
                )}
              </View>
            )}
            {sessionInfo.isCompleted && (
              <View style={styles.startRow}>
                <Text style={[styles.startText, { color: "#34C759", fontWeight: "600" }]}>
                  Session logged ✓
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.sessionCard, { borderColor: colors.border, alignItems: "center", padding: spacing.xl }]}>
            <Text style={{ fontSize: typography.sizes.md, fontWeight: "700", color: colors.textSecondary }}>
              No plan generated yet
            </Text>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.textMuted, marginTop: spacing.xs, textAlign: "center" }}>
              Complete onboarding to get your training plan
            </Text>
          </View>
        )}

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
              const isActive = schedule?.preferredDays.includes(i);
              return (
                <View
                  key={i}
                  style={[
                    styles.dayDot,
                    isActive && styles.dayDotActive,
                    new Date().getDay() === i && { borderWidth: 2, borderColor: colors.text },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayDotText,
                      isActive && styles.dayDotTextActive,
                      new Date().getDay() === i && { color: colors.text },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        {/* Swap session modal */}
        {swapModalOpen && activeMesocycle && (
          <View style={styles.swapModalOverlay}>
            <TouchableOpacity
              style={styles.swapModalBackdrop}
              activeOpacity={1}
              onPress={() => setSwapModalOpen(false)}
            />
            <View style={styles.swapModalSheet}>
              <Text style={styles.swapModalTitle}>Switch session</Text>
              <Text style={styles.swapModalSubtitle}>
                Pick any session from this week. Completed ones are dimmed.
              </Text>
              {getWeekSessions(activeMesocycle, sessionHistory).map(opt => (
                <TouchableOpacity
                  key={opt.session.id}
                  style={[
                    styles.swapOption,
                    opt.completedThisWeek && styles.swapOptionDisabled,
                  ]}
                  disabled={opt.completedThisWeek}
                  onPress={() => {
                    setOverrideSession(opt.session);
                    setSwapModalOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.swapOptionTitle,
                      opt.completedThisWeek && { color: colors.textMuted },
                    ]}>
                      {opt.session.label}
                    </Text>
                    <Text style={styles.swapOptionDay}>
                      {opt.dayLabel} · {opt.session.exercises.length} exercises
                      {opt.completedThisWeek ? " · Done this week" : ""}
                    </Text>
                  </View>
                  {opt.completedThisWeek && (
                    <Text style={styles.swapOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.swapCancelButton}
                onPress={() => setSwapModalOpen(false)}
              >
                <Text style={styles.swapCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gearButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: "900",
    color: colors.accent,
    letterSpacing: -1,
  },
  // Streak
  streakCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  streakItem: { alignItems: "center" },
  streakNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.accent,
  },
  streakLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  streakDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  // Session CTA
  sessionCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  sessionBadge: {
    backgroundColor: colors.accentGlow,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  sessionBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1,
  },
  sessionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  sessionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  nextDayNote: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sessionMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: "500",
  },
  sessionMetaDot: { color: colors.textMuted },
  startRow: { marginTop: spacing.md },
  startText: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.accent,
  },
  resumeSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  // Cascade pill
  cascadePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(245,166,35,0.08)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.4)",
  },
  cascadePillText: {
    fontSize: typography.sizes.sm,
    color: "#F5A623",
    fontWeight: "600",
    flex: 1,
  },
  cascadePillUndo: {
    fontSize: typography.sizes.sm,
    color: "#F5A623",
    fontWeight: "800",
    textDecorationLine: "underline",
    paddingHorizontal: spacing.sm,
  },
  // Program Status
  programStatusRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 4,
  },
  programStatusText: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.3,
  },
  programStatusPhase: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  // Schedule
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  // Week
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayDotActive: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent,
  },
  dayDotText: {
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dayDotTextActive: { color: colors.accent },
  // Swap modal
  swapModalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  swapModalBackdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  swapModalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
  },
  swapModalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  swapModalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  swapOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  swapOptionDisabled: {
    opacity: 0.4,
  },
  swapOptionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  swapOptionDay: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  swapOptionCheck: {
    color: "#34C759",
    fontSize: 18,
    fontWeight: "700",
  },
  swapCancelButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  swapCancelText: {
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});

// ── Dev-only debug panel styles ─────────────────────────────────────────────
const debugStyles = StyleSheet.create({
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(245,166,35,0.04)",
    borderColor: "rgba(245,166,35,0.3)",
    borderWidth: 1,
    borderRadius: radius.md,
  },
  heading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F5A623",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  section: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(245,166,35,0.7)",
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  empty: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontStyle: "italic",
  },
  line: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 2,
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 6,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  itemMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    marginTop: 1,
  },
  itemFlags: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  simButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  simButtonText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
