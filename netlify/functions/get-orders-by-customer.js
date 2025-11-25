// netlify/functions/get-orders-by-customer.js
const { sql } = require("./database.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const { customerId } = event.queryStringParameters || {};
    const cid = parseInt(customerId, 10);

    if (!cid) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "customerId required" })
      };
    }

    const rows = await sql`
      SELECT
        o.id AS order_id,
        o.payment_status,
        o.total_amount,
        o.created_at
      FROM orders o
      WHERE o.customer_id = ${cid}
      ORDER BY o.created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, orders: rows })
    };
  } catch (err) {
    console.error("get-orders-by-customer error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
