import Stripe from "stripe";
import { sql } from "./database.js";

export default async (req) => {
  try {
    const method = req.method || req.httpMethod;
    if (method !== "POST") {
      return Response.json({ success: false, message: "Method Not Allowed" }, { status: 405 });
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ success: false, message: "Missing order_id" }, { status: 400 });
    }

    // Get order info
    const rows = await sql`
      SELECT id, full_name, email, medication, price 
      FROM orders WHERE id = ${order_id}
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = rows[0];

    // PRICE must be in pennies
    const amount = Number(order.price) * 100;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Mounjaro ${order.medication}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: "https://pharmalogic-weightlossmedication.com/order-success.html?order_id=" + order_id,
      cancel_url: "https://pharmalogic-weightlossmedication.com/order-failed.html?order_id=" + order_id,
    });

    return Response.json({
      success: true,
      sessionId: session.id,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
    });

  } catch (err) {
    console.error("Stripe session error:", err);
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
};
