import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, Card } from "../components/ui";

export default function CustomerDashboard({
  currentUser,
  onLogout,
  onPlaceOrder,
  onHistory,
  onProfile,
  onChat,
  onShop,
}) {
  const { colors, spacing, typography, radii } = useTheme();
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "there";

  const ActionBanner = ({ icon, accent, tint, title, desc, cta, onPress }) => (
    <Card style={{ marginTop: spacing.md }}>
      <View style={styles.bannerRow}>
        <View style={[styles.bannerIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={24} color={accent} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.t("subtitle", "bold"), { color: colors.text }]}>{title}</Text>
          <Text style={[typography.t("footnote", "regular"), { color: colors.textSecondary, marginTop: 2 }]}>{desc}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.bannerCta, { backgroundColor: accent, borderRadius: radii.md }]}
      >
        <Text style={[typography.t("body", "semibold"), { color: "#FFFFFF" }]}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </Card>
  );

  const QuickRow = ({ icon, label, onPress }) => (
    <Card onPress={onPress} style={{ marginTop: spacing.md }} padding={spacing.lg}>
      <View style={styles.quickRow}>
        <View style={[styles.quickIcon, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[typography.t("bodyLg", "medium"), { color: colors.text, flex: 1, marginLeft: spacing.md }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen scroll padded edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.t("body", "regular"), { color: colors.textSecondary }]}>Hello,</Text>
          <Text style={[typography.t("h2", "bold"), { color: colors.text }]}>{firstName}</Text>
        </View>
        <TouchableOpacity onPress={onProfile} style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={[styles.logout, { borderColor: colors.border }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ActionBanner
        icon="cube-outline"
        accent={colors.primary}
        tint={colors.primaryLight}
        title="Send a Package"
        desc="Courier anything across the city, tracked live."
        cta="Send Package"
        onPress={onPlaceOrder}
      />
      <ActionBanner
        icon="bag-handle-outline"
        accent={colors.partner}
        tint={colors.surfaceAlt}
        title="Shop Essentials"
        desc="Groceries, snacks and more to your door."
        cta="Browse Store"
        onPress={onShop}
      />

      <Text style={[typography.t("footnote", "semibold"), { color: colors.textMuted, marginTop: spacing.xl, letterSpacing: 0 }]}>
        QUICK ACTIONS
      </Text>
      <QuickRow icon="receipt-outline" label="My Deliveries & Orders" onPress={onHistory} />
      <QuickRow icon="chatbubble-ellipses-outline" label="Customer Support Chat" onPress={onChat} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logout: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  bannerCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 46, marginTop: 16 },
  quickRow: { flexDirection: "row", alignItems: "center" },
  quickIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
