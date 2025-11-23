// netlify/functions/get-orders.js
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "GET") {
      return Response.json(
        { success: false, message: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const rows = await sql`
      SELECT 
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
      ORDER BY created_at DESC
    `;

    return Response.json({
      success: true,
      count: rows.length,
      orders: rows,
    });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    return Response.json(
      { success: false, message: "Failed to fetch orders", error: err.message },
      { status: 500 }
    );
  }
};
