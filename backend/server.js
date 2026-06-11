const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const PRODUCTS = require("./data/products");
const {
  sendOrderEmail,
  buildOrderPlacedEmail,
  buildOrderDeliveredEmail,
  buildOrderCancelledEmail,
} = require("./services/emailService");

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP Server for Socket.IO integration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

/* =========================================
   DEBUG REQUEST LOGGER
========================================= */
app.use((req, res, next) => {
  console.log("\n=================================");
  console.log(" REQUEST RECEIVED");
  console.log("TIME:", new Date().toLocaleString());
  console.log("METHOD:", req.method);
  console.log("URL:", req.url);

  if (Object.keys(req.body || {}).length > 0) {
    // Never log sensitive fields (passwords, OTPs, tokens).
    const safeBody = { ...req.body };
    ["password", "otp", "token", "newPassword"].forEach((k) => {
      if (safeBody[k] !== undefined) safeBody[k] = "***REDACTED***";
    });
    console.log("BODY:", JSON.stringify(safeBody, null, 2));
  }

  console.log("=================================\n");
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || "smart_delivery_super_secure_key_123";

// Helper to generate JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is required. Please sign in." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Access token is invalid or expired." });
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Authorize Roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient role permissions." });
    }
    next();
  };
}

// Helper: Find customer email for notifications
async function findCustomerEmail(order) {
  if (order.customerEmail) return order.customerEmail;
  try {
    const result = await db.query(
      "SELECT email FROM users WHERE phone = $1 OR name = $2 LIMIT 1",
      [order.receiverPhone, order.receiverName]
    );
    return result.rows[0]?.email || null;
  } catch (err) {
    console.error("Failed to query customer email:", err.message);
    return null;
  }
}


// --- 1. AUTHENTICATION & PROFILE ENDPOINTS ---

// Register Customer
app.post("/api/auth/register", async (req, res) => {
  console.log(" REGISTER API HIT");
  console.log("REGISTER REQUEST:", req.body);

  const { name, email, phone, password, address } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "Name, email, phone, and password are required." });
  }

  try {
    // Check if user already exists
    const checkUser = await db.query(
      "SELECT * FROM users WHERE email = LOWER($1) OR phone = $2",
      [email.trim(), phone.trim()]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "An account with this email or phone number already exists." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const insertResult = await db.query(
      "INSERT INTO users (name, email, phone, address, password, role, is_blocked) VALUES ($1, LOWER($2), $3, $4, $5, 'customer', FALSE) RETURNING id, name, email, phone, address, role, is_blocked",
      [name.trim(), email.trim(), phone.trim(), address || "Bangalore, Karnataka", hashedPassword]
    );

    const createdUser = insertResult.rows[0];
    const token = generateToken(createdUser);

    res.status(201).json({
      ...createdUser,
      token,
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Server error occurred during account creation." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { emailOrPhone, password, selectedRole } = req.body;

  if (!emailOrPhone || !password || !selectedRole) {
    return res.status(400).json({ error: "Email/Phone, password, and portal role selection are required." });
  }

  try {
    // Lookup user in PostgreSQL
    console.log("=================================");
    console.log("LOGIN REQUEST");
    console.log("emailOrPhone =", emailOrPhone);
    console.log("selectedRole =", selectedRole);
    console.log("=================================");

    const userResult = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1",
      [emailOrPhone.trim()]
    );

    console.log("USERS FOUND:", userResult.rows.length);

    if (userResult.rows.length > 0) {
      console.log("MATCHED USER:", userResult.rows[0].email);
      console.log("MATCHED PHONE:", userResult.rows[0].phone);
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email/phone or password."
      });
    }

    const matchedUser = userResult.rows[0];

    // Check Role compatibility
    if (selectedRole === "customer" && matchedUser.role !== "customer") {
      return res.status(403).json({ error: "This account is not registered on the Customer portal." });
    }
    if (selectedRole === "partner" && matchedUser.role !== "partner") {
      return res.status(403).json({ error: "This account is not registered as a Delivery Partner." });
    }
    if (selectedRole === "admin" && matchedUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Insufficient administrative privileges." });
    }

    // Check Block Status
    if (matchedUser.is_blocked) {
      return res.status(403).json({ error: "This account has been suspended by the administrator." });
    }

    // Verify Password Hash
    // const isMatch = await bcrypt.compare(password, matchedUser.password);
      console.log("INPUT PASSWORD:", password);
      console.log("DB HASH:", matchedUser.password);

      const isMatch = await bcrypt.compare(password, matchedUser.password);

      console.log("PASSWORD MATCH:", isMatch);
      console.log("USER ROLE:", matchedUser.role);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email/phone or password." });
    }

    // Generate token
    const token = generateToken(matchedUser);

    res.json({
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      phone: matchedUser.phone,
      address: matchedUser.address,
      role: matchedUser.role,
      isBlocked: matchedUser.is_blocked,
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error occurred during login." });
  }
});

