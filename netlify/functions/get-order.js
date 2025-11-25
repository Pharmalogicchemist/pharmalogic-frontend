// netlify/functions/get-order.js
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
    const { id } = event.queryStringParameters || {};
    const orderId = parseInt(id, 10);

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "id query param required" })
      };
    }

    const orderRows = await sql`
      SELECT
        o.id AS order_id,
        o.payment_status,
        o.total_amount,
        o.consultation_data,
        o.created_at,
        c.id AS customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.mobile AS customer_mobile,
        c.address AS customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${orderId}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Order not found" })
      };
    }

    const order = orderRows[0];

    const statsRows = await sql`
      SELECT
        COUNT(*)::INT AS total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END)::INT AS paid_orders,
        COALESCE(
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END),
          0
        )::NUMERIC(10,2) AS total_paid_amount
      FROM orders
      WHERE customer_id = ${order.customer_id}
    `;
    const stats = statsRows[0];

    const files = await sql`
      SELECT id, file_url, file_type, uploaded_at
      FROM order_files
      WHERE order_id = ${orderId}
      ORDER BY uploaded_at ASC
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        order,
        stats,
        files
      })
    };
  } catch (err) {
    console.error("get-order error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
