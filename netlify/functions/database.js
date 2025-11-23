import { neon } from "@neondatabase/client";

const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("Database connection string missing");
}

export const sql = neon(connectionString);
