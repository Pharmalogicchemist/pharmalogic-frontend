// netlify/functions/database.js
import { neon } from "@neondatabase/client";

// Use the env vars created by the Neon–Netlify integration
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error("❌ No database connection string found in environment");
  throw new Error("Database connection string missing");
}

export const sql = neon(connectionString);
