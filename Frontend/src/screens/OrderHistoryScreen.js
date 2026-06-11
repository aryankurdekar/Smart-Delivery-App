import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, Badge } from "../components/ui";

const ORDERS = [
  { id: "1001", route: "MG Road → Whitefield", status: "Delivered" },
  { id: "1002", route: "Marathahalli → Electronic City", status: "Delivered" },
  { id: "1003", route: "Indiranagar → Koramangala", status: "Out For Delivery" },
  { id: "1004", route: "HSR Layout → Whitefield", status: "Cancelled" },
];

export default function OrderHistoryScreen({
  onBack,
}) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Order History" onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {ORDERS.map((order) => (
          <Card key={order.id} style={{ marginBottom: spacing.md }}>
            <View style={styles.cardHeader}>
              <Text style={[typography.t("subtitle", "bold"), { color: colors.text }]}>
                Order #{order.id}
              </Text>
              <Badge status={order.status} />
            </View>
            <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: spacing.sm }]}>
              {order.route}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
