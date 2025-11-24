import { sql } from "./database.js";

export default async (req) => {
  try {
    const order_id = req.queryStringParameters.order_id;
    if (!order_id) {
      return Response.json(
        { success: false, message: "Missing order_id" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT *
      FROM orders
      WHERE id = ${order_id}
    `;

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      order: rows[0]
    });

  } catch (err) {
    return Response.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
};
