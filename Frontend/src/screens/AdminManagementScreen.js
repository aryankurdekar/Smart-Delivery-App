import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, Pill, Badge, Button, EmptyState } from "../components/ui";

export default function AdminManagementScreen({
  users,
  orders,
  onBack,
  onBlockUser,
  onOverrideOrderStatus,
}) {
  const { colors, spacing, typography } = useTheme();
  const [activeSegment, setActiveSegment] = useState("users");

  const customers = users.filter((u) => u.role === "customer" || !u.role);

  const handleBlockToggle = (user) => {
    const isBlocked = user.isBlocked;
    Alert.alert(
      isBlocked ? "Unblock Account" : "Block Account",
      `Are you sure you want to ${isBlocked ? "enable" : "suspend"} the customer account for ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isBlocked ? "Unblock" : "Block",
          style: isBlocked ? "default" : "destructive",
          onPress: () => onBlockUser(user.email, !isBlocked),
        },
      ]
    );
  };

  const handleOrderOverride = (order) => {
    Alert.alert(
      `Override Order #${order.id}`,
      "Admin actions bypass standard rider verification codes. Choose an operation:",
      [
        { text: "Cancel Selection", style: "cancel" },
        {
          text: "Force DELIVERED",
          onPress: () => onOverrideOrderStatus(order.id, "Delivered"),
        },
        {
          text: "Force CANCELLED",
          style: "destructive",
          onPress: () => onOverrideOrderStatus(order.id, "Cancelled"),
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => {
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={[styles.userHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.userIconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="person" size={22} color={colors.admin} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[typography.t("body", "bold"), { color: colors.text }]}>{item.name}</Text>
            <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>{item.email}</Text>
            <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.userFooter}>
          <View style={styles.userAddress}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginLeft: 4, flex: 1 }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <Button
            title={item.isBlocked ? "Unblock User" : "Suspend User"}
            size="sm"
            variant={item.isBlocked ? "success" : "danger"}
            fullWidth={false}
            onPress={() => handleBlockToggle(item)}
          />
        </View>
      </Card>
    );
  };

  const renderOrderItem = ({ item }) => {
    const isCourier = item.type === "package";
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={[styles.orderHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[typography.t("body", "bold"), { color: colors.text }]}>Order #{item.id}</Text>
            <Text style={[typography.t("caption", "regular"), { color: colors.textMuted, marginTop: 2 }]}>{item.date}</Text>
          </View>
          <Badge status={item.status} />
        </View>

        <Text style={[typography.t("body", "semibold"), { color: colors.text, marginBottom: spacing.md }]} numberOfLines={1}>
          {item.pickup.split(",")[0]} ➔ {item.delivery.split(",")[0]}
        </Text>

        <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
          <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>
            {isCourier ? `Courier Package` : `Store: ₹${item.totalAmount}`}
          </Text>
          {item.status !== "Delivered" && item.status !== "Cancelled" && (
            <Button
              title="Admin Override"
              size="sm"
              variant="danger"
              icon="shield-half-outline"
              fullWidth={false}
              onPress={() => handleOrderOverride(item)}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader title="System Control" onBack={onBack} />

      {/* Segment Switcher */}
      <View style={[styles.segmentContainer, { paddingHorizontal: spacing.gutter, paddingTop: spacing.md }]}>
        <Pill
          label={`User Registry (${customers.length})`}
          active={activeSegment === "users"}
          activeColor={colors.admin}
          onPress={() => setActiveSegment("users")}
        />
        <Pill
          label={`System Orders (${orders.length})`}
          active={activeSegment === "orders"}
          activeColor={colors.admin}
          onPress={() => setActiveSegment("orders")}
        />
      </View>

      {/* Registry Lists */}
      <FlatList
        data={activeSegment === "users" ? customers : orders}
        keyExtractor={(item) => item.email || item.id}
        renderItem={activeSegment === "users" ? renderUserItem : renderOrderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="file-tray-outline" title="No records found" subtitle="There is nothing to show here yet." />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: "row",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    marginBottom: 12,
  },
  userIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userAddress: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
});
