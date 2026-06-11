import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

// Standard screen wrapper: safe-area + optional scroll + optional padding.
export default function Screen({
  children,
  scroll = false,
  padded = false,
  edges = ["top"],
  style,
  contentStyle,
  backgroundColor,
}) {
  const { colors, spacing } = useTheme();
  const bg = backgroundColor || colors.background;
  const pad = padded ? { padding: spacing.gutter } : null;

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: bg }, style]}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
