import React from "react";
import { View, StyleSheet, Text, Animated, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "./src/context/ThemeContext";
import { useDeliveryApp } from "./src/hooks/useDeliveryApp";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import CustomerDashboard from "./src/screens/CustomerDashboard";
import PlaceOrderScreen from "./src/screens/PlaceOrderScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import MyOrdersScreen from "./src/screens/MyOrdersScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import OTPVerificationScreen from "./src/screens/OTPVerificationScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import CartScreen from "./src/screens/CartScreen";
import ChatScreen from "./src/screens/ChatScreen";
import PartnerDashboard from "./src/screens/PartnerDashboard";
import PartnerDeliveryScreen from "./src/screens/PartnerDeliveryScreen";
import PartnerEarningsScreen from "./src/screens/PartnerEarningsScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import AdminManagementScreen from "./src/screens/AdminManagementScreen";
import { API } from "./src/services/api";

export default function App() {
  const { colors } = useTheme();
  const app = useDeliveryApp();

  if (app.screen === "splash") {
    return <SplashScreen onFinish={() => app.setScreen("login")} />;
  }

  if (app.screen === "login") {
    return (
      <LoginScreen
        users={app.users}
        onLogin={(user) => {
          app.setCurrentUser(user);
          app.setScreen("loading");
        }}
        onRegister={() => app.setScreen("register")}
        onForgotPassword={() => app.setScreen("forgotPassword")}
      />
    );
  }

  if (app.screen === "forgotPassword") {
    return <ForgotPasswordScreen onBack={() => app.setScreen("login")} onDone={() => app.setScreen("login")} />;
  }

  if (app.screen === "register") {
  return (
    <RegisterScreen
      onRegister={async (newUser) => {
        try {
          const createdUser = await API.register(newUser);

          Alert.alert(
            "Success",
            "Registration successful. Please login."
          );

          app.setUsers((prev) => [...prev, createdUser]);
          app.setScreen("login");
        } catch (err) {
          Alert.alert(
            "Registration Failed",
            err.message || "Unable to register user."
          );
        }
      }}
      onLogin={() => app.setScreen("login")}
    />
  );
}

  if (app.screen === "loading") {
    return (
      <LoadingScreen
        onFinish={async () => {
          await app.refreshOrders();
          const role = app.currentUser?.role;
          app.setScreen(
            role === "partner" ? "partnerDashboard" : role === "admin" ? "adminDashboard" : "dashboard"
          );
        }}
      />
    );
  }

  const trackOrder = app.orders.find((o) => o.id === app.currentTrackingOrderId);
  const detailOrder = app.orders.find((o) => o.id === app.currentOrderDetailId);

  const screens = {
    dashboard: (
      <CustomerDashboard
        currentUser={app.currentUser}
        onLogout={() => { app.setCurrentUser(null); app.setScreen("login"); }}
        onPlaceOrder={() => app.setScreen("placeOrder")}
        onHistory={() => app.setScreen("myOrders")}
        onProfile={() => app.setScreen("profile")}
        onChat={() => app.setScreen("chat")}
        onShop={() => app.setScreen("products")}
      />
    ),
    placeOrder: (
      <PlaceOrderScreen
        onBack={() => app.setScreen("dashboard")}
        onConfirm={app.handlePlaceCourierOrder}
      />
    ),
    products: (
      <ProductsScreen
        cart={app.cart}
        onAddToCart={app.handleAddToCart}
        onRemoveFromCart={app.handleRemoveFromCart}
        onBack={() => app.setScreen("dashboard")}
        onGoToCart={() => app.setScreen("cart")}
      />
    ),
    cart: (
      <CartScreen
        cart={app.cart}
        profile={app.currentUser}
        onAddToCart={app.handleAddToCart}
        onRemoveFromCart={app.handleRemoveFromCart}
        onDeleteFromCart={app.handleDeleteFromCart}
        onCheckout={app.handleShopCheckout}
        onBack={() => app.setScreen("products")}
      />
    ),
    tracking: (
      <TrackingScreen
        order={trackOrder}
        riderLocation={app.riderLocations[String(trackOrder?.id)]}
        onBack={() => app.setScreen("myOrders")}
        onVerify={() => app.setScreen("otp")}
        onCancel={() => app.handleCancelOrder(trackOrder?.id)}
      />
    ),
    myOrders: (
      <MyOrdersScreen
        orders={app.orders}
        currentUser={app.currentUser}
        onBack={() => app.setScreen("dashboard")}
        onActive={(id) => { app.setCurrentTrackingOrderId(id); app.setScreen("tracking"); }}
        onCompleted={(id) => { app.setCurrentOrderDetailId(id); app.setScreen("details"); }}
        onCancel={app.handleCancelOrder}
      />
    ),
    details: (
      <OrderDetailsScreen order={detailOrder} onBack={() => app.setScreen("myOrders")} />
    ),
    otp: (
      <OTPVerificationScreen
        order={trackOrder}
        onSuccess={() => trackOrder && app.handleOTPSuccess(trackOrder.id)}
        onBack={() => app.setScreen("tracking")}
      />
    ),
    chat: (
      <ChatScreen orders={app.orders} onBack={() => app.setScreen("dashboard")} />
    ),
    profile: (
      <ProfileScreen
        profile={app.currentUser}
        onBack={() => app.setScreen("dashboard")}
        onLogout={() => { app.setCurrentUser(null); app.setScreen("login"); }}
        onEdit={() => app.setScreen("editProfile")}
      />
    ),
    editProfile: (
      <EditProfileScreen
        profile={app.currentUser}
        setProfile={(updated) => {
          app.setCurrentUser(updated);
          app.setUsers((prev) =>
            prev.map((u) => (u.email === app.currentUser.email ? { ...u, ...updated } : u))
          );
        }}
        onBack={() => app.setScreen("profile")}
      />
    ),
    partnerDashboard: (
      <PartnerDashboard
        currentUser={app.currentUser}
        orders={app.orders}
        isOnline={app.isRiderOnline}
        setIsOnline={app.handleRiderOnlineChange}
        onLogout={() => { app.setCurrentUser(null); app.setScreen("login"); }}
        onAcceptOrder={app.handleRiderAcceptOrder}
        onContinueDelivery={app.handleRiderContinueDelivery}
        onViewEarnings={() => app.setScreen("partnerEarnings")}
      />
    ),
    partnerDelivery: (
      <PartnerDeliveryScreen
        order={trackOrder}
        onUpdateStatus={app.handleRiderUpdateStatus}
        onVerifyOTPComplete={app.handleRiderVerifyOTP}
        onBack={() => app.setScreen("partnerDashboard")}
      />
    ),
    partnerEarnings: (
      <PartnerEarningsScreen
        orders={app.orders}
        currentUser={app.currentUser}
        onBack={() => app.setScreen("partnerDashboard")}
      />
    ),
    adminDashboard: (
      <AdminDashboard
        orders={app.orders}
        users={app.users}
        onLogout={() => { app.setCurrentUser(null); app.setScreen("login"); }}
        onManageUsers={() => app.setScreen("adminManagement")}
        onOverrideOrder={(id) => {
          Alert.alert("Override Order", `Change status for Order #${id}?`, [
            { text: "No", style: "cancel" },
            { text: "Force Deliver", onPress: () => app.handleAdminOverrideOrderStatus(id, "Delivered") },
            { text: "Force Cancel", style: "destructive", onPress: () => app.handleAdminOverrideOrderStatus(id, "Cancelled") },
          ]);
        }}
      />
    ),
    adminManagement: (
      <AdminManagementScreen
        users={app.users}
        orders={app.orders}
        onBack={() => app.setScreen("adminDashboard")}
        onBlockUser={app.handleAdminBlockToggle}
        onOverrideOrderStatus={app.handleAdminOverrideOrderStatus}
      />
    ),
  };
  console.log("CURRENT SCREEN:", app.screen);

  return (
    <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
      {screens[app.screen] || null}

      {app.activeNotification && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: app.toastY }] }]}>
          <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={app.dismissToast}>
            <View style={styles.toastColorBar} />
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle}>
                  {String(app.activeNotification?.title ?? "")}
                </Text>

                <Text style={styles.toastText}>
                  {String(app.activeNotification?.message ?? "")}
                </Text>
            </View>
            <TouchableOpacity style={styles.toastCloseBtn} onPress={app.dismissToast}>
              <Text style={styles.toastCloseText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1 },
  toastContainer: { position: "absolute", top: 30, left: 15, right: 15, zIndex: 9999 },
  toastCard: {
    flexDirection: "row",
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 6,
    alignItems: "center",
  },
  toastColorBar: { width: 4, height: "100%", backgroundColor: "#0E9F6E", borderRadius: 2, marginRight: 12 },
  toastContent: { flex: 1 },
  toastTitle: { color: "#FFF", fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  toastText: { color: "#DDD", fontSize: 13 },
  toastCloseBtn: { paddingLeft: 10, paddingVertical: 5 },
  toastCloseText: { color: "#999", fontSize: 22, fontWeight: "300" },
});
