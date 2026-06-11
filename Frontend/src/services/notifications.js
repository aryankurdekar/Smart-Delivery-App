import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/*
=========================================
ON-DEVICE NOTIFICATIONS
=========================================
Fires local OS notifications in response to real-time Socket.IO events
(order status changes, new delivery requests). Works in Expo Go and in a
standalone build. To upgrade to remote Firebase Cloud Messaging push later,
add a Firebase project + expo-notifications push token registration — the
notify() call sites stay the same.
=========================================
*/

// Show notifications even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // legacy field (older SDKs)
    shouldShowBanner: true, // SDK 54+
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let configured = false;

/** Request permission + set up the Android channel. Safe to call repeatedly. */
export async function configureNotifications() {
  if (configured) return;
  configured = true;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Delivery Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    /* notifications unavailable — ignore */
  }
}

/** Present an immediate local notification. */
export async function notify(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // deliver right away
    });
  } catch {
    /* ignore */
  }
}
