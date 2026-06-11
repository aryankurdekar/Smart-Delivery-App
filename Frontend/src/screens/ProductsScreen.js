import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { PRODUCTS } from "../data/products";
import { Screen, AppHeader, TextField, Pill, EmptyState, BottomBar } from "../components/ui";

const GUTTER = 16;
const GAP = 12;
const CARD_W = (Dimensions.get("window").width - GUTTER * 2 - GAP) / 2;

function ProductImage({ uri, style, bg, iconColor }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: "center", alignItems: "center", backgroundColor: bg }]}>
        <Ionicons name="image-outline" size={30} color={iconColor} />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />;
}

export default function ProductsScreen({ cart, onAddToCart, onRemoveFromCart, onBack, onGoToCart }) {
  const { colors, spacing, radii, typography, shadows } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Meals", "Groceries", "Snacks", "Beverages", "Electronics", "Essentials"];

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProductQty = (productId) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const renderProductItem = ({ item }) => {
    const quantity = getProductQty(item.id);
    return (
      <View style={[styles.card, shadows.sm, { width: CARD_W, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
        <ProductImage
          uri={item.image}
          style={[styles.image, { borderRadius: radii.md, backgroundColor: colors.surfaceAlt }]}
          bg={colors.surfaceAlt}
          iconColor={colors.textMuted}
        />
        <Text style={[typography.t("caption", "semibold"), { color: colors.primary, marginTop: spacing.sm }]}>
          {item.category}
        </Text>
        <Text numberOfLines={2} style={[typography.t("body", "semibold"), { color: colors.text, marginTop: 2, minHeight: 40 }]}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[typography.t("bodyLg", "bold"), { color: colors.text }]}>₹{item.price}</Text>
          {quantity > 0 ? (
            <View style={[styles.stepper, { backgroundColor: colors.primary, borderRadius: radii.sm }]}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => onRemoveFromCart(item)}>
                <Ionicons name="remove" size={16} color="#FFF" />
              </TouchableOpacity>
              <Text style={[typography.t("footnote", "bold"), { color: "#FFF" }]}>{quantity}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => onAddToCart(item)}>
                <Ionicons name="add" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: colors.primary, borderRadius: radii.sm }]}
              onPress={() => onAddToCart(item)}
            >
              <Text style={[typography.t("footnote", "bold"), { color: colors.primary }]}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Screen edges={["top"]}>
      <AppHeader
        title="Shop"
        onBack={onBack}
        right={
          <TouchableOpacity onPress={onGoToCart} style={{ padding: 4 }}>
            <Ionicons name="cart-outline" size={26} color={colors.text} />
            {totalCartItems > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[typography.t("caption", "bold"), { color: "#FFF" }]}>{totalCartItems}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        }
      />

      <View style={{ paddingHorizontal: GUTTER, paddingTop: spacing.md }}>
        <TextField
          leftIcon="search"
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ marginBottom: spacing.md }}
        />
      </View>

      <View style={{ height: 40, marginBottom: spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingHorizontal: GUTTER }}
          renderItem={({ item }) => (
            <Pill label={item} active={selectedCategory === item} onPress={() => setSelectedCategory(item)} />
          )}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: GUTTER }}
        contentContainerStyle={{ paddingBottom: 120, gap: GAP, paddingTop: spacing.xs }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="search-outline" title="No products found" subtitle="Try a different search or category." />}
      />

      {totalCartItems > 0 ? (
        <BottomBar>
          <TouchableOpacity activeOpacity={0.9} onPress={onGoToCart} style={[styles.cartBar, { backgroundColor: colors.primary, borderRadius: radii.md }]}>
            <View>
              <Text style={[typography.t("footnote", "semibold"), { color: "#FFFFFFCC" }]}>
                {totalCartItems} {totalCartItems === 1 ? "item" : "items"}
              </Text>
              <Text style={[typography.t("bodyLg", "bold"), { color: "#FFF" }]}>₹{cartTotal}</Text>
            </View>
            <View style={styles.cartBarCta}>
              <Text style={[typography.t("bodyLg", "bold"), { color: "#FFF" }]}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </BottomBar>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 10, marginBottom: 0 },
  image: { width: "100%", height: 110 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  addBtn: { borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 6 },
  stepper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 2 },
  stepBtn: { padding: 6 },
  badge: { position: "absolute", right: -4, top: -4, minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  cartBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 56 },
  cartBarCta: { flexDirection: "row", alignItems: "center" },
});
