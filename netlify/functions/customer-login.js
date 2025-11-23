import crypto from "crypto";
import { sql } from "./database.js";

function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

export default async (req) => {
  try {
    if (req.method !== "POST" && req.httpMethod !== "POST") {
      return Response.json({ success: false, message: "Method Not Allowed" }, { status: 405 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { success: false, message: "Missing email or password" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, full_name, email, password_hash
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    const customer = rows[0];

    if (!verifyPassword(password, customer.password_hash)) {
      return Response.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }

    return Response.json({
      success: true,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
      },
    });
  } catch (err) {
    return Response.json(
      { success: false, message: "Login failed", error: err.message },
      { status: 500 }
    );
  }
};
