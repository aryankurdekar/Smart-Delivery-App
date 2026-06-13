import { Platform } from "react-native";

/*
=========================================
SMART DELIVERY API CONFIGURATION
=========================================

1. Open CMD
2. Run: ipconfig
3. Find IPv4 Address

Example:
192.168.29.105

4. Replace the IP below with your IP
=========================================
*/

// const PC_IP = "192.168.31"; // <-- CHANGE THIS to your PC's LAN IP (auto-set for this machine)

export const API_ROOT_URL = "https://smart-delivery-app.onrender.com";

export const API_BASE_URL = `${API_ROOT_URL}/api`;

console.log("=================================");
console.log("Platform:", Platform.OS);
console.log("API_ROOT_URL:", API_ROOT_URL);
console.log("API_BASE_URL:", API_BASE_URL);
console.log("=================================");