# Smart Delivery — Deployment Guide

## Quick start (local development)

### 1. Backend

```powershell
cd c:\App\smart-delivery-app\backend
npm install
npm start
```

Server runs at `http://localhost:5000`. Emails print to the **terminal** until you configure SMTP (see below).

### 2. Frontend (Expo)

```powershell
cd c:\App\smart-delivery-app\Frontend
npm install
npx expo start -c
```

**Important:** Do not copy the `>>` prefix from docs — that causes PowerShell errors. Run commands exactly as shown.

| Device | API URL |
|--------|---------|
| iOS Simulator | `http://localhost:5000/api` (default) |
| Android Emulator | `http://10.0.2.2:5000/api` (default) |
| Physical phone | Create `Frontend/.env` with your PC LAN IP |

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:5000/api
```

Find your IP: `ipconfig` → IPv4 Address (e.g. `192.168.1.5`).

---

## Email notifications

Orders trigger emails on **placed**, **delivered**, and **cancelled**.

1. Copy `backend/.env.example` → `backend/.env`
2. For Gmail: enable 2FA → create an [App Password](https://myaccount.google.com/apppasswords)
3. Set `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`

Without SMTP, emails appear in the backend console (dev mode).

---

## Deploy backend (Render — free tier)

1. Push repo to GitHub
2. [render.com](https://render.com) → New **Web Service**
3. Root directory: `backend`
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables from `.env.example`
7. Copy your Render URL (e.g. `https://smart-delivery-api.onrender.com`)

Update frontend `.env`:

```env
EXPO_PUBLIC_API_URL=https://smart-delivery-api.onrender.com/api
```

**Note:** Render free tier sleeps after inactivity — first request may take ~30s.

### Alternatives

- **Railway** — similar setup, `backend` folder, `npm start`
- **VPS (DigitalOcean/AWS)** — `pm2 start server.js`, nginx reverse proxy, SSL via Certbot

---

## Deploy mobile app (Expo EAS)

```powershell
cd Frontend
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
```

For production, set `EXPO_PUBLIC_API_URL` in `eas.json` env or Expo dashboard.

Publish OTA updates:

```powershell
eas update --branch production
```

---

## PostgreSQL Database Setup

The Smart Delivery backend uses PostgreSQL as its primary database.

### Environment Variables

Configure one of the following in `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

Or individual settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_delivery
DB_USER=postgres
DB_PASSWORD=your_password
```

### Recommended PostgreSQL Providers

- Neon (Free Tier)
- Supabase PostgreSQL
- Railway PostgreSQL
- Render PostgreSQL

### Local Development

1. Install PostgreSQL
2. Create a database named `smart_delivery`
3. Update the database credentials in `backend/.env`
4. Start the backend:

```powershell
cd backend
npm install
npm start
```

### Production Deployment

1. Create a PostgreSQL database on Neon, Supabase, Railway, or Render
2. Copy the connection string
3. Set `DATABASE_URL` in your hosting provider's environment variables
4. Restart the backend service

The backend will automatically connect to the configured PostgreSQL database during startup.

---

## Test Accounts

The application includes pre-configured demo accounts for testing and evaluation.

| Role | Email | Password |
|------|--------|----------|
| Customer | aryan@gmail.com | password123 |
| Rider | rider@gmail.com | password123 |
| Admin | admin@gmail.com | password123 |

>These accounts are automatically seeded in development/demo environments and are intended for testing purposes only.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Duplicate order key `1003` | Fixed — orders sync from server only (no double-append) |
| Text must be in `<Text>` | Fixed — order item shape normalized |
| SafeAreaView warning | Use `react-native-safe-area-context` (SafeScreen component) |
| Can't reach API on phone | Same Wi-Fi + LAN IP in `.env` + backend listens on `0.0.0.0` |
| `>>` command error | Remove `>>` — run `npx expo start -c` directly |
