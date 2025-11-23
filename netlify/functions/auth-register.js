// netlify/functions/auth-register.js
import bcrypt from "bcryptjs";
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json(
        { success: false, message: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { fullname, email, password, role = "admin" } = await req.json();

    if (!fullname || !email || !password) {
      return Response.json(
        { success: false, message: "fullname, email, and password are required" },
        { status: 400 }
      );
    }

    const check = await sql`
      SELECT id FROM auth_users WHERE email = ${email} LIMIT 1
    `;

    if (check.length > 0) {
      return Response.json(
        { success: false, message: "Email already registered. Please log in." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO auth_users (fullname, email, password_hash, role)
      VALUES (${fullname}, ${email}, ${hash}, ${role})
      RETURNING id, fullname, email, role
    `;

    return Response.json({
      success: true,
      message: "Auth user registered successfully",
      user: result[0],
    });
  } catch (err) {
    console.error("AUTH REGISTER ERROR:", err);
    return Response.json(
      { success: false, message: "Registration failed", error: err.message },
      { status: 500 }
    );
  }
};
