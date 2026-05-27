// =============================================================================
// ARNOLD — Edit Schedule Sheet (MVP 1.17)
// Settings → Training schedule. Edit daysPerWeek + preferredDays post-onboarding.
// Saves via setProfileSchedule (which rebalances uncompleted mesocycle sessions
// to the new preferredDays). Does NOT change split or sessionDurationMin.
// Confirms before reducing days (sessions get dropped from upcoming weeks).
// Not Plan Realignment (§4.5.3, post-MVP) — this is the simple MVP gap fill.
// =============================================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store/useStore";
import { colors, typography, spacing, radius } from "../../theme";
import type { Schedule } from "../../types";

interface EditScheduleSheetProps {
  visible: boolean;
  initialSchedule: Schedule;
  onClose: () => void;
}

const DAYS_OPTIONS = [2, 3, 4, 5, 6];
// 0=Sun…6=Sat, matching the Schedule.preferredDays convention.
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function EditScheduleSheet({
  visible,
  initialSchedule,
  onClose,
}: EditScheduleSheetProps) {
  const setProfileSchedule = useStore((s) => s.setProfileSchedule);
  const [daysPerWeek, setDaysPerWeek] = useState(initialSchedule.daysPerWeek);
  const [preferredDays, setPreferredDays] = useState<number[]>(
    initialSchedule.preferredDays,
  );

  // Reset draft state whenever the sheet opens so a cancelled edit doesn't
  // leak into the next open.
  useEffect(() => {
    if (visible) {
      setDaysPerWeek(initialSchedule.daysPerWeek);
      setPreferredDays(initialSchedule.preferredDays);
    }
  }, [visible, initialSchedule.daysPerWeek, initialSchedule.preferredDays]);

  const handleDaysChange = (n: number) => {
    setDaysPerWeek(n);
    // Auto-trim preferredDays from the end if it exceeds the new cap. The user
    // can re-pick any combination; this just keeps the UI consistent.
    setPreferredDays((curr) => (curr.length > n ? curr.slice(0, n) : curr));
  };

  const toggleDay = (dayIdx: number) => {
    setPreferredDays((curr) => {
      if (curr.includes(dayIdx)) return curr.filter((d) => d !== dayIdx);
      if (curr.length >= daysPerWeek) return curr; // already full
      return [...curr, dayIdx].sort((a, b) => a - b);
    });
  };

  const canSave = preferredDays.length === daysPerWeek;
  const isDecreasing = daysPerWeek < initialSchedule.daysPerWeek;
  const isUnchanged =
    daysPerWeek === initialSchedule.daysPerWeek &&
    preferredDays.length === initialSchedule.preferredDays.length &&
    preferredDays.every((d, i) => d === [...initialSchedule.preferredDays].sort((a, b) => a - b)[i]);

  const performSave = () => {
    // Preserve split + sessionDurationMin; only edit days fields.
    setProfileSchedule({
      ...initialSchedule,
      daysPerWeek,
      preferredDays,
    });
    onClose();
  };

  const handleSave = () => {
    if (!canSave || isUnchanged) return;
    if (isDecreasing) {
      const dropped = initialSchedule.daysPerWeek - daysPerWeek;
      Alert.alert(
        "Reduce training days?",
        `This will remove up to ${dropped} session${dropped > 1 ? "s" : ""} per upcoming week from your plan. Completed sessions stay logged.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reduce", style: "destructive", onPress: performSave },
        ],
      );
    } else {
      performSave();
    }
  };

  const remaining = daysPerWeek - preferredDays.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Training schedule</Text>
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={12}
            disabled={!canSave || isUnchanged}
          >
            <Text
              style={[
                styles.saveText,
                (!canSave || isUnchanged) && styles.saveTextDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionLabel}>DAYS PER WEEK</Text>
          <View style={styles.daysRow}>
            {DAYS_OPTIONS.map((n) => {
              const active = n === daysPerWeek;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.daysButton, active && styles.daysButtonActive]}
                  onPress={() => handleDaysChange(n)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.daysButtonText,
                      active && styles.daysButtonTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
            PREFERRED DAYS
          </Text>
          <Text style={styles.counter}>
            Selected {preferredDays.length} of {daysPerWeek} day
            {daysPerWeek > 1 ? "s" : ""}
          </Text>
          <View style={styles.dayChipsRow}>
            {DAY_LABELS.map((label, i) => {
              const selected = preferredDays.includes(i);
              const full = !selected && preferredDays.length >= daysPerWeek;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayChip,
                    selected && styles.dayChipSelected,
                    full && styles.dayChipDisabled,
                  ]}
                  onPress={() => !full && toggleDay(i)}
                  disabled={full}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selected && styles.dayChipTextSelected,
                      full && styles.dayChipTextDisabled,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!canSave && (
            <Text style={styles.hint}>
              Pick {remaining} more day{remaining > 1 ? "s" : ""} to save.
            </Text>
          )}

          {isDecreasing && canSave && (
            <Text style={styles.warning}>
              You'll be asked to confirm — reducing days drops up to{" "}
              {initialSchedule.daysPerWeek - daysPerWeek} session
              {initialSchedule.daysPerWeek - daysPerWeek > 1 ? "s" : ""} per
              upcoming week.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  cancelText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  saveText: {
    fontSize: typography.sizes.base,
    color: colors.accent,
    fontWeight: "700",
  },
  saveTextDisabled: {
    color: colors.textMuted,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  sectionLabelSpaced: {
    marginTop: spacing.xl,
  },
  // Days-per-week picker
  daysRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  daysButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  daysButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  daysButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  daysButtonTextActive: {
    color: colors.accent,
  },
  counter: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  // Day-of-week chips
  dayChipsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  dayChipDisabled: {
    opacity: 0.35,
  },
  dayChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.accent,
  },
  dayChipTextDisabled: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  warning: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