// --- PASSWORD RESET ---
// In-memory store of reset codes: emailLower -> { otp, expires }
const passwordResetCodes = new Map();

// Step 1: request a reset code
app.post("/api/auth/forgot-password", async (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ error: "Email or phone number is required." });
  }
  try {
    const result = await db.query(
      "SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1",
      [emailOrPhone.trim()]
    );

    // Always respond success so we don't reveal which accounts exist.
    if (result.rows.length === 0) {
      return res.json({ success: true, message: "If that account exists, a reset code has been sent." });
    }

    const user = result.rows[0];
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    passwordResetCodes.set(user.email.toLowerCase(), { otp, expires: Date.now() + 10 * 60 * 1000 });

    console.log(`🔐 Password reset code for ${user.email}: ${otp} (valid 10 min)`);
    // In production this code is emailed/SMS'd. SMTP is often not configured in
    // dev, so we also return it as `devOtp` to keep the flow testable.
    return res.json({
      success: true,
      message: "A reset code has been sent. Enter it along with your new password.",
      devOtp: otp,
    });
  } catch (err) {
    console.error("Forgot-password error:", err.message);
    res.status(500).json({ error: "Server error while requesting a reset code." });
  }
});

// Step 2: reset the password using the code
app.post("/api/auth/reset-password", async (req, res) => {
  const { emailOrPhone, otp, newPassword } = req.body;
  if (!emailOrPhone || !otp || !newPassword) {
    return res.status(400).json({ error: "Email/phone, reset code, and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }
  try {
    const result = await db.query(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1",
      [emailOrPhone.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found." });
    }
    const user = result.rows[0];
    const record = passwordResetCodes.get(user.email.toLowerCase());

    if (!record || record.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid reset code." });
    }
    if (Date.now() > record.expires) {
      passwordResetCodes.delete(user.email.toLowerCase());
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, user.id]);
    passwordResetCodes.delete(user.email.toLowerCase());

    return res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset-password error:", err.message);
    res.status(500).json({ error: "Server error while resetting password." });
  }
});

// Update Profile
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  const { email, name, phone, address } = req.body;

  if (!email || !name || !phone || !address) {
    return res.status(400).json({ error: "Missing required profile fields." });
  }

  // Ensure user edits their own profile, or is admin
  if (req.user.email.toLowerCase() !== email.toLowerCase() && req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized operation." });
  }

  try {
    const updateResult = await db.query(
      "UPDATE users SET name = $1, phone = $2, address = $3 WHERE email = LOWER($4) RETURNING id, name, email, phone, address, role, is_blocked AS \"isBlocked\"",
      [name.trim(), phone.trim(), address.trim(), email.trim()]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: "Server error occurred while updating profile." });
  }
});


// --- 2. RIDER ONLINE STATUS CONTROL ---

// Get Status
app.get("/api/rider/status", async (req, res) => {
  try {
    const configResult = await db.query(
      "SELECT value FROM system_config WHERE key = 'isRiderOnline'"
    );
    const isOnline = configResult.rows.length > 0 ? configResult.rows[0].value === "true" : true;
    res.json({ isRiderOnline: isOnline });
  } catch (err) {
    console.error("Get rider status error:", err.message);
    res.json({ isRiderOnline: true }); // Fallback default
  }
});

