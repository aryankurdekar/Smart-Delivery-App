const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    // Dev fallback: log emails to console (use Ethereal SMTP in production)
    transporter = {
      sendMail: async (opts) => {
        console.log("\n📧 ─── EMAIL (dev mode — configure SMTP in .env to send real mail) ───");
        console.log(`To:      ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(opts.text);
        console.log("────────────────────────────────────────────────────────────\n");
        return { messageId: "dev-" + Date.now() };
      },
    };
  }

  return transporter;
}

async function sendOrderEmail({ to, subject, html, text }) {
  if (!to) return;
  const from = process.env.SMTP_FROM || "Smart Delivery <noreply@smartdelivery.app>";
  try {
    await getTransporter().sendMail({ from, to, subject, html, text });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

function buildOrderPlacedEmail(order, userEmail) {
  const itemsList =
    order.type === "shop" && order.items?.length
      ? order.items.map((i) => `  • ${i.name} x${i.quantity} — ₹${i.price * i.quantity}`).join("\n")
      : `  • ${order.packageType || "Package"} courier`;

  return {
    to: userEmail,
    subject: `Order #${order.id} confirmed — Smart Delivery`,
    text: [
      `Hi ${order.receiverName || "Customer"},`,
      "",
      `Your order #${order.id} has been placed successfully!`,
      "",
      "Items:",
      itemsList,
      "",
      `Delivery to: ${order.delivery}`,
      order.totalAmount ? `Total: ₹${order.totalAmount} (COD)` : "",
      "",
      "Track your order in the Smart Delivery app.",
      "",
      "— Smart Delivery Team",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `<p>Hi <strong>${order.receiverName || "Customer"}</strong>,</p>
      <p>Your order <strong>#${order.id}</strong> is confirmed!</p>
      <p>Delivery to: ${order.delivery}</p>
      ${order.totalAmount ? `<p>Total: <strong>₹${order.totalAmount}</strong> (Cash on Delivery)</p>` : ""}
      <p>Open the app to track live status.</p>`,
  };
}

function buildOrderDeliveredEmail(order, userEmail) {
  return {
    to: userEmail,
    subject: `Order #${order.id} delivered — Smart Delivery`,
    text: [
      `Hi ${order.receiverName || "Customer"},`,
      "",
      `Great news! Order #${order.id} has been delivered successfully.`,
      "",
      `Delivered to: ${order.delivery}`,
      order.partnerName ? `Rider: ${order.partnerName}` : "",
      "",
      "Thank you for choosing Smart Delivery!",
      "",
      "— Smart Delivery Team",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `<p>Hi <strong>${order.receiverName || "Customer"}</strong>,</p>
      <p>Order <strong>#${order.id}</strong> has been <strong>delivered</strong>!</p>
      <p>Thank you for using Smart Delivery.</p>`,
  };
}

function buildOrderCancelledEmail(order, userEmail) {
  return {
    to: userEmail,
    subject: `Order #${order.id} cancelled — Smart Delivery`,
    text: [
      `Hi ${order.receiverName || "Customer"},`,
      "",
      `Your order #${order.id} has been cancelled.`,
      "",
      "If you did not request this, please contact support via the app chat.",
      "",
      "— Smart Delivery Team",
    ].join("\n"),
    html: `<p>Order <strong>#${order.id}</strong> has been cancelled.</p>`,
  };
}

module.exports = {
  sendOrderEmail,
  buildOrderPlacedEmail,
  buildOrderDeliveredEmail,
  buildOrderCancelledEmail,
};
