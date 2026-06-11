# Smart Delivery Tracking System 🛵

A full-stack, real-time delivery-tracking app with three roles — **Customer**, **Delivery Partner**, and **Admin**.

- **Frontend:** React Native (Expo SDK 54)
- **Backend:** Node.js + Express + Socket.IO
- **Database:** PostgreSQL
- **Security:** JWT auth, bcrypt password hashing, role-based access

---

## ✨ Key Features

| Area | What it does |
|------|--------------|
| **Real-time order status** | Status changes (Placed → Assigned → Picked Up → Out for Delivery → Delivered) push live to every device over **Socket.IO** — no refresh. |
| **Live map tracking** | The customer watches the rider move on a real **OpenStreetMap** street map; the rider broadcasts live GPS over Socket.IO. |
| **Live GPS sharing** | Rider app reads device GPS via `expo-location` and publishes coordinates to the customer's tracking room in real time. |
| **Push notifications** | On-device notifications fire on order status changes and new delivery requests (`expo-notifications`). |
| **Real-time chat** | Customer ⇄ support chat persisted in PostgreSQL and delivered live over Socket.IO, with a server-side auto-reply bot. |
| **OTP delivery confirmation** | A 4-digit OTP is generated per order and verified on handover. |
| **Secure auth** | JWT (24h) + bcrypt; order/chat routes require a valid token; admin routes are role-gated. |
| **Admin dashboard** | Live orders, user management (block/unblock), order overrides, analytics. |
| **Dark mode** | App-wide light/dark theme with a persisted toggle. |

---

## 📂 Project Structure

```text
├── backend/                      # Node.js + Express + Socket.IO API
│   ├── data/products.js          # Product catalog
│   ├── services/emailService.js  # Email notifications (nodemailer)
│   ├── db.js                     # PostgreSQL connection pool
│   ├── schema.sql                # Tables, indexes, seed data
│   ├── seed.js                   # One-command DB setup  (npm run seed)
│   ├── server.js                 # REST routes + Socket.IO events
│   └── .env.example              # Environment template
├── Frontend/                     # React Native (Expo) app
│   ├── src/
│   │   ├── components/LiveMap.js  # OpenStreetMap + live rider marker (WebView/Leaflet)
│   │   ├── config/apiConfig.js    # Backend URL (set your LAN IP here)
│   │   ├── context/ThemeContext.js
│   │   ├── hooks/useDeliveryApp.js # App state + Socket.IO wiring
│   │   ├── screens/               # 21 screens (customer / rider / admin)
│   │   ├── services/
│   │   │   ├── api.js             # REST client (attaches JWT)
│   │   │   ├── socket.js          # Socket.IO client
│   │   │   └── notifications.js   # Local push notifications
│   │   └── utils/geo.js           # Map coordinate helpers
│   └── app.json
└── README.md
```

---

## ⚡ Quick Start

**Prerequisites:** Node.js 18+, PostgreSQL running locally, and the **Expo Go** app on your phone (or an Android emulator).

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit .env — set DB_PASSWORD to your Postgres password
npm install
npm run seed                  # creates the database + loads tables and seed data
npm start                     # API + WebSockets on http://localhost:5000
```

> The connection uses the `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME` values in `.env`.
> If your Postgres has no `postgres` role, set `DB_USER` to your own role (e.g. your macOS username).

### 2. Frontend

```bash
cd Frontend
npm install
```

Open `src/config/apiConfig.js` and set `PC_IP` to your computer's **LAN IP** (so your phone can reach the backend):

```js
const PC_IP = "192.168.1.2";   // ← your machine's IP (run `ipconfig`/`ifconfig` to find it)
```

- Physical phone (Expo Go): use your LAN IP, and keep phone + computer on the **same Wi-Fi**.
- Android emulator: use `10.0.2.2`.

Then start Expo and open the app:

```bash
npx expo start
```

Scan the QR with Expo Go, or press `a` for an Android emulator.

---

## 🔐 Test Accounts

All seeded with password **`password123`**:

| Role | Email |
|------|-------|
| Customer | `aryan@gmail.com` |
| Delivery Partner | `rider@gmail.com` |
| Delivery Partner (backup) | `amit@delivery.com` |
| Admin | `admin@gmail.com` |

---

## 🎬 Try the real-time flow

1. Log in as the **customer** on one device, place an order, open **Track Order**.
2. Log in as the **partner** on a second device → accept the order → mark *Picked Up* / *Out for Delivery*.
3. Watch the customer's screen update live: status changes, a notification fires, and the rider marker moves on the map.
4. Complete delivery by verifying the **OTP** shown on the customer's tracking screen.

---

## 📱 Build an Android APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # produces an installable .apk
```

An `eas.json` with an APK `preview` profile is included. Download the `.apk` from the link EAS prints, then install it on your device.

---

## 📝 Implementation notes (honest)

- **Maps use OpenStreetMap (keyless)** via Leaflet in a WebView, so no Google Maps API key/billing is needed. To switch to Google Maps, drop in `react-native-maps` with `PROVIDER_GOOGLE` + an API key — the `LiveMap` props stay the same. (A network connection is needed to load map tiles.)
- **Notifications are on-device (local)**. To add remote Firebase Cloud Messaging push, create a Firebase project and register an Expo push token; the `notify()` call sites stay the same.
- **Rider movement on the map** is interpolated along the route for a clear demo, and is published over Socket.IO as genuine real-time location data; `expo-location` reads the device's real GPS.
- **Secrets** live in `.env` (git-ignored). `.env.example` is the template — never commit real credentials.

See `API_DOCUMENTATION.md` for the full REST + Socket.IO reference and `DEPLOYMENT.md` for hosting.
