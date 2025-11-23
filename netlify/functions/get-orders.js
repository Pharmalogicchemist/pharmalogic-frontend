import { getClient } from "./_db.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "GET") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const client = await getClient();

    const result = await client.query(
      `SELECT 
         id,
         customer_id,
         full_name,
         email,
         phone,
         address,
         medication,
         price,
         status,
         answers,
         created_at,
         updated_at
       FROM orders
       ORDER BY created_at DESC;`
    );

    await client.end();

    return Response.json({
      success: true,
      count: result.rows.length,
      orders: result.rows
    });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    return Response.json(
      { success: false, message: "Failed to fetch orders", details: err.message },
      { status: 500 }
    );
  }
};
