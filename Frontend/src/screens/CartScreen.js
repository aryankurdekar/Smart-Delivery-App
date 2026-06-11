import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, AppHeader, SectionCard, TextField, Button, EmptyState, BottomBar } from "../components/ui";

export default function CartScreen({ cart, profile, onAddToCart, onRemoveFromCart, onDeleteFromCart, onCheckout, onBack }) {
  const { colors, spacing, radii, typography } = useTheme();
  const [address, setAddress] = useState(profile ? profile.address : "");

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 49 : 0;
  const platformFee = subtotal > 0 ? 10 : 0;
  const total = subtotal + deliveryFee + platformFee;

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Please add items to your cart first.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter a valid delivery address.");
      return;
    }
    onCheckout(address, total);
  };

  const PriceRow = ({ label, value, strong }) => (
    <View style={styles.priceRow}>
      <Text style={[typography.t(strong ? "bodyLg" : "body", strong ? "semibold" : "regular"), { color: strong ? colors.text : colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[typography.t(strong ? "bodyLg" : "body", strong ? "bold" : "medium"), { color: strong ? colors.primary : colors.text }]}>
        ₹{value}
      </Text>
    </View>
  );

  return (
    <Screen edges={["top"]}>
      <AppHeader title="My Cart" onBack={onBack} />

      {cart.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Browse the store and add items to get started."
          actionTitle="Browse Products"
          onAction={onBack}
        />
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.gutter, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <SectionCard title="Items" style={{ marginBottom: spacing.lg }}>
              {cart.map((item, idx) => (
                <View
                  key={String(item.product?.id || idx)}
                  style={[styles.item, idx < cart.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[typography.t("body", "semibold"), { color: colors.text }]} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={[typography.t("caption", "medium"), { color: colors.primary, marginTop: 2 }]}>{item.product.category}</Text>
                    <Text style={[typography.t("footnote", "regular"), { color: colors.textMuted, marginTop: 2 }]}>₹{item.product.price} each</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={[styles.stepper, { backgroundColor: colors.primary, borderRadius: radii.sm }]}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => onRemoveFromCart(item.product)}>
                        <Ionicons name="remove" size={16} color="#FFF" />
                      </TouchableOpacity>
                      <Text style={[typography.t("footnote", "bold"), { color: "#FFF" }]}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => onAddToCart(item.product)}>
                        <Ionicons name="add" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[typography.t("body", "bold"), { color: colors.text, marginTop: 8 }]}>₹{item.product.price * item.quantity}</Text>
                  </View>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="Delivery Address" style={{ marginBottom: spacing.lg }}>
              <TextField
                leftIcon="location-outline"
                placeholder="Enter delivery address"
                value={address}
                onChangeText={setAddress}
                multiline
                style={{ marginBottom: 0 }}
              />
            </SectionCard>

            <SectionCard title="Bill Details" style={{ marginBottom: spacing.lg }}>
              <PriceRow label="Items Subtotal" value={subtotal} />
              <PriceRow label="Delivery Fee" value={deliveryFee} />
              <PriceRow label="Platform Fee" value={platformFee} />
              <View style={[styles.divider, { borderTopColor: colors.border }]} />
              <PriceRow label="Total Payable" value={total} strong />
            </SectionCard>

            <View style={[styles.cod, { backgroundColor: colors.surfaceAlt, borderRadius: radii.md }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.success} />
              <Text style={[typography.t("footnote", "medium"), { color: colors.textSecondary, marginLeft: 10 }]}>
                Payment Method: Cash on Delivery (COD)
              </Text>
            </View>
          </ScrollView>

          <BottomBar>
            <Button title={`Place Order  ·  ₹${total}`} onPress={handleCheckout} />
          </BottomBar>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  stepper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 2 },
  stepBtn: { padding: 6 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 2, marginBottom: 12 },
  cod: { flexDirection: "row", alignItems: "center", padding: 14 },
});
