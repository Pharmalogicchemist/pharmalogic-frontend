// netlify/functions/customer-register.js
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
    const { name, email, mobile, address, password } = body;

    if (!name || !mobile || !address || !password) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing required fields" })
      };
    }

    const existing = await sql`
      SELECT id FROM customers WHERE mobile = ${mobile} LIMIT 1
    `;
    if (existing.length > 0) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Customer already exists" })
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO customers (name, email, mobile, address, password_hash)
      VALUES (${name}, ${email}, ${mobile}, ${address}, ${passwordHash})
      RETURNING id, name, email, mobile, address, created_at
    `;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, customer: rows[0] })
    };
  } catch (err) {
    console.error("customer-register error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
