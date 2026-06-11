import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getShopItemCount } from "../utils/orderHelpers";
import { Screen, AppHeader, Card, Badge, Pill, Button, EmptyState } from "../components/ui";

export default function MyOrdersScreen({
  orders,
  currentUser,
  onBack,
  onActive,
  onCompleted,
  onCancel,
}) {
  const { colors, spacing, radii, typography } = useTheme();
  const [activeTab, setActiveTab] = useState("active");

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );

  const completedOrders = orders.filter(
    (o) => o.status === "Delivered" || o.status === "Cancelled"
  );

  const displayedOrders = activeTab === "active" ? activeOrders : completedOrders;

  const canCancel = (item) =>
    onCancel && ["Placed", "Assigned"].includes(item.status);

  const renderOrderItem = ({ item }) => {
    const isCourier = item.type === "package";

    return (
      <Card
        onPress={() => (activeTab === "active" ? onActive(item.id) : onCompleted(item.id))}
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.cardHeader}>
          <Text style={[typography.t("bodyLg", "bold"), { color: colors.text }]}>Order #{item.id}</Text>
          <Badge status={item.status} />
        </View>

        <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted, marginTop: 3 }]}>
          {item.date}
        </Text>

        <View style={[styles.routeRow, { backgroundColor: colors.surfaceAlt, borderRadius: radii.md }]}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[typography.t("body", "semibold"), { color: colors.text, marginLeft: 8, flex: 1 }]} numberOfLines={1}>
            {item.pickup.split(",")[0]} ➔ {item.delivery.split(",")[0]}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>
            {isCourier
              ? `Courier: ${item.packageType || "Package"}`
              : `Store Purchase: ${getShopItemCount(item)} items`}
          </Text>
          {!isCourier && item.totalAmount != null ? (
            <Text style={[typography.t("bodyLg", "bold"), { color: colors.primary }]}>₹{item.totalAmount}</Text>
          ) : null}
        </View>

        {activeTab === "active" && canCancel(item) ? (
          <Button
            title="Cancel Order"
            variant="danger"
            size="sm"
            style={{ marginTop: spacing.md }}
            onPress={(e) => {
              e?.stopPropagation?.();
              onCancel(item.id);
            }}
          />
        ) : null}
      </Card>
    );
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader title="My Deliveries" onBack={onBack} />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { paddingHorizontal: spacing.gutter, paddingVertical: spacing.md }]}>
        <Pill
          label={`Active (${activeOrders.length})`}
          active={activeTab === "active"}
          onPress={() => setActiveTab("active")}
        />
        <Pill
          label={`Completed (${completedOrders.length})`}
          active={activeTab === "completed"}
          onPress={() => setActiveTab("completed")}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={displayedOrders}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderOrderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={activeTab === "active" ? "cube-outline" : "archive-outline"}
            title={
              activeTab === "active"
                ? "No ongoing active deliveries"
                : "No past completed orders"
            }
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
});
