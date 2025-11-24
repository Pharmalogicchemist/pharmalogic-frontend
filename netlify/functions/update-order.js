// netlify/functions/update-order.js
const { sql } = require("./database.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { orderId, paymentStatus, consultationData, totalAmount } = body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "orderId required" })
      };
    }

    await sql`
      UPDATE orders
      SET
        payment_status = COALESCE(${paymentStatus}, payment_status),
        consultation_data = COALESCE(${consultationData}, consultation_data),
        total_amount = COALESCE(${totalAmount}, total_amount)
      WHERE id = ${orderId}
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("update-order error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
