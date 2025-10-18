# Family Membership Email Notification System

## Overview

Comprehensive email notification system for the Family Membership Pass, providing automated communications for subscription lifecycle events, family invitations, and payment notifications.

## 📧 Email Types

### 1. 🎉 Family Membership Welcome
**Trigger:** New subscription created (checkout.session.completed)
**Template:** `family_membership_welcome`
**Purpose:** Welcome new family membership subscribers and guide them through next steps

**Content Includes:**
- Personalized welcome message
- Family member slots available (e.g., "5 Family Members")
- Lifetime access badge
- Key benefits (courses, vault, events, support)
- Next steps guide (invite family, explore dashboard, access vault, join events)
- Pro tip for inviting family members
- CTAs: "Go to Family Dashboard", "Invite Family"

**Trigger Location:** `supabase/functions/stripe-webhook-subscription/index.ts:346-392`

---

### 2. 🎁 Family Invitation
**Trigger:** Family member added or invitation resent
**Template:** `family_invitation`
**Purpose:** Invite family members to join the membership with personalized access link

**Content Includes:**
- Personal invitation from primary member (with their name)
- Visual invitation card with avatar
- Complete benefits list (6 key features)
- Expiration warning (7-day countdown)
- Clear "Accept Invitation" CTA
- How it works explanation
- Privacy note about who sent the invitation

**Trigger Locations:**
- `src/services/membership/FamilyMembersService.ts:26-90` (addFamilyMember)
- `src/services/membership/FamilyMembersService.ts:155-219` (resendInvitation)

---

### 3. ✅ Payment Success
**Trigger:** Invoice payment succeeded
**Template:** `membership_payment_success`
**Purpose:** Confirm successful payment and provide invoice details

**Content Includes:**
- Success confirmation with checkmark icon
- Detailed payment card with:
  - Plan name
  - Billing period
  - Invoice number
  - Payment method
  - Payment date
  - Amount paid (large, prominent display)
- Current membership status:
  - Active status
  - Current period dates
  - Next billing date
  - Family members count (active/max)
- Download invoice CTA
- Quick links to dashboard, billing history, settings

**Trigger Location:** `supabase/functions/stripe-webhook-subscription/index.ts:394-470`

---

### 4. ⚠️ Payment Failed
**Trigger:** Invoice payment failed
**Template:** `membership_payment_failed`
**Purpose:** Notify about payment failure and provide resolution options

**Content Includes:**
- Urgent alert with warning icon
- Payment failure details:
  - Amount due
  - Billing period
  - Payment method
  - Attempt date
- Common failure reasons (insufficient funds, expired card, etc.)
- Grace period information (7 days with access)
- Suspension date warning
- Two resolution options:
  1. **Update Payment Method** (primary CTA)
  2. **Retry Current Payment** (secondary CTA)
- Support contact information
- Automatic retry notice

**Trigger Location:** `supabase/functions/stripe-webhook-subscription/index.ts:472-544`

---

### 5. 📋 Subscription Lifecycle (Pause/Resume/Cancel)
**Trigger:** Subscription status changes
**Template:** `membership_lifecycle`
**Purpose:** Notify about subscription status changes with specific details

**Variants:**

#### Paused
- Effective date when pause begins
- Resume date (if scheduled)
- Access continuation information
- No action required message

#### Resumed
- Reactivation confirmation
- Next billing date
- Full access restoration details
- List of available features

#### Cancelled
- Cancellation confirmation
- End date (cancel_at_period_end or immediate)
- Access timeline
- Progress preservation notice
- Reactivation option

**Trigger Location:** `supabase/functions/stripe-webhook-subscription/index.ts:606-678`

**Helper Functions:**
- `src/utils/familyMembershipEmails.ts:225-248` (sendSubscriptionPausedEmail)
- `src/utils/familyMembershipEmails.ts:250-274` (sendSubscriptionResumedEmail)
- `src/utils/familyMembershipEmails.ts:276-306` (sendSubscriptionCancelledEmail)

---

### 6. ⏰ Expiration Warning
**Trigger:** Scheduled cron job (7 days before expiration)
**Template:** `membership_expiration_warning`
**Purpose:** Warn users about upcoming access expiration with urgency

