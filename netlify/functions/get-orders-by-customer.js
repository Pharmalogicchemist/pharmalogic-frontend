// netlify/functions/get-orders-by-customer.js
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "GET") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const url = new URL(req.url);
    const customer_id = url.searchParams.get("customer_id");
    const email = url.searchParams.get("email");

    if (!customer_id && !email) {
      return Response.json(
        { error: "Missing customer_id or email parameter" },
        { status: 400 }
      );
    }

    let orders;
    if (customer_id) {
      orders = await sql`
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
        WHERE customer_id = ${customer_id}
        ORDER BY created_at DESC;
      `;
    } else {
      orders = await sql`
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
        WHERE email = ${email}
        ORDER BY created_at DESC;
      `;
    }

    return Response.json({
      success: true,
      customer_id: customer_id || null,
      email: email || null,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("GET ORDERS BY CUSTOMER ERROR:", err);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch customer orders",
        details: err.message,
      },
      { status: 500 }
    );
  }
};
