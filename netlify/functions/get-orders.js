import { Client } from "@neondatabase/client";
export default async (req) => {
  try {
    if (req.method !== "GET") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    // Connect to Neon
    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    // Fetch orders sorted by newest first
    const sql = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        address,
        medication,
        price,
        order_status,
        answers,
        created_at
      FROM orders
      ORDER BY created_at DESC;
    `;

    const result = await client.query(sql);

    return Response.json({
      success: true,
      count: result.rows.length,
      orders: result.rows
    });

  } catch (err) {
    console.error("GET-ORDERS ERROR:", err);

    return Response.json(
      { 
        success: false,
        message: "Failed to fetch orders",
        details: err.message
      },
      { status: 500 }
    );
  }
};
