/**
 * Family Membership Email Notification Helpers
 *
 * Helper functions for sending family membership-related emails
 * using the Supabase Edge Function email notification system.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

type FamilyMembershipEmailType =
  | 'family_membership_welcome'
  | 'family_invitation'
  | 'membership_payment_success'
  | 'membership_payment_failed'
  | 'membership_lifecycle'
  | 'membership_expiration_warning';

/**
 * Base function to send family membership emails
 */
async function sendFamilyMembershipEmail(
  type: FamilyMembershipEmailType,
  recipientEmail: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: _result, error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        to: recipientEmail,
        type,
        data,
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error sending ${type} email:`, error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// FAMILY MEMBERSHIP EMAIL HELPERS
// ============================================================================

/**
 * Send welcome email to new family membership subscriber
 */
export async function sendFamilyMembershipWelcomeEmail(params: {
  primaryMemberEmail: string;
  primaryMemberName: string;
  maxFamilyMembers: number;
  dashboardUrl?: string;
  inviteFamilyUrl?: string;
  settingsUrl?: string;
}) {
  const baseUrl = window.location.origin;

  return sendFamilyMembershipEmail('family_membership_welcome', params.primaryMemberEmail, {
    primaryMemberName: params.primaryMemberName,
    maxFamilyMembers: params.maxFamilyMembers,
    dashboardUrl: params.dashboardUrl || `${baseUrl}/family-membership`,
    inviteFamilyUrl: params.inviteFamilyUrl || `${baseUrl}/family-membership?tab=members`,
    settingsUrl: params.settingsUrl || `${baseUrl}/profile#settings`,
  });
}

/**
 * Send invitation email to family member
 */
export async function sendFamilyInvitationEmail(params: {
  inviteeEmail: string;
  inviteeName: string;
  primaryMemberName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  acceptInvitationUrl: string;
}) {
  return sendFamilyMembershipEmail('family_invitation', params.inviteeEmail, {
    inviteeName: params.inviteeName,
    inviteeEmail: params.inviteeEmail,
    primaryMemberName: params.primaryMemberName,
    daysUntilExpiry: params.daysUntilExpiry,
    expiryDate: params.expiryDate,
    acceptInvitationUrl: params.acceptInvitationUrl,
  });
}

/**
 * Send payment success confirmation email
 */
export async function sendMembershipPaymentSuccessEmail(params: {
  customerEmail: string;
  customerName: string;
  planName: string;
  amount: string;
  billingPeriod: string;
  invoiceNumber: string;
  paymentMethod: string;
  paymentDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  activeFamilyMembers: number;
  maxFamilyMembers: number;
  invoiceUrl?: string;
  dashboardUrl?: string;
  billingUrl?: string;
  settingsUrl?: string;
}) {
  const baseUrl = window.location.origin;

  return sendFamilyMembershipEmail('membership_payment_success', params.customerEmail, {
    customerName: params.customerName,
    planName: params.planName,
    amount: params.amount,
    billingPeriod: params.billingPeriod,
    invoiceNumber: params.invoiceNumber,
    paymentMethod: params.paymentMethod,
    paymentDate: params.paymentDate,
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    nextBillingDate: params.nextBillingDate,
    activeFamilyMembers: params.activeFamilyMembers,
    maxFamilyMembers: params.maxFamilyMembers,
    invoiceUrl: params.invoiceUrl || '#',
    dashboardUrl: params.dashboardUrl || `${baseUrl}/family-membership`,
    billingUrl: params.billingUrl || `${baseUrl}/family-membership?tab=billing`,
    settingsUrl: params.settingsUrl || `${baseUrl}/profile#settings`,
  });
}

/**
 * Send payment failed notification email
 */
export async function sendMembershipPaymentFailedEmail(params: {
  customerEmail: string;
  customerName: string;
  amountDue: string;
  billingPeriod: string;
  paymentMethod: string;
  attemptDate: string;
  gracePeriodDays: number;
  suspensionDate: string;
  updatePaymentUrl?: string;
  retryPaymentUrl?: string;
  dashboardUrl?: string;
  billingUrl?: string;
  supportUrl?: string;
}) {
  const baseUrl = window.location.origin;

  return sendFamilyMembershipEmail('membership_payment_failed', params.customerEmail, {
    customerName: params.customerName,
    amountDue: params.amountDue,
    billingPeriod: params.billingPeriod,
    paymentMethod: params.paymentMethod,
    attemptDate: params.attemptDate,
    gracePeriodDays: params.gracePeriodDays,
    suspensionDate: params.suspensionDate,
    updatePaymentUrl:
      params.updatePaymentUrl || `${baseUrl}/family-membership?tab=billing&action=update`,
    retryPaymentUrl:
      params.retryPaymentUrl || `${baseUrl}/family-membership?tab=billing&action=retry`,
    dashboardUrl: params.dashboardUrl || `${baseUrl}/family-membership`,
    billingUrl: params.billingUrl || `${baseUrl}/family-membership?tab=billing`,
    supportUrl: params.supportUrl || `${baseUrl}/contact`,
  });
}

/**
 * Send subscription lifecycle notification (pause, resume, cancel)
 */
