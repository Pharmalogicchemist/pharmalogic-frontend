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
      `SELECT id, fullname, email, password_hash, role
       FROM auth_users
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

    delete user.password_hash;

    await client.end();

    return Response.json({
      success: true,
      message: "Auth login successful",
      user
      // you can add JWT token here later
    });
  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);
    return Response.json(
      { success: false, message: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
};
