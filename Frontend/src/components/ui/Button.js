import React from "react";
import { Text, TouchableOpacity, ActivityIndicator, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

// variant: primary | secondary | danger | success | ghost
// size: sm | md | lg
export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  iconColor,
  disabled,
  loading,
  fullWidth = true,
  color, // optional explicit fill color (e.g. role accent)
  style,
  textStyle,
}) {
  const { colors, radii, typography } = useTheme();
  const height = size === "sm" ? 40 : size === "md" ? 48 : 54;
  const isOutline = variant === "secondary" || variant === "ghost";
  const fill =
    color ||
    (variant === "danger" ? colors.danger : variant === "success" ? colors.success : colors.primary);
  const bg = isOutline ? "transparent" : fill;
  const fg = isOutline ? color || colors.primary : "#FFFFFF";
  const borderColor = variant === "secondary" ? color || colors.primary : "transparent";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          height,
          backgroundColor: bg,
          borderRadius: radii.md,
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={iconColor || fg} style={styles.icon} /> : null}
          <Text style={[typography.t(size === "sm" ? "body" : "bodyLg", "semibold"), { color: fg }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  fullWidth: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: 8 },
});
