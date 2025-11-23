import { getClient } from "./_db.js";
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

    const client = await getClient();

    const result = await client.query(
      `SELECT id, fullname, email, password_hash
       FROM customers
       WHERE email = $1
       LIMIT 1;`,
      [email]
    );

    if (result.rows.length === 0) {
      await client.end();
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      await client.end();
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    await client.end();

    return Response.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    console.error("CUSTOMER LOGIN ERROR:", err);
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
