import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { dedupeOrders } from "../utils/dedupeOrders";
import { Screen, AppHeader, Card, StatCard, Badge, Button, EmptyState } from "../components/ui";

export default function PartnerDashboard({
  currentUser,
  orders,
  onLogout,
  onAcceptOrder,
  onContinueDelivery,
  onViewEarnings,
}) {
  const { colors, spacing, radii, typography, isDarkMode, toggleDarkMode } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

  const riderName = currentUser?.name || "Rahul Kumar";

  const newRequests = orders.filter(
    (o) =>
      o.status === "Placed" &&
      (!o.partnerName || o.partnerName === "")
  );

  const myActiveDeliveries = orders.filter(
    (o) =>
      o.partnerName === riderName &&
      ["Assigned", "Picked Up", "Out For Delivery"].includes(o.status)
  );

  const pendingDeliveries = dedupeOrders([...newRequests, ...myActiveDeliveries]);

  const completedCount = orders.filter(
    (o) => o.status === "Delivered" && o.partnerName === riderName
  ).length;

  const totalEarnings = completedCount * 60;

  const renderDeliveryItem = ({ item }) => {
    const isCourier = item.type === "package";
    const isAcceptedByMe =
      item.partnerName === riderName && item.status !== "Placed";

    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <Text style={[typography.t("bodyLg", "bold"), { color: colors.text }]}>Order #{item.id}</Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.surfaceAlt, borderRadius: radii.sm }]}>
            <Text style={[typography.t("caption", "semibold"), { color: colors.partner }]}>
              {isCourier ? "Courier Package" : "Store Order"}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeBulletColumn}>
            <View style={[styles.bullet, { backgroundColor: colors.success }]} />
            <View style={[styles.bulletLine, { backgroundColor: colors.border }]} />
            <View style={[styles.bullet, { backgroundColor: colors.partner }]} />
          </View>
          <View style={styles.routeInfoColumn}>
            <Text style={[typography.t("caption", "semibold"), { color: colors.textMuted, letterSpacing: 0.5 }]}>
              PICKUP FROM
            </Text>
            <Text style={[typography.t("body", "semibold"), { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
              {item.pickup}
            </Text>
            <Text style={[typography.t("caption", "semibold"), { color: colors.textMuted, letterSpacing: 0.5, marginTop: 10 }]}>
              DELIVER TO
            </Text>
            <Text style={[typography.t("body", "semibold"), { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
              {item.delivery}
            </Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>Est. Payout</Text>
            <Text style={[typography.t("bodyLg", "bold"), { color: colors.primary }]}>₹60.00</Text>
          </View>
          {isAcceptedByMe ? (
            <Button
              title="Continue Delivery"
              size="sm"
              fullWidth={false}
              icon="navigate"
              color={colors.partner}
              onPress={() => onContinueDelivery(item.id)}
            />
          ) : (
            <Button
              title="Accept & Deliver"
              size="sm"
              fullWidth={false}
              icon="arrow-forward"
              onPress={() => onAcceptOrder(item.id)}
            />
          )}
        </View>
      </Card>
    );
  };

  const ListHeader = (
    <>
      <Card
        style={[styles.statusCard, { borderColor: isOnline ? colors.partner : colors.border }]}
        padding={spacing.lg}
      >
        <View style={styles.statusInfo}>
          <Ionicons
            name={isOnline ? "ellipse" : "ellipse-outline"}
            size={16}
            color={isOnline ? colors.partner : colors.textMuted}
          />
          <Text
            style={[
              typography.t("footnote", "bold"),
              { color: isOnline ? colors.partner : colors.textSecondary, marginLeft: spacing.sm },
            ]}
          >
            You are {isOnline ? "ONLINE & RECEIVING" : "OFFLINE"}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: colors.border, true: colors.partner }}
          thumbColor={"#FFFFFF"}
        />
      </Card>

      <View style={styles.statsRow}>
        <StatCard
          icon="cash-outline"
          iconColor={colors.partner}
          iconBg={colors.surfaceAlt}
          value={`₹${totalEarnings}`}
          label="TODAY'S EARNINGS"
          style={{ marginRight: spacing.md }}
        />
        <StatCard
          icon="checkmark-done-outline"
          iconColor={colors.partner}
          iconBg={colors.surfaceAlt}
          value={completedCount}
          label="COMPLETED DELIVERIES"
          onPress={onViewEarnings}
        />
      </View>

      <Text style={[typography.t("bodyLg", "bold"), { color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md }]}>
        Assigned Deliveries ({isOnline ? pendingDeliveries.length : 0})
      </Text>
    </>
  );

  return (
    <Screen edges={["top"]}>
      <AppHeader
        title="Rider Portal"
        subtitle={`Welcome, ${riderName}`}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.themeBtn} onPress={toggleDarkMode}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      {!isOnline ? (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="cloud-offline-outline"
              title="You are offline"
              subtitle="Go online to start receiving and accepting customer orders."
            />
          }
        />
      ) : (
        <FlatList
          data={pendingDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderDeliveryItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bicycle-outline"
              title="Waiting for orders..."
              subtitle="We will notify you immediately when a customer creates a delivery request."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeBtn: {
    padding: 8,
    marginRight: 4,
  },
  logoutBtn: {
    padding: 8,
  },
  listContent: {
    padding: 15,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  routeRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  routeBulletColumn: {
    width: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bulletLine: {
    width: 1,
    flex: 1,
    marginVertical: 4,
  },
  routeInfoColumn: {
    flex: 1,
    marginLeft: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
});
