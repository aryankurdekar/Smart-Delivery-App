import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

// Sticky bottom action bar (e.g. cart bar, checkout button).
export default function BottomBar({ children, style }) {
  const { colors, spacing, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        shadows.md,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.gutter,
          paddingTop: spacing.md,
          paddingBottom: spacing.md + (insets.bottom || spacing.sm),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
});
