import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SafeScreen from "../components/SafeScreen";
import LiveMap from "../components/LiveMap";
import { coordsFor, interpolate, statusProgress } from "../utils/geo";
import { joinOrderRoom, leaveOrderRoom } from "../services/socket";
import { AppHeader, Card, Button } from "../components/ui";

export default function TrackingScreen({
  order,
  onBack,
  onVerify,
  onCancel,
  riderLocation,
}) {
  const { colors, spacing, radii, typography, statusColor, shadows } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the active milestone dot and bike icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Subscribe to this order's live room (status + rider GPS) while open.
  useEffect(() => {
    if (!order?.id) return;
    joinOrderRoom(order.id);
    return () => leaveOrderRoom(order.id);
  }, [order?.id]);

  if (!order) {
    return (
      <SafeScreen style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.danger} />
          <Text style={[typography.t("bodyLg", "medium"), styles.errorText, { color: colors.textSecondary }]}>
            No active order found to track.
          </Text>
          <Button title="Go Back" onPress={onBack} fullWidth={false} style={{ paddingHorizontal: 28 }} />
        </View>
      </SafeScreen>
    );
  }

  const milestones = [
    { key: "Placed", label: "Order Placed", icon: "clipboard-outline", desc: "We have received your order request." },
    { key: "Assigned", label: "Driver Assigned", icon: "person-outline", desc: "Rider Rahul is assigned to your delivery." },
    { key: "Picked Up", label: "Package Picked Up", icon: "cube-outline", desc: "Rider has picked up the package from the source." },
    { key: "Out For Delivery", label: "Out For Delivery", icon: "bicycle-outline", desc: "Rider is heading towards your location." },
    { key: "Delivered", label: "Delivered", icon: "checkmark-circle-outline", desc: "Package has been successfully handed over." }
  ];

  const statusIndex = milestones.findIndex((m) => m.key === order.status);

  // Real map coordinates: stable demo points for pickup/delivery, and the rider
  // position from the live Socket.IO feed (falling back to a status-based point
  // along the route until the first GPS ping arrives).
  const pickupCoord = coordsFor(order.pickup, "pickup");
  const deliveryCoord = coordsFor(order.delivery, "delivery");
  const isLiveRider = !!(riderLocation && riderLocation.latitude != null);
  const riderCoord = isLiveRider
    ? riderLocation
    : interpolate(pickupCoord, deliveryCoord, statusProgress(order.status));

  const handleCallRider = () => {
    if (order.partnerPhone) {
      Linking.openURL(`tel:${order.partnerPhone}`).catch(() => {
        Alert.alert("Call Rider", `Rider Phone Number: ${order.partnerPhone}`);
      });
    } else {
      Alert.alert("Rider Not Assigned", "A delivery partner will be assigned shortly.");
    }
  };

  const isCancelled = order.status === "Cancelled";
  const canCancel = onCancel && ["Placed", "Assigned"].includes(order.status);

  return (
    <SafeScreen style={{ backgroundColor: colors.background }}>
    <AppHeader title="Track Order" subtitle={`Order #${order.id}`} onBack={onBack} />
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {isCancelled ? (
        <View style={[styles.cancelledBanner, { backgroundColor: statusColor("Cancelled").bg, borderColor: statusColor("Cancelled").bg }]}>
          <Ionicons name="close-circle" size={28} color={statusColor("Cancelled").fg} />
          <Text style={[typography.t("body", "semibold"), styles.cancelledBannerText, { color: statusColor("Cancelled").fg }]}>
            This order has been cancelled.
          </Text>
        </View>
      ) : null}

      {/* Live Map (OpenStreetMap + real-time rider position) */}
      <View style={[styles.mapContainer, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.xl }]}>
        {order.status !== "Delivered" && order.status !== "Cancelled" ? (
          <LiveMap
            pickup={pickupCoord}
            delivery={deliveryCoord}
            rider={riderCoord}
            style={styles.liveMap}
          />
        ) : (
          <View style={[styles.liveMap, styles.mapResting, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name={order.status === "Delivered" ? "checkmark-done-circle" : "close-circle"}
              size={42}
              color={order.status === "Delivered" ? colors.success : colors.danger}
            />
            <Text style={[typography.t("body", "semibold"), styles.mapRestingText, { color: colors.textSecondary }]}>
              {order.status === "Delivered" ? "Delivered to destination" : "Order cancelled"}
            </Text>
          </View>
        )}
        <View style={[styles.routeSummaryRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[typography.t("body", "semibold"), styles.routeText, { color: colors.text }]} numberOfLines={1}>
            {order.pickup.split(",")[0]} ➔ {order.delivery.split(",")[0]}
          </Text>
          {isLiveRider ? (
            <Text style={[typography.t("caption", "bold"), styles.liveBadge, { color: colors.danger }]}>● LIVE</Text>
          ) : null}
        </View>
      </View>

      {/* ETA & OTP Panel */}
      <View style={styles.bannerRow}>
        <Card style={[styles.bannerCard, { marginRight: 10 }]}>
          <Text style={[typography.t("caption", "bold"), styles.bannerLabel, { color: colors.textMuted }]}>ESTIMATED TIME</Text>
          <Text style={[typography.t("subtitle", "bold"), styles.bannerValue, { color: colors.text }]}>
            {order.status === "Delivered" ? "Delivered" : order.eta || "Calculating..."}
          </Text>
        </Card>
        <Card style={styles.bannerCard}>
          <Text style={[typography.t("caption", "bold"), styles.bannerLabel, { color: colors.textMuted }]}>VERIFICATION OTP</Text>
          <Text
            style={[
              typography.t("title", "bold"),
              styles.otpText,
              { color: colors.primary },
              (order.status !== "Picked Up" && order.status !== "Out For Delivery") && [
                typography.t("body", "medium"),
                { letterSpacing: 0, color: colors.textSecondary },
              ],
            ]}
          >
            {order.status === "Picked Up" || order.status === "Out For Delivery"
              ? order.otp
              : "Pickup pending"}
          </Text>
        </Card>
      </View>

      {/* Delivery QR (rider scans this to confirm handover) */}
      {order.status === "Picked Up" || order.status === "Out For Delivery" ? (
        <Card style={styles.qrCard}>
          <Image
            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${order.otp}` }}
            style={[styles.qrImage, { borderRadius: radii.sm }]}
          />
          <View style={styles.qrInfo}>
            <Text style={[typography.t("bodyLg", "bold"), styles.qrTitle, { color: colors.text }]}>Delivery QR Code</Text>
            <Text style={[typography.t("footnote", "regular"), styles.qrSubtitle, { color: colors.textSecondary }]}>
              Let your rider scan this to confirm handover — or share OTP{" "}
              <Text style={[typography.t("footnote", "bold"), styles.qrOtp, { color: colors.primary }]}>{order.otp}</Text>.
            </Text>
          </View>
        </Card>
      ) : null}

      {/* Rider Info Card */}
      {statusIndex >= 1 ? (
        <Card style={styles.infoCard}>
          <View style={[styles.riderAvatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.riderDetails}>
            <Text style={[typography.t("footnote", "medium"), styles.infoTitle, { color: colors.textMuted }]}>Delivery Executive</Text>
            <Text style={[typography.t("bodyLg", "bold"), styles.riderName, { color: colors.text }]}>{order.partnerName || "Rahul Kumar"}</Text>
            <Text style={[typography.t("footnote", "regular"), styles.riderPhone, { color: colors.textSecondary }]}>{order.partnerPhone || "+91 8888888888"}</Text>
          </View>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.success }]} onPress={handleCallRider}>
            <Ionicons name="call" size={20} color="#FFF" />
          </TouchableOpacity>
        </Card>
      ) : (
        <Card style={styles.infoCard}>
          <View style={[styles.riderAvatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="hourglass-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.riderDetails}>
            <Text style={[typography.t("footnote", "medium"), styles.infoTitle, { color: colors.textMuted }]}>Delivery Executive</Text>
            <Text style={[typography.t("bodyLg", "bold"), styles.riderName, { color: colors.text }]}>Finding partner near you...</Text>
          </View>
        </Card>
      )}

      {/* Timeline Milestones */}
      <Card style={styles.statusCard}>
        <Text style={[typography.t("subtitle", "bold"), styles.statusTitleText, { color: colors.text }]}>Delivery Milestones</Text>

        {milestones.map((m, index) => {
          const isCompleted = index < statusIndex;
          const isActive = index === statusIndex;
          const isPending = index > statusIndex;

          return (
            <View key={m.key} style={styles.milestoneRow}>
              {/* Left Timeline Line & Dot */}
              <View style={styles.timelineColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    isCompleted && { backgroundColor: colors.success, borderColor: colors.success },
                    isActive && { borderColor: colors.primary, backgroundColor: colors.surface },
                    isPending && { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : isActive ? (
                    <Animated.View
                      style={[
                        styles.activeDotInner,
                        { backgroundColor: colors.primary },
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    />
                  ) : null}
                </View>
                {index < milestones.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: colors.border },
                      index < statusIndex && { backgroundColor: colors.success },
                    ]}
                  />
                )}
              </View>

              {/* Milestone Texts */}
              <View style={styles.milestoneContent}>
                <Text
                  style={[
                    typography.t("body", "semibold"),
                    isCompleted && { color: colors.text },
                    isActive && { color: colors.primary },
                    isPending && { color: colors.textMuted },
                  ]}
                >
                  {m.label}
                </Text>
                <Text style={[typography.t("footnote", "regular"), styles.milestoneDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
              </View>

              <Ionicons
                name={m.icon}
                size={22}
                color={isCompleted ? colors.success : isActive ? colors.primary : colors.textMuted}
                style={styles.milestoneIcon}
              />
            </View>
          );
        })}
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isCancelled ? (
          <View style={[styles.otpWaitingCard, { backgroundColor: statusColor("Cancelled").bg, borderColor: statusColor("Cancelled").bg, borderRadius: radii.md }]}>
            <Ionicons name="information-circle" size={22} color={statusColor("Cancelled").fg} style={{ marginRight: 10 }} />
            <Text style={[typography.t("footnote", "medium"), styles.otpWaitingText, { color: statusColor("Cancelled").fg }]}>
              Order cancelled. Refund (if any) will be processed within 24 hours for prepaid orders.
            </Text>
          </View>
        ) : order.status !== "Delivered" ? (
          <View style={[styles.otpWaitingCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radii.md }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.success} style={{ marginRight: 10 }} />
            <Text style={[typography.t("footnote", "medium"), styles.otpWaitingText, { color: colors.textSecondary }]}>
              {order.status === "Picked Up" || order.status === "Out For Delivery"
                ? `Share OTP ${order.otp} with ${order.partnerName || "your rider"} upon arrival.`
                : "Your OTP will appear here once the rider picks up your order."}
            </Text>
          </View>
        ) : (
          <View style={[styles.otpWaitingCard, { backgroundColor: statusColor("Delivered").bg, borderColor: statusColor("Delivered").bg, borderRadius: radii.md }]}>
            <Ionicons name="checkmark-circle" size={22} color={statusColor("Delivered").fg} style={{ marginRight: 10 }} />
            <Text style={[typography.t("footnote", "medium"), styles.otpWaitingText, { color: statusColor("Delivered").fg }]}>
              This order has been successfully delivered. Thank you!
            </Text>
          </View>
        )}

        {canCancel ? (
          <Button
            title="Cancel Order"
            variant="danger"
            style={{ marginBottom: 12 }}
            onPress={() => onCancel(order.id)}
          />
        ) : null}

        <Button title="View My Deliveries" variant="secondary" onPress={onBack} />
      </View>
    </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 25,
    textAlign: "center",
  },
  mapContainer: {
    margin: 15,
    overflow: "hidden",
  },
  routeSummaryRow: {
    padding: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  routeText: {},
  liveMap: {
    height: 220,
    width: "100%",
  },
  mapResting: {
    justifyContent: "center",
    alignItems: "center",
  },
  mapRestingText: {
    marginTop: 8,
  },
  liveBadge: {
    marginTop: 4,
    letterSpacing: 1,
  },
  qrCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  qrImage: {
    width: 90,
    height: 90,
  },
  qrInfo: {
    flex: 1,
    marginLeft: 16,
  },
  qrTitle: {
    marginBottom: 4,
  },
  qrSubtitle: {},
  qrOtp: {
    letterSpacing: 1,
  },
  bannerRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  bannerCard: {
    flex: 1,
    alignItems: "center",
  },
  bannerLabel: {
    marginBottom: 6,
  },
  bannerValue: {},
  otpText: {
    letterSpacing: 2,
  },
  infoCard: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  riderDetails: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {},
  riderName: {
    marginTop: 2,
  },
  riderPhone: {
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCard: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  statusTitleText: {
    marginBottom: 20,
  },
  milestoneRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  timelineColumn: {
    alignItems: "center",
    width: 30,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  activeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    height: 50,
    marginVertical: 2,
    zIndex: 1,
  },
  milestoneContent: {
    flex: 1,
    marginLeft: 15,
    paddingBottom: 25,
  },
  milestoneDesc: {
    marginTop: 4,
  },
  milestoneIcon: {
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 15,
    marginBottom: 40,
  },
  otpWaitingCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
  },
  otpWaitingText: {
    flex: 1,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelledBannerText: {
    marginLeft: 10,
  },
});