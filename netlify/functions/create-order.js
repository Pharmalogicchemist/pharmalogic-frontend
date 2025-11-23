// netlify/functions/create-order.js
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const data = await req.json();

    const required = [
      "customer_id",
      "full_name",
      "email",
      "address",
      "medication",
      "answers",
    ];
    for (const r of required) {
      if (!data[r]) {
        return Response.json(
          { error: `Missing required field: ${r}` },
          { status: 400 }
        );
      }
    }

    const rows = await sql`
      INSERT INTO orders (
        customer_id,
        full_name,
        email,
        phone,
        address,
        medication,
        price,
        answers,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${data.customer_id},
        ${data.full_name},
        ${data.email},
        ${data.phone || ""},
        ${data.address},
        ${data.medication},
        ${data.price || 0},
        ${JSON.stringify(data.answers)},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING id, customer_id, full_name, email, medication, price, status, created_at;
    `;

    return Response.json({
      success: true,
      message: "Order created successfully",
      order: rows[0],
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
};
