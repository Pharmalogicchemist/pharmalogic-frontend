// netlify/functions/create-checkout-session.js
import Stripe from "stripe";
import { sql } from "./database.js";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req) => {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ success: false, message: "order_id missing" });
    }

    const rows = await sql`
      SELECT * FROM orders WHERE order_id = ${order_id} LIMIT 1;
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Order not found" });
    }

    const order = rows[0];

    const priceMap = {
      "2.5mg": 125,
      "5mg": 145,
      "7.5mg": 165,
      "10mg": 185,
      "12.5mg": 195,
      "15mg": 205
    };

    const amount = priceMap[order.mounjaro_strength] || 125;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Mounjaro ${order.mounjaro_strength}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/order-success.html?order_id=${order_id}`,
      cancel_url: `${req.headers.origin}/order-failed.html?order_id=${order_id}`,
      metadata: { order_id }
    });

    return Response.json({
      success: true,
      sessionId: session.id,
      publicKey: process.env.STRIPE_PUBLIC_KEY
    });

  } catch (error) {
    console.error("Stripe Session Error:", error);
    return Response.json({ success: false, message: "Stripe error" });
  }
};
