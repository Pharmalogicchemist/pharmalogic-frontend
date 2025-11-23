import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const { order_id, status } = await req.json();

    if (!order_id) {
      return Response.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (!status) {
      return Response.json({ error: "Missing status" }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM orders WHERE id = ${order_id};
    `;

    if (existing.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const rows = await sql`
      UPDATE orders SET status = ${status}, updated_at = NOW()
      WHERE id = ${order_id}
      RETURNING id, status, updated_at;
    `;

    return Response.json({
      success: true,
      message: "Order updated successfully",
      order: rows[0],
    });
  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);
    return Response.json(
      {
        success: false,
        message: "Failed to update order",
        details: err.message,
      },
      { status: 500 }
    );
  }
};
