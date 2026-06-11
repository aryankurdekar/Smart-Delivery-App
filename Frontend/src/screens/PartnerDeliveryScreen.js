import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import LiveMap from "../components/LiveMap";
import QRScanner from "../components/QRScanner";
import { coordsFor, interpolate, statusProgress, bearing } from "../utils/geo";
import { shareRiderLocation } from "../services/socket";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, SectionCard, TextField, Button, Badge } from "../components/ui";

export default function PartnerDeliveryScreen({
  order,
  onUpdateStatus,
  onVerifyOTPComplete,
  onBack,
}) {
  const { colors, spacing, radii, typography, shadows } = useTheme();
  const [otpInput, setOtpInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [riderPos, setRiderPos] = useState(null);
  const [gps, setGps] = useState(null);
  const progressRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Read the device's real GPS once — demonstrates live location permission.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        /* GPS unavailable (e.g. emulator without a set location) */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Broadcast the rider's live position along the route over Socket.IO so the
  // customer's tracking map moves in real time as the delivery progresses.
  useEffect(() => {
    if (!order?.id) return;
    const pickup = coordsFor(order.pickup, "pickup");
    const delivery = coordsFor(order.delivery, "delivery");
    const head = bearing(pickup, delivery);
    const base = statusProgress(order.status);
    if (progressRef.current < base) progressRef.current = base;

    const emit = () => {
      const pos = interpolate(pickup, delivery, progressRef.current);
      setRiderPos(pos);
      shareRiderLocation({
        orderId: order.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        heading: head,
      });
    };
    emit(); // publish current position immediately

    const moving = order.status === "Picked Up" || order.status === "Out For Delivery";
    if (!moving) return;
    const cap = order.status === "Out For Delivery" ? 0.97 : 0.72;
    const iv = setInterval(() => {
      if (progressRef.current < cap) {
        progressRef.current = Math.min(cap, progressRef.current + 0.02);
        emit();
      }
    }, 700);
    return () => clearInterval(iv);
  }, [order?.id, order?.status]);

  if (!order) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginBottom: spacing.xl }]}>
            No active delivery order selected.
          </Text>
          <Button title="Go Back" onPress={onBack} fullWidth={false} style={{ paddingHorizontal: 28 }} />
        </View>
      </Screen>
    );
  }

  const getStatusIndex = () => {
    switch (order.status) {
      case "Placed":
        return 0;
      case "Assigned":
        return 1;
      case "Picked Up":
        return 2;
      case "Out For Delivery":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 0;
    }
  };

  const statusIndex = getStatusIndex();

  const pickupCoord = coordsFor(order.pickup, "pickup");
  const deliveryCoord = coordsFor(order.delivery, "delivery");
  const mapRider =
    riderPos || interpolate(pickupCoord, deliveryCoord, statusProgress(order.status));

  const handleAdvanceStatus = () => {
    let nextStatus = "";
    if (order.status === "Placed" || order.status === "Assigned") {
      nextStatus = "Picked Up";
    } else if (order.status === "Picked Up") {
      nextStatus = "Out For Delivery";
    }

    if (nextStatus) {
      onUpdateStatus(order.id, nextStatus);
    }
  };

  const handleVerifyOTP = () => {
    if (otpInput.trim() === order.otp) {
      onVerifyOTPComplete(order.id, otpInput.trim());
    } else {
      Alert.alert("Invalid Verification Code", "The OTP entered is incorrect. Please ask the customer for the correct OTP.");
    }
  };

  const handleScanned = (data) => {
    setShowScanner(false);
    if (data && data === order.otp) {
      onVerifyOTPComplete(order.id, data);
    } else {
      Alert.alert(
        "QR Mismatch",
        "The scanned code doesn't match this order. Try again or enter the OTP manually."
      );
    }
  };

  // Bike position calculations for route mockup
  const getBikePositionOffset = () => {
    if (statusIndex <= 1) return "20%";
    if (statusIndex === 2) return "50%";
    if (statusIndex === 3) return "80%";
    return "95%";
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Active Delivery" subtitle={`Order #${order.id}`} onBack={onBack} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Navigation Map (live OpenStreetMap + real-time position) */}
        <Card style={[styles.mapContainer, shadows.sm]} padding={0}>
          <LiveMap
            pickup={pickupCoord}
            delivery={deliveryCoord}
            rider={mapRider}
            style={styles.liveMap}
          />
          <View style={[styles.routeSummaryRow, { borderTopColor: colors.border }]}>
            <Ionicons name="navigate-circle-outline" size={18} color={colors.partner} />
            <Text style={[typography.t("body", "bold"), { color: colors.text, marginLeft: 8, flex: 1 }]} numberOfLines={1}>
              {order.pickup.split(",")[0]} ➔ {order.delivery.split(",")[0]}
            </Text>
            {gps ? (
              <View style={styles.gpsReadout}>
                <Ionicons name="location" size={12} color={colors.partner} />
                <Text style={[typography.t("caption", "semibold"), { color: colors.partner, marginLeft: 2 }]}>
                  {gps.latitude.toFixed(3)}, {gps.longitude.toFixed(3)}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Customer Details Box */}
        <SectionCard title="Customer Details" style={styles.section}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[typography.t("bodyLg", "medium"), { color: colors.text }]}>{order.receiverName}</Text>
          </View>
          <View style={[styles.detailRow, { marginTop: 10 }]}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[typography.t("bodyLg", "medium"), { color: colors.text }]}>{order.receiverPhone}</Text>
          </View>
        </SectionCard>

        {/* Status transiter */}
        <SectionCard
          title="Delivery Status"
          right={<Badge status={order.status} />}
          style={styles.section}
        >
          {statusIndex < 3 ? (
            <Button
              title={
                order.status === "Placed" || order.status === "Assigned"
                  ? "Mark as PICKED UP"
                  : "Mark as OUT FOR DELIVERY"
              }
              icon="bicycle"
              color={colors.partner}
              onPress={handleAdvanceStatus}
            />
          ) : (
            <View>
              <Text style={[typography.t("bodyLg", "bold"), { color: colors.text }]}>
                Verify Handover with OTP
              </Text>
              <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg }]}>
                Ask the customer for the 4-digit code shown on their tracking screen to complete this order.
              </Text>

              <View style={styles.otpInputRow}>
                <TextField
                  placeholder="Enter 4-Digit OTP"
                  keyboardType="numeric"
                  maxLength={4}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  style={{ flex: 1, marginBottom: 0, marginRight: spacing.md }}
                  inputStyle={{ letterSpacing: 4, textAlign: "center" }}
                />
                <Button
                  title="Verify"
                  size="md"
                  fullWidth={false}
                  color={colors.partner}
                  disabled={otpInput.length !== 4}
                  onPress={handleVerifyOTP}
                  style={{ paddingHorizontal: 22 }}
                />
              </View>

              <Button
                title="Scan delivery QR instead"
                variant="secondary"
                icon="qr-code-outline"
                color={colors.partner}
                onPress={() => setShowScanner(true)}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </SectionCard>
      </ScrollView>

      <QRScanner
        visible={showScanner}
        onScanned={handleScanned}
        onClose={() => setShowScanner(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  mapContainer: {
    margin: 15,
    borderRadius: 20,
    overflow: "hidden",
  },
  routeSummaryRow: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  liveMap: {
    height: 220,
    width: "100%",
  },
  gpsReadout: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 10,
  },
  otpInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
