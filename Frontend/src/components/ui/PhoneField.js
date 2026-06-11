import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Country-code + numeric phone input. The flag is a conventional indicator (kept).
export default function PhoneField({ label, value, onChangeText, placeholder = "10-digit number", required, style }) {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? (
        <Text style={[typography.t("footnote", "medium"), { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.row, { borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.inputBg }]}>
        <View style={[styles.code, { borderRightColor: colors.border }]}>
          <Text style={[typography.t("bodyLg", "medium"), { color: colors.text }]}>🇮🇳 +91</Text>
        </View>
        <TextInput
          style={[{ flex: 1, color: colors.text, paddingHorizontal: spacing.lg }, typography.t("bodyLg", "regular")]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, height: 52 },
  code: { paddingHorizontal: 14, height: "100%", justifyContent: "center", borderRightWidth: 1 },
});
