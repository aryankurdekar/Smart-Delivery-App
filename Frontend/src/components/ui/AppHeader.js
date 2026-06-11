import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

// Standard top bar: back chevron + title (+ subtitle) + optional right slot.
export default function AppHeader({ title, subtitle, onBack, right, style }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: spacing.gutter, backgroundColor: colors.surface, borderBottomColor: colors.border },
        style,
      ]}
    >
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}

      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={[typography.t("subtitle", "semibold"), { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightWrap}>{right || <View style={styles.iconBtn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center" },
  titleWrap: { flex: 1, marginHorizontal: 4 },
  rightWrap: { minWidth: 40, alignItems: "flex-end" },
});
