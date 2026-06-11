/*
=========================================
ONE-COMMAND DATABASE SETUP  —  `npm run seed`
=========================================
Creates the PostgreSQL database (if missing) and loads schema.sql
(tables, indexes, and seed data). Re-runnable: schema.sql drops and
recreates everything for a clean slate.

Reads connection settings from .env (DB_HOST, DB_PORT, DB_USER,
DB_PASSWORD, DB_NAME).
=========================================
*/
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

const DB_NAME = process.env.DB_NAME || "smart_delivery";
const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
};

async function ensureDatabase() {
  const client = new Client({ ...baseConfig, database: "postgres" });
  await client.connect();
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [DB_NAME]
  );
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`✅ Created database "${DB_NAME}"`);
  } else {
    console.log(`ℹ️  Database "${DB_NAME}" already exists — reloading schema`);
  }
  await client.end();
}

async function loadSchema() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const client = new Client({ ...baseConfig, database: DB_NAME });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("✅ Loaded schema.sql (tables, indexes, seed data)");
}

(async () => {
  try {
    await ensureDatabase();
    await loadSchema();
    console.log("\n🎉 Database ready. Test accounts (password: password123):");
    console.log("   • customer  →  aryan@gmail.com");
    console.log("   • partner   →  rider@gmail.com");
    console.log("   • admin     →  admin@gmail.com");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error("   Check that PostgreSQL is running and .env credentials are correct.");
    process.exit(1);
  }
})();
