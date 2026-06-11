import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "./Card";
import { useTheme } from "../../context/ThemeContext";

export default function SectionCard({ title, right, children, style }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Card style={style}>
      {title ? (
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, marginBottom: spacing.md, paddingBottom: spacing.sm },
          ]}
        >
          <Text style={[typography.t("bodyLg", "semibold"), { color: colors.text }]}>{title}</Text>
          {right || null}
        </View>
      ) : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
