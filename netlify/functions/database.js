// netlify/functions/database.js
const { neon } = require("@neondatabase/client");

// Make sure this is set in Netlify → Site settings → Environment → DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables");
  throw new Error("DATABASE_URL is missing");
}

// Single shared client
const sql = neon(connectionString);

module.exports = { sql };
