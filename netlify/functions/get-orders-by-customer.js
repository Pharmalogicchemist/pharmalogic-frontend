import { Client } from "@neondatabase/client";
export default async (req) => {
  try {
    if (req.method !== "GET") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const url = new URL(req.url);
    const customer_id = url.searchParams.get("customer_id");
    const email = url.searchParams.get("email"); // optional fallback

    if (!customer_id && !email) {
      return Response.json(
        { error: "Missing customer_id or email parameter" },
        { status: 400 }
      );
    }

    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    let sql, params;

    if (customer_id) {
      sql = `
        SELECT 
          id,
          customer_id,
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
        WHERE customer_id = $1
        ORDER BY created_at DESC;
      `;
      params = [customer_id];
    } else {
      sql = `
        SELECT 
          id,
          customer_id,
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
        WHERE email = $1
        ORDER BY created_at DESC;
      `;
      params = [email];
    }

    const result = await client.query(sql, params);

    return Response.json({
      success: true,
      customer_id: customer_id || null,
      email: email || null,
      count: result.rows.length,
      orders: result.rows
    });

  } catch (err) {
    console.error("GET ORDERS BY CUSTOMER ERROR:", err);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch customer orders",
        details: err.message
      },
      { status: 500 }
    );
  }
};
