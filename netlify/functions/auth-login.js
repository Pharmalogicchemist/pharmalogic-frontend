import { Client } from "@neondatabase/client";
import bcrypt from "bcryptjs";

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    const sql = `
      SELECT id, fullname, email, password_hash, role
      FROM auth_users
      WHERE email = $1
      LIMIT 1;
    `;

    const result = await client.query(sql, [email]);

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Remove sensitive info
    delete user.password_hash;

    return Response.json({
      success: true,
      message: "Auth login successful",
      user
      // later you can add a JWT token here
    });

  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
        details: err.message
      },
      { status: 500 }
    );
  }
};
