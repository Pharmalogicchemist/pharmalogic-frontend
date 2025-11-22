import { Client } from "@neondatabase/serverless";

export default async (req) => {
  try {
    // Only allow POST (or change to DELETE if you want)
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json(
        { error: "Missing order_id" },
        { status: 400 }
      );
    }

    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    const sql = `
      DELETE FROM orders
      WHERE id = $1
      RETURNING id;
    `;

    const result = await client.query(sql, [order_id]);

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Order deleted successfully",
      order_id
    });

  } catch (err) {
    console.error("DELETE ORDER ERROR:", err);

    return Response.json(
      {
        success: false,
        message: "Failed to delete order",
        details: err.message
      },
      { status: 500 }
    );
  }
};
