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

    const { fullname, email, password } = await req.json();

    // Basic validation
    if (!fullname || !email || !password) {
      return Response.json(
        { error: "fullname, email, and password are required" },
        { status: 400 }
      );
    }

    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    // CHECK IF EMAIL ALREADY EXISTS
    const checkSql = `
      SELECT id FROM customers WHERE email = $1 LIMIT 1;
    `;
    const check = await client.query(checkSql, [email]);

    if (check.rows.length > 0) {
      return Response.json(
        { error: "Email already registered. Please log in." },
        { status: 409 } // conflict
      );
    }

    // HASH PASSWORD
    const hash = await bcrypt.hash(password, 10);

    // INSERT NEW CUSTOMER
    const sql = `
      INSERT INTO customers (fullname, email, password_hash, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, fullname, email;
    `;

    const result = await client.query(sql, [fullname, email, hash]);
    const user = result.rows[0];

    // RETURN THE NEW USER (CUSTOMER ID INCLUDED)
    return Response.json({
      success: true,
      message: "Customer registered successfully",
      user: {
        id: user.id,          // customer_id -> used in orders
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
