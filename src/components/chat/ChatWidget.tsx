// =============================================================================
// ARNOLD — Interactive Chat Widget (Core Differentiator)
// Bottom sheet with tappable options (like Claude's UI) + free text.
// Knows full context: program, history, current exercise, difficulty, phase.
// Pain reporting is IN the chat, not a separate modal.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from "react-native";
import { ChatMessage, ChatOption } from "../../types/logging";
import { colors, typography, spacing, radius } from "../../theme";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  messages: ChatMessage[];
  onSendText: (text: string) => void;
  onTapOption: (option: ChatOption, messageId: string) => void;
  onClose: () => void;
  isOpen: boolean;
  /** Disable input while Arnold is "thinking" */
  loading?: boolean;
}

// ── Body Part Chips (for pain reporting in chat) ────────────────────────────

const BODY_PARTS = [
  "Shoulder", "Elbow", "Wrist", "Lower back",
  "Knee", "Neck", "Hip", "Ankle",
];

// ── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onTapOption,
}: {
  message: ChatMessage;
  onTapOption: (option: ChatOption, messageId: string) => void;
}) {
  const isArnold = message.role === "arnold";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <View style={styles.systemMsg}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isArnold ? "flex-start" : "flex-end" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isArnold ? styles.arnoldBubble : styles.userBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isArnold ? styles.arnoldText : styles.userText,
          ]}
        >
          {message.text}
        </Text>
      </View>

      {/* Tappable options below Arnold's messages */}
      {isArnold && message.options && !message.optionSelected && (
        <View style={styles.optionsContainer}>
          {message.options.map((opt) => (
            <TouchableOpacity
              key={opt.id || opt.label || Math.random().toString()}
              style={styles.optionButton}
              onPress={() => onTapOption(opt, message.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Show which option was selected */}
      {isArnold && message.optionSelected && (
        <View style={styles.selectedOptionContainer}>
          <Text style={styles.selectedOptionText}>
            {message.options?.find((o) => o.id === message.optionSelected)?.label}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Pain Severity Picker (inline in chat) ───────────────────────────────────

export function PainSeverityPicker({
  bodyPart,
  onSelect,
}: {
  bodyPart: string;
  onSelect: (severity: number) => void;
}) {
  return (
    <View style={styles.painPickerContainer}>
      <Text style={styles.painPickerLabel}>
        How much does your {bodyPart.toLowerCase()} hurt?
      </Text>
      <View style={styles.painScaleRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const painColor =
            n >= 8 ? colors.danger : n >= 6 ? "#FF6B35" : colors.accent;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.painDot, { borderColor: painColor }]}
              onPress={() => onSelect(n)}
            >
              <Text style={[styles.painDotText, { color: painColor }]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.painLabels}>
        <Text style={styles.painLabel}>Mild</Text>
        <Text style={styles.painLabel}>Moderate</Text>
        <Text style={styles.painLabel}>Severe</Text>
      </View>
    </View>
  );
}

// ── Body Part Selector (inline in chat) ─────────────────────────────────────

export function BodyPartPicker({
  onSelect,
}: {
  onSelect: (part: string) => void;
}) {
  return (
    <View style={styles.bodyPartContainer}>
      <Text style={styles.bodyPartLabel}>Where does it hurt?</Text>
      <View style={styles.bodyPartGrid}>
        {BODY_PARTS.map((part) => (
          <TouchableOpacity
            key={part}
            style={styles.bodyPartChip}
            onPress={() => onSelect(part)}
            activeOpacity={0.7}
          >
            <Text style={styles.bodyPartText}>{part}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main Chat Widget ────────────────────────────────────────────────────────

export default function ChatWidget({
  messages,
  onSendText,
  onTapOption,
  onClose,
  isOpen,
  loading = false,
}: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animate open/close
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSendText(trimmed);
    setInput("");
  }, [input, loading, onSendText]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!isOpen) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Arnold</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} onTapOption={onTapOption} />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, { animationDelay: "0.2s" }]} />
            <View style={[styles.typingDot, { animationDelay: "0.4s" }]} />
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Arnold anything..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              input.trim() ? styles.sendActive : styles.sendInactive,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  headerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },

  // Bubbles
  bubbleRow: {
    marginBottom: spacing.sm,
  },
  bubble: {
    maxWidth: "85%",
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  arnoldBubble: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  userBubble: {
    backgroundColor: `${colors.accent}18`,
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
    alignSelf: "flex-end",
  },
  bubbleText: {
    fontSize: typography.sizes.sm + 1,
    lineHeight: 20,
  },
  arnoldText: {
    color: "rgba(255,255,255,0.78)",
  },
  userText: {
    color: colors.accent,
  },

  // System messages
  systemMsg: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  systemText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },

  // Options (tappable buttons below Arnold's messages)
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    maxWidth: "85%",
  },
  optionButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
    backgroundColor: `${colors.accent}0C`,
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    color: colors.accent,
  },
  selectedOptionContainer: {
    marginTop: 6,
    maxWidth: "85%",
  },
  selectedOptionText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // Pain picker (inline)
  painPickerContainer: {
    maxWidth: "85%",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  painPickerLabel: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.5)",
    marginBottom: spacing.sm,
  },
  painScaleRow: {
    flexDirection: "row",
    gap: 4,
  },
  painDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  painDotText: {
    fontSize: 11,
    fontWeight: "700",
  },
  painLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  painLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Body part picker (inline)
  bodyPartContainer: {
    maxWidth: "85%",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  bodyPartLabel: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.5)",
    marginBottom: spacing.sm,
  },
  bodyPartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  bodyPartChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
    backgroundColor: `${colors.danger}08`,
  },
  bodyPartText: {
    fontSize: 12,
    fontWeight: "600",
    color: `${colors.danger}CC`,
  },

  // Typing indicator
  typingRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${colors.accent}60`,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sendActive: {
    backgroundColor: `${colors.accent}25`,
  },
  sendInactive: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
});
