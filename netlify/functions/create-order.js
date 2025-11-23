import { Client } from "@neondatabase/client";
export default async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }

    const data = await req.json();

    // Required fields
    const required = ["full_name", "email", "address", "medication", "answers"];
    for (let r of required) {
      if (!data[r] || data[r].length === 0) {
        return Response.json(
          { error: `Missing required field: ${r}` },
          { status: 400 }
        );
      }
    }

    // Connect to NEON DB
    const client = new Client(process.env.NETLIFY_DATABASE_URL);
    await client.connect();

    const sql = `
      INSERT INTO orders (
        full_name,
        email,
        phone,
        address,
        medication,
        price,
        answers,
        order_status,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
      RETURNING id, full_name, email, medication, price, order_status, created_at;
    `;

    const params = [
      data.full_name,
      data.email,
      data.phone || "",
      data.address,
      data.medication,
      data.price || 0,
      JSON.stringify(data.answers),
      "pending"
    ];

    const result = await client.query(sql, params);

    return Response.json({
      success: true,
      message: "Order created successfully",
      order: result.rows[0]
    });

  } catch (err) {
    console.error("Create Order Error:", err);

    return Response.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
};
