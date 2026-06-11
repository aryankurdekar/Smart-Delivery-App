import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import {
  getOrderItemName,
  getOrderItemPrice,
  getOrderItemQuantity,
  getShopSubtotal,
} from "../utils/orderHelpers";
import { Screen, AppHeader, SectionCard, Badge, EmptyState } from "../components/ui";

export default function OrderDetailsScreen({
  order,
  onBack,
}) {
  const { colors, spacing, radii, typography } = useTheme();

  if (!order) {
    return (
      <Screen edges={["top"]}>
        <AppHeader title="Order Details" onBack={onBack} />
        <EmptyState
          icon="document-outline"
          title="No order details found"
          actionTitle="Go Back"
          onAction={onBack}
        />
      </Screen>
    );
  }

  const isCourier = order.type === "package";
  const shopSubtotal = getShopSubtotal(order);
  const fees = order.totalAmount ? Math.max(0, order.totalAmount - shopSubtotal) : 59;

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Order Details" subtitle={`Order #${order.id}`} onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <SectionCard style={{ marginBottom: spacing.lg }}>
          <View style={styles.statusRow}>
            <Text style={[typography.t("body", "medium"), { color: colors.textSecondary }]}>
              Date: {order.date}
            </Text>
            <Badge status={order.status} />
          </View>
        </SectionCard>

        {/* Route Details */}
        <SectionCard title="Route Details" style={{ marginBottom: spacing.lg }}>
          <View style={styles.routeContainer}>
            <View style={styles.routeIconColumn}>
              <Ionicons name="radio-button-on" size={20} color={colors.primary} />
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <Ionicons name="location" size={20} color={colors.success} />
            </View>

            <View style={styles.routeInfoColumn}>
              <View style={styles.routeSpot}>
                <Text style={[typography.t("caption", "semibold"), { color: colors.textMuted, letterSpacing: 0.5 }]}>
                  PICKUP FROM
                </Text>
                <Text style={[typography.t("body", "semibold"), { color: colors.text, marginTop: 2 }]}>{order.pickup}</Text>
              </View>

              <View style={[styles.routeSpot, { marginTop: 25 }]}>
                <Text style={[typography.t("caption", "semibold"), { color: colors.textMuted, letterSpacing: 0.5 }]}>
                  DELIVER TO
                </Text>
                <Text style={[typography.t("body", "semibold"), { color: colors.text, marginTop: 2 }]}>{order.delivery}</Text>
              </View>
            </View>
          </View>
        </SectionCard>

        {/* Package / Items Card */}
        <SectionCard
          title={isCourier ? "Package Description" : "Ordered Items"}
          style={{ marginBottom: spacing.lg }}
        >
          {isCourier ? (
            <View style={styles.courierDetails}>
              <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted }]}>Package Type</Text>
              <Text style={[typography.t("bodyLg", "bold"), { color: colors.text, marginTop: 3 }]}>{order.packageType}</Text>
            </View>
          ) : (
            <View>
              {(order.items || []).map((item, idx) => (
                <View key={idx} style={[styles.shopItemRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.shopItemLeft}>
                    <Text style={[typography.t("body", "semibold"), { color: colors.text }]}>
                      {getOrderItemName(item)}
                    </Text>
                    <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>
                      Qty: {getOrderItemQuantity(item)}
                    </Text>
                  </View>
                  <Text style={[typography.t("body", "bold"), { color: colors.text }]}>
                    ₹{getOrderItemPrice(item) * getOrderItemQuantity(item)}
                  </Text>
                </View>
              ))}

              <View style={[styles.priceSummaryContainer, { borderTopColor: colors.border }]}>
                <View style={styles.priceRow}>
                  <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[typography.t("body", "regular"), { color: colors.text }]}>₹{shopSubtotal}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>
                    Delivery & Platform Fees
                  </Text>
                  <Text style={[typography.t("body", "regular"), { color: colors.text }]}>₹{fees}</Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[typography.t("bodyLg", "bold"), { color: colors.text }]}>Total Paid (COD)</Text>
                  <Text style={[typography.t("subtitle", "bold"), { color: colors.primary }]}>
                    ₹{order.totalAmount || shopSubtotal + fees}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </SectionCard>

        {/* Recipient Details */}
        <SectionCard title="Recipient Information" style={{ marginBottom: spacing.lg }}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <Text style={[typography.t("body", "medium"), { color: colors.text }]}>{order.receiverName}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <Text style={[typography.t("body", "medium"), { color: colors.text }]}>{order.receiverPhone}</Text>
          </View>
        </SectionCard>

        {/* Delivery Rider */}
        {order.partnerName ? (
          <SectionCard title="Delivery Executive" style={{ marginBottom: spacing.lg }}>
            <View style={styles.riderRow}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={[typography.t("body", "bold"), { color: colors.text }]}>{order.partnerName}</Text>
                <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>{order.partnerPhone}</Text>
              </View>
            </View>
          </SectionCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeContainer: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  routeIconColumn: {
    alignItems: "center",
    width: 30,
    justifyContent: "space-between",
  },
  routeLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  routeInfoColumn: {
    flex: 1,
    marginLeft: 10,
  },
  routeSpot: {
    justifyContent: "center",
  },
  courierDetails: {
    paddingVertical: 5,
  },
  shopItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  shopItemLeft: {
    flex: 1,
  },
  priceSummaryContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 10,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  riderInfo: {
    marginLeft: 15,
  },
});
