# Smart Delivery API & WebSockets Documentation

This file documents the REST API endpoints and Socket.IO real-time events for the **Smart Delivery Tracking System**.

---

## 1. REST API Endpoints

All base URLs are prefixed with: `http://<server-ip>:5000/api`

### Authentication

Login/register return a **JWT** (24h expiry). Protected endpoints require it in the request header:

```
Authorization: Bearer <token>
```

- **Auth required** (any logged-in user): all `/orders*` and `/chat` endpoints.
- **Admin role required**: `/admin/*` and `/users`.
- **Public**: `/auth/register`, `/auth/login`, `/products`, `/rider/status`.

### 🔑 Authentication Portal

#### `POST /auth/register`
Creates a new customer account.
- **Request Body**:
  ```json
  {
    "name": "Aryan Kurdekar",
    "email": "aryan@gmail.com",
    "phone": "+91 9876543210",
    "password": "password123",
    "address": "Bangalore, Karnataka"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": 1,
    "name": "Aryan Kurdekar",
    "email": "aryan@gmail.com",
    "phone": "+91 9876543210",
    "address": "Bangalore, Karnataka",
    "role": "customer",
    "is_blocked": false,
    "token": "eyJhbGciOi..."
  }
  ```

#### `POST /auth/login`
Authenticates user and signs session token.
- **Request Body**:
  ```json
  {
    "emailOrPhone": "aryan@gmail.com",
    "password": "password123",
    "selectedRole": "customer"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "name": "Aryan Kurdekar",
    "email": "aryan@gmail.com",
    "phone": "+91 9876543210",
    "address": "Bangalore, Karnataka",
    "role": "customer",
    "isBlocked": false,
    "token": "eyJhbGciOi..."
  }
  ```

#### `PUT /auth/profile`
Updates customer profile details.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "email": "aryan@gmail.com",
    "name": "Aryan K",
    "phone": "+91 9876543211",
    "address": "HSR Layout, Bangalore"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "name": "Aryan K",
    "email": "aryan@gmail.com",
    "phone": "+91 9876543211",
    "address": "HSR Layout, Bangalore",
    "role": "customer",
    "isBlocked": false
  }
  ```

---

### 📦 Orders Management

#### `GET /orders`
Retrieves full system orders. Shop orders automatically return nested line items.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": 1002,
      "type": "shop",
      "pickup": "Smart Store Outlet",
      "delivery": "Electronic City Phase 1",
      "packageType": null,
      "receiverName": "Aryan Kurdekar",
      "receiverPhone": "+91 9876543210",
      "status": "Delivered",
      "partnerName": "Amit Sharma",
      "partnerPhone": "+91 9898989898",
      "eta": "Completed",
      "otp": "5678",
      "totalAmount": "1037.00",
      "date": "29 May 2026",
      "items": [
        { "name": "Fresh Organic Avocados (1kg)", "quantity": 2, "price": 399 },
        { "name": "Gourmet Dark Chocolate Bar", "quantity": 1, "price": 180 }
      ]
    }
  ]
  ```

#### `POST /orders`
Creates a new order.
- **Request Body (Courier)**:
  ```json
  {
    "type": "package",
    "pickup": "MG Road, Indiranagar",
    "delivery": "Whitefield Main Rd",
    "packageType": "Documents",
    "receiverName": "Amit",
    "receiverPhone": "+91 9999999999",
    "customerEmail": "aryan@gmail.com"
  }
  ```
- **Request Body (Shop)**:
  ```json
  {
    "type": "shop",
    "pickup": "Smart Store Outlet",
    "delivery": "Indiranagar, Bangalore",
    "receiverName": "Aryan Kurdekar",
    "receiverPhone": "+91 9876543210",
    "totalAmount": 1037.00,
    "customerEmail": "aryan@gmail.com",
    "items": [
      { "name": "Fresh Organic Avocados (1kg)", "quantity": 2, "price": 399.00 },
      { "name": "Gourmet Dark Chocolate Bar", "quantity": 1, "price": 180.00 }
    ]
  }
  ```
- **Response** (`201 Created`): Returns created order matching parameters, with generated ID and random OTP.

#### `POST /orders/:id/cancel`
Cancels order (allowed only if state is 'Placed' or 'Assigned').
- **Response** (`200 OK`): Cancelled order data.

#### `POST /orders/:id/accept`
Assigns a Rider to the order.
- **Request Body**:
  ```json
  {
    "riderName": "Rahul Kumar",
    "riderPhone": "+91 8888888888"
  }
  ```

#### `POST /orders/:id/status`
Updates order transit milestone step.
- **Request Body**:
  ```json
  {
    "status": "Picked Up" // or 'Out For Delivery'
  }
  ```

#### `POST /orders/:id/verify-otp`
Verifies OTP code and marks order as 'Delivered'.
- **Request Body**:
  ```json
  {
    "otp": "1234"
  }
  ```

---

### 🛡️ Admin Controls

#### `GET /users`
Retrieves directory registry.
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Users array list.

#### `POST /admin/users/:email/block`
Suspends user account access.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "shouldBlock": true
  }
  ```

#### `POST /admin/orders/:id/override`
Bypasses OTP verification and forces status.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "Delivered" // or 'Cancelled'
  }
  ```

---

### 💬 Chat Support

#### `GET /chat`
Fetches database log of support thread.
- **Response**: Array of message logs.

#### `POST /chat`
Appends message to log. Trigger bot response if sender is customer.
- **Request Body**:
  ```json
  {
    "sender": "user",
    "text": "Where is my order?"
  }
  ```

---

## 2. Socket.IO Real-Time Engine

Connection URI: `http://<server-ip>:5000`

### Client Emissions (Listen to Events)

| Event Name | Parameter Payload | Description |
|------------|-------------------|-------------|
| `join_order_room` | `orderId` (string) | Registers client to listen to status and location events for order. |
| `leave_order_room` | `orderId` (string) | Unregisters client from specific order room events. |
| `share_rider_location` | `{ orderId, latitude, longitude, heading }` | Telemetry coordinates emitted by the rider app. |

### Server Emissions (Emitted to Client)

| Event Name | Room Scope | Parameter Payload | Description |
|------------|------------|-------------------|-------------|
| `new_delivery_request` | Broadcast | Order Object | Emitted to riders when a customer places an order. |
| `order_status_updated` | `order_id` & Broadcast | Order Object | Emitted when transit milestones change. |
| `rider_location_updated`| `order_id` room | `{ orderId, latitude, longitude, heading }` | Real-time coordinates received by customer tracking screen. |
| `receive_chat_message` | Broadcast | `{ sender, text, timestamp }` | Support message updates. |
