// netlify/functions/stripe-webhook.js
import Stripe from "stripe";
import { sql } from "./database.js";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req) => {
  const body = await req.text();
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  const data = event.data.object;

  if (event.type === "checkout.session.completed") {
    const orderId = data.metadata.order_id;

    await sql`
      UPDATE orders
      SET order_status = 'PAID',
          payment_id = ${data.id},
          payment_status = ${data.payment_status}
      WHERE order_id = ${orderId};
    `;
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const orderId = data.metadata.order_id;

    await sql`
      UPDATE orders
      SET order_status = 'PAYMENT_FAILED'
      WHERE order_id = ${orderId};
    `;
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    const orderId = data.metadata.order_id;

    await sql`
      UPDATE orders
      SET order_status = 'PAID'
      WHERE order_id = ${orderId};
    `;
  }

  return new Response("OK", { status: 200 });
};

export const config = { rawBody: true };
