import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Animated } from "react-native";
import { API as api } from "../services/api";
import { socket } from "../services/socket";
import { configureNotifications, notify } from "../services/notifications";
import { normalizeOrderItems } from "../utils/orderHelpers";
import { dedupeOrders } from "../utils/dedupeOrders";

// Human-friendly push text for each delivery status.
function statusMessage(o) {
  switch (o.status) {
    case "Assigned":
      return `${o.partnerName || "A rider"} has been assigned to your order.`;
    case "Picked Up":
      return "Your package has been picked up by the rider.";
    case "Out For Delivery":
      return "Your order is out for delivery and on its way!";
    case "Delivered":
      return "Your order has been delivered. Enjoy! 🎉";
    case "Cancelled":
      return "Your order has been cancelled.";
    default:
      return `Order status updated to ${o.status}.`;
  }
}

const samePhone = (a, b) =>
  !!a && !!b && String(a).replace(/\s+/g, "") === String(b).replace(/\s+/g, "");

export function useDeliveryApp() {
  const [screen, setScreen] = useState("splash");
  const [users, setUsers] = useState([]);
  const [isRiderOnline, setIsRiderOnline] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentTrackingOrderId, setCurrentTrackingOrderId] = useState(null);
  const [currentOrderDetailId, setCurrentOrderDetailId] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  // Live rider GPS coordinates pushed over Socket.IO, keyed by orderId.
  const [riderLocations, setRiderLocations] = useState({});
  const toastY = useRef(new Animated.Value(-100)).current;
  const placingRef = useRef(false);
  // Refs so socket callbacks always read the latest user/online state.
  const currentUserRef = useRef(currentUser);
  const isRiderOnlineRef = useRef(isRiderOnline);
  currentUserRef.current = currentUser;
  isRiderOnlineRef.current = isRiderOnline;

  const dismissToast = useCallback(() => {
    Animated.timing(toastY, {
      toValue: -150,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setActiveNotification(null));
  }, [toastY]);

  const showToast = useCallback(
    (title, message) => {
      setActiveNotification({ title, message });
      Animated.spring(toastY, {
        toValue: 20,
        useNativeDriver: true,
        tension: 20,
        friction: 6,
      }).start();
      setTimeout(dismissToast, 4000);
    },
    [toastY, dismissToast]
  );

  const refreshOrders = useCallback(async () => {
    try {
      const serverOrders = await api.getOrders();
      if (Array.isArray(serverOrders)) {
        setOrders(dedupeOrders(serverOrders));
      }
    } catch {
      /* offline — keep local state */
    }
  }, []);

  const syncUsers = useCallback(async () => {
    const list = await api.getUsersList();
    if (Array.isArray(list) && list.length > 0) {
      setUsers(list);
    }
  }, []);

  useEffect(() => {
    configureNotifications();
    refreshOrders();
    syncUsers();
    api.getRiderStatus().then((online) => {
      if (typeof online === "boolean") setIsRiderOnline(online);
    });
  }, [refreshOrders, syncUsers]);

  // Clear the stored JWT whenever the user logs out.
  useEffect(() => {
    if (!currentUser) api.clearAuth();
  }, [currentUser]);

  // Offline auto-progress when no rider online
  useEffect(() => {
    if (isRiderOnline) return;
    const interval = setInterval(() => {
      setOrders((prev) => {
        let updated = false;
        const next = prev.map((order) => {
          if (
            order.status !== "Delivered" &&
            order.status !== "Cancelled" &&
            (!order.partnerName || order.partnerName === "Rahul Kumar")
          ) {
            updated = true;
            let nextStatus = order.status;
            let nextETA = order.eta;
            if (order.status === "Placed") {
              nextStatus = "Assigned";
              nextETA = "20 Mins";
            } else if (order.status === "Assigned") {
              nextStatus = "Picked Up";
              nextETA = "15 Mins";
            } else if (order.status === "Picked Up") {
              nextStatus = "Out For Delivery";
              nextETA = "5 Mins";
            }
            return {
              ...order,
              status: nextStatus,
              eta: nextETA,
              partnerName: "Rahul Kumar",
              partnerPhone: "+91 8888888888",
            };
          }
          return order;
        });
        return updated ? next : prev;
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [isRiderOnline]);

  // Real-time: react to events the backend pushes over Socket.IO so every
  // dashboard reflects status changes and live rider GPS without polling.
  useEffect(() => {
    // Order status changed somewhere — refresh, and push a notification to the
    // customer whose order it is.
    const onStatusEvent = (order) => {
      refreshOrders();
      const u = currentUserRef.current;
      if (!u || !order || u.role !== "customer") return;
      const mine =
        samePhone(order.receiverPhone, u.phone) || order.receiverName === u.name;
      if (mine) notify(`Order #${order.id} • ${order.status}`, statusMessage(order));
    };
    // New order placed — alert online riders.
    const onNewOrder = (order) => {
      refreshOrders();
      const u = currentUserRef.current;
      if (u && u.role === "partner" && isRiderOnlineRef.current) {
        notify("New delivery request 📦", `Order #${order?.id} is available to accept.`);
      }
    };
    const onRiderLocation = (data) => {
      if (!data || data.orderId == null) return;
      setRiderLocations((prev) => ({
        ...prev,
        [String(data.orderId)]: {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading ?? 0,
        },
      }));
    };

    socket.on("new_delivery_request", onNewOrder);
    socket.on("admin_fleet_update", onStatusEvent);
    socket.on("order_status_updated", onStatusEvent);
    socket.on("rider_location_updated", onRiderLocation);
    socket.on("admin_rider_location_sync", onRiderLocation);

    return () => {
      socket.off("new_delivery_request", onNewOrder);
      socket.off("admin_fleet_update", onStatusEvent);
      socket.off("order_status_updated", onStatusEvent);
      socket.off("rider_location_updated", onRiderLocation);
      socket.off("admin_rider_location_sync", onRiderLocation);
    };
  }, [refreshOrders]);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== product.id);
    });
  };

  const handleDeleteFromCart = (product) => {
    setCart((prev) => prev.filter((item) => item.product.id !== product.id));
  };

  const placeOrder = async (orderPayload) => {
    if (placingRef.current) return null;
    placingRef.current = true;
    try {
      const newOrder = await api.placeOrder({
        ...orderPayload,
        customerEmail: currentUser?.email || "",
      });
      await refreshOrders();
      return newOrder;
    } finally {
      placingRef.current = false;
    }
  };

  const handleShopCheckout = async (address, totalAmount) => {
    const orderPayload = {
      type: "shop",
      pickup: "Smart Store Outlet",
      delivery: address,
      items: normalizeOrderItems(cart),
      receiverName: currentUser?.name || "Customer",
      receiverPhone: currentUser?.phone || "+91 9876543210",
      totalAmount,
    };
    const newOrder = await placeOrder(orderPayload);
    if (!newOrder) return;
    setCart([]);
    setCurrentTrackingOrderId(newOrder.id);
    // showToast("Order Confirmed! 🎉", `Order #${newOrder.id} placed. Check your email for confirmation.`);
    console.log("ORDER CREATED:", JSON.stringify(newOrder, null, 2));
    setScreen("tracking");
  };

  const handlePlaceCourierOrder = async (orderData) => {
    const newOrder = await placeOrder({
      type: "package",
      ...orderData,
    });
    if (!newOrder) return;
    setCurrentTrackingOrderId(newOrder.id);
    showToast("Order Placed! 📦", `Courier Order #${newOrder.id} created.`);
    setScreen("tracking");
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await api.cancelOrder(orderId);
            } catch {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === orderId
                    ? { ...o, status: "Cancelled", eta: "Cancelled" }
                    : o
                )
              );
            }
            await refreshOrders();
            showToast("Order Cancelled", `Order #${orderId} has been cancelled.`);
            setScreen("myOrders");
          },
        },
      ]
    );
  };

  const handleOTPSuccess = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, "Delivered");
      await refreshOrders();
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "Delivered", eta: "Completed" } : o
        )
      );
    }
    showToast("Delivery Completed! ✅", `Order #${orderId} delivered successfully.`);
    setScreen("myOrders");
  };

  const handleRiderAcceptOrder = async (orderId) => {
    const riderName = currentUser?.name || "Rahul Kumar";
    const riderPhone = currentUser?.phone || "+91 8888888888";
    try {
      await api.acceptOrder(orderId, riderName, riderPhone);
      await refreshOrders();
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "Assigned", eta: "20 Mins", partnerName: riderName, partnerPhone: riderPhone }
            : o
        )
      );
    }
    setCurrentTrackingOrderId(orderId);
    setScreen("partnerDelivery");
    showToast("Order Accepted 🛵", `Delivery started for Order #${orderId}.`);
  };

  const handleRiderContinueDelivery = (orderId) => {
    setCurrentTrackingOrderId(orderId);
    setScreen("partnerDelivery");
  };

  const handleRiderUpdateStatus = async (orderId, nextStatus) => {
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await refreshOrders();
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: nextStatus, eta: nextStatus === "Picked Up" ? "15 Mins" : "5 Mins" }
            : o
        )
      );
    }
    showToast("Status Updated 📍", `Order #${orderId}: ${nextStatus}`);
  };

  const handleRiderVerifyOTP = async (orderId, otp) => {
    try {
      await api.verifyOTP(orderId, otp);
      await refreshOrders();
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "Delivered", eta: "Completed" } : o
        )
      );
    }
    showToast("Package Delivered! 🎉", `Incentive credited for Order #${orderId}.`);
    setScreen("partnerDashboard");
  };

  const handleAdminBlockToggle = async (email, shouldBlock) => {
    try {
      await api.blockUser(email, shouldBlock);
      await syncUsers();
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, isBlocked: shouldBlock } : u))
      );
    }
    showToast(
      shouldBlock ? "Account Blocked 🚫" : "Account Restored ✅",
      `Account ${email} updated.`
    );
  };

  const handleAdminOverrideOrderStatus = async (orderId, newStatus) => {
    try {
      await api.overrideOrderStatus(orderId, newStatus);
      await refreshOrders();
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus, eta: newStatus === "Delivered" ? "Completed" : "Cancelled" }
            : o
        )
      );
    }
    showToast("Admin Override 🛡️", `Order #${orderId} set to ${newStatus}.`);
  };

  const handleRiderOnlineChange = async (online) => {
    setIsRiderOnline(online);
    try {
      await api.setRiderStatus(online);
    } catch {
      /* local only */
    }
  };

  return {
    screen,
    setScreen,
    users,
    setUsers,
    isRiderOnline,
    currentUser,
    setCurrentUser,
    orders,
    cart,
    currentTrackingOrderId,
    setCurrentTrackingOrderId,
    currentOrderDetailId,
    setCurrentOrderDetailId,
    activeNotification,
    riderLocations,
    toastY,
    dismissToast,
    refreshOrders,
    handleAddToCart,
    handleRemoveFromCart,
    handleDeleteFromCart,
    handleShopCheckout,
    handlePlaceCourierOrder,
    handleCancelOrder,
    handleOTPSuccess,
    handleRiderAcceptOrder,
    handleRiderContinueDelivery,
    handleRiderUpdateStatus,
    handleRiderVerifyOTP,
    handleAdminBlockToggle,
    handleAdminOverrideOrderStatus,
    handleRiderOnlineChange,
  };
}
