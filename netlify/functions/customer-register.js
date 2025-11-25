// netlify/functions/customer-register.js
import crypto from "crypto";
import { sql } from "./database.js";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export default async (req) => {
  try {
    if ((req.method || req.httpMethod) !== "POST") {
      return Response.json({ success: false, message: "Method not allowed" }, { status: 405 });
    }

    const { name, email, mobile, password } = await req.json();

    if (!name || !email || !mobile || !password) {
      return Response.json({ success: false, message: "Missing required fields" });
    }

    // Check if already exists
    const existing = await sql`
      SELECT id FROM customers WHERE email = ${email} LIMIT 1
    `;
    if (existing.length > 0) {
      return Response.json({ success: false, message: "Email already registered" });
    }

    const passwordHash = hashPassword(password);

    const rows = await sql`
      INSERT INTO customers (name, email, mobile, password_hash)
      VALUES (${name}, ${email}, ${mobile}, ${passwordHash})
      RETURNING id
    `;

    return Response.json({
      success: true,
      customer_id: rows[0].id,
      message: "Registration successful"
    });

  } catch (err) {
    return Response.json({ success: false, message: err.message });
  }
};
