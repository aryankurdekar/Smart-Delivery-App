import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { useTheme } from "../../context/ThemeContext";

export default function EmptyState({ icon = "cube-outline", title, subtitle, actionTitle, onAction, style }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={[styles.wrap, { padding: spacing.xxxl }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={[typography.t("subtitle", "semibold"), { color: colors.text, marginTop: spacing.lg, textAlign: "center" }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} fullWidth={false} style={{ marginTop: spacing.xl, paddingHorizontal: 28 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 84, height: 84, borderRadius: 42, justifyContent: "center", alignItems: "center" },
});
