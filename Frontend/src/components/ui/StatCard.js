import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import { useTheme } from "../../context/ThemeContext";

export default function StatCard({ icon, iconColor, iconBg, value, label, onPress, style }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Card onPress={onPress} style={[{ flex: 1 }, style]} padding={spacing.lg}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg || colors.primaryLight }]}>
          <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
        </View>
      ) : null}
      <Text style={[typography.t("h2", "bold"), { color: colors.text, marginTop: icon ? spacing.md : 0 }]}>{value}</Text>
      <Text style={[typography.t("caption", "semibold"), { color: colors.textMuted, marginTop: 2, letterSpacing: 0.5 }]}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
