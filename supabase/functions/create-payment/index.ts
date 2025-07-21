import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseName, coursePrice, studentInfo } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Convert price to cents
    const priceInCents = Math.round(parseFloat(coursePrice.replace('£', '')) * 100);

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer_email: studentInfo.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: courseName,
              description: `AI Training Course - ${courseName}`
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        courseName,
        studentName: studentInfo.studentName,
        email: studentInfo.email,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});