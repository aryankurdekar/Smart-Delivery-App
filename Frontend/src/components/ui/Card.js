import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Card({ children, style, onPress, padding, flat }) {
  const { colors, radii, shadows, spacing } = useTheme();
  const base = [
    {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: padding != null ? padding : spacing.lg,
    },
    flat ? shadows.none : shadows.sm,
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={base}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={base}>{children}</View>;
}
