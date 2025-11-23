// netlify/functions/customer-login.js
const crypto = require("crypto");
const { sql } = require("./database");

// Compare "salt:hash" format
function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(":");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { email, password } = data;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Missing email or password",
        }),
      };
    }

    const rows = await sql`
      SELECT id, full_name, email, password_hash
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    const customer = rows[0];

    if (!verifyPassword(password, customer.password_hash)) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        customer_id: customer.id,
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
        },
      }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Login failed",
        error: err.message,
      }),
    };
  }
};
