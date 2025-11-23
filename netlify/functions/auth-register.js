// netlify/functions/auth-register.js
import { sql } from "./database.js";
import bcrypt from "bcryptjs";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const { fullname, email, password, role = "admin" } = await req.json();

    if (!fullname || !email || !password) {
      return Response.json(
        { error: "fullname, email, and password are required" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await sql`
      SELECT id FROM auth_users WHERE email = ${email} LIMIT 1;
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Email already registered. Please log in." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO auth_users (fullname, email, password_hash, role)
      VALUES (${fullname}, ${email}, ${hash}, ${role})
      RETURNING id, fullname, email, role;
    `;

    return Response.json({
      success: true,
      message: "Auth user registered successfully",
      user: rows[0],
    });
  } catch (err) {
    console.error("AUTH REGISTER ERROR:", err);
    return Response.json(
      {
        success: false,
        message: "Registration failed",
        details: err.message,
      },
      { status: 500 }
    );
  }
};
