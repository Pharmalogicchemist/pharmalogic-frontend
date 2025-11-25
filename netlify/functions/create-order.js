// netlify/functions/create-order.js
const { sql } = require("./database.js");

/**
 * Creates an order + customer + stores consultation files.
 */
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

    // REQUIRED FIELDS
    const patientName = body.patient_name;
    const dob = body.dob;
    const mounjaroStrength = body.mounjaro_strength;
    const mobile = body.billing_phone;
    const email = body.billing_email;
    const address = `${body.billing_address_1 || ""}, ${body.billing_city || ""}, ${body.billing_postcode || ""}`.trim();

    if (!patientName || !mobile || !address || !mounjaroStrength) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing required fields" })
      };
    }

    // ⭐ PRICE TABLE (editable)
    const prices = {
      "2.5mg": 179,
      "5mg": 199,
      "7.5mg": 219,
      "10mg": 229,
      "12.5mg": 239,
      "15mg": 249
    };

    const totalAmount = prices[mounjaroStrength] || null;

    if (!totalAmount) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid Mounjaro strength price" })
      };
    }

    // Extract files from body
    const fileFields = ["proof_of_id", "previous_prescription", "video_upload"];
    const filesToStore = [];

    fileFields.forEach((key) => {
      if (body[key]) {
        filesToStore.push({
          file_url: body[key],
          file_type: key
        });
        delete body[key];
      }
    });

    const consultationData = body; // JSONB data

    await sql`BEGIN`;

    // ======= UPSERT CUSTOMER =======
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
        SET name = ${patientName},
            email = ${email},
            address = ${address}
        WHERE id = ${customerId}
      `;
    } else {
      const inserted = await sql`
        INSERT INTO customers (name, email, mobile, address)
        VALUES (${patientName}, ${email}, ${mobile}, ${address})
        RETURNING id
      `;
      customerId = inserted[0].id;
    }

    // ======= INSERT ORDER WITH CORRECT total_amount =======
    const orders = await sql`
      INSERT INTO orders (customer_id, payment_status, total_amount, consultation_data)
      VALUES (${customerId}, 'pending', ${totalAmount}, ${consultationData})
      RETURNING id, created_at
    `;

    const orderId = orders[0].id;

    // ======= INSERT UPLOADED FILES =======
    for (const f of filesToStore) {
      await sql`
        INSERT INTO order_files (order_id, file_url, file_type)
        VALUES (${orderId}, ${f.file_url}, ${f.file_type})
      `;
    }

    await sql`COMMIT`;

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        order_id: orderId,
        total_amount: totalAmount
      })
    };

  } catch (err) {
    console.error("create-order error:", err);
    try { await sql`ROLLBACK`; } catch (_) {}

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
