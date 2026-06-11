import { io } from "socket.io-client";
import { API_ROOT_URL } from "../config/apiConfig";

/*
=========================================
SMART DELIVERY — REAL-TIME SOCKET CLIENT
=========================================
A single shared Socket.IO connection for the whole app. The backend
(server.js) emits these events; here is where the client finally listens.

Server -> client events:
  new_delivery_request       new order placed (riders refresh assigned list)
  admin_fleet_update         any order status change (all dashboards refresh)
  order_status_updated       status change for a specific order room
  rider_location_updated     live rider GPS for a specific order room
  admin_rider_location_sync  live rider GPS (global, for admin fleet map)
  receive_chat_message       new support chat message

Client -> server events:
  join_order_room / leave_order_room   subscribe to one order's updates
  share_rider_location                 rider publishes its live GPS
=========================================
*/

export const socket = io(API_ROOT_URL, {
  transports: ["websocket"], // RN works best with the websocket transport only
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  timeout: 8000,
});

socket.on("connect", () => console.log("[socket] connected:", socket.id));
socket.on("disconnect", (reason) => console.log("[socket] disconnected:", reason));
socket.on("connect_error", (err) => console.log("[socket] connect_error:", err?.message));

/** Subscribe to live updates for one order (status + rider location). */
export const joinOrderRoom = (orderId) => {
  if (orderId != null) socket.emit("join_order_room", String(orderId));
};

/** Stop receiving updates for an order. */
export const leaveOrderRoom = (orderId) => {
  if (orderId != null) socket.emit("leave_order_room", String(orderId));
};

/** Rider publishes its live GPS for an order. */
export const shareRiderLocation = ({ orderId, latitude, longitude, heading }) => {
  if (orderId == null) return;
  socket.emit("share_rider_location", {
    orderId: String(orderId),
    latitude,
    longitude,
    heading: heading ?? 0,
  });
};

export default socket;
