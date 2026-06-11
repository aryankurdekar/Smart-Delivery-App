import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, TextField, PhoneField, Button } from "../components/ui";

export default function PlaceOrderScreen({
  onBack,
  onConfirm,
}) {
  const { colors, spacing, radii, typography } = useTheme();
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [packageType, setPackageType] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    if (
      !pickup.trim() ||
      !delivery.trim() ||
      !packageType.trim() ||
      !receiverName.trim() ||
      !receiverPhone.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill all fields"
      );
      return;
    }

    if (receiverPhone.trim().length !== 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Receiver phone number must be exactly 10 digits."
      );
      return;
    }

    const orderData = {
      pickup: pickup.trim(),
      delivery: delivery.trim(),
      packageType: packageType.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: "+91 " + receiverPhone.trim(),
    };

    setShowSuccess(true);

    setTimeout(() => {
      if (onConfirm) {
        onConfirm(orderData);
      }
    }, 1500);
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Place New Delivery" onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {showSuccess && (
          <View style={[styles.successBox, { backgroundColor: colors.primaryLight, borderColor: colors.success, borderRadius: radii.md }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[typography.t("body", "semibold"), { color: colors.success, marginLeft: spacing.sm }]}>
              Order Confirmed Successfully!
            </Text>
          </View>
        )}

        <TextField
          label="Pickup Location"
          leftIcon="location-outline"
          value={pickup}
          onChangeText={setPickup}
          placeholder="Enter pickup location"
        />

        <TextField
          label="Delivery Location"
          leftIcon="navigate-outline"
          value={delivery}
          onChangeText={setDelivery}
          placeholder="Enter delivery location"
        />

        <TextField
          label="Package Type"
          leftIcon="cube-outline"
          value={packageType}
          onChangeText={setPackageType}
          placeholder="Documents / Electronics / Parcel"
        />

        <TextField
          label="Receiver Name"
          leftIcon="person-outline"
          value={receiverName}
          onChangeText={setReceiverName}
          placeholder="Receiver Name"
        />

        <PhoneField
          label="Receiver Phone"
          required
          placeholder="10-digit mobile number"
          value={receiverPhone}
          onChangeText={(text) => setReceiverPhone(text.replace(/[^0-9]/g, ""))}
        />

        <Button title="Confirm Order" onPress={handleConfirm} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
  },
});
