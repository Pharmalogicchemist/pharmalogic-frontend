
// netlify/functions/auth-login.js
const bcrypt = require("bcryptjs");
const { sql } = require("./database.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Email and password required" })
      };
    }

    const rows = await sql`
      SELECT id, email, password_hash, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid credentials" })
      };
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid credentials" })
      };
    }

    delete user.password_hash;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, user })
    };
  } catch (err) {
    console.error("auth-login error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
