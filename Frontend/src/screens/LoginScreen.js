import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { Screen, Card, TextField, Button, Pill } from "../components/ui";

export default function LoginScreen({ users, onLogin, onRegister, onForgotPassword }) {
  const { colors, spacing, typography, radii, isDarkMode, toggleDarkMode } = useTheme();
  const [selectedRole, setSelectedRole] = useState("customer");
  const [emailOrPhone, setEmailOrPhone] = useState("aryan@gmail.com");
  const [password, setPassword] = useState("password123");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "customer") {
      setEmailOrPhone("aryan@gmail.com");
      setPassword("password123");
    } else if (role === "partner") {
      setEmailOrPhone("rider@gmail.com");
      setPassword("password123");
    } else if (role === "admin") {
      setEmailOrPhone("admin@gmail.com");
      setPassword("password123");
    }
  };

  const accent =
    selectedRole === "partner" ? colors.partner : selectedRole === "admin" ? colors.admin : colors.primary;

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email/phone and password.");
      return;
    }
    try {
      const user = await API.login(emailOrPhone.trim(), password.trim(), selectedRole);
      if (user.isBlocked) {
        Alert.alert("Access Suspended", "This account has been blocked.");
        return;
      }
      onLogin(user);
    } catch (error) {
      Alert.alert("Authentication Failed", error.message || "Invalid credentials.");
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) onForgotPassword();
  };

  const roleTitle =
    selectedRole === "customer" ? "Customer Sign In" : selectedRole === "partner" ? "Rider Sign In" : "Admin Sign In";

  return (
    <Screen scroll padded>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          onPress={toggleDarkMode}
        >
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={16} color={colors.text} />
          <Text style={[typography.t("caption", "semibold"), { color: colors.text, marginLeft: 6 }]}>
            {isDarkMode ? "Light" : "Dark"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Image source={require("../../assets/rider.jpg")} style={[styles.heroImg, { borderRadius: radii.xl }]} resizeMode="cover" />
        <Text style={[typography.t("display", "bold"), { color: colors.text, marginTop: spacing.lg }]}>Welcome back</Text>
        <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" }]}>
          Sign in to access your portal
        </Text>
      </View>

      <View style={styles.roles}>
        <Pill label="Customer" active={selectedRole === "customer"} activeColor={colors.primary} onPress={() => handleRoleChange("customer")} />
        <Pill label="Rider" active={selectedRole === "partner"} activeColor={colors.partner} onPress={() => handleRoleChange("partner")} />
        <Pill label="Admin" active={selectedRole === "admin"} activeColor={colors.admin} onPress={() => handleRoleChange("admin")} />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.t("title", "bold"), { color: colors.text, marginBottom: spacing.lg }]}>{roleTitle}</Text>

        <TextField
          label="Email or Phone"
          leftIcon="mail-outline"
          placeholder="Enter email or phone"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
        />
        <TextField
          label="Password"
          leftIcon="lock-closed-outline"
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginBottom: spacing.sm }}
        />

        <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: "flex-end", marginBottom: spacing.lg }}>
          <Text style={[typography.t("footnote", "semibold"), { color: accent }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button title="Login" onPress={handleLogin} color={accent} />

        {selectedRole === "customer" ? (
          <View style={styles.registerRow}>
            <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={onRegister}>
              <Text style={[typography.t("footnote", "bold"), { color: colors.primary }]}>Register</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  themeBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  hero: { alignItems: "center", marginTop: 12 },
  heroImg: { width: 132, height: 132 },
  roles: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
});
