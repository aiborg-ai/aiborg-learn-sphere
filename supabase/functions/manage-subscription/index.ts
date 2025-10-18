/**
 * Manage Subscription Edge Function
 *
 * Handles subscription management operations:
 * - Cancel subscription (immediate or at period end)
 * - Pause subscription
 * - Resume subscription
 * - Update payment method
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

interface ManageSubscriptionRequest {
  action: 'cancel' | 'pause' | 'resume' | 'update_payment' | 'get_portal';
  subscriptionId?: string;
  cancelImmediately?: boolean;
  cancellationReason?: string;
  cancellationFeedback?: string;
  pauseMonths?: number;
  returnUrl?: string;
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: ManageSubscriptionRequest = await req.json();
    const { action, subscriptionId, returnUrl } = body;

    // Validate action
    const validActions = ['cancel', 'pause', 'resume', 'update_payment', 'get_portal'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('membership_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', subscriptionId || '')
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different actions
    let result;
    switch (action) {
      case 'cancel':
        result = await handleCancelSubscription(
          subscription,
          body.cancelImmediately || false,
          body.cancellationReason,
          body.cancellationFeedback
        );
        break;

      case 'pause':
        result = await handlePauseSubscription(
          subscription,
          body.pauseMonths || 1
        );
        break;

      case 'resume':
        result = await handleResumeSubscription(subscription);
        break;

      case 'update_payment':
      case 'get_portal':
        result = await handleGetCustomerPortal(
          subscription.stripe_customer_id,
          returnUrl || `${Deno.env.get('FRONTEND_URL')}/settings/membership`
        );
        break;

      default:
        throw new Error('Invalid action');
    }

    // Update database if needed
    if (action !== 'get_portal' && action !== 'update_payment') {
      await updateSubscriptionInDatabase(supabaseClient, subscription.id, result);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error managing subscription:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to manage subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleCancelSubscription(
  subscription: any,
  cancelImmediately: boolean,
  cancellationReason?: string,
  cancellationFeedback?: string
) {
  const stripeSubscriptionId = subscription.stripe_subscription_id;

  if (!stripeSubscriptionId) {
    throw new Error('No Stripe subscription ID found');
  }

  if (cancelImmediately) {
    // Cancel immediately
    const canceledSubscription = await stripe.subscriptions.cancel(
      stripeSubscriptionId,
      {
        cancellation_details: {
          comment: cancellationFeedback,
          feedback: cancellationReason as any,
        },
      }
    );

    return {
      success: true,
      message: 'Subscription canceled immediately',
      subscription: canceledSubscription,
      canceledAt: new Date(),
      cancelImmediately: true,
      cancellationReason,
      cancellationFeedback,
    };
  } else {
    // Cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: cancellationFeedback,
          feedback: cancellationReason as any,
        },
      }
    );

    return {
      success: true,
      message: 'Subscription will cancel at period end',
      subscription: updatedSubscription,
      cancelAtPeriodEnd: true,
      periodEnd: new Date(updatedSubscription.current_period_end * 1000),
      cancellationReason,
      cancellationFeedback,
    };
  }
}

async function handlePauseSubscription(
  subscription: any,
  pauseMonths: number
) {
  const stripeSubscriptionId = subscription.stripe_subscription_id;

  if (!stripeSubscriptionId) {
    throw new Error('No Stripe subscription ID found');
  }

  // Calculate resume date
  const resumeDate = new Date();
  resumeDate.setMonth(resumeDate.getMonth() + pauseMonths);

  // Pause subscription using pause_collection
  const updatedSubscription = await stripe.subscriptions.update(
    stripeSubscriptionId,
    {
      pause_collection: {
        behavior: 'void',
        resumes_at: Math.floor(resumeDate.getTime() / 1000),
      },
    }
  );

  return {
    success: true,
    message: `Subscription paused for ${pauseMonths} month(s)`,
    subscription: updatedSubscription,
    resumeAt: resumeDate,
    pauseMonths,
  };
}

async function handleResumeSubscription(subscription: any) {
  const stripeSubscriptionId = subscription.stripe_subscription_id;

  if (!stripeSubscriptionId) {
    throw new Error('No Stripe subscription ID found');
  }

  // Resume subscription
  const updatedSubscription = await stripe.subscriptions.update(
    stripeSubscriptionId,
    {
      pause_collection: null as any,
    }
  );

  return {
    success: true,
    message: 'Subscription resumed',
    subscription: updatedSubscription,
  };
}

async function handleGetCustomerPortal(
  stripeCustomerId: string,
  returnUrl: string
) {
  if (!stripeCustomerId) {
    throw new Error('No Stripe customer ID found');
  }

  // Create customer portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return {
    success: true,
    portalUrl: portalSession.url,
    message: 'Customer portal session created',
  };
}

// ============================================================================
// DATABASE UPDATE HELPER
// ============================================================================

async function updateSubscriptionInDatabase(
  supabaseClient: any,
  subscriptionId: string,
  result: any
) {
  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (result.cancelImmediately) {
    updates.status = 'canceled';
    updates.canceled_at = new Date().toISOString();
    updates.cancellation_reason = result.cancellationReason;
    updates.cancellation_feedback = result.cancellationFeedback;
  } else if (result.cancelAtPeriodEnd) {
    updates.cancel_at_period_end = true;
    updates.cancellation_reason = result.cancellationReason;
    updates.cancellation_feedback = result.cancellationFeedback;
  } else if (result.pauseMonths) {
    updates.status = 'paused';
    updates.paused_at = new Date().toISOString();
    updates.resume_at = result.resumeAt.toISOString();
    updates.pause_reason = `Paused for ${result.pauseMonths} month(s)`;
  } else if (result.message === 'Subscription resumed') {
    updates.status = 'active';
    updates.paused_at = null;
    updates.resume_at = null;
  }

  const { error } = await supabaseClient
    .from('membership_subscriptions')
    .update(updates)
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error updating subscription in database:', error);
  }
}
