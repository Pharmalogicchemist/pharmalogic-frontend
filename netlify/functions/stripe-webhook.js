import Stripe from "stripe";
import { sql } from "./database.js";

export const config = {
  bodyParser: false,
};

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    const rawBody = await req.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.error("Webhook signature error:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const order_id = session.success_url.split("order_id=")[1];

      await sql`
        UPDATE orders
        SET status = 'approved', updated_at = NOW()
        WHERE id = ${order_id}
      `;
    }

    else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const order_id = session.cancel_url.split("order_id=")[1];

      await sql`
        UPDATE orders
        SET status = 'payment_failed', updated_at = NOW()
        WHERE id = ${order_id}
      `;
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook update error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
