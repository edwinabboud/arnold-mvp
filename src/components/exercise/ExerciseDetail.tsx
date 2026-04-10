// =============================================================================
// ARNOLD — Exercise Detail View
// Temporary stand-in for the 3D viewer. Shows form cues, target muscles,
// common mistakes, and why this exercise is in the plan.
// Built as a view layer over exercise knowledge data — will be replaced by
// the 3D viewer in Phase 2. Do not design as permanent solution.
// =============================================================================

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { colors, typography, spacing, radius } from "../../theme";
import { EXERCISE_KB, ExerciseKnowledge } from "../../data/exerciseKnowledge";
import { PROGRESSIONS } from "../../data/progressions";

interface ExerciseDetailProps {
  progressionId: string;
  onClose: () => void;
  /** Is this the first time the user sees this exercise? */
  isNew?: boolean;
  /** Why it's in today's session (contextual coaching note) */
  sessionContext?: string;
  exerciseName?: string;
  exerciseNotes?: string;
}

function InfoSection({
  title,
  items,
  color = colors.textSecondary,
  bullet = "•",
}: {
  title: string;
  items: string[];
  color?: string;
  bullet?: string;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={[styles.bullet, { color }]}>{bullet}</Text>
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function MuscleTag({
  name,
  type,
}: {
  name: string;
  type: "primary" | "secondary";
}) {
  const isPrimary = type === "primary";
  return (
    <View
      style={[
        styles.muscleTag,
        {
          backgroundColor: isPrimary ? "#E6394615" : "#F5A62310",
          borderColor: isPrimary ? "#E6394630" : "#F5A62320",
        },
      ]}
    >
      <View
        style={[
          styles.muscleDot,
          { backgroundColor: isPrimary ? "#E63946" : "#F5A623" },
        ]}
      />
      <Text
        style={[
          styles.muscleText,
          { color: isPrimary ? "#E63946" : "#F5A623" },
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

export default function ExerciseDetail({
  progressionId,
  onClose,
  isNew = false,
  sessionContext,
  exerciseName,
  exerciseNotes,
}: ExerciseDetailProps) {
  const knowledge = EXERCISE_KB[progressionId];
  const progression = PROGRESSIONS.find((p) => p.id === progressionId);

  if (!knowledge || !progression) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.exerciseName}>{exerciseName || "Exercise"}</Text>
          <Text style={styles.patternLabel}>
            {progressionId === "warmup" ? "WARM-UP" : progressionId === "cooldown" ? "COOLDOWN" : progressionId === "prehab" ? "PREHAB" : "EXERCISE"}
          </Text>
          {exerciseNotes && (
            <View style={styles.contextBox}>
              <Text style={styles.contextText}>{exerciseNotes}</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.gotItButton}>
            <Text style={styles.gotItText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW EXERCISE</Text>
          </View>
        )}

        <Text style={styles.exerciseName}>{progression.name}</Text>

        <Text style={styles.patternLabel}>
          {progression.pattern.toUpperCase()} · Level {progression.order + 1}
        </Text>

        {/* Session context (why it's in today's plan) */}
        {sessionContext && (
          <View style={styles.contextBox}>
            <Text style={styles.contextText}>{sessionContext}</Text>
          </View>
        )}

        {/* Muscle activation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MUSCLE ACTIVATION</Text>
          <View style={styles.muscleGrid}>
            {knowledge.primaryMuscles.map((m) => (
              <MuscleTag key={m} name={m} type="primary" />
            ))}
            {knowledge.secondaryMuscles.map((m) => (
              <MuscleTag key={m} name={m} type="secondary" />
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#E63946" }]} />
              <Text style={styles.legendText}>Primary</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F5A623" }]} />
              <Text style={styles.legendText}>Secondary</Text>
            </View>
          </View>
        </View>

        {/* Form cues */}
        <InfoSection
          title="FORM CUES"
          items={progression.cues}
          color={colors.accent}
          bullet="→"
        />

        {/* Common mistakes */}
        <InfoSection
          title="COMMON MISTAKES"
          items={knowledge.commonMistakes}
          color={colors.danger}
          bullet="✕"
        />

        {/* Breathing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BREATHING</Text>
          <Text style={styles.breathingText}>{knowledge.breathing}</Text>
        </View>

        {/* Why it's in the plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHY THIS EXERCISE</Text>
          <Text style={styles.whyText}>{knowledge.whyInPlan}</Text>
        </View>

        {/* Contraindications */}
        {knowledge.contraindications.length > 0 && (
          <InfoSection
            title="CAUTION"
            items={knowledge.contraindications}
            color={colors.danger}
            bullet="⚠"
          />
        )}

        {/* Reps/sets info */}
        <View style={styles.repInfo}>
          <View style={styles.repItem}>
            <Text style={styles.repLabel}>TARGET</Text>
            <Text style={styles.repValue}>
              {progression.targetSets} × {progression.targetReps}
              {progression.isIsometric ? "s" : " reps"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.gotItButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.gotItText}>
            {isNew ? "Got it — start training" : "Close"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: "center",
    marginTop: spacing.xxl,
  },

  // Header
  newBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.accent}15`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 2,
  },
  exerciseName: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 32,
    marginBottom: 4,
  },
  patternLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  // Context box
  contextBox: {
    backgroundColor: `${colors.accent}08`,
    borderWidth: 1,
    borderColor: `${colors.accent}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  contextText: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 20,
    fontStyle: "italic",
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  itemText: {
    flex: 1,
    fontSize: typography.sizes.sm + 1,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },

  // Muscles
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.sm,
  },
  muscleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  muscleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Breathing
  breathingText: {
    fontSize: typography.sizes.sm + 1,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
  },

  // Why
  whyText: {
    fontSize: typography.sizes.sm + 1,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
  },

  // Reps
  repInfo: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  repItem: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  repLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  repValue: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  gotItButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  gotItText: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.bg,
  },
});