// Set Status
app.post("/api/rider/status", async (req, res) => {
  const { isOnline } = req.body;

  if (typeof isOnline !== "boolean") {
    return res.status(400).json({ error: "isOnline status must be a boolean." });
  }

  try {
    await db.query(
      "INSERT INTO system_config (key, value) VALUES ('isRiderOnline', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [isOnline ? "true" : "false"]
    );
    res.json({ isRiderOnline: isOnline });
  } catch (err) {
    console.error("Set rider status error:", err.message);
    res.status(500).json({ error: "Server error saving rider status configuration." });
  }
});


// --- 3. PRODUCTS CATALOG ---
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});


// --- 4. ORDERS MANAGEMENT ENDPOINTS ---

// Get All Orders (With joined order items via JSON Aggregation)
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const ordersResult = await db.query(`
      SELECT o.id, o.type, o.pickup, o.delivery, o.package_type AS "packageType",
             o.receiver_name AS "receiverName", o.receiver_phone AS "receiverPhone",
             o.status, o.partner_name AS "partnerName", o.partner_phone AS "partnerPhone",
             o.eta, o.otp, o.total_amount AS "totalAmount", o.date,
             COALESCE(
               (SELECT json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'price', oi.price))
                FROM order_items oi WHERE oi.order_id = o.id),
               '[]'::json
             ) AS items
      FROM orders o
      ORDER BY o.id DESC
    `);
    res.json(ordersResult.rows);
  } catch (err) {
    console.error("Get orders error:", err.message);
    res.status(500).json({ error: "Failed to retrieve order listings from database." });
  }
});

