import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Lightweight shimmer placeholder (uses built-in Animated; no extra deps).
export default function Skeleton({ width = "100%", height = 16, radius, style }) {
  const { colors, radii } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius != null ? radius : radii.sm, backgroundColor: colors.surfaceAlt, opacity },
        style,
      ]}
    />
  );
}
