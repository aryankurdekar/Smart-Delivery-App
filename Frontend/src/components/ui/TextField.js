import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize = "none",
  leftIcon,
  right,
  required,
  style,
  inputStyle,
}) {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? (
        <Text style={[typography.t("footnote", "medium"), { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            borderRadius: radii.md,
            minHeight: multiline ? 88 : 52,
            alignItems: multiline ? "flex-start" : "center",
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={{ marginRight: 8, marginTop: multiline ? 14 : 0 }} />
        ) : null}
        <TextInput
          style={[{ flex: 1, color: colors.text, paddingVertical: multiline ? 14 : 0 }, typography.t("bodyLg", "regular"), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
        />
        {right || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", borderWidth: 1 },
});
