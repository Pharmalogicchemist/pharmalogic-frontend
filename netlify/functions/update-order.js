import { Client } from "@neondatabase/serverless";

export default async (req) => {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { order_id, order_status } = await req.json();

    // Validate input
    if (!order_id) {
      return Response.json(
        { error: "Missing order_id" },
        { status: 400 }
      );
    }

    if (!order_status || order_status.length === 0) {
      return Response.json(
        { error: "Missing order_status" },
        { status: 400 }
      );
    }

    // Connect to Neon DB
    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    // Check if order exists
    const checkSql = `
      SELECT id FROM orders WHERE id = $1 LIMIT 1;
    `;
    const exists = await client.query(checkSql, [order_id]);

    if (exists.rows.length === 0) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order
    const updateSql = `
      UPDATE orders
      SET order_status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, order_status, updated_at;
    `;

    const result = await client.query(updateSql, [order_status, order_id]);

    return Response.json({
      success: true,
      message: "Order updated successfully",
      order: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);

    return Response.json(
      { 
        success: false,
        message: "Failed to update order",
        details: err.message
      },
      { status: 500 }
    );
  }
};
