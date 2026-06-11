import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Segmented control / category chip / quick-reply pill.
export default function Pill({ label, active, onPress, activeColor, style }) {
  const { colors, radii, typography, spacing } = useTheme();
  const ac = activeColor || colors.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          borderWidth: 1,
          backgroundColor: active ? ac : colors.surface,
          borderColor: active ? ac : colors.border,
          marginRight: spacing.sm,
        },
        style,
      ]}
    >
      <Text style={[typography.t("footnote", "semibold"), { color: active ? "#FFFFFF" : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