// Create Order (Handles both Courier & Shop orders, with transactional safety)
app.post("/api/orders", authenticateToken, async (req, res) => {
  const { type, pickup, delivery, packageType, receiverName, receiverPhone, totalAmount, items, customerEmail } = req.body;

  if (!type || !pickup || !delivery || !receiverName || !receiverPhone) {
    return res.status(400).json({ error: "Missing mandatory fields to create order." });
  }

  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pgClient = await db.pool.connect();

  try {
    await pgClient.query("BEGIN"); // Begin Transaction

    // Lookup customer ID if email provided
    let customerId = null;
    if (customerEmail) {
      const userResult = await pgClient.query("SELECT id FROM users WHERE email = LOWER($1) LIMIT 1", [customerEmail]);
      customerId = userResult.rows[0]?.id || null;
    }

    // Insert Order
    const orderResult = await pgClient.query(
      `INSERT INTO orders (type, pickup, delivery, package_type, receiver_name, receiver_phone, status, eta, otp, total_amount, date, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Placed', 'Calculating...', $7, $8, $9, $10)
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [type, pickup, delivery, packageType || null, receiverName, receiverPhone, generatedOtp, totalAmount || 0, formattedDate, customerId]
    );

    const insertedOrder = orderResult.rows[0];
    insertedOrder.items = [];

    // If Shop order, insert order items
    if (type === "shop" && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await pgClient.query(
          "INSERT INTO order_items (order_id, name, quantity, price) VALUES ($1, $2, $3, $4)",
          [insertedOrder.id, item.name, item.quantity, item.price]
        );
        insertedOrder.items.push({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
        });
      }
    }

    await pgClient.query("COMMIT"); // Commit Transaction
    pgClient.release();

    // Broadcast new order to rider channel via WebSockets
    io.emit("new_delivery_request", insertedOrder);

    // Send confirmation email asynchronously
    findCustomerEmail({ ...insertedOrder, customerEmail }).then(async (email) => {
      if (email) {
        await sendOrderEmail(buildOrderPlacedEmail(insertedOrder, email));
      }
    });

    res.status(201).json(insertedOrder);
  } catch (err) {
    await pgClient.query("ROLLBACK"); // Rollback Transaction
    pgClient.release();
    console.error("Create order transaction failed:", err.message);
    res.status(500).json({ error: "Failed to place order due to database transactional error." });
  }
});

// Cancel Order
app.post("/api/orders/:id/cancel", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const checkOrder = await db.query("SELECT * FROM orders WHERE id = $1", [id]);

    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = checkOrder.rows[0];

    if (order.status === "Delivered") {
      return res.status(400).json({ error: "Cannot cancel a delivered order." });
    }
    if (order.status === "Cancelled") {
      return res.json(order);
    }
    if (["Picked Up", "Out For Delivery"].includes(order.status)) {
      return res.status(400).json({ error: "Order is in transit and cannot be cancelled." });
    }

    const cancelResult = await db.query(
      `UPDATE orders SET status = 'Cancelled', eta = 'Cancelled' WHERE id = $1
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [id]
    );

    const updatedOrder = cancelResult.rows[0];

    // Emit live WebSockets cancellation updates to active monitoring channels and the specific order room
    io.to(`order_${id}`).emit("order_status_updated", updatedOrder);
    io.emit("admin_fleet_update", updatedOrder);

    // Send email notification
    findCustomerEmail(updatedOrder).then(async (email) => {
      if (email) {
        await sendOrderEmail(buildOrderCancelledEmail(updatedOrder, email));
      }
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error("Cancel order error:", err.message);
    res.status(500).json({ error: "Failed to process order cancellation." });
  }
});

// Accept Order (Rider Accepts)
app.post("/api/orders/:id/accept", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { riderName, riderPhone } = req.body;

  if (!riderName || !riderPhone) {
    return res.status(400).json({ error: "Rider details (name, phone) are required to accept orders." });
  }

  try {
    // Check if order exists and is not already accepted
    const checkResult = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = checkResult.rows[0];
    if (order.partner_name && order.partner_name !== "" && order.partner_name !== riderName && order.status !== "Placed") {
      return res.status(409).json({ error: "Order has already been assigned to another rider." });
    }

    // Lookup Rider ID
    const riderResult = await db.query("SELECT id FROM users WHERE name = $1 AND role = 'partner' LIMIT 1", [riderName]);
    const partnerId = riderResult.rows[0]?.id || null;

    const acceptResult = await db.query(
      `UPDATE orders SET status = 'Assigned', eta = '20 Mins', partner_name = $1, partner_phone = $2, partner_id = $3 WHERE id = $4
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [riderName, riderPhone, partnerId, id]
    );

    const updatedOrder = acceptResult.rows[0];

    // Emit updates to WebSockets channels
    io.to(`order_${id}`).emit("order_status_updated", updatedOrder);
    io.emit("admin_fleet_update", updatedOrder);

    res.json(updatedOrder);
  } catch (err) {
    console.error("Accept order error:", err.message);
    res.status(500).json({ error: "Database error assigning rider to order." });
  }
});

// Update Status (Transit Progression)
app.post("/api/orders/:id/status", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Target status parameter is required." });
  }

  try {
    const checkOrder = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    let eta = "Calculating...";
    if (status === "Picked Up") eta = "15 Mins";
    else if (status === "Out For Delivery") eta = "5 Mins";
    else if (status === "Delivered") eta = "Completed";
    else if (status === "Cancelled") eta = "Cancelled";

    const updateResult = await db.query(
      `UPDATE orders SET status = $1, eta = $2 WHERE id = $3
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [status, eta, id]
    );

    const updatedOrder = updateResult.rows[0];

    // WebSockets notification broadcasts
    io.to(`order_${id}`).emit("order_status_updated", updatedOrder);
    io.emit("admin_fleet_update", updatedOrder);

    if (status === "Delivered") {
      findCustomerEmail(updatedOrder).then(async (email) => {
        if (email) {
          await sendOrderEmail(buildOrderDeliveredEmail(updatedOrder, email));
        }
      });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("Status update error:", err.message);
    res.status(500).json({ error: "Failed to update order tracking status." });
  }
});

// Verify OTP (Completing Delivery Handover)
app.post("/api/orders/:id/verify-otp", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "Verification OTP is required." });
  }

  try {
    const checkResult = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = checkResult.rows[0];

    if (order.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid verification OTP. Please verify matching digits." });
    }

    const deliverResult = await db.query(
      `UPDATE orders SET status = 'Delivered', eta = 'Completed' WHERE id = $1
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [id]
    );

    const updatedOrder = deliverResult.rows[0];

    // Broadcast WebSocket updates
    io.to(`order_${id}`).emit("order_status_updated", updatedOrder);
    io.emit("admin_fleet_update", updatedOrder);

    findCustomerEmail(updatedOrder).then(async (email) => {
      if (email) {
        await sendOrderEmail(buildOrderDeliveredEmail(updatedOrder, email));
      }
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error("OTP verification error:", err.message);
    res.status(500).json({ error: "Database server error processing OTP validation." });
  }
});


// --- 5. ADMIN CONTROL & FLEET MONITORING ENDPOINTS ---

// Admin Bypass / Status Overrides
app.post("/api/admin/orders/:id/override", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Target status parameter is required." });
  }

  try {
    const eta = status === "Delivered" ? "Completed" : "Cancelled";
    const overrideResult = await db.query(
      `UPDATE orders SET status = $1, eta = $2 WHERE id = $3
       RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                 receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                 partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
      [status, eta, id]
    );

    if (overrideResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const updatedOrder = overrideResult.rows[0];

    // Broadcast updates
    io.to(`order_${id}`).emit("order_status_updated", updatedOrder);
    io.emit("admin_fleet_update", updatedOrder);

    res.json(updatedOrder);
  } catch (err) {
    console.error("Admin override error:", err.message);
    res.status(500).json({ error: "Admin override database query failed." });
  }
});

