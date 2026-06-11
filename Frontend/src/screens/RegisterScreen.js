import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Screen, Card, TextField, PhoneField, Button } from "../components/ui";

export default function RegisterScreen({
  onRegister,
  onLogin,
}) {
  const { colors, spacing, typography } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const handleRegister = async () => {
  if (
    !name.trim() ||
    !email.trim() ||
    !phone.trim() ||
    !password.trim() ||
    !confirmPassword.trim()
  ) {
    Alert.alert("Missing Fields", "Please fill all fields");
    return;
  }

  if (phone.trim().length !== 10) {
    Alert.alert(
      "Invalid Phone Number",
      "Phone number must be exactly 10 digits."
    );
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  const newUser = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: "+91 " + phone.trim(),
    password,
    address: "Bangalore, Karnataka",
  };

  console.log("=================================");
  console.log("🚀 REGISTER BUTTON CLICKED");
  console.log("USER DATA:", newUser);
  console.log("=================================");

  try {
    await onRegister(newUser);

    Alert.alert(
      "Registration Successful",
      "Your account has been created successfully!"
    );

    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    Alert.alert(
      "Registration Failed",
      error?.message || "Unable to create account."
    );
  }
};

  return (
    <Screen scroll padded>
      <View style={styles.header}>
        <Text style={[typography.t("display", "bold"), { color: colors.text }]}>
          Create Account
        </Text>
        <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Register to start using Smart Delivery
        </Text>
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <TextField
          label="Full Name"
          leftIcon="person-outline"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <TextField
          label="Email"
          leftIcon="mail-outline"
          placeholder="Enter your email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <PhoneField
          label="Phone Number"
          required
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
        />

        <TextField
          label="Password"
          leftIcon="lock-closed-outline"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextField
          label="Confirm Password"
          leftIcon="lock-closed-outline"
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{ marginBottom: spacing.xl }}
        />

        <Button title="Register" onPress={handleRegister} />

        <View style={styles.loginRow}>
          <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={onLogin}>
            <Text style={[typography.t("footnote", "bold"), { color: colors.primary }]}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 12 },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
});
