import { getClient } from "./_db.js";
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

    const client = await getClient();

    // Check duplicate
    const check = await client.query(
      "SELECT id FROM auth_users WHERE email = $1 LIMIT 1;",
      [email]
    );

    if (check.rows.length > 0) {
      await client.end();
      return Response.json(
        { error: "Email already registered. Please log in." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO auth_users (fullname, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fullname, email, role;`,
      [fullname, email, hash, role]
    );

    await client.end();

    return Response.json({
      success: true,
      message: "Auth user registered successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("AUTH REGISTER ERROR:", err);
    return Response.json(
      { success: false, message: "Registration failed", details: err.message },
      { status: 500 }
    );
  }
};
