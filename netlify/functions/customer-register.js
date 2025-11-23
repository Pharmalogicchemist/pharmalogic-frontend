// netlify/functions/customer-register.js
import crypto from "crypto";
import { sql } from "./database.js";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json(
        { success: false, message: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { full_name, email, password } = await req.json();

    if (!full_name || !email || !password) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM customers WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return Response.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(password);

    const rows = await sql`
      INSERT INTO customers (full_name, email, password_hash)
      VALUES (${full_name}, ${email}, ${password_hash})
      RETURNING id, full_name, email, created_at
    `;

    const customer = rows[0];

    return Response.json({
      success: true,
      customer_id: customer.id,
      customer,
    });
  } catch (err) {
    console.error("Customer register error:", err);
    return Response.json(
      {
        success: false,
        message: "Registration failed",
        error: err.message,
      },
      { status: 500 }
    );
  }
};
