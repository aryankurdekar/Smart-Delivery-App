import { Alert } from "react-native";
import { API_BASE_URL } from "../config/apiConfig";

const BASE_URL = API_BASE_URL;

// --- JWT handling: store the token from login and attach it to every request ---
let authToken = null;
export function setAuthToken(token) {
  authToken = token || null;
}
function authHeaders(extra) {
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(extra || {}),
  };
}

// Fallback Mock State in memory in case the backend server is not running
let mockUsers = [
  {
    name: "Aryan Kurdekar",
    email: "aryan@gmail.com",
    phone: "+91 9876543210",
    address: "Bangalore, Karnataka",
    password: "password123",
    role: "customer",
    isBlocked: false,
  },
  {
    name: "Rahul Kumar",
    email: "rider@gmail.com",
    phone: "+91 8888888888",
    address: "Delivery Hub Station, Indiranagar",
    password: "password123",
    role: "partner",
    isBlocked: false,
  },
  {
    name: "Amit Sharma",
    email: "amit@delivery.com",
    phone: "+91 9898989898",
    address: "Central Store Depot, Whitefield",
    password: "password123",
    role: "partner",
    isBlocked: false,
  },
  {
    name: "Vikram Singh",
    email: "vikram@delivery.com",
    phone: "+91 7777777777",
    address: "Smart Store Hub, Koramangala",
    password: "password123",
    role: "partner",
    isBlocked: false,
  },
  {
    name: "System Admin",
    email: "admin@gmail.com",
    phone: "+91 9999999999",
    address: "Headquarters Office, Bangalore",
    password: "password123",
    role: "admin",
    isBlocked: false,
  },
];

let mockOrders = [
  {
    id: "1001",
    type: "package",
    pickup: "MG Road, Indiranagar",
    delivery: "Whitefield Main Rd",
    packageType: "Documents",
    receiverName: "Aryan",
    receiverPhone: "+91 9876543210",
    status: "Delivered",
    partnerName: "Rahul Kumar",
    partnerPhone: "+91 8888888888",
    eta: "Completed",
    otp: "1234",
    date: "29 May 2026",
  },
  {
    id: "1002",
    type: "shop",
    pickup: "Smart Store Outlet",
    delivery: "Electronic City Phase 1",
    items: [
      { name: "Fresh Organic Avocados (1kg)", quantity: 2, price: 399 },
      { name: "Gourmet Dark Chocolate Bar", quantity: 1, price: 180 },
    ],
    receiverName: "Aryan Kurdekar",
    receiverPhone: "+91 9876543210",
    status: "Delivered",
    partnerName: "Amit Sharma",
    partnerPhone: "+91 9898989898",
    eta: "Completed",
    otp: "5678",
    date: "29 May 2026",
    totalAmount: 1037,
  },
];

let mockChatMessages = [
  { id: "m1", sender: "support", text: "Hello! Welcome to Smart Delivery support. How can we help you today?", timestamp: "12:00 AM" }
];

let mockIsRiderOnline = true;
let mockResetCodes = {}; // emailLower -> otp (offline password-reset demo)

function nextMockOrderId() {
  const maxId = mockOrders.reduce((max, o) => Math.max(max, parseInt(o.id, 10) || 0), 1000);
  return (maxId + 1).toString();
}

function buildLocalOrder(orderData) {
  return {
    id: nextMockOrderId(),
    status: "Placed",
    otp: Math.floor(1000 + Math.random() * 9000).toString(),
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    partnerName: "",
    partnerPhone: "",
    eta: "Calculating...",
    ...orderData,
  };
}

