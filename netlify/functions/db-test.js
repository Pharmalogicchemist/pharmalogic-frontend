// netlify/functions/db-test.js
import { neon } from "@neondatabase/client";

export default async function handler(req) {
  try {
    const connectionString =
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;

    if (!connectionString) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No database URL found in environment vars"
        }),
        { status: 500 }
      );
    }

    const sql = neon(connectionString);

    const result = await sql`SELECT NOW() AS server_time`;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Neon DB connected successfully!",
        time: result[0].server_time,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
