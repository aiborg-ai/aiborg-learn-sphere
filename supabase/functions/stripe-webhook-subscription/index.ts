/**
 * Stripe Webhook Handler for Subscription Events
 *
 * Handles subscription lifecycle events from Stripe:
 * - subscription.created
 * - subscription.updated
 * - subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - customer.subscription.trial_will_end
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-10-28.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    console.log(`Received event: ${event.type}`);

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreatedOrUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(supabase, subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleCheckoutSessionCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  console.log('Handling checkout.session.completed');

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing user_id or plan_id in session metadata');
    return;
  }

  // Update subscription record with Stripe subscription ID
  if (session.subscription) {
    const { error } = await supabase
      .from('membership_subscriptions')
      .update({
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .is('stripe_subscription_id', null);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log(`Subscription updated for user ${userId}`);
      // Send welcome email
      await sendWelcomeEmail(supabase, userId, planId);
    }
  }
}

async function handleSubscriptionCreatedOrUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log(`Handling subscription ${subscription.status}`);

  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing user_id or plan_id in subscription metadata');
    return;
  }

  // Map Stripe status to our status enum
  const statusMap: Record<string, string> = {
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    paused: 'paused',
  };

  const ourStatus = statusMap[subscription.status] || subscription.status;

  // Prepare subscription data
  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: ourStatus,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  // Upsert subscription record
  const { error } = await supabase
    .from('membership_subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  } else {
    console.log(`Subscription upserted for user ${userId}: ${ourStatus}`);
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log('Handling subscription.deleted');

  const { error } = await supabase
    .from('membership_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
  } else {
    console.log(`Subscription canceled: ${subscription.id}`);
    // Send cancellation confirmation email
    const userId = subscription.metadata?.user_id;
    if (userId) {
      await sendCancellationEmail(supabase, userId);
    }
  }
}

async function handleInvoicePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log('Handling invoice.payment_succeeded');

  if (!invoice.subscription) {
    return;
  }

  // Update subscription period dates
  const { error } = await supabase
    .from('membership_subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(invoice.period_start * 1000).toISOString(),
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription);

  if (error) {
    console.error('Error updating subscription after payment:', error);
  } else {
    console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
    // Send payment success email
    const { data: subscription } = await supabase
      .from('membership_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription?.user_id) {
      await sendPaymentSuccessEmail(supabase, subscription.user_id, invoice);
    }
  }
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log('Handling invoice.payment_failed');

  if (!invoice.subscription) {
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabase
    .from('membership_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription);

  if (error) {
    console.error('Error updating subscription after payment failure:', error);
  } else {
    console.log(`Payment failed for subscription: ${invoice.subscription}`);
    // Send payment failed email
    const { data: subscription } = await supabase
      .from('membership_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription?.user_id) {
      await sendPaymentFailedEmail(supabase, subscription.user_id);
    }
  }
}

async function handleTrialWillEnd(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log('Handling customer.subscription.trial_will_end');

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('Missing user_id in subscription metadata');
    return;
  }

  // Send trial ending reminder email
  await sendTrialEndingEmail(supabase, userId, subscription);
  console.log(`Trial ending reminder sent to user ${userId}`);
}

// ============================================================================
// EMAIL NOTIFICATION HELPERS
// ============================================================================

async function sendWelcomeEmail(
  supabase: any,
  userId: string,
  planId: string
) {
  try {
    // Get user and plan details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const { data: plan } = await supabase
      .from('membership_plans')
      .select('name, max_family_members')
      .eq('id', planId)
      .single();

    if (!user || !plan) {
      console.error('User or plan not found for welcome email');
      return;
    }

    // Get app base URL from environment or construct it
    const appUrl = Deno.env.get('APP_URL') || 'https://aiborg-ai-web.vercel.app';

    // Send welcome email
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        type: 'family_membership_welcome',
        data: {
          primaryMemberName: user.full_name || 'there',
          maxFamilyMembers: plan.max_family_members,
          dashboardUrl: `${appUrl}/family-membership`,
          inviteFamilyUrl: `${appUrl}/family-membership?tab=members`,
          settingsUrl: `${appUrl}/profile#settings`,
        },
      },
    });

    console.log(`Welcome email sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

async function sendPaymentSuccessEmail(
  supabase: any,
  userId: string,
  invoice: Stripe.Invoice
) {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Get subscription details
    const { data: subscription } = await supabase
      .from('membership_subscriptions')
      .select(`
        *,
        plan:membership_plans(name, max_family_members)
      `)
      .eq('user_id', userId)
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    // Get family members count
    const { count: activeFamilyMembers } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription?.id)
      .eq('status', 'active');

    if (!user || !subscription) {
      console.error('User or subscription not found for payment success email');
      return;
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://aiborg-ai-web.vercel.app';

    // Format dates
    const formatDate = (timestamp: number) =>
      new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    // Send payment success email
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        type: 'membership_payment_success',
        data: {
          customerName: user.full_name || 'there',
          planName: subscription.plan?.name || 'Family Membership',
          amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
          billingPeriod: `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`,
          invoiceNumber: invoice.number || invoice.id,
          paymentMethod: invoice.payment_intent ? 'Card' : 'Unknown',
          paymentDate: formatDate(invoice.created),
          currentPeriodStart: formatDate(invoice.period_start),
          currentPeriodEnd: formatDate(invoice.period_end),
          nextBillingDate: formatDate(invoice.period_end),
          activeFamilyMembers: activeFamilyMembers || 0,
          maxFamilyMembers: subscription.plan?.max_family_members || 5,
          invoiceUrl: invoice.invoice_pdf || '#',
          dashboardUrl: `${appUrl}/family-membership`,
          billingUrl: `${appUrl}/family-membership?tab=billing`,
          settingsUrl: `${appUrl}/profile#settings`,
        },
      },
    });

    console.log(`Payment success email sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
}

async function sendPaymentFailedEmail(supabase: any, userId: string) {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Get subscription details
    const { data: subscription } = await supabase
      .from('membership_subscriptions')
      .select(`
        *,
        plan:membership_plans(name, price_monthly, price_annual)
      `)
      .eq('user_id', userId)
      .eq('status', 'past_due')
      .single();

    if (!user || !subscription) {
      console.error('User or subscription not found for payment failed email');
      return;
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://aiborg-ai-web.vercel.app';

    // Calculate suspension date (7 days grace period)
    const suspensionDate = new Date();
    suspensionDate.setDate(suspensionDate.getDate() + 7);

    // Format dates
    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    // Determine amount and billing period
    const isAnnual = subscription.plan?.price_annual !== null;
    const amount = isAnnual
      ? `$${subscription.plan.price_annual}`
      : `$${subscription.plan.price_monthly}`;
    const billingPeriod = isAnnual ? 'Annual' : 'Monthly';

    // Send payment failed email
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        type: 'membership_payment_failed',
        data: {
          customerName: user.full_name || 'there',
          amountDue: amount,
          billingPeriod: billingPeriod,
          paymentMethod: 'Card ending in ****',
          attemptDate: formatDate(new Date()),
          gracePeriodDays: 7,
          suspensionDate: formatDate(suspensionDate),
          updatePaymentUrl: `${appUrl}/family-membership?tab=billing&action=update`,
          retryPaymentUrl: `${appUrl}/family-membership?tab=billing&action=retry`,
          dashboardUrl: `${appUrl}/family-membership`,
          billingUrl: `${appUrl}/family-membership?tab=billing`,
          supportUrl: `${appUrl}/contact`,
        },
      },
    });

    console.log(`Payment failed email sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending payment failed email:', error);
  }
}

async function sendTrialEndingEmail(
  supabase: any,
  userId: string,
  subscription: Stripe.Subscription
) {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user || !subscription.trial_end) {
      console.error('User not found or no trial end date');
      return;
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://aiborg-ai-web.vercel.app';

    // Calculate days until trial ends
    const trialEndDate = new Date(subscription.trial_end * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Format date
    const formatDate = (timestamp: number) =>
      new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    // Send expiration warning (reuse template for trial ending)
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        type: 'membership_expiration_warning',
        data: {
          customerName: user.full_name || 'there',
          daysRemaining: daysRemaining,
          expirationDate: formatDate(subscription.trial_end),
          totalCourses: 50,
          familyMembersCount: 5,
          coursesCompleted: 0,
          certificatesEarned: 0,
          learningHours: 0,
          renewUrl: `${appUrl}/family-membership?tab=billing`,
          dashboardUrl: `${appUrl}/family-membership`,
          settingsUrl: `${appUrl}/profile#settings`,
        },
      },
    });

    console.log(`Trial ending email sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending trial ending email:', error);
  }
}

async function sendCancellationEmail(supabase: any, userId: string) {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Get subscription details
    const { data: subscription } = await supabase
      .from('membership_subscriptions')
      .select('*, plan:membership_plans(name)')
      .eq('user_id', userId)
      .eq('status', 'canceled')
      .single();

    if (!user || !subscription) {
      console.error('User or subscription not found for cancellation email');
      return;
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://aiborg-ai-web.vercel.app';

    // Format dates
    const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const effectiveDate = subscription.canceled_at
      ? formatDate(subscription.canceled_at)
      : formatDate(new Date().toISOString());

    const endDate = subscription.current_period_end
      ? formatDate(subscription.current_period_end)
      : formatDate(new Date().toISOString());

    // Send cancellation email using lifecycle template
    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: user.email,
        type: 'membership_lifecycle',
        data: {
          customerName: user.full_name || 'there',
          actionTitle: 'Cancelled',
          actionSubtitle: 'Your subscription has been cancelled',
          message: subscription.cancel_at_period_end
            ? "We've received your cancellation request. Your subscription will remain active until the end of your current billing period."
            : 'Your Family Membership subscription has been cancelled.',
          currentStatus: 'Cancelled',
          effectiveDate: effectiveDate,
          endDate: endDate,
          whatHappensNext: subscription.cancel_at_period_end
            ? `<p>You and your family will continue to have full access until <strong>${endDate}</strong>. After that date, access to courses, vault resources, and events will be removed.</p><p>All progress and certificates earned will be preserved in your account.</p>`
            : `<p>Your access will end on <strong>${endDate}</strong>. After this date, you and your family members will no longer be able to access courses, vault resources, or attend live events.</p><p>However, all your progress and earned certificates will remain in your account.</p>`,
          actionRequired: subscription.cancel_at_period_end
            ? `If you change your mind, you can reactivate your subscription anytime before ${endDate} without losing access.`
            : 'If you want to continue learning, you can reactivate your subscription from your dashboard.',
          dashboardUrl: `${appUrl}/family-membership`,
          settingsUrl: `${appUrl}/profile#settings`,
          helpUrl: `${appUrl}/help`,
        },
      },
    });

    console.log(`Cancellation email sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
}
