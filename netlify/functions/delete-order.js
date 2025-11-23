// netlify/functions/delete-order.js
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json(
        { success: false, message: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json(
        { success: false, message: "Missing order_id" },
        { status: 400 }
      );
    }

    const rows = await sql`
      DELETE FROM orders
      WHERE id = ${order_id}
      RETURNING id
    `;

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Order deleted successfully",
      order_id,
    });
  } catch (err) {
    console.error("DELETE ORDER ERROR:", err);
    return Response.json(
      { success: false, message: "Failed to delete order", error: err.message },
      { status: 500 }
    );
  }
};
