// netlify/functions/customer-register.js
const crypto = require("crypto");
const { sql } = require("./database");

// Helper to hash password using PBKDF2 (no extra dependencies)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  // store "salt:hash"
  return `${salt}:${hash}`;
}

// Netlify function handler
exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { full_name, email, password } = data;

    if (!full_name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Missing required fields",
        }),
      };
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM customers WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          success: false,
          message: "Email already registered",
        }),
      };
    }

    const password_hash = hashPassword(password);

    // Insert new customer
    const rows = await sql`
      INSERT INTO customers (full_name, email, password_hash)
      VALUES (${full_name}, ${email}, ${password_hash})
      RETURNING id, full_name, email, created_at
    `;

    const customer = rows[0];

    // You can store in localStorage on frontend using this id
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        customer_id: customer.id,
        customer,
      }),
    };
  } catch (err) {
    console.error("Register error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Registration failed",
        error: err.message,
      }),
    };
  }
};
