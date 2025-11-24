// netlify/functions/get-order.js
import { sql } from "./database.js";

export default async (req) => {
  try {
    const orderId = req.query.order_id || req.query["order_id"];

    if (!orderId) {
      return Response.json({ success: false, message: "order_id missing" });
    }

    const rows = await sql`
      SELECT * FROM orders WHERE order_id = ${orderId} LIMIT 1;
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Order not found" });
    }

    return Response.json({
      success: true,
      order: rows[0]
    });

  } catch (err) {
    console.error("❌ Error fetching order:", err);
    return Response.json({ success: false, message: "Server error" });
  }
};
