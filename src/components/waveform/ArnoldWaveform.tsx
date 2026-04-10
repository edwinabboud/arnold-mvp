// =============================================================================
// ARNOLD — Waveform Component
// Siri-style animated waveform. Works in React Native without canvas.
// Uses Animated API for smooth bar animations.
// =============================================================================

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface WaveformProps {
  speaking: boolean;
  size?: "compact" | "full";
}

const BAR_COUNT = 24;
const WAVE_COLORS = [colors.accent, colors.accentDim, "#E87B30", colors.accent, "#C4841D"];

export default function ArnoldWaveform({ speaking, size = "full" }: WaveformProps) {
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) => {
      const baseHeight = speaking ? 0.3 + Math.sin(i * 0.5) * 0.35 : 0.1;
      const toValue = speaking
        ? baseHeight + Math.random() * 0.35
        : 0.08 + Math.sin(i * 0.3) * 0.07;

      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue,
            duration: speaking ? 200 + Math.random() * 300 : 800 + Math.random() * 400,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: speaking ? 0.1 + Math.random() * 0.3 : 0.05 + Math.sin(i * 0.2) * 0.05,
            duration: speaking ? 200 + Math.random() * 300 : 800 + Math.random() * 400,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [speaking]);

  const maxHeight = size === "full" ? 48 : 28;
  const barWidth = size === "full" ? 3 : 2;
  const gap = size === "full" ? 3 : 2;

  return (
    <View style={[styles.container, { height: maxHeight }]}>
      {anims.map((anim, i) => {
        const colorIdx = i % WAVE_COLORS.length;
        const height = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [2, maxHeight],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.2, speaking ? 0.6 : 0.25, speaking ? 0.9 : 0.35],
        });

        return (
          <Animated.View
            key={i}
            style={{
              width: barWidth,
              height,
              borderRadius: barWidth / 2,
              backgroundColor: WAVE_COLORS[colorIdx],
              opacity,
              marginHorizontal: gap / 2,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
