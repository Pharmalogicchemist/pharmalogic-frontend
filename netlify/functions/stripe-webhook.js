// netlify/functions/stripe-webhook.js
const stripeLib = require("stripe");
const { sql } = require("./database.js");

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || "pk_test_51Rmj2QQslD1AIGDminivIkWafT4K6CtYDdV1EuxGeVNwd3GftrJTKMISPXeOqPAWBd5lAzO3OAtyudjp0tTaE67y00ow2kGrHP");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    if (webhookSecret && sig) {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } else {
      // Fallback: parse without verification (development only)
      stripeEvent = JSON.parse(event.body || "{}");
    }
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Invalid signature" })
    };
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const orderId = session.metadata && session.metadata.orderId;

      if (orderId) {
        await sql`
          UPDATE orders
          SET payment_status = 'paid',
              stripe_payment_intent = ${session.payment_intent}
          WHERE id = ${orderId}
        `;
      }
    } else if (stripeEvent.type === "checkout.session.expired") {
      const session = stripeEvent.data.object;
      const orderId = session.metadata && session.metadata.orderId;
      if (orderId) {
        await sql`
          UPDATE orders
          SET payment_status = 'failed'
          WHERE id = ${orderId}
        `;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error("stripe-webhook DB error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false })
    };
  }
};
