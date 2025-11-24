// netlify/functions/database.js
const { neon, neonConfig } = require("@neondatabase/serverless");

// Reuse connections between invocations
neonConfig.fetchConnectionCache = true;

const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ No database connection string found in environment");
  throw new Error("Database connection string missing");
}

const sql = neon(connectionString);

module.exports = { sql };
