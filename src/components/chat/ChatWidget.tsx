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
  Keyboard,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatMessage, ChatOption } from "../../types/logging";
import { colors, typography, spacing, radius } from "../../theme";

// LayoutAnimation drives the keyboard-lift glide (see `setKbHeight` calls
// below). On Android, the API ships disabled and must be opted in once at
// module load — iOS has it on by default.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const slideAnim = useRef(new Animated.Value(0)).current;
  // Bottom inset for home-indicator clearance on iPhone X+ — applied only to
  // the input row, never as a vertical offset for any keyboard math.
  const insets = useSafeAreaInsets();
  // Keyboard height as a *plain* useState number — NOT an Animated.Value.
  // Applied as `marginBottom` on the container so the whole sheet
  // (including the bottom-pinned input row) lifts above the keyboard. A
  // plain number is a re-render, not an animation, so it CANNOT conflict
  // with the native-driven `translateY` on the same node (that mix was
  // the 961673b crash). KeyboardAvoidingView with behavior="padding"
  // didn't work here because the sheet is a fixed-height absolute
  // container — padding inside it gets absorbed/clipped rather than
  // lifting the input row.
  const [kbHeight, setKbHeight] = useState(0);

  // Animate open/close — softer spring than the earlier (65/11) config so
  // the sheet glides in rather than snapping.
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
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

  // Track keyboard height in plain state. iOS gets `keyboardWillShow/Hide`
  // (fires slightly before the keyboard animates in, matches the system
  // curve more naturally); Android only ships `keyboardDidShow/Hide`.
  //
  // We call `LayoutAnimation.configureNext` immediately before each
  // `setKbHeight` so the resulting `marginBottom` change on the container
  // glides instead of snapping. This is intentionally LayoutAnimation, NOT
  // Animated — LayoutAnimation animates layout at the native-layout level
  // and does NOT create an Animated.Value, so the container's lone
  // native-driven `translateY` transform is unaffected. (Mixing an
  // Animated.Value lift with the native-driven transform was the 961673b
  // crash; LayoutAnimation has no such risk.)
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      // iOS keyboard events carry a duration matching the system curve;
      // Android usually doesn't — fall back to a sane default.
      const duration = (e as { duration?: number }).duration ?? 250;
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          duration,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity,
        ),
      );
      setKbHeight(e.endCoordinates.height);
      // Latest message would otherwise sit just behind the input row
      // after the sheet lifts.
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvt, (e) => {
      const duration = (e as { duration?: number }).duration ?? 200;
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          duration,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity,
        ),
      );
      setKbHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!isOpen) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
        // Plain number from useState — re-render, NOT an animation. Lifts
        // the whole sheet (incl. bottom-pinned input row) above the
        // keyboard. Because this is a JS layout value (not an
        // Animated.Value), it CANNOT conflict with the native-driven
        // `translateY` above. KeyboardAvoidingView was removed: its
        // `behavior="padding"` was unreliable inside this fixed-height
        // absolute sheet.
        { marginBottom: kbHeight },
      ]}
    >
      {/*
       * Near-full-height (92%) absolute bottom-sheet anchored at `bottom: 0`,
       * leaving a small peek of the workout screen at the top. WhatsApp-style
       * column: header (fixed) → FlatList (flex:1, scrolls, newest at bottom)
       * → input row (fixed, pinned to bottom).
       *
       * CRITICAL CRASH GUARD: the parent Animated.View carries ONLY a
       * native-driven `translateY` transform. The `marginBottom: kbHeight`
       * above is a plain useState number — applying it triggers a normal
       * re-render, not an Animated update — so there is no second animated
       * driver on the node. Mixing a JS-driven Animated.Value with a
       * native-driven transform on the same node crashes the app (961673b).
       * NEVER convert `kbHeight` to `Animated.Value` without also moving
       * `translateY` off the native driver. Re-render ≠ animation.
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

        {/* Input — hidden for pure-tappable turns per v2.4.8 §5.1. When the
            keyboard is closed, the bottom padding picks the larger of
            `spacing.lg` and the home-indicator inset. When the keyboard
            is open, the sheet is lifted by `marginBottom: kbHeight` so the
            home indicator is already covered by the keyboard — collapse
            the padding to `spacing.sm` to avoid an unnecessary gap above
            the keyboard top. */}
        {!composerHidden && (
          <View
            style={[
              styles.inputRow,
              {
                paddingBottom:
                  kbHeight > 0 ? spacing.sm : Math.max(insets.bottom, spacing.lg),
              },
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
              editable={!loading}
              onFocus={() => {
                // Belt-and-suspenders re-pin: the keyboard listener also
                // calls scrollToEnd on `keyboardWill/DidShow`, but onFocus
                // fires a hair earlier on iOS — keeps the newest message
                // visible the instant the sheet lifts.
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