**Content Includes:**
- Large countdown display (days remaining)
- Expiration date
- Complete list of benefits being lost:
  - All AI courses (with count)
  - Exclusive vault resources
  - Live workshops & events
  - Family member access (with count)
  - Community forum
  - Course certificates
- Current progress summary:
  - Courses completed
  - Certificates earned
  - Learning hours
- "Renew Now" CTA (primary)
- Multiple support channels (email, live chat, phone)
- Follow-up reminder notice

**Trigger:** Scheduled task (implementation needed)

---

## 🎨 Email Design

### Visual Theme
- **Primary Color:** Gold (#f59e0b, #fbbf24) for family membership branding
- **Success Color:** Green (#10b981) for payment confirmations
- **Alert Color:** Red (#ef4444) for failures and warnings
- **Info Color:** Purple (#8b5cf6) for invitations
- **Neutral Color:** Blue (#3b82f6) for lifecycle updates

### Layout
- Responsive design (600px max-width)
- Mobile-optimized
- Consistent header with Aiborg™ logo
- Clear content sections with visual hierarchy
- Prominent CTAs with hover effects
- Professional footer with navigation links

### Typography
- Font Family: 'Inter', 'Segoe UI', sans-serif
- Headings: 28-36px, bold
- Body: 16px, line-height 1.6
- Color: #1f2937 (dark gray) for readability

---

## 🔧 Implementation

### Edge Function Updates

**File:** `supabase/functions/send-email-notification/index.ts`

#### New Email Types Added:
```typescript
type: 'course_enrollment' | ... |
  'family_membership_welcome' |
  'family_invitation' |
  'membership_payment_success' |
  'membership_payment_failed' |
  'membership_lifecycle' |
  'membership_expiration_warning'
```

#### Templates Added (lines 427-980):
1. `family_membership_welcome` (lines 431-532)
2. `family_invitation` (lines 534-611)
3. `membership_payment_success` (lines 613-709)
4. `membership_payment_failed` (lines 711-803)
5. `membership_lifecycle` (lines 805-886)
6. `membership_expiration_warning` (lines 888-980)

---

### Helper Functions

**File:** `src/utils/familyMembershipEmails.ts`

All helper functions are TypeScript-typed and include comprehensive documentation:

1. **sendFamilyMembershipWelcomeEmail()**
   - Called after successful checkout
   - Includes dashboard URLs and max family members count

2. **sendFamilyInvitationEmail()**
   - Called when adding/resending family member invitations
   - Includes expiry countdown and acceptance URL

3. **sendMembershipPaymentSuccessEmail()**
   - Called after successful invoice payment
   - Includes full invoice details and membership status

4. **sendMembershipPaymentFailedEmail()**
   - Called when payment fails
   - Includes grace period and resolution options

5. **sendMembershipLifecycleEmail()**
   - Generic function for status changes
   - Specialized helpers: pause, resume, cancel

6. **sendMembershipExpirationWarningEmail()**
   - Called 7 days before expiration
   - Includes progress summary and renewal CTA

---

### Webhook Integration

**File:** `supabase/functions/stripe-webhook-subscription/index.ts`

#### Event Handlers Updated:

1. **handleCheckoutSessionCompleted** (lines 120-156)
   - Calls `sendWelcomeEmail()` after subscription creation
   - Fetches user and plan details
   - Sends personalized welcome with family slots info

2. **handleInvoicePaymentSucceeded** (lines 250-286)
   - Calls `sendPaymentSuccessEmail()` with invoice details
   - Includes subscription period and family member count
   - Provides invoice PDF URL

3. **handleInvoicePaymentFailed** (lines 288-322)
   - Calls `sendPaymentFailedEmail()` when payment fails
   - Sets 7-day grace period
   - Provides update/retry URLs

4. **handleSubscriptionDeleted** (lines 223-248)
   - Calls `sendCancellationEmail()` on cancellation
   - Includes end date and reactivation info

5. **handleTrialWillEnd** (lines 324-340)
   - Calls `sendTrialEndingEmail()` for trial expiration
   - Reuses expiration warning template

---

### Service Integration

**File:** `src/services/membership/FamilyMembersService.ts`

#### Email Triggers:

1. **addFamilyMember()** (lines 26-90)
   - Sends invitation email immediately after adding member
   - Fetches primary user name
   - Generates unique invitation URL with token
   - Includes 7-day expiration countdown

2. **resendInvitation()** (lines 155-219)
   - Increments reminder count
   - Re-sends invitation with same token
   - Updates invitation_sent_at timestamp

---

## 📊 Email Data Requirements

### Family Membership Welcome
```typescript
{
  primaryMemberName: string;
  maxFamilyMembers: number;
  dashboardUrl: string;
  inviteFamilyUrl: string;
  settingsUrl: string;
}
```

### Family Invitation
```typescript
{
  inviteeName: string;
  inviteeEmail: string;
  primaryMemberName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  acceptInvitationUrl: string;
}
```

### Payment Success
```typescript
{
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
  invoiceUrl: string;
  dashboardUrl: string;
  billingUrl: string;
  settingsUrl: string;
}
```

### Payment Failed
```typescript
{
  customerName: string;
  amountDue: string;
  billingPeriod: string;
  paymentMethod: string;
  attemptDate: string;
  gracePeriodDays: number;
  suspensionDate: string;
  updatePaymentUrl: string;
  retryPaymentUrl: string;
  dashboardUrl: string;
  billingUrl: string;
  supportUrl: string;
}
```

### Subscription Lifecycle
```typescript
{
  customerName: string;
  actionTitle: string;
  actionSubtitle: string;
  message: string;
  currentStatus: string;
  effectiveDate?: string;
  endDate?: string;
  whatHappensNext?: string;
  actionRequired?: string;
  dashboardUrl: string;
  settingsUrl: string;
  helpUrl: string;
}
```

### Expiration Warning
```typescript
{
  customerName: string;
  daysRemaining: number;
  expirationDate: string;
  totalCourses: number;
  familyMembersCount: number;
  coursesCompleted: number;
  certificatesEarned: number;
  learningHours: number;
  renewUrl: string;
  dashboardUrl: string;
  settingsUrl: string;
}
```

---

## 🚀 Deployment

### 1. Deploy Edge Function

```bash
# Deploy updated send-email-notification function
npx supabase functions deploy send-email-notification

# Verify deployment
npx supabase functions list
```

### 2. Set Environment Variables

Ensure these are set in Supabase Edge Function secrets:

```bash
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://aiborg-ai-web.vercel.app
```

### 3. Deploy Webhook Handler

```bash
# Deploy updated stripe-webhook-subscription function
npx supabase functions deploy stripe-webhook-subscription

# Verify webhook endpoint
npx supabase functions list | grep stripe-webhook
```

### 4. Configure Stripe Webhooks

Add these events to Stripe webhook configuration:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

---

## 🧪 Testing

### Manual Testing

#### Test Welcome Email:
```bash
# In Supabase SQL Editor or via API
SELECT * FROM send_email_notification(
  'your-email@example.com'::text,
  'family_membership_welcome'::text,
  '{"primaryMemberName": "Test User", "maxFamilyMembers": 5, ...}'::jsonb
);
```

#### Test Invitation Email:
```typescript
// In browser console or test file
import { FamilyMembersService } from '@/services/membership/FamilyMembersService';

await FamilyMembersService.addFamilyMember({
  subscription_id: 'test-sub-id',
  member_name: 'Test Family Member',
  member_email: 'family@example.com',
  member_age: 30,
  relationship: 'spouse',
  access_level: 'member',
});
```

#### Test Payment Emails:
```bash
# Use Stripe CLI to trigger test webhooks
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

---

## 📈 Monitoring

### View Sent Emails

```sql
-- Check all family membership emails sent
SELECT * FROM email_notifications_log
WHERE notification_type IN (
  'family_membership_welcome',
  'family_invitation',
  'membership_payment_success',
  'membership_payment_failed',
  'membership_lifecycle',
  'membership_expiration_warning'
)
ORDER BY sent_at DESC;

-- Count by type
SELECT notification_type, COUNT(*) as count
FROM email_notifications_log
WHERE notification_type LIKE 'family%' OR notification_type LIKE 'membership%'
GROUP BY notification_type;

-- Check delivery status in Resend
SELECT email_id, user_email, notification_type, sent_at
FROM email_notifications_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;
```

### Resend Dashboard

1. Go to https://resend.com/emails
2. Search by email_id from logs
3. View delivery status, opens, clicks
4. Check bounce/spam reports

---

## 🛠️ Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   npx supabase secrets list
   # Verify RESEND_API_KEY is set
   ```

2. **Check Edge Function Logs**
   ```bash
   npx supabase functions logs send-email-notification --tail
   npx supabase functions logs stripe-webhook-subscription --tail
   ```

3. **Check User Preferences**
   ```sql
   SELECT email_notifications, notification_preferences
   FROM profiles
   WHERE email = 'user@example.com';
   ```

### Invitation Links Not Working

1. **Verify Token Generation**
   ```sql
   SELECT id, name, email, invitation_token, invitation_expires_at
   FROM family_members
   WHERE email = 'invitee@example.com';
   ```

2. **Check Expiration**
   ```sql
   SELECT id, name, email,
     invitation_expires_at,
     invitation_expires_at > NOW() as is_valid
   FROM family_members
   WHERE invitation_token = 'token-here';
   ```

3. **Check Accept Invitation Page**
   - Ensure page exists at `/family-membership/accept-invitation`
   - Verify token parsing from URL query params
   - Check RPC function `accept_family_invitation` exists

### Payment Emails Not Triggered

1. **Verify Webhook Configuration**
   ```bash
   # Check Stripe webhook events
   stripe webhooks list

   # Test webhook endpoint
   stripe listen --forward-to your-webhook-url
   ```

2. **Check Stripe Metadata**
   ```javascript
   // Ensure metadata is set when creating checkout
   {
     metadata: {
       user_id: 'user-uuid',
       plan_id: 'plan-uuid'
     }
   }
   ```

---

## 🔮 Future Enhancements

### Phase 2 (Planned)
- [ ] Email digest notifications (weekly summary)
- [ ] SMS notifications via Twilio
- [ ] Push notifications (browser/mobile)
- [ ] Email template customization in admin panel
- [ ] A/B testing for subject lines
- [ ] Unsubscribe preferences management
- [ ] Multi-language support (i18n)

### Phase 3 (Ideas)
- [ ] Smart notification timing (user timezone awareness)
- [ ] AI-powered content personalization
- [ ] Calendar integration (iCal invites for events)
- [ ] Email analytics dashboard in admin
- [ ] Automated re-engagement campaigns
- [ ] Family usage reports (monthly digest)

---

## 📝 Best Practices

### 1. Respect User Preferences
Always check email preferences before sending:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('email_notifications, notification_preferences')
  .eq('email', userEmail)
  .single();

if (!profile?.email_notifications) return;
```

### 2. Handle Errors Gracefully
```typescript
try {
  await sendFamilyInvitationEmail(params);
} catch (error) {
  logger.error('Failed to send invitation email:', error);
  // Don't block user flow
  // Log to monitoring service
}
```

### 3. Use Descriptive Subjects
- ✅ "🎉 Welcome to the Aiborg Family Membership!"
- ✅ "⚠️ Payment Failed - Action Required for Family Membership"
- ❌ "Notification"
- ❌ "Update"

### 4. Test Before Deploying
```bash
# Local testing
npx supabase functions serve send-email-notification

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-email-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "family_membership_welcome", ...}'
```

### 5. Monitor Delivery Rates
- Track open rates (>20% is good)
- Monitor bounce rates (<5% is healthy)
- Watch spam complaints (<0.1% is acceptable)
- Review unsubscribe rates (adjust if >2%)

---

## 📞 Support

### Documentation
- This file: `/docs/FAMILY_MEMBERSHIP_EMAILS.md`
- Main email docs: `/docs/EMAIL_NOTIFICATIONS.md`
- Edge function: `/supabase/functions/send-email-notification/`
- Webhook handler: `/supabase/functions/stripe-webhook-subscription/`
- Helper functions: `/src/utils/familyMembershipEmails.ts`
- Service integration: `/src/services/membership/FamilyMembersService.ts`

### Resources
- Resend API: https://resend.com/docs
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

### Contact
- Development Team: Create GitHub issue
- Email Issues: Contact Resend support
- Webhook Issues: Check Stripe dashboard

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0
**Author:** Claude Code AI Assistant