// Admin Account Suspend / Block
app.post("/api/admin/users/:email/block", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { email } = req.params;
  const { shouldBlock } = req.body;

  if (typeof shouldBlock !== "boolean") {
    return res.status(400).json({ error: "shouldBlock property must be a boolean." });
  }

  try {
    const blockResult = await db.query(
      "UPDATE users SET is_blocked = $1 WHERE email = LOWER($2) RETURNING id, name, email, phone, address, role, is_blocked AS \"isBlocked\"",
      [shouldBlock, email.trim()]
    );

    if (blockResult.rows.length === 0) {
      return res.status(404).json({ error: "User registry record not found." });
    }

    res.json(blockResult.rows[0]);
  } catch (err) {
    console.error("Admin user block error:", err.message);
    res.status(500).json({ error: "User block status update query failed." });
  }
});

// Admin Get User Directory List
app.get("/api/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const listResult = await db.query(
      "SELECT id, name, email, phone, address, role, is_blocked AS \"isBlocked\" FROM users ORDER BY id ASC"
    );
    res.json(listResult.rows);
  } catch (err) {
    console.error("Admin get users list error:", err.message);
    res.status(500).json({ error: "Database retrieval for user directory failed." });
  }
});


// --- 6. SUPPORT CHAT ROOM ENDPOINTS ---

// Fetch Chat Log
app.get("/api/chat", authenticateToken, async (req, res) => {
  try {
    const chatResult = await db.query("SELECT sender, text, timestamp FROM chat_messages ORDER BY id ASC");
    res.json(chatResult.rows);
  } catch (err) {
    console.error("Get chat logs error:", err.message);
    res.status(500).json({ error: "Failed to query chat transcript logs." });
  }
});

// Post Message
app.post("/api/chat", authenticateToken, async (req, res) => {
  const { sender, text } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ error: "Message sender and text content are required." });
  }

  const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  try {
    // Insert User Message
    const msgResult = await db.query(
      "INSERT INTO chat_messages (sender, text, timestamp) VALUES ($1, $2, $3) RETURNING sender, text, timestamp",
      [sender, text.trim(), timeString]
    );

    const insertedMsg = msgResult.rows[0];

    // Emit live Socket.IO update
    io.emit("receive_chat_message", insertedMsg);

    // Automation bot triggers when customer writes (dev fallback simulation)
    if (sender === "user") {
      let botText = "Thank you for writing to us. A customer support representative will join this conversation shortly.";
      if (text.toLowerCase().includes("order")) {
        botText = "We are currently checking the dispatch logs for your order. Rest assured our delivery partner is moving as quickly as possible!";
      } else if (text.toLowerCase().includes("refund") || text.toLowerCase().includes("money")) {
        botText = "For refund queries, your request has been forwarded to our billing team. They will resolve it within 24 hours.";
      }

      // Delay bot response slightly for natural feel
      setTimeout(async () => {
        try {
          const botResult = await db.query(
            "INSERT INTO chat_messages (sender, text, timestamp) VALUES ('support', $1, $2) RETURNING sender, text, timestamp",
            [botText, timeString]
          );
          io.emit("receive_chat_message", botResult.rows[0]);
        } catch (botErr) {
          console.error("Bot chat insertion error:", botErr.message);
        }
      }, 1000);
    }

    res.status(201).json(insertedMsg);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).json({ error: "Failed to persist chat message in database." });
  }
});


