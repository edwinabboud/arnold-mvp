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
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { ChatMessage, ChatOption } from "../../types/logging";
import { colors, typography, spacing, radius } from "../../theme";

// `Animated` (the old RN API) is kept ONLY for the TypingIndicator's three
// pulsing dots — they live in their own subtree and never share a node with
// the chat container, so there's no animation-system conflict.
//
// The chat container itself uses Reanimated (`Reanimated.View`). Both the
// open/close lift and the keyboard tracking are combined into ONE
// `useAnimatedStyle` transform on the container, so there is exactly one
// animation system driving the container's transform. This is the post-
// crash guarantee: never stack the RN Animated transform AND a Reanimated
// transform on the same view.

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

// ── Typing Indicator (animated, native-driven) ──────────────────────────────
//
// Three dots that pulse in opacity, staggered. Lives in its own subtree
// well below the chat container's Animated.View, so its native driver
// does not interact with the container — no chance of the 961673b
// crash class.
//
// (The previous static dots used `animationDelay: "0.2s"` — a CSS web
// prop that does nothing in RN and shows up as a TS error in the baseline.
// Those errors disappear with this component.)

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const loops = dots.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(val, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 380, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((val, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: val }]} />
      ))}
    </View>
  );
}

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
  // Bottom inset for home-indicator clearance on iPhone X+ — applied only to
  // the input row, never as a vertical offset for any keyboard math.
  const insets = useSafeAreaInsets();

  // ── Animation system: Reanimated, single transform on the container ─────
  //
  // `openProgress` (0 → 1) drives the open/close lift; the keyboard
  // animation comes in as Reanimated shared values from
  // `useReanimatedKeyboardAnimation`. Both feed a SINGLE `useAnimatedStyle`
  // transform on the container, so the container has exactly one animation
  // system driving it. This is the post-961673b invariant.
  const openProgress = useSharedValue(0);
  useEffect(() => {
    openProgress.value = withSpring(isOpen ? 1 : 0, {
      damping: 16,
      stiffness: 90,
      mass: 1,
    });
  }, [isOpen, openProgress]);

  // Native keyboard tracking. `height` is the y-coordinate of the keyboard's
  // top edge as a Reanimated shared value — negative when the keyboard is
  // visible (e.g. -300), zero when it's closed. Updated frame-by-frame on
  // the UI thread, so applying it as `translateY` makes the sheet move in
  // lockstep with the keyboard.
  const keyboard = useReanimatedKeyboardAnimation();

  const animatedContainerStyle = useAnimatedStyle(() => {
    // Off-screen at 600px when closed, settled at 0 when open. Add the
    // keyboard's (negative) y on top so the sheet lifts with the keyboard.
    const openTY = interpolate(openProgress.value, [0, 1], [600, 0]);
    return {
      transform: [{ translateY: openTY + keyboard.height.value }],
    };
  });

  // Auto-scroll to bottom on new message.
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

  // v2.4.8 §5.1 — if the last Arnold message still awaiting a response is a
  // pure-tappable turn (e.g. the §1.6 RPE calibration set), the composer is
  // hidden until the user taps a chip. "Never make the user type a number
  // on a scale." Defaults to showing the composer when no signal is present.
  const composerHidden = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "arnold") continue;
      if (!m.options || m.optionSelected) continue;
      return m.inputMode === "tappable_only";
    }
    return false;
  })();

  if (!isOpen) return null;

  return (
    <Reanimated.View style={[styles.container, animatedContainerStyle]}>
      {/*
       * Near-full-height (92%) absolute bottom-sheet anchored at `bottom: 0`,
       * leaving a small peek of the workout screen at the top. WhatsApp-style
       * column: header (fixed) → FlatList (flex:1, scrolls, newest at bottom)
       * → input row (fixed, pinned to bottom).
       *
       * CRITICAL CRASH GUARD: the container is a Reanimated.View driven by a
       * SINGLE `useAnimatedStyle` transform. That style combines two
       * Reanimated shared values (open/close `openProgress` + native
       * keyboard tracking from `useReanimatedKeyboardAnimation`) into one
       * `translateY`. There is exactly one animation system on this node.
       * The RN `Animated` import is used ONLY by the TypingIndicator dots
       * in their own subtree — they never share a node with the container.
       * Do NOT add an RN `Animated.View` transform alongside the Reanimated
       * one on this container — that's the same class of conflict as
       * 961673b (different APIs, same trap).
       */}
      <View style={styles.keyboardView}>
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

        {/* Messages — flex:1 so it fills space between header and input row,
            pushing the input row to the bottom of the sheet. Newest message
            sits at the visual bottom because content stacks top-down and
            auto-scrollToEnd pins the latest into view. */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} onTapOption={onTapOption} />
          )}
          style={styles.list}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator — animated pulse, replaces the prior static dots. */}
        {loading && <TypingIndicator />}

        {/* Input — hidden for pure-tappable turns per v2.4.8 §5.1. The
            bottom padding picks the larger of `spacing.lg` and the
            home-indicator inset so the input clears the iPhone X+ home
            indicator. When the keyboard is open, the sheet is lifted
            natively by the keyboard-controller transform; this padding
            then shows as a small (24–34pt) clearance above the keyboard
            top, which is acceptable and matches HIG-style buffering. */}
        {!composerHidden && (
          <View
            style={[
              styles.inputRow,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Arnold anything..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              /*
               * `editable` is intentionally always true. WhatsApp-style:
               * the user can keep typing the next message while Arnold's
               * reply is still in flight. Send is still gated on `loading`
               * below so two requests can't fire at once.
               */
              onFocus={() => {
                // Re-pin the newest message the moment the keyboard
                // begins to appear, before the native lift completes.
                setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
              }}
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
        )}
      </View>
    </Reanimated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "92%",
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
  list: {
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

  // Input — paddingBottom is set inline based on safe-area inset.
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
