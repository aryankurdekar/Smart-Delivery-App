const { Pool } = require("pg");
require("dotenv").config();

// Debug logs
console.log("=================================");
console.log("Database Configuration");
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("DB_PASSWORD length =", process.env.DB_PASSWORD?.length);
console.log("=================================");

// TEMPORARY: Ignore DATABASE_URL and use individual DB settings
const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "smart_delivery",
};

const pool = new Pool(poolConfig);

// Test connection immediately on startup
pool
  .connect()
  .then((client) => {
    console.log("🐘 Connected to PostgreSQL successfully!");
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Failed:");
    console.error(err.message);
  });

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};