// --- 7. OFFLINE SIMULATION BACKGROUND SERVICE ---
// Periodically checks if the "offline simulation" should run (when Rider portal is toggled offline).
// Automatically advances the delivery status steps of active orders to simulate courier movements.
setInterval(async () => {
  try {
    // Read status
    const configResult = await db.query("SELECT value FROM system_config WHERE key = 'isRiderOnline'");
    const isOnline = configResult.rows.length > 0 ? configResult.rows[0].value === "true" : true;

    if (isOnline) return; // Simulation only active in offline simulation mode

    // Fetch active orders under simulation partner
    const activeResult = await db.query(
      "SELECT * FROM orders WHERE status NOT IN ('Delivered', 'Cancelled') AND (partner_name = '' OR partner_name = 'Rahul Kumar')"
    );

    if (activeResult.rows.length === 0) return;

    for (const order of activeResult.rows) {
      let nextStatus = order.status;
      let nextEta = order.eta;

      if (order.status === "Placed") {
        nextStatus = "Assigned";
        nextEta = "20 Mins";
      } else if (order.status === "Assigned") {
        nextStatus = "Picked Up";
        nextEta = "15 Mins";
      } else if (order.status === "Picked Up") {
        nextStatus = "Out For Delivery";
        nextEta = "5 Mins";
      }

      if (nextStatus !== order.status) {
        const updateResult = await db.query(
          `UPDATE orders SET status = $1, eta = $2, partner_name = 'Rahul Kumar', partner_phone = '+91 8888888888' WHERE id = $3
           RETURNING id, type, pickup, delivery, package_type AS "packageType", receiver_name AS "receiverName",
                     receiver_phone AS "receiverPhone", status, partner_name AS "partnerName",
                     partner_phone AS "partnerPhone", eta, otp, total_amount AS "totalAmount", date`,
          [nextStatus, nextEta, order.id]
        );

        const updatedOrder = updateResult.rows[0];

        // Broadcast simulation transitions
        io.to(`order_${order.id}`).emit("order_status_updated", updatedOrder);
        io.emit("admin_fleet_update", updatedOrder);

        console.log(`[Simulation] Auto-advanced order #${order.id} status to ${nextStatus}.`);
      }
    }
  } catch (err) {
    console.error("[Simulation] Background runner database connection error:", err.message);
  }
}, 15000);


// --- 8. SOCKET.IO WEBSOCKET EVENTS SETUP ---
io.on("connection", (socket) => {
  console.log(`📡 WebSocket client connected: Socket ID ${socket.id}`);

  // Channel room registrations
  socket.on("join_order_room", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`🚪 Client socket ${socket.id} joined room order_${orderId}`);
  });

  socket.on("leave_order_room", (orderId) => {
    socket.leave(`order_${orderId}`);
    console.log(`🚪 Client socket ${socket.id} left room order_${orderId}`);
  });

  // Rider coordinates telemetry relays
  socket.on("share_rider_location", (locationData) => {
    const { orderId, latitude, longitude, heading } = locationData;
    if (orderId) {
      // Broadcast location updates to the customer tracking room in real time
      io.to(`order_${orderId}`).emit("rider_location_updated", {
        orderId,
        latitude,
        longitude,
        heading,
      });
      // Update admin active location maps
      io.emit("admin_rider_location_sync", { orderId, latitude, longitude, heading });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 WebSocket client disconnected: Socket ID ${socket.id}`);
  });
});

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "Smart Delivery Tracking System",
    version: "1.0.0",
    status: "Running",
    serverTime: new Date().toISOString()
  });
});


// Start Combined HTTP + WebSockets Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(` Smart Delivery System Server API listening on http://0.0.0.0:${PORT}`);
  console.log(` Real-Time WebSockets active via Socket.IO engine`);
});
