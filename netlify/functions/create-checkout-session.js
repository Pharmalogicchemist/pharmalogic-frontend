// netlify/functions/create-checkout-session.js
import Stripe from "stripe";
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, message: "Method not allowed" }),
        { status: 405 }
      );
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({
        success: false,
        message: "Missing order_id",
      });
    }

    /** 🔥 Ensure Stripe is configured in Netlify ENV */
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publicKey = process.env.STRIPE_PUBLIC_KEY;

    if (!secretKey || !publicKey) {
      return Response.json({
        success: false,
        message: "Stripe not configured",
      });
    }

    const stripe = new Stripe(secretKey);

    // Get the order details
    const orders = await sql`
      SELECT * FROM orders WHERE id = ${order_id}
    `;

    if (orders.length === 0) {
      return Response.json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `https://pharmalogic-weightlossmedication.com/order-success.html?order_id=${order_id}`,
      cancel_url: `https://pharmalogic-weightlossmedication.com/order-failed.html?order_id=${order_id}`,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: order.mounjaro_strength + " Mounjaro",
            },
            unit_amount: Math.round(order.total_price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: order_id,
      },
    });

    return Response.json({
      success: true,
      message: "Session created",
      sessionId: session.id,
      publicKey,
    });

  } catch (err) {
    return Response.json({
      success: false,
      message: err.message,
    });
  }
};
