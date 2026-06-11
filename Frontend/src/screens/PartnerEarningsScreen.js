import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, StatCard, EmptyState } from "../components/ui";

export default function PartnerEarningsScreen({
  orders,
  currentUser,
  onBack,
}) {
  const completedDeliveries = orders.filter(
    (o) => o.status === "Delivered" && (o.partnerName === currentUser?.name || o.partnerName === "Rahul Kumar")
  );

  const totalPayout = completedDeliveries.length * 60; // ₹60 per delivery incentive

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Earnings Dashboard" onBack={onBack} />
      <ScrollViewContent
        completedDeliveries={completedDeliveries}
        totalPayout={totalPayout}
      />
    </Screen>
  );
}

// Sub-component to hold flatlist inside scroll view
function ScrollViewContent({ completedDeliveries, totalPayout }) {
  const { colors, spacing, radii, typography, shadows } = useTheme();

  const renderEarningItem = ({ item }) => (
    <Card style={{ marginBottom: spacing.md }} padding={spacing.lg}>
      <View style={styles.itemHeader}>
        <Text style={[typography.t("body", "bold"), { color: colors.text }]}>Order #{item.id}</Text>
        <Text style={[typography.t("body", "bold"), { color: colors.primary }]}>+ ₹60.00</Text>
      </View>
      <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 4 }]}>
        Recipient: {item.receiverName}
      </Text>
      <Text style={[typography.t("caption", "regular"), { color: colors.textMuted, marginTop: 4 }]}>
        Completed: {item.date}
      </Text>
    </Card>
  );

  // Mock weekly trend — bar heights/values preserved, colors tokenized.
  const weekly = [
    { label: "Mon", height: 40, today: false },
    { label: "Tue", height: 80, today: false },
    { label: "Wed", height: 60, today: false },
    { label: "Today", height: 110, today: true },
    { label: "Fri", height: 20, today: false },
    { label: "Sat", height: 0, today: false },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Total Card */}
      <Card
        style={[styles.totalWalletCard, shadows.md, { backgroundColor: colors.partner, borderColor: colors.partner }]}
        padding={spacing.xxl}
      >
        <Text style={[typography.t("caption", "bold"), { color: "#FFFFFFCC", letterSpacing: 1 }]}>
          WALLET INCENTIVES
        </Text>
        <Text style={[typography.t("display", "bold"), { color: "#FFF", marginTop: spacing.sm }]}>
          ₹{totalPayout.toFixed(2)}
        </Text>
        <Text style={[typography.t("footnote", "regular"), { color: "#FFFFFFD9", marginTop: spacing.md }]}>
          Incentives calculated at a flat rate of ₹60.00 per delivery completion.
        </Text>
      </Card>

      {/* Stats row */}
      <View style={styles.summaryRow}>
        <StatCard
          icon="checkmark-done-outline"
          iconColor={colors.partner}
          iconBg={colors.surfaceAlt}
          value={completedDeliveries.length}
          label="DELIVERIES"
          style={{ marginRight: spacing.md }}
        />
        <StatCard
          icon="cash-outline"
          iconColor={colors.partner}
          iconBg={colors.surfaceAlt}
          value={`₹${completedDeliveries.length > 0 ? "60.00" : "0.00"}`}
          label="AVG. PAYOUT"
        />
      </View>

      {/* Week Performance Mock Chart */}
      <Card style={styles.performanceCard} padding={spacing.lg}>
        <Text style={[typography.t("body", "bold"), { color: colors.text, marginBottom: spacing.lg }]}>
          Weekly Earnings Trend
        </Text>
        <View style={styles.chartContainer}>
          {weekly.map((d) => (
            <View key={d.label} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: d.height,
                    backgroundColor: d.today ? colors.partner : colors.primaryLight,
                    borderRadius: radii.sm,
                  },
                ]}
              />
              <Text
                style={[
                  typography.t("caption", d.today ? "bold" : "regular"),
                  { color: d.today ? colors.text : colors.textMuted, marginTop: spacing.sm },
                ]}
              >
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={[typography.t("bodyLg", "bold"), { color: colors.text, marginHorizontal: spacing.xl, marginBottom: spacing.md }]}>
        Payout Logs
      </Text>
      <FlatList
        data={completedDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderEarningItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No completed deliveries recorded."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  totalWalletCard: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  performanceCard: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: "row",
    height: 140,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 20,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
