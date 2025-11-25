// netlify/functions/create-order.js
const { sql } = require("./database.js");

/**
 * This function:
 * 1. Saves/updates the customer in `customers` table
 * 2. Creates a new row in `orders` with consultation JSON
 * 3. Saves any uploaded files (as data URLs) into `order_files`
 * 4. Returns { success: true, order_id }
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

    // 1) Extract patient & billing details from your existing form fields
    const patientName = body.patient_name;
    const dob = body.dob;
    const mounjaroStrength = body.mounjaro_strength;
    const mobile = body.billing_phone;
    const email = body.billing_email;
    const address = `${body.billing_address_1 || ""}, ${body.billing_city || ""}, ${body.billing_postcode || ""}`.trim();

    if (!patientName || !mobile || !address) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing required fields" })
      };
    }

    // 2) Separate file fields from the consultation JSON
    const fileFields = ["proof_of_id", "previous_prescription", "video_upload"];
    const filesToStore = [];

    fileFields.forEach((key) => {
      if (body[key]) {
        filesToStore.push({
          file_url: body[key], // data URL from frontend
          file_type: key
        });
        delete body[key];
      }
    });

    // This is the full consultation data we’ll store as JSONB
    const consultationData = body;

    // 3) Upsert customer by mobile
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

    // 4) Insert order (payment_status initially 'pending')
    const orders = await sql`
      INSERT INTO orders (customer_id, payment_status, total_amount, consultation_data)
      VALUES (${customerId}, 'pending', NULL, ${consultationData})
      RETURNING id, created_at
    `;
    const orderId = orders[0].id;

    // 5) Store files (if any) in order_files
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
        order_id: orderId
      })
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
