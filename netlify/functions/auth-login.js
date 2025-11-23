// netlify/functions/auth-login.js
import { sql } from "./database.js";
import bcrypt from "bcryptjs";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, fullname, email, password_hash, role
      FROM auth_users
      WHERE email = ${email}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    delete user.password_hash;

    return Response.json({
      success: true,
      message: "Auth login successful",
      user,
      // you can add JWT token here later
    });
  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
};
