// netlify/functions/create-order.js
const { sql } = require("./database.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      customer,
      paymentStatus = "pending",
      totalAmount = null,
      consultationData = null,
      files = []
    } = body;

    if (!customer || !customer.name || !customer.mobile || !customer.address) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing customer details" })
      };
    }

    const { name, email = null, mobile, address } = customer;

    await sql`BEGIN`;

    let customerId;
    const existing = await sql`
      SELECT id FROM customers
      WHERE mobile = ${mobile}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existing.length > 0) {
      customerId = existing[0].id;
      await sql`
        UPDATE customers
        SET name = ${name}, email = ${email}, address = ${address}
        WHERE id = ${customerId}
      `;
    } else {
      const inserted = await sql`
        INSERT INTO customers (name, email, mobile, address)
        VALUES (${name}, ${email}, ${mobile}, ${address})
        RETURNING id
      `;
      customerId = inserted[0].id;
    }

    const orders = await sql`
      INSERT INTO orders (customer_id, payment_status, total_amount, consultation_data)
      VALUES (${customerId}, ${paymentStatus}, ${totalAmount}, ${consultationData})
      RETURNING id, created_at
    `;
    const orderId = orders[0].id;

    for (const f of files) {
      if (!f || !f.url) continue;
      await sql`
        INSERT INTO order_files (order_id, file_url, file_type)
        VALUES (${orderId}, ${f.url}, ${f.type || null})
      `;
    }

    await sql`COMMIT`;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, orderId })
    };
  } catch (err) {
    console.error("create-order error:", err);
    try {
      await sql`ROLLBACK`;
    } catch (_) {}
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
