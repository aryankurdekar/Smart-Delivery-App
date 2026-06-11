import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Pass `status` for an order-status pill, or `label`+`bg`/`fg` for a custom one.
export default function Badge({ status, label, bg, fg, dot = true, style }) {
  const { statusColor, radii, typography, colors } = useTheme();
  let bgc = bg;
  let fgc = fg;
  if (status) {
    const c = statusColor(status);
    bgc = c.bg;
    fgc = c.fg;
  }
  if (!bgc) {
    bgc = colors.surfaceAlt;
    fgc = colors.textSecondary;
  }
  return (
    <View style={[styles.badge, { backgroundColor: bgc, borderRadius: radii.pill }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fgc }]} /> : null}
      <Text style={[typography.t("caption", "semibold"), { color: fgc }]}>{label || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
});
