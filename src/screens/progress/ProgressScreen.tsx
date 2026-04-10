// =============================================================================
// ARNOLD — Progress Dashboard
// PRs, streaks, progression levels, session history.
// =============================================================================

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useStore } from "../../store/useStore";
import { colors, typography, spacing, radius } from "../../theme";
import { PROGRESSIONS, getProgressionTree, GOAL_META } from "../../data/progressions";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function ProgressionBar({
  pattern,
  currentLevel,
  totalLevels,
}: {
  pattern: string;
  currentLevel: number;
  totalLevels: number;
}) {
  const progress = totalLevels > 0 ? currentLevel / totalLevels : 0;
  const tree = getProgressionTree(pattern);
  const currentName = tree[currentLevel]?.name || "—";

  const patternColors: Record<string, string> = {
    pull: "#E63946",
    push: "#F5A623",
    legs: "#2A9D8F",
    core: "#7C5CBF",
    skill: "#F77F00",
  };

  return (
    <View style={styles.progRow}>
      <View style={styles.progHeader}>
        <Text style={[styles.progPattern, { color: patternColors[pattern] || colors.textSecondary }]}>
          {pattern.toUpperCase()}
        </Text>
        <Text style={styles.progLevel}>
          Lvl {currentLevel + 1}/{totalLevels}
        </Text>
      </View>
      <Text style={styles.progName}>{currentName}</Text>
      <View style={styles.progBar}>
        <View
          style={[
            styles.progFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: patternColors[pattern] || colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const streaks = useStore((s) => s.streaks);
  const progressions = useStore((s) => s.userProgressions);
  const history = useStore((s) => s.sessionHistory);
  const goals = useStore((s) => s.onboarding.rankedGoals);

  // Calculate current level per pattern from user progressions
  const patterns = ["pull", "push", "legs", "core", "skill"];
  const patternLevels = patterns.map((p) => {
    const tree = getProgressionTree(p);
    const activeProgression = progressions.find(
      (up) => tree.some((t) => t.id === up.progressionId) && up.status === "active"
    );
    const level = activeProgression
      ? tree.findIndex((t) => t.id === activeProgression.progressionId)
      : 0;
    return { pattern: p, currentLevel: Math.max(0, level), totalLevels: tree.length };
  });

  // Recent sessions
  const recentSessions = history.slice(-5).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>

        {/* Streak cards */}
        <View style={styles.statsRow}>
          <StatCard label="Daily streak" value={streaks.currentDaily} sub={`Best: ${streaks.longestDaily}`} />
          <StatCard label="Weekly streak" value={streaks.currentWeekly} sub={`Best: ${streaks.longestWeekly}`} />
          <StatCard label="Total sessions" value={streaks.totalSessions} />
        </View>

        {/* Progression levels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROGRESSION LEVELS</Text>
          {patternLevels.map((pl) => (
            <ProgressionBar
              key={pl.pattern}
              pattern={pl.pattern}
              currentLevel={pl.currentLevel}
              totalLevels={pl.totalLevels}
            />
          ))}
        </View>

        {/* Goals */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR GOALS</Text>
            {goals.map((g) => {
              const meta = GOAL_META[g.goal];
              if (!meta) return null;
              return (
                <View key={g.goal} style={[styles.goalRow, { borderLeftColor: meta.color }]}>
                  <Text style={styles.goalLabel}>{meta.label}</Text>
                  <Text style={styles.goalRank}>
                    {g.rank === 1 ? "Primary" : g.rank === 2 ? "Secondary" : "Tertiary"}
                    {" · "}
                    {g.rank === 1 ? "~60%" : g.rank === 2 ? "~30%" : "~10%"} volume
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet. Start training!</Text>
          ) : (
            recentSessions.map((s) => {
              const date = new Date(s.startedAt);
              const dayStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <View key={s.id} style={styles.sessionRow}>
                  <View>
                    <Text style={styles.sessionDate}>{dayStr}</Text>
                    <Text style={styles.sessionSets}>
                      {s.completedSets.length} sets · {s.painReports.length > 0 ? `${s.painReports.length} pain reports` : "No pain"}
                    </Text>
                  </View>
                  {s.overallFeeling && (
                    <View style={styles.feelingBadge}>
                      <Text style={styles.feelingText}>
                        {s.overallFeeling >= 4 ? "Great" : s.overallFeeling >= 3 ? "Good" : "Tough"}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent,
  },
  statSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },

  // Progression bars
  progRow: { marginBottom: spacing.md },
  progHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  progPattern: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  progLevel: { fontSize: 11, color: colors.textMuted },
  progName: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  progBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progFill: { height: 4, borderRadius: 2 },

  // Goals
  goalRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  goalLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  goalRank: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Sessions
  emptyText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  sessionDate: { fontSize: 13, fontWeight: "600", color: colors.text },
  sessionSets: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  feelingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${colors.accent}10`,
    borderWidth: 1,
    borderColor: `${colors.accent}20`,
  },
  feelingText: { fontSize: 11, fontWeight: "600", color: colors.accent },
});
