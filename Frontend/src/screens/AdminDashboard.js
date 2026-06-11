import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, Card, SectionCard, StatCard, Badge, Button } from "../components/ui";

export default function AdminDashboard({
  orders,
  users,
  onLogout,
  onManageUsers,
  onOverrideOrder,
}) {
  const { colors, spacing, typography } = useTheme();

  const totalCount = orders.length;
  const completedCount = orders.filter((o) => o.status === "Delivered").length;
  const pendingCount = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;

  // Calculate total system revenue (completed shop orders + platform fee of ₹10 from all active/delivered courier orders)
  const shopRevenue = orders
    .filter((o) => o.type === "shop" && o.status === "Delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const courierPlatformFees = orders
    .filter((o) => o.type === "package" && o.status !== "Cancelled")
    .length * 10;

  const totalRevenue = shopRevenue + courierPlatformFees;

  const activeRiders = users.filter((u) => u.role === "partner");
  const customers = users.filter((u) => u.role === "customer" || !u.role);

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  return (
    <Screen edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: spacing.gutter, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.t("title", "bold"), { color: colors.text }]}>Command Center</Text>
          <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>
            Smart Delivery System Admin
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={[styles.logout, { borderColor: colors.border }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.gutter }}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Stats Grid */}
        <View style={styles.statsRow}>
          <StatCard
            icon="receipt-outline"
            iconColor={colors.admin}
            iconBg={colors.surfaceAlt}
            value={totalCount}
            label="TOTAL ORDERS"
            style={{ marginRight: spacing.md }}
          />
          <StatCard
            icon="checkmark-circle-outline"
            iconColor={colors.success}
            iconBg={colors.primaryLight}
            value={completedCount}
            label="COMPLETED"
          />
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.md }]}>
          <StatCard
            icon="hourglass-outline"
            iconColor={colors.warning}
            iconBg={colors.surfaceAlt}
            value={pendingCount}
            label="PENDING ACTIVE"
            style={{ marginRight: spacing.md }}
          />
          <StatCard
            icon="cash-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            value={`₹${Number(totalRevenue).toFixed(2)}`}
            label="TOTAL REVENUE"
          />
        </View>

        {/* Portals Quick Router */}
        <Card onPress={onManageUsers} style={{ marginTop: spacing.lg }}>
          <View style={styles.bannerRow}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="people-outline" size={24} color={colors.admin} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.t("subtitle", "bold"), { color: colors.text }]}>Manage Users & Orders</Text>
              <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>
                View user details, block accounts, or force complete/cancel deliveries.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        </Card>

        {/* Live Active Fleet Monitor */}
        <SectionCard title={`Live Delivery Fleet (${activeRiders.length})`} style={{ marginTop: spacing.lg }}>
          {activeRiders.length === 0 ? (
            <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.md }]}>
              No riders registered yet.
            </Text>
          ) : (
            activeRiders.map((rider, idx) => {
              const isAssigned = orders.some(
                (o) => o.partnerName === rider.name && o.status !== "Delivered" && o.status !== "Cancelled"
              );
              return (
                <View
                  key={idx}
                  style={[
                    styles.riderRow,
                    idx < activeRiders.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.riderAvatar, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="bicycle" size={20} color={colors.partner} />
                  </View>
                  <View style={styles.riderDetails}>
                    <Text style={[typography.t("body", "semibold"), { color: colors.text }]}>{rider.name}</Text>
                    <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>
                      {rider.phone}
                    </Text>
                  </View>
                  <Badge
                    label={isAssigned ? "ON TRIP" : "ONLINE"}
                    bg={isAssigned ? colors.surfaceAlt : colors.primaryLight}
                    fg={isAssigned ? colors.warning : colors.success}
                  />
                </View>
              );
            })
          )}
        </SectionCard>

        {/* System Active Deliveries Logs */}
        <SectionCard title="Active Orders Monitoring" style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
          {activeOrders.length === 0 ? (
            <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.md }]}>
              No active orders currently under transit.
            </Text>
          ) : (
            activeOrders.map((order, idx) => (
              <View
                key={idx}
                style={[
                  styles.orderRow,
                  idx < activeOrders.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.orderLeft}>
                  <Text style={[typography.t("body", "semibold"), { color: colors.text }]}>Order #{order.id}</Text>
                  <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 3 }]} numberOfLines={1}>
                    {order.pickup.split(",")[0]} ➔ {order.delivery.split(",")[0]}
                  </Text>
                  <Badge status={order.status} style={{ marginTop: spacing.sm }} />
                </View>
                <Button
                  title="Override"
                  size="sm"
                  variant="secondary"
                  color={colors.admin}
                  icon="arrow-forward"
                  fullWidth={false}
                  onPress={() => onOverrideOrder(order.id)}
                />
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logout: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row" },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  riderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  riderAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  riderDetails: { flex: 1, marginLeft: 12 },
  orderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  orderLeft: { flex: 1, paddingRight: 12 },
});
