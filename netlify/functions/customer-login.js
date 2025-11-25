// netlify/functions/customer-login.js
import crypto from "crypto";
import { sql } from "./database.js";

function verifyPassword(password, savedHash) {
  const [salt, hash] = savedHash.split(":");
  const hashed = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hashed === hash;
}

export default async (req) => {
  try {
    if ((req.method || req.httpMethod) !== "POST") {
      return Response.json({ success: false, message: "Method not allowed" }, { status: 405 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, message: "Missing fields" });
    }

    const users = await sql`
      SELECT id, password_hash
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return Response.json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];

    if (!verifyPassword(password, user.password_hash)) {
      return Response.json({ success: false, message: "Invalid email or password" });
    }

    return Response.json({
      success: true,
      customer_id: user.id,
      message: "Login successful"
    });

  } catch (err) {
    return Response.json({ success: false, message: err.message });
  }
};
