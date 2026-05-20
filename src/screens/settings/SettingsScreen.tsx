// =============================================================================
// ARNOLD — Settings Screen
// Account: email, sign out, delete. About: version + ToS/Privacy placeholders.
// Spec ref: v2.4.3 amendment §15.1.
// =============================================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { colors, typography, spacing, radius } from "../../theme";
import { supabase } from "../../config/supabase";
import DeleteAccountDialog from "./DeleteAccountDialog";
import { DISCLAIMER_PARAGRAPH_1, DISCLAIMER_PARAGRAPH_2 } from "../../components/DisclaimerModal";

type Placeholder = "terms" | "privacy" | "disclaimers" | null;

export default function SettingsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [email, setEmail] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState<Placeholder>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const version = Constants.expoConfig?.version ?? "—";

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{email || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Sign out</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => setDeleteOpen(true)} activeOpacity={0.6}>
            <Text style={styles.rowLabelDestructive}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => setPlaceholder("terms")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => setPlaceholder("privacy")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => setPlaceholder("disclaimers")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Disclaimers</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteAccountDialog visible={deleteOpen} onCancel={() => setDeleteOpen(false)} />

      <Modal
        visible={placeholder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaceholder(null)}
      >
        <View style={styles.placeholderBackdrop}>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>
              {placeholder === "terms"
                ? "Terms of Service"
                : placeholder === "privacy"
                ? "Privacy Policy"
                : "Disclaimers"}
            </Text>
            {placeholder === "disclaimers" ? (
              <ScrollView style={styles.disclaimerScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.placeholderBody}>{DISCLAIMER_PARAGRAPH_1}</Text>
                <Text style={styles.placeholderBody}>{DISCLAIMER_PARAGRAPH_2}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.placeholderBody}>
                {placeholder === "terms"
                  ? "Terms coming before public launch."
                  : "Privacy policy coming before public launch."}
              </Text>
            )}
            <TouchableOpacity
              style={styles.placeholderClose}
              onPress={() => setPlaceholder(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.placeholderCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: "600",
    width: 60,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: "500",
  },
  rowLabelDestructive: {
    fontSize: typography.sizes.base,
    color: colors.danger,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    maxWidth: "60%",
    textAlign: "right",
  },
  rowChevron: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  placeholderBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  placeholderCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholderBody: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  disclaimerScroll: {
    maxHeight: 360,
    marginBottom: spacing.xs,
  },
  placeholderClose: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderCloseText: {
    fontSize: typography.sizes.base,
    fontWeight: "800",
    color: colors.bg,
  },
});
