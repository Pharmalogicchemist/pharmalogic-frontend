// netlify/functions/create-checkout-session.js
const { sql } = require("./database.js");
const stripeLib = require("stripe");

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || "sk_test_51Rmj2QQslD1AIGDmY6ZkHc0yJcUv3taSGEZTyGVcLM4pgjuEm24F8uAqA7ewOpNGR4bEqaVimjgwSVzCI0LU1h0400XbTJ0179");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Stripe not configured" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      orderId,
      amount,
      currency = "gbp",
      successUrl,
      cancelUrl,
      customerEmail
    } = body;

    if (!orderId || !amount || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message: "Missing fields" })
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Weight loss medication consultation"
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: String(orderId)
      }
    });

    await sql`
      UPDATE orders
      SET stripe_session_id = ${session.id}, total_amount = ${amount}
      WHERE id = ${orderId}
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        sessionId: session.id,
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
