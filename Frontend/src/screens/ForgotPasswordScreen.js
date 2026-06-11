import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { API } from "../services/api";
import { Screen, AppHeader, Card, TextField, Button } from "../components/ui";

export default function ForgotPasswordScreen({ onBack, onDone }) {
  const { colors, spacing, radii, typography } = useTheme();
  const [phase, setPhase] = useState("request"); // "request" | "reset"
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  const requestCode = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert("Required", "Enter your registered email or phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.forgotPassword(emailOrPhone.trim());
      if (res.devOtp) {
        setOtp(String(res.devOtp));
        setDevOtp(String(res.devOtp));
      }
      setPhase("reset");
    } catch (e) {
      Alert.alert("Error", e.message || "Could not send a reset code.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (!otp.trim()) {
      Alert.alert("Required", "Enter the reset code.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "The two passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await API.resetPassword(emailOrPhone.trim(), otp.trim(), newPassword);
      Alert.alert("Success", "Your password has been reset. Please log in.", [
        { text: "OK", onPress: onDone || onBack },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll padded edges={["top"]}>
      <AppHeader
        title="Reset Password"
        onBack={onBack}
        style={{ marginHorizontal: -spacing.gutter, marginTop: -spacing.gutter, marginBottom: spacing.lg }}
      />

      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="lock-closed-outline" size={34} color={colors.primary} />
      </View>

      <Text style={[typography.t("title", "bold"), { color: colors.text, textAlign: "center", marginTop: spacing.lg }]}>
        Reset Password
      </Text>
      <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.sm }]}>
        {phase === "request"
          ? "Enter your email or phone and we'll send you a reset code."
          : "Enter the code we sent and choose a new password."}
      </Text>

      {phase === "request" ? (
        <Card style={{ marginTop: spacing.xl }}>
          <TextField
            label="Email or Phone"
            leftIcon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            style={{ marginBottom: spacing.md }}
          />
          <Button title="Send Reset Code" onPress={requestCode} loading={loading} disabled={loading} />
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.xl }}>
          {devOtp ? (
            <View style={[styles.devHint, { borderColor: colors.primary, borderRadius: radii.md }]}>
              <Text style={[typography.t("footnote", "bold"), { color: colors.primary, letterSpacing: 1 }]}>
                Demo code: {devOtp}
              </Text>
            </View>
          ) : null}

          <TextField
            label="Reset Code"
            leftIcon="key-outline"
            placeholder="4-digit code"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />

          <TextField
            label="New Password"
            leftIcon="lock-closed-outline"
            placeholder="At least 6 characters"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TextField
            label="Confirm Password"
            leftIcon="lock-closed-outline"
            placeholder="Re-enter new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ marginBottom: spacing.md }}
          />

          <Button title="Reset Password" onPress={submitReset} loading={loading} disabled={loading} />

          <TouchableOpacity onPress={() => setPhase("request")} style={{ marginTop: spacing.lg }}>
            <Text style={[typography.t("footnote", "semibold"), { color: colors.textSecondary, textAlign: "center" }]}>
              Use a different account
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  devHint: {
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 10,
    alignItems: "center",
    marginBottom: 16,
  },
});
