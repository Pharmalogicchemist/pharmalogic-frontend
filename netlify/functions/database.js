// netlify/functions/database.js
import { neon } from "@neondatabase/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables");
  throw new Error("DATABASE_URL is missing");
}

// Neon returns a tagged template function
export const sql = neon(connectionString);