export async function sendMembershipLifecycleEmail(params: {
  customerEmail: string;
  customerName: string;
  actionTitle: string; // e.g., "Paused", "Resumed", "Cancelled"
  actionSubtitle: string; // e.g., "Your subscription has been paused"
  message: string; // Main message body
  currentStatus: string;
  effectiveDate?: string;
  endDate?: string;
  whatHappensNext?: string;
  actionRequired?: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  helpUrl?: string;
}) {
  const baseUrl = window.location.origin;

  return sendFamilyMembershipEmail('membership_lifecycle', params.customerEmail, {
    customerName: params.customerName,
    actionTitle: params.actionTitle,
    actionSubtitle: params.actionSubtitle,
    message: params.message,
    currentStatus: params.currentStatus,
    effectiveDate: params.effectiveDate,
    endDate: params.endDate,
    whatHappensNext: params.whatHappensNext,
    actionRequired: params.actionRequired,
    dashboardUrl: params.dashboardUrl || `${baseUrl}/family-membership`,
    settingsUrl: params.settingsUrl || `${baseUrl}/profile#settings`,
    helpUrl: params.helpUrl || `${baseUrl}/help`,
  });
}

/**
 * Send expiration warning email
 */
export async function sendMembershipExpirationWarningEmail(params: {
  customerEmail: string;
  customerName: string;
  daysRemaining: number;
  expirationDate: string;
  totalCourses: number;
  familyMembersCount: number;
  coursesCompleted: number;
  certificatesEarned: number;
  learningHours: number;
  renewUrl?: string;
  dashboardUrl?: string;
  settingsUrl?: string;
}) {
  const baseUrl = window.location.origin;

  return sendFamilyMembershipEmail('membership_expiration_warning', params.customerEmail, {
    customerName: params.customerName,
    daysRemaining: params.daysRemaining,
    expirationDate: params.expirationDate,
    totalCourses: params.totalCourses,
    familyMembersCount: params.familyMembersCount,
    coursesCompleted: params.coursesCompleted,
    certificatesEarned: params.certificatesEarned,
    learningHours: params.learningHours,
    renewUrl: params.renewUrl || `${baseUrl}/family-membership/enroll`,
    dashboardUrl: params.dashboardUrl || `${baseUrl}/family-membership`,
    settingsUrl: params.settingsUrl || `${baseUrl}/profile#settings`,
  });
}

// ============================================================================
// SPECIALIZED LIFECYCLE EMAIL HELPERS
// ============================================================================

/**
 * Send subscription paused notification
 */
export async function sendSubscriptionPausedEmail(params: {
  customerEmail: string;
  customerName: string;
  effectiveDate: string;
  resumeDate?: string;
}) {
  return sendMembershipLifecycleEmail({
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    actionTitle: 'Paused',
    actionSubtitle: 'Your subscription has been temporarily paused',
    message:
      "We've paused your Family Membership as requested. Your family will retain access to all content until the pause takes effect.",
    currentStatus: 'Paused',
    effectiveDate: params.effectiveDate,
    endDate: params.resumeDate,
    whatHappensNext: params.resumeDate
      ? `<p>Your subscription will automatically resume on <strong>${params.resumeDate}</strong>. At that time, billing will restart and your family will continue to have full access.</p>`
      : '<p>Your subscription is paused indefinitely. You can resume it anytime from your dashboard. When you resume, billing will restart and your family will regain full access.</p>',
    actionRequired:
      'No action needed right now. You can resume your subscription anytime from your account settings.',
  });
}

/**
 * Send subscription resumed notification
 */
export async function sendSubscriptionResumedEmail(params: {
  customerEmail: string;
  customerName: string;
  effectiveDate: string;
  nextBillingDate: string;
}) {
  return sendMembershipLifecycleEmail({
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    actionTitle: 'Resumed',
    actionSubtitle: 'Your subscription has been reactivated',
    message:
      'Great news! Your Family Membership has been resumed. Your family now has full access to all courses, resources, and events.',
    currentStatus: 'Active',
    effectiveDate: params.effectiveDate,
    whatHappensNext: `<p>Your subscription is now active. Your next billing date is <strong>${params.nextBillingDate}</strong>.</p><p>All family members can now access:</p><ul><li>All AI courses and workshops</li><li>Exclusive vault resources</li><li>Live community events</li><li>Priority support</li></ul>`,
    actionRequired: null,
  });
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelledEmail(params: {
  customerEmail: string;
  customerName: string;
  effectiveDate: string;
  endDate: string;
  cancelAtPeriodEnd: boolean;
}) {
  return sendMembershipLifecycleEmail({
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    actionTitle: 'Cancelled',
    actionSubtitle: 'Your subscription has been cancelled',
    message: params.cancelAtPeriodEnd
      ? "We've received your cancellation request. Your subscription will remain active until the end of your current billing period."
      : 'Your Family Membership subscription has been cancelled and will end soon.',
    currentStatus: 'Cancelled',
    effectiveDate: params.effectiveDate,
    endDate: params.endDate,
    whatHappensNext: params.cancelAtPeriodEnd
      ? `<p>You and your family will continue to have full access until <strong>${params.endDate}</strong>. After that date, access to courses, vault resources, and events will be removed.</p><p>All progress and certificates earned will be preserved in your account.</p>`
      : `<p>Your access will end on <strong>${params.endDate}</strong>. After this date, you and your family members will no longer be able to:</p><ul><li>Access AI courses</li><li>Download vault resources</li><li>Attend live events</li><li>Use priority support</li></ul><p>However, all your progress and earned certificates will remain in your account.</p>`,
    actionRequired: params.cancelAtPeriodEnd
      ? `If you change your mind, you can reactivate your subscription anytime before ${params.endDate} without losing access.`
      : 'If you want to continue learning, you can reactivate your subscription from your dashboard.',
  });
}
