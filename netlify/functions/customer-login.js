// netlify/functions/customer-login.js
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
    const { mobile, password } = body;

    if (!mobile || !password) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Mobile and password required" })
      };
    }

    const rows = await sql`
      SELECT id, name, email, mobile, address, password_hash
      FROM customers
      WHERE mobile = ${mobile}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid credentials" })
      };
    }

    const customer = rows[0];
    const match = await bcrypt.compare(password, customer.password_hash || "");
    if (!match) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid credentials" })
      };
    }

    delete customer.password_hash;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, customer })
    };
  } catch (err) {
    console.error("customer-login error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
