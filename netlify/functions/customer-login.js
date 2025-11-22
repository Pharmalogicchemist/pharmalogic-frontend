import { Client } from "@neondatabase/serverless";
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

    // Connect to DB
    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    // Query user
    const sql = `
      SELECT id, fullname, email, password_hash
      FROM customers
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

    // Compare password using bcrypt
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
      message: "Login successful",
      user
    });

  } catch (err) {
    console.error("Login Error:", err);

    return Response.json(
      { success: false, error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
};
