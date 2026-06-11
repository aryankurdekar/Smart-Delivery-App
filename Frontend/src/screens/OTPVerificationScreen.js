import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, TextField, Button } from "../components/ui";

export default function OTPVerificationScreen({
  order,
  onSuccess,
  onBack,
}) {
  const { colors, spacing, radii, typography } = useTheme();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const verifyOTP = () => {
    if (!order) return;

    if (otp === order.otp) {
      setSuccess(true);
      setMessage("Delivery Verified & Completed!");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setSuccess(false);
      setMessage("Invalid OTP code. Please check and try again.");
    }
  };

  if (!order) {
    return (
      <Screen edges={["top"]}>
        <AppHeader title="OTP Verification" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xl }]}>
            No active order to verify.
          </Text>
          <Button title="Go Back" onPress={onBack} fullWidth={false} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded edges={["top"]}>
      <Card style={{ marginTop: spacing.md }}>
        <Text style={[typography.t("title", "bold"), { color: colors.text }]}>OTP Verification</Text>
        <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg }]}>
          Enter the 4-digit code provided on the tracking screen to verify and complete delivery for Order #{order.id}.
        </Text>

        <View style={[styles.otpHint, { backgroundColor: colors.primaryLight, borderRadius: radii.md }]}>
          <Text style={[typography.t("footnote", "medium"), { color: colors.textSecondary }]}>Customer Verification OTP: </Text>
          <Text style={[typography.t("body", "bold"), { color: colors.primary }]}>{order.otp}</Text>
        </View>

        <TextField
          placeholder="Enter 4 Digit OTP"
          keyboardType="numeric"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
          inputStyle={{ textAlign: "center", letterSpacing: 8 }}
        />

        <Button
          title="Verify OTP"
          onPress={verifyOTP}
          disabled={otp.length !== 4 || success}
        />

        {message ? (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: success ? colors.primaryLight : colors.surfaceAlt,
                borderColor: success ? colors.success : colors.danger,
                borderRadius: radii.md,
              },
            ]}
          >
            <Ionicons
              name={success ? "checkmark-circle" : "close-circle"}
              size={18}
              color={success ? colors.success : colors.danger}
            />
            <Text style={[typography.t("footnote", "semibold"), { color: success ? colors.success : colors.danger, marginLeft: spacing.sm }]}>
              {message}
            </Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  otpHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginBottom: 20,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
  },
});
