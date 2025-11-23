import { getClient } from "./_db.js";

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

    if (!status || status.length === 0) {
      return Response.json({ error: "Missing status" }, { status: 400 });
    }

    const client = await getClient();

    // Check exist
    const check = await client.query(
      "SELECT id FROM orders WHERE id = $1 LIMIT 1;",
      [order_id]
    );

    if (check.rows.length === 0) {
      await client.end();
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await client.query(
      `UPDATE orders
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at;`,
      [status, order_id]
    );

    await client.end();

    return Response.json({
      success: true,
      message: "Order updated successfully",
      order: result.rows[0]
    });
  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);
    return Response.json(
      { success: false, message: "Failed to update order", details: err.message },
      { status: 500 }
    );
  }
};
