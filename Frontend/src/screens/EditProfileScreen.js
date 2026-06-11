import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, TextField, Button } from "../components/ui";

export default function EditProfileScreen({
  profile,
  setProfile,
  onBack,
}) {
  const { spacing } = useTheme();
  const [name, setName] = useState(profile ? profile.name : "");
  const [email, setEmail] = useState(profile ? profile.email : "");
  const [phone, setPhone] = useState(profile ? profile.phone : "");
  const [address, setAddress] = useState(profile ? profile.address : "");

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      Alert.alert(
        "Mandatory Fields Required",
        "All fields marked with an asterisk (*) are compulsory. Please fill out all fields before saving."
      );
      return;
    }

    setProfile({
      ...profile,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    Alert.alert("Success", "Profile Updated Successfully");
    onBack();
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader title="Edit Profile" onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label="Full Name"
          required
          leftIcon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
        />

        <TextField
          label="Email Address"
          required
          leftIcon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="Phone Number"
          required
          leftIcon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
        />

        <TextField
          label="Delivery Address"
          required
          leftIcon="location-outline"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter complete address"
        />

        <Button title="Save Changes" onPress={handleSave} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </Screen>
  );
}