// Helper: Test server connection
async function checkServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 1s timeout
    const res = await fetch(`${BASE_URL}/rider/status`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

export const API = {
  // Clear the stored JWT (call on logout).
  clearAuth: () => setAuthToken(null),

  // 1. Authentication
  login: async (emailOrPhone, password, selectedRole) => {
    const isLive = await checkServer();
    if (isLive) {
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ emailOrPhone, password, selectedRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Authentication failed.");
        setAuthToken(data.token); // attach JWT to all subsequent requests
        return data;
      } catch (err) {
        throw err;
      }
    } else {
      console.warn("[API MOCK] Express server offline. Using local storage mock authentication.");
      const matched = mockUsers.find(
        (u) =>
          (u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
            u.phone?.replace(/\s+/g, "") === emailOrPhone.trim().replace(/\s+/g, "")) &&
          u.password === password
      );

      if (!matched) throw new Error("Invalid email/phone or password.");

      if (selectedRole === "customer" && matched.role !== "customer" && matched.role !== undefined) {
        throw new Error("This account is registered for another portal.");
      }
      if (selectedRole === "partner" && matched.role !== "partner") {
        throw new Error("This account is not registered as a delivery partner.");
      }
      if (selectedRole === "admin" && matched.role !== "admin") {
        throw new Error("This account does not have administrator privileges.");
      }
      if (matched.isBlocked) {
        throw new Error("This account has been temporarily blocked by the Administrator.");
      }
      return matched;
    }
  },

  register: async (newUser) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      return data;
    } else {
      const exists = mockUsers.find(
        (u) => u.email.toLowerCase() === newUser.email.toLowerCase() || u.phone === newUser.phone
      );
      if (exists) throw new Error("An account with this email or phone already exists.");

      const created = { ...newUser, role: "customer", isBlocked: false };
      mockUsers.push(created);
      return created;
    }
  },

  // Password reset — step 1: request a code
  forgotPassword: async (emailOrPhone) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ emailOrPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send reset code.");
      return data; // { success, message, devOtp? }
    } else {
      const matched = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
          u.phone?.replace(/\s+/g, "") === emailOrPhone.trim().replace(/\s+/g, "")
      );
      if (!matched) return { success: true, message: "If that account exists, a reset code has been sent." };
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      mockResetCodes[matched.email.toLowerCase()] = otp;
      return { success: true, message: "Reset code generated (offline demo).", devOtp: otp };
    }
  },

  // Password reset — step 2: set a new password with the code
  resetPassword: async (emailOrPhone, otp, newPassword) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ emailOrPhone, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password.");
      return data;
    } else {
      if (newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
      const matched = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
          u.phone?.replace(/\s+/g, "") === emailOrPhone.trim().replace(/\s+/g, "")
      );
      if (!matched) throw new Error("Account not found.");
      if (mockResetCodes[matched.email.toLowerCase()] !== String(otp).trim()) {
        throw new Error("Invalid reset code.");
      }
      matched.password = newPassword;
      delete mockResetCodes[matched.email.toLowerCase()];
      return { success: true, message: "Password reset successful (offline demo)." };
    }
  },

  updateProfile: async (email, profileData) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ email, ...profileData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile update failed.");
      return data;
    } else {
      const idx = mockUsers.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        mockUsers[idx] = { ...mockUsers[idx], ...profileData };
        return mockUsers[idx];
      }
      throw new Error("User not found.");
    }
  },

  // 2. Rider Online Status
  getRiderStatus: async () => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/rider/status`);
      const data = await res.json();
      return data.isRiderOnline;
    } else {
      return mockIsRiderOnline;
    }
  },

  setRiderStatus: async (isOnline) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/rider/status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ isOnline }),
      });
      const data = await res.json();
      return data.isRiderOnline;
    } else {
      mockIsRiderOnline = isOnline;
      return mockIsRiderOnline;
    }
  },

  // 3. Orders Management
  getOrders: async () => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders`, { headers: authHeaders() });
      return await res.json();
    } else {
      return mockOrders;
    }
  },

  placeOrder: async (orderData) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order placement failed.");
      return data;
    } else {
      const newOrder = buildLocalOrder(orderData);
      mockOrders.push(newOrder);
      return newOrder;
    }
  },

  /** Offline-only placement (called when server unreachable). */
  placeOrderLocal: async (orderData) => {
    const newOrder = buildLocalOrder(orderData);
    mockOrders.push(newOrder);
    return newOrder;
  },

  cancelOrder: async (orderId) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed.");
      return data;
    } else {
      const idx = mockOrders.findIndex((o) => o.id === orderId);
      if (idx === -1) throw new Error("Order not found.");
      mockOrders[idx] = { ...mockOrders[idx], status: "Cancelled", eta: "Cancelled" };
      return mockOrders[idx];
    }
  },

  getProducts: async () => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/products`);
      if (res.ok) return await res.json();
    }
    return null;
  },

  acceptOrder: async (orderId, riderName, riderPhone) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/accept`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ riderName, riderPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Accept order failed.");
      return data;
    } else {
      const idx = mockOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        mockOrders[idx] = {
          ...mockOrders[idx],
          status: "Assigned",
          eta: "20 Mins",
          partnerName: riderName || "Rahul Kumar",
          partnerPhone: riderPhone || "+91 8888888888",
        };
        return mockOrders[idx];
      }
      throw new Error("Order not found.");
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update status failed.");
      return data;
    } else {
      const idx = mockOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        let eta = mockOrders[idx].eta;
        if (status === "Picked Up") eta = "15 Mins";
        else if (status === "Out For Delivery") eta = "5 Mins";
        else if (status === "Delivered") eta = "Completed";

        mockOrders[idx] = { ...mockOrders[idx], status, eta };
        return mockOrders[idx];
      }
      throw new Error("Order not found.");
    }
  },

  verifyOTP: async (orderId, otp) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/verify-otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP verification.");
      return data;
    } else {
      const idx = mockOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        if (mockOrders[idx].otp !== otp) throw new Error("Invalid verification OTP.");
        mockOrders[idx] = { ...mockOrders[idx], status: "Delivered", eta: "Completed" };
        return mockOrders[idx];
      }
      throw new Error("Order not found.");
    }
  },

  // 4. Admin Direct Overrides
  overrideOrderStatus: async (orderId, status) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/override`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } else {
      const idx = mockOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        mockOrders[idx] = {
          ...mockOrders[idx],
          status,
          eta: status === "Delivered" ? "Completed" : "Cancelled",
        };
        return mockOrders[idx];
      }
      throw new Error("Order not found.");
    }
  },

  blockUser: async (email, shouldBlock) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/admin/users/${email}/block`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ shouldBlock }),
      });
      return await res.json();
    } else {
      const idx = mockUsers.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        mockUsers[idx].isBlocked = shouldBlock;
        return mockUsers[idx];
      }
      throw new Error("User not found.");
    }
  },

  getUsersList: async () => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/users`, { headers: authHeaders() });
      if (res.ok) return await res.json();
      return mockUsers;
    }
    return mockUsers;
  },

  // 5. Chat Support
  getChatMessages: async () => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/chat`, { headers: authHeaders() });
      return await res.json();
    } else {
      return mockChatMessages;
    }
  },

  sendChatMessage: async (sender, text) => {
    const isLive = await checkServer();
    if (isLive) {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sender, text }),
      });
      return await res.json();
    } else {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = {
        id: "msg" + (mockChatMessages.length + 1),
        sender,
        text,
        timestamp: time,
      };
      mockChatMessages.push(newMsg);

      if (sender === "user") {
        setTimeout(() => {
          mockChatMessages.push({
            id: "msg" + (mockChatMessages.length + 2),
            sender: "support",
            text: text.toLowerCase().includes("order")
              ? "We are currently checking the dispatch logs for your order. Rest assured our delivery partner is moving as quickly as possible!"
              : "Thank you for writing to us. A customer support representative will join this conversation shortly.",
            timestamp: time,
          });
        }, 1000);
      }
      return newMsg;
    }
  },
};
