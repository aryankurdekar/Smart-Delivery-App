import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, Card, SectionCard, Button } from "../components/ui";

export default function ProfileScreen({
  profile,
  onBack,
  onLogout,
  onEdit,
}) {
  const { colors, spacing, typography, isDarkMode, toggleDarkMode } = useTheme();

  const InfoRow = ({ icon, label, value, last }) => (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.t("footnote", "medium"), { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[typography.t("bodyLg", "semibold"), { color: colors.text, marginTop: 2 }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Screen scroll padded edges={["top"]}>
      <AppHeader
        title="Profile"
        onBack={onBack}
        style={{ marginHorizontal: -spacing.gutter, marginTop: -spacing.gutter, marginBottom: spacing.lg }}
        right={
          <TouchableOpacity onPress={toggleDarkMode} style={styles.themeBtn}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <Card style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
        <Ionicons name="person-circle" size={96} color={colors.primary} />
        <Text style={[typography.t("h2", "bold"), { color: colors.text, marginTop: spacing.sm }]}>
          {profile.name}
        </Text>
        <Text style={[typography.t("body", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>
          Customer
        </Text>
      </Card>

      <SectionCard title="Account Details" style={{ marginTop: spacing.lg }}>
        <InfoRow icon="mail-outline" label="Email" value={profile.email} />
        <InfoRow icon="call-outline" label="Phone" value={profile.phone} />
        <InfoRow icon="location-outline" label="Address" value={profile.address} last />
      </SectionCard>

      <Button title="Edit Profile" icon="create-outline" onPress={onEdit} style={{ marginTop: spacing.xl }} />
      <Button title="Logout" variant="danger" icon="log-out-outline" onPress={onLogout} style={{ marginTop: spacing.md, marginBottom: spacing.xxxl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeBtn: { padding: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
