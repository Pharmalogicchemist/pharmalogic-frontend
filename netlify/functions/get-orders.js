// netlify/functions/get-orders.js
const { sql } = require("./database.js");

exports.handler = async () => {
  try {
    const rows = await sql`
      SELECT
        o.id AS order_id,
        c.mobile AS customer_mobile,
        c.name AS customer_name,
        c.address AS customer_address,
        o.payment_status,
        o.total_amount,
        o.created_at
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, orders: rows })
    };
  } catch (err) {
    console.error("get-orders error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
