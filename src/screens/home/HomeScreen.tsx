// =============================================================================
// HomeScreen — Main dashboard after onboarding
// =============================================================================

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "../../store/useStore";
import { colors, typography, spacing, radius } from "../../theme";
import { findCurrentSession, getSessionSummary } from "../../utils/sessionFinder";
import { supabase } from "../../config/supabase";

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
  const sessionHistory = useStore((s) => s.sessionHistory);

  const schedule = profile?.schedule;

  const sessionInfo = activeMesocycle ? findCurrentSession(activeMesocycle, sessionHistory) : null;

  const handleStartSession = () => {
    if (!sessionInfo) return;
    startSession(sessionInfo.session, "long");
    navigation.getParent()?.navigate("Session");
  };

  const handleDevReset = async () => {
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

      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[ARNOLD] Dev reset error:', e);
      await AsyncStorage.clear();
      await supabase.auth.signOut();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {sessionInfo?.isToday ? "Ready to train" : "Rest & recover"}
          </Text>
          <Text style={styles.title}>Arnold</Text>
          {__DEV__ && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              <TouchableOpacity onPress={handleDevReset} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>DEV RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "#E63946" }}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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

        {/* Session CTA */}
        {sessionInfo ? (
          <TouchableOpacity
            style={[
              styles.sessionCard,
              !sessionInfo.isToday && { borderColor: colors.border },
              sessionInfo.isCompleted && { borderColor: "#34C75930" },
            ]}
            activeOpacity={0.8}
            onPress={sessionInfo.isToday && !sessionInfo.isCompleted ? handleStartSession : undefined}
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
                {sessionInfo.isCompleted ? "COMPLETED ✓" : sessionInfo.isToday ? "TODAY" : `NEXT: ${sessionInfo.dayLabel.toUpperCase()}`}
              </Text>
            </View>
            <Text style={styles.sessionTitle}>{sessionInfo.session.label}</Text>
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
            {sessionInfo.isToday && (
              <View style={styles.startRow}>
                <Text style={[styles.startText, sessionInfo.isCompleted && { color: "#34C759", fontWeight: "600" }]}>
                  {sessionInfo.isCompleted ? "Session logged ✓" : "Start Session →"}
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
});
