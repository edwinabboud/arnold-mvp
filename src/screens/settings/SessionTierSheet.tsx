// =============================================================================
// ARNOLD — Session Tier Sheet (MVP 1.18 / v2.4.7)
// Settings → Training → Session length. Pick Compact / Standard / Recommended.
// Recommended is the default for new users; Compact and Standard are explicit
// opt-ins. Switching mid-mesocycle re-applies path-specific cuts to uncompleted
// sessions (one-way ratchet — see applyCutsForTier JSDoc in planGenerator).
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
import type { SessionLog, SessionTier } from "../../types";

interface SessionTierSheetProps {
  visible: boolean;
  initialTier: SessionTier;
  onClose: () => void;
}

interface TierOption {
  tier: SessionTier;
  label: string;
  duration: string;
  blurb: string;
  recommended?: boolean;
}

const OPTIONS: TierOption[] = [
  {
    tier: "compact",
    label: "Compact",
    duration: "~40 min",
    blurb: "Warm-up + main lift + 1 accessory. Skip finisher/conditioning.",
  },
  {
    tier: "standard",
    label: "Standard",
    duration: "~60 min",
    blurb: "Warm-up + main lift + 2 accessories. Skip finisher/conditioning.",
  },
  {
    tier: "recommended",
    label: "Recommended",
    duration: "~90 min",
    blurb: "Full program — warm-up, main lift, accessories, finisher. Best results.",
    recommended: true,
  },
];

/** Mon-start week match (matches sessionFinder convention). */
function hasLoggedThisWeek(sessionHistory: SessionLog[]): boolean {
  const now = new Date();
  const daysSinceMon = (now.getDay() + 6) % 7; // Sun→6, Mon→0
  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceMon);
  start.setHours(0, 0, 0, 0);
  return sessionHistory.some((log) => new Date(log.startedAt) >= start);
}

export default function SessionTierSheet({
  visible,
  initialTier,
  onClose,
}: SessionTierSheetProps) {
  const setSessionTier = useStore((s) => s.setSessionTier);
  const activeMesocycle = useStore((s) => s.activeMesocycle);
  const sessionHistory = useStore((s) => s.sessionHistory);
  const [selectedTier, setSelectedTier] = useState<SessionTier>(initialTier);

  // Reset draft state when the sheet (re-)opens so a cancelled edit doesn't
  // leak into the next open.
  useEffect(() => {
    if (visible) setSelectedTier(initialTier);
  }, [visible, initialTier]);

  const canSave = selectedTier !== initialTier;

  const performSave = () => {
    setSessionTier(selectedTier);
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    // Mid-mesocycle switch with sessions already logged this week → confirm.
    // (Spec amendment §"Change 5" says this should trigger Plan Realignment,
    // which isn't built yet; using a simple confirm as interim per the
    // 1.18 prompt's directive.)
    const needsConfirm = !!activeMesocycle && hasLoggedThisWeek(sessionHistory);
    if (needsConfirm) {
      Alert.alert(
        "Switch session length?",
        "Switching tier now will apply from your next session. Completed sessions stay logged.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Switch", onPress: performSave },
        ],
      );
    } else {
      performSave();
    }
  };

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
          <Text style={styles.title}>Session length</Text>
          <TouchableOpacity onPress={handleSave} hitSlop={12} disabled={!canSave}>
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {OPTIONS.map((opt) => {
            const selected = opt.tier === selectedTier;
            return (
              <TouchableOpacity
                key={opt.tier}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setSelectedTier(opt.tier)}
                activeOpacity={0.7}
              >
                <View style={styles.optionTopRow}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionDuration, selected && styles.optionDurationSelected]}>
                    {opt.duration}
                  </Text>
                </View>
                <Text style={styles.optionBlurb}>{opt.blurb}</Text>
                {opt.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <Text style={styles.note}>
            Switching to a longer tier mid-mesocycle won't restore exercises that
            were dropped from upcoming sessions — those return on your next
            mesocycle. Main-lift warm-up sets stay full at every tier.
          </Text>
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
  option: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  optionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.accent,
  },
  optionDuration: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  optionDurationSelected: {
    color: colors.accent,
  },
  optionBlurb: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  recommendedBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.accent,
  },
  note: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: spacing.lg,
    fontStyle: "italic",
  },
});
