import { getClient } from "./_db.js";
import bcrypt from "bcryptjs";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const { fullname, email, password } = await req.json();

    if (!fullname || !email || !password) {
      return Response.json(
        { error: "fullname, email, and password are required" },
        { status: 400 }
      );
    }

    const client = await getClient();

    // Check duplicate
    const check = await client.query(
      "SELECT id FROM customers WHERE email = $1 LIMIT 1;",
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
      `INSERT INTO customers (fullname, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, fullname, email;`,
      [fullname, email, hash]
    );

    await client.end();

    const user = result.rows[0];

    return Response.json({
      success: true,
      message: "Customer registered successfully",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    console.error("CUSTOMER REGISTER ERROR:", err);
    return Response.json(
      { error: "Registration failed", details: err.message },
      { status: 500 }
    );
  }
};
