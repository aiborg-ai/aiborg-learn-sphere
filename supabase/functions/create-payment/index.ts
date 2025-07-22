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
    const requestBody = await req.json();
    
    // Input validation and sanitization
    const { courseName, coursePrice, studentInfo } = requestBody;
    
    if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
      throw new Error('Invalid course name provided');
    }
    
    if (!coursePrice || typeof coursePrice !== 'string') {
      throw new Error('Invalid course price provided');
    }
    
    if (!studentInfo || typeof studentInfo !== 'object') {
      throw new Error('Invalid student information provided');
    }
    
    if (!studentInfo.email || typeof studentInfo.email !== 'string' || !studentInfo.email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!studentInfo.studentName || typeof studentInfo.studentName !== 'string' || studentInfo.studentName.trim().length === 0) {
      throw new Error('Student name is required');
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Sanitize and validate price conversion
    const sanitizedPrice = coursePrice.replace(/[^0-9.£]/g, '').replace('£', '');
    const priceFloat = parseFloat(sanitizedPrice);
    
    if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 10000) {
      throw new Error('Invalid price amount');
    }
    
    const priceInCents = Math.round(priceFloat * 100);

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
    
    // Determine if this is a validation error or system error
    const isValidationError = error.message.includes('Invalid') || 
                             error.message.includes('required') || 
                             error.message.includes('Valid email');
    
    if (isValidationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // For system errors, don't expose internal details
    return new Response(JSON.stringify({ error: "Payment processing unavailable. Please try again later." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});