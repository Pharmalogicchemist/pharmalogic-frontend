// netlify/functions/create-checkout-session.js
const { sql } = require("./database.js");
const stripeLib = require("stripe");

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || "");

// Price table – edit these numbers as you wish (GBP)
const PRICE_MAP = {
  "2.5mg": 189.0,
  "5mg": 199.0,
  "7.5mg": 209.0,
  "10mg": 219.0,
  "12.5mg": 229.0,
  "15mg": 239.0
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY env var");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Stripe not configured" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { order_id, success_url, cancel_url } = body;

    if (!order_id || !success_url || !cancel_url) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing fields" })
      };
    }

    // 1) Fetch order + customer + consultation data
    const rows = await sql`
      SELECT
        o.id,
        o.consultation_data,
        c.email,
        c.name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${order_id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Order not found" })
      };
    }

    const order = rows[0];
    const consultation = order.consultation_data || {};
    const strength = consultation.mounjaro_strength;

    const amount = PRICE_MAP[strength] || 0;
    if (!amount) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Invalid or missing Mounjaro strength" })
      };
    }

    // 2) Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: order.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Mounjaro consultation (${strength})`
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        orderId: String(order.id)
      }
    });

    // 3) Update order with session + amount
    await sql`
      UPDATE orders
      SET stripe_session_id = ${session.id},
          total_amount = ${amount}
      WHERE id = ${order.id}
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        url: session.url
      })
    };
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
};
