// =============================================================================
// ARNOLD — Delete Account Confirmation Dialog
// Remote-first deletion. Local state is wiped ONLY after the server confirms.
// Required by Apple guideline 5.1.1(v).
// =============================================================================

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, typography, spacing, radius } from "../../theme";
import { useStore } from "../../store/useStore";
import { supabase } from "../../config/supabase";
import { deleteAccount } from "../../engine/api";

interface DeleteAccountDialogProps {
  visible: boolean;
  onCancel: () => void;
}

export default function DeleteAccountDialog({ visible, onCancel }: DeleteAccountDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetForAccountDeletion = useStore((s) => s.resetForAccountDeletion);

  const handleCancel = () => {
    if (deleting) return;
    setError(null);
    onCancel();
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      // 1. Remote first — if this fails, local state stays intact.
      await deleteAccount();

      // 2. Server confirmed deletion. Wipe local.
      resetForAccountDeletion();
      await AsyncStorage.clear();

      // 3. Sign out. onAuthStateChange in navigation flips to AuthStack.
      await supabase.auth.signOut();
      // Dialog unmounts when its parent screen does. No explicit nav call needed.
    } catch (e) {
      console.error("[ARNOLD] DeleteAccountDialog error:", e);
      setError("Couldn't delete account. Check your connection and try again.");
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.body}>
            This permanently deletes your profile, training history, progression data,
            and chat history. Cannot be undone.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.cancelButton, deleting && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <View style={styles.deletingRow}>
                <ActivityIndicator size="small" color={colors.danger} />
                <Text style={styles.deleteText}>Deleting…</Text>
              </View>
            ) : (
              <Text style={styles.deleteText}>Delete forever</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  cancelButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cancelText: {
    fontSize: typography.sizes.md,
    fontWeight: "800",
    color: colors.bg,
    letterSpacing: -0.3,
  },
  deleteButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.danger,
  },
  deletingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
