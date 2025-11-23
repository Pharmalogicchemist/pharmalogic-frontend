// netlify/functions/customer-register.js
import { Client } from "@neondatabase/client";
import bcrypt from "bcryptjs";

export const handler = async (event) => {
  try {
    // Only POST allowed
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // Parse JSON body
    const { fullname, email, password } = JSON.parse(event.body);

    if (!fullname || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fields" })
      };
    }

    // ENV CHECK (prevents crashes)
    if (!process.env.NETLIFY_DATABASE_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Database URL missing",
          details: "NETLIFY_DATABASE_URL is undefined"
        })
      };
    }

    // Connect to Neon
    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    const hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO customers (fullname, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, fullname, email;
    `;

    const result = await client.query(sql, [fullname, email, hash]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: result.rows[0]
      })
    };

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Server crashed",
        details: err.message
      })
    };
  }
};
