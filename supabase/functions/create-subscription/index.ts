/**
 * Create Stripe Subscription Checkout Session
 *
 * Handles creating a Stripe Checkout session for membership subscriptions
 * Supports free trials and recurring billing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  planSlug: string;
  customerEmail: string;
  customerName: string;
  startTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: CreateSubscriptionRequest = await req.json();
    const {
      planSlug,
      customerEmail,
      customerName,
      startTrial = true,
      successUrl,
      cancelUrl,
      metadata = {},
    } = body;

    // Validate required fields
    if (!planSlug || !customerEmail || !customerName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: planSlug, customerEmail, customerName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from('membership_plans')
      .select('*')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or inactive plan',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabaseClient
      .from('membership_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .single();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({
          error: 'User already has an active subscription',
          subscription: existingSubscription,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create or retrieve Stripe customer
    let stripeCustomer;
    const { data: existingCustomerData } = await supabaseClient
      .from('membership_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingCustomerData?.stripe_customer_id) {
      // Retrieve existing customer
      stripeCustomer = await stripe.customers.retrieve(
        existingCustomerData.stripe_customer_id
      );
    } else {
      // Create new customer
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          supabase_user_id: user.id,
          plan_slug: planSlug,
        },
      });
    }

    // Verify plan has Stripe price ID
    if (!plan.stripe_price_id) {
      return new Response(
        JSON.stringify({
          error: 'Plan does not have Stripe price ID configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Configure line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: plan.stripe_price_id,
        quantity: 1,
      },
    ];

    // Configure subscription data
    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        plan_slug: planSlug,
        ...metadata,
      },
    };

    // Add trial period if requested and available
    if (startTrial && plan.trial_days && plan.trial_days > 0) {
      subscriptionData.trial_period_days = plan.trial_days;
      subscriptionData.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      };
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      subscription_data: subscriptionData,
      success_url:
        successUrl ||
        `${Deno.env.get('FRONTEND_URL')}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${Deno.env.get('FRONTEND_URL')}/family-membership?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        plan_slug: planSlug,
      },
    });

    // Create subscription record in database (status will be updated by webhook)
    const { error: insertError } = await supabaseClient
      .from('membership_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        stripe_customer_id: stripeCustomer.id,
        status: 'incomplete',
        metadata: {
          checkout_session_id: session.id,
          plan_slug: planSlug,
        },
      });

    if (insertError) {
      console.error('Error creating subscription record:', insertError);
      // Don't fail the request - webhook will handle it
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        subscriptionId: session.subscription,
        customerId: stripeCustomer.id,
        plan: {
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.billing_interval,
          trialDays: startTrial ? plan.trial_days : 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
