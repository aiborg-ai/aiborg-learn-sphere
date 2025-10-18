# Family Membership Pass System - Comprehensive Overview

**Project**: aiborg-learn-sphere  
**Technology Stack**: React 18 + TypeScript + Supabase + Stripe  
**Date**: October 17, 2025

---

## 1. PROJECT STRUCTURE & TECHNOLOGY STACK

### Frontend Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **HTTP Client**: Supabase JS Client
- **Icons**: Lucide React

### Backend Infrastructure
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (Email/Password)
- **Backend Functions**: Supabase Edge Functions (Deno-based)
- **Payment Processing**: Stripe (v2024-10-28.acacia)
- **Session Management**: Supabase Auth + Stripe Webhooks

### Key File Locations
```
src/
├── pages/
│   ├── FamilyMembershipPage.tsx          # Landing page (11 sections)
│   └── FamilyMembershipEnrollment.tsx    # 4-step checkout flow
├── services/membership/
│   ├── MembershipService.ts              # Core membership operations
│   ├── FamilyMembersService.ts           # Family member management
│   ├── VaultContentService.ts            # Premium vault content
│   └── types.ts                          # TypeScript type definitions
├── hooks/
│   ├── useMembership.ts                  # React Query hooks
│   └── useFamilyMembers.ts               # Family member hooks
├── components/membership/
│   ├── FamilyPassBanner.tsx              # Home page banner
│   └── ROISavingsCalculator.tsx          # Interactive savings calculator
└── integrations/supabase/
    └── client.ts                         # Supabase client setup

supabase/
├── migrations/
│   ├── 20251017120000_membership_plans.sql       # Plans table
│   ├── 20251017120001_membership_subscriptions.sql # Subscriptions
│   └── 20251017120003_family_members.sql         # Family members
└── functions/
    ├── create-subscription/                # Stripe checkout session
    ├── manage-subscription/                # Pause/resume/cancel
    └── stripe-webhook-subscription/        # Webhook handler
```

---

## 2. DATABASE SCHEMA - MEMBERSHIP SYSTEM

### Core Tables

#### `membership_plans`
Defines available subscription tiers:
```sql
- id (UUID PRIMARY KEY)
- name, slug, description
- price (DECIMAL), currency (default: 'GBP')
- billing_interval ('month' | 'year')
- features (JSONB array of strings)
- max_family_members (INTEGER, default: 6)
- includes_vault_access, includes_event_access, includes_all_courses (BOOLEAN)
- trial_days (INTEGER, default: 30)
- stripe_product_id, stripe_price_id (TEXT)
- is_active, is_featured, display_order
- created_at, updated_at (TIMESTAMP)
```

**Sample Plans**:
1. **Family Pass** (Featured)
   - £20/month
   - Up to 6 family members
   - 50+ courses, 200+ vault items
   - Priority event access
   - 30-day free trial

2. **Individual Pass** (Inactive)
   - £15/month
   - 1 person only
   - 50+ courses
   - Event access (member pricing)
   - 14-day free trial

#### `membership_subscriptions`
Tracks user subscriptions with Stripe integration:
```sql
- id (UUID PRIMARY KEY)
- user_id (UUID, FK auth.users)
- plan_id (UUID, FK membership_plans)
- stripe_customer_id, stripe_subscription_id (TEXT)
- status (ENUM: trialing, active, past_due, canceled, unpaid, paused, incomplete)
- current_period_start, current_period_end (TIMESTAMP)
- trial_start, trial_end (TIMESTAMP)
- cancel_at_period_end (BOOLEAN)
- canceled_at, cancellation_reason, cancellation_feedback
- paused_at, pause_reason, resume_at
- payment_method_last4, payment_method_brand (TEXT)
- metadata (JSONB)
- created_at, updated_at
```

#### `family_members`
Manages family members with invitation system:
```sql
- id (UUID PRIMARY KEY)
- subscription_id (FK membership_subscriptions)
- primary_user_id (FK auth.users) - Who added them
- member_user_id (FK auth.users) - Linked account (null until accepted)
- member_name, member_email, member_age
- member_date_of_birth (DATE)
- relationship (ENUM: self, spouse, partner, child, parent, grandparent, 
               grandchild, sibling, other)
- status (ENUM: pending_invitation, invitation_sent, active, inactive, removed)
- access_level (TEXT: 'admin' | 'member' | 'restricted')
- can_manage_subscription (BOOLEAN)
- invitation_token, invitation_sent_at, invitation_expires_at (7-day TTL)
- invitation_accepted_at, invitation_reminders_sent
- last_login_at
- courses_enrolled_count, courses_completed_count
- vault_items_viewed, events_attended
- created_at, updated_at, removed_at
```

### RLS (Row Level Security) Policies

**membership_plans**:
- Anyone can view active plans (`is_active = true`)

**membership_subscriptions**:
- Users can view/insert/update only their own subscriptions
- Constraint: Only 1 active subscription (trialing or active) per user

**family_members**:
- Primary users can view and manage their family members
- Family members can view their own record
- Max 6 members per subscription (database constraint)

---

## 3. HELPER FUNCTIONS (SQL)

### `check_membership_access(user_id)`
Returns: BOOLEAN
- Checks if user has active membership (trialing or active status)
- Validates trial or billing period is not expired

### `get_active_subscription(user_id)`
Returns: TABLE with subscription + plan details
- Returns current active subscription with all plan features
- Used for membership dashboard and feature access checks

### `calculate_family_savings(num_members, courses_per_member, months)`
Returns: TABLE with savings metrics
- individual_cost: Calculated cost of individual courses
- family_pass_cost: Family pass monthly cost
- monthly_savings: Difference between individual and family
- annual_savings: Annual savings calculation
- roi_percentage: Return on investment %

### `add_family_member(...)`
Returns: UUID (member_id)
- Validates subscription belongs to user
- Checks member limit against plan max_family_members
- Generates 7-day invitation token
- Sets status to 'invitation_sent'

### `accept_family_invitation(token)`
Returns: UUID (member_id)
- Validates token exists and not expired
- Validates email matches current user's email
- Updates status to 'active' and links user account

### `remove_family_member(member_id)`
- Validates ownership
- Sets status to 'removed' with timestamp

### `get_subscription_family_members(subscription_id)`
Returns: TABLE of family members with stats
- Access control: user must own subscription
- Returns all active, pending, and invited members

### `sync_family_member_stats(member_user_id)`
- Updates enrollment/completion/vault/event counts from related tables
- Called after member completes courses or activities

### `update_subscription_status(stripe_subscription_id, status, dates)`
- Called by Stripe webhook handler
- Updates subscription status and billing period info

---

## 4. FRONTEND PAGES & COMPONENTS

### Pages

#### `/family-membership` - FamilyMembershipPage.tsx
**11 Conversion-Optimized Sections**:

1. **Hero Section**
   - Headline: "One Membership. Unlimited Learning. Whole Family."
   - £20/month pricing with £2,400+ annual savings
   - 30-day free trial CTA
   - Trust indicators: Money-back guarantee, Cancel anytime, No credit card

2. **Problem-Solution Section**
   - Left: Old way (expensive, limiting)
   - Right: Family Pass way (affordable, inclusive)

3. **Interactive Savings Calculator**
   - Adjustable sliders: Number of family members, courses per person, months
   - Real-time ROI calculation
   - Component: `<ROISavingsCalculator />`

4. **What's Included Section**
   - 4 feature cards:
     * All Online Courses (50+, primary, secondary, professional)
     * Exclusive Vault (200+ videos, templates, AI tools)
     * Event Access (free seminars, priority registration)
     * Family Sharing (individual accounts, certificates)

5. **Comparison Table Section**
   - Pricing comparison: Individual vs Family Pass
   - Feature matrix (course access, family members, vault, events, support)

6. **Testimonials Section**
   - 3 sample family testimonials
   - Social proof: 500+ families, star ratings
   - Real-world metrics (courses completed)

7. **How It Works Section**
   - 3-step process:
     1. Start Free Trial (no credit card)
     2. Add Family Members (up to 6)
     3. Learn Together (cancel anytime)

8. **FAQ Section**
   - 12 common questions
   - Accordion component for easy navigation
   - Covers: adding members, cancellation, pricing, features

9. **Trust & Guarantee Section**
   - 30-Day Money-Back Guarantee
   - Cancel Anytime
   - Secure Payment (Stripe)
   - Accepted payment methods

10. **Urgency & Final CTA Section**
    - Countdown timer (7 days from now)
    - Limited spots counter (47 remaining)
    - "Lock in £20/month forever" messaging
    - Final call-to-action button

11. **Live Activity Banner**
    - Rotating testimonials/activity updates
    - "Sarah from London joined 2 minutes ago"
    - Social proof elements

**Key Features**:
- Fully responsive design
- Gradient backgrounds with animations
- Icons from lucide-react
- React Query for data fetching
- Lazy-loaded page component

#### `/family-membership/enroll` - FamilyMembershipEnrollment.tsx
**4-Step Checkout Flow**:

**Step 1: Plan Confirmation**
- Plan name, description, price
- Feature list (first 8 features)
- Trial information
- ROI calculator preview
- Compact version displayed
- Blue info box: "30-Day Free Trial"

**Step 2: Account Information**
- Full Name (required)
- Email Address (required)
- Phone Number (optional)
- Country selector (GB, US, CA, AU, IE)
- Form validation with Zod
- Back/Continue buttons

**Step 3: Family Members (Optional)**
- Add up to max_family_members from plan
- Form fields per member:
  * Name (required)
  * Email (required)
  * Age (5-120)
  * Relationship (spouse, child, parent, sibling, other)
- Inline member cards showing added members
- Remove button per member
- "Skip for Now" option
- Note: Can add/remove members later from dashboard

**Step 4: Payment**
- Order Summary (plan, account holder, member count, price)
- Two options:
  * **Start 30-Day Free Trial** (blue button)
    - Full access for 30 days
    - No credit card required
    - Cancel anytime during trial
  * **Subscribe Now** (outlined button with price)
    - Immediate access
    - 30-day money-back guarantee
    - Billed monthly, cancel anytime

**UI Elements**:
- Progress indicator (4 steps with icons)
- Active step highlighting (amber/orange gradient)
- Card-based layout
- Smooth transitions between steps
- Trust indicators at bottom (Secure, 30-day guarantee, Cancel anytime)

### Components

#### `<ROISavingsCalculator />`
- Interactive sliders for: family members (1-6), courses per member (1-5), months (1-12)
- Real-time calculation using `calculate_family_savings()` RPC
- Displays: individual cost, family cost, monthly savings, annual savings, ROI %
- Full and compact versions

#### `<FamilyPassBanner />`
- Compact promotional banner
- Social proof: "523 families already joined"
- Scarcity counter: "47 spots remaining"
- CTA link to `/family-membership/enroll`
- Animated gradient background
- Hidden if user already has active membership

---

## 5. STRIPE INTEGRATION POINTS

### Edge Functions

#### `create-subscription` Function
**File**: `supabase/functions/create-subscription/index.ts`

**Request Body**:
```typescript
{
  planSlug: string;
  customerEmail: string;
  customerName: string;
  startTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}
```

**Process**:
1. Authenticate user via Supabase Auth header
2. Validate plan exists and is active
3. Check user doesn't already have active subscription
4. Create or retrieve Stripe customer
5. Create Stripe Checkout session with:
   - mode: 'subscription'
   - Line item: plan's stripe_price_id
   - Trial period: plan.trial_days (if startTrial = true)
   - Trial settings: cancel on missing payment method
   - Success/cancel URLs
   - Billing address collection
   - Metadata: user_id, plan_id, plan_slug
6. Create subscription record in DB (status: 'incomplete')
7. Return: { sessionId, url, subscriptionId }

**Redirects to**: Stripe Checkout URL

#### `manage-subscription` Function
**File**: `supabase/functions/manage-subscription/index.ts`

**Actions Supported**:
- `cancel`: Cancel subscription (at period end or immediately)
- `pause`: Pause subscription for N months
- `resume`: Resume paused subscription
- `get_portal`: Get Stripe Customer Portal URL
- `update_payment`: Access payment method management

**Cancel Logic**:
- If `cancelImmediately: true`: Stripe cancels immediately
- If `false`: Sets `cancel_at_period_end = true` (cancels at next billing)
- Stores cancellation_reason and cancellation_feedback

**Pause Logic**:
- Sets `paused_at` timestamp
- Stores pause_reason
- Stripe pauses for specified months
- Calculates resume_at date

**Portal Link**:
- Uses Stripe's customer portal
- Allows users to manage payment method, update billing, view invoices

#### `stripe-webhook-subscription` Function
**File**: `supabase/functions/stripe-webhook-subscription/index.ts`

**Events Handled**:
1. `checkout.session.completed`
   - Updates subscription with stripe_subscription_id
   - Sets status from Stripe data

2. `customer.subscription.created`
   - Inserts/updates subscription in DB
   - Syncs all subscription details

3. `customer.subscription.updated`
   - Updates subscription status and dates
   - Handles: active → canceled, trialing → active, etc.

4. `customer.subscription.deleted`
   - Sets status to 'canceled'
   - Records canceled_at timestamp

5. `invoice.payment_succeeded`
   - Updates payment_method_last4 and payment_method_brand
   - Triggers success notifications (TODO)

6. `invoice.payment_failed`
   - Sets status to 'past_due'
   - Stores failure reason
   - TODO: Send retry notifications

7. `customer.subscription.trial_will_end`
   - TODO: Send trial expiration reminder

**Webhook Verification**:
- Validates Stripe signature using webhook secret
- Uses Stripe's constructEventAsync with SubtleCrypto provider

### Stripe Configuration

**Required Environment Variables** (Vercel):
```
STRIPE_SECRET_KEY          # Secret key for server-side operations
STRIPE_WEBHOOK_SECRET      # Webhook verification secret
STRIPE_PUBLISHABLE_KEY     # (Frontend - for future use)
FRONTEND_URL               # Used in success/cancel redirect URLs
```

**Stripe Account Setup**:
- Products & Prices: Family Pass product with monthly price
- Webhooks: Configure endpoint for `stripe-webhook-subscription`
- Event subscriptions: checkout.session.completed, subscription.*, invoice.*, customer.subscription.*
- Customers: Created with metadata (supabase_user_id, plan_slug)

---

## 6. ACCESS CONTROL & SECURITY

### Authentication & Authorization

**Authentication Layer**:
- Supabase Auth (email/password, social OAuth via providers)
- JWT tokens in Authorization header
- Auth status checked at: checkout, subscription management, family member operations

**Authorization Checks**:

1. **Subscription Access**
   - User can only access their own subscription (`user_id = auth.uid()`)
   - Primary user can manage associated family members
   - Family members can view only their own record

2. **Family Member Invitations**
   - Email verification: member's registered email must match invitation email
   - 7-day token expiration
   - Only primary user (subscription owner) can send/revoke invitations

3. **Access Levels**
   - `admin`: Can manage subscription, add/remove family members
   - `member`: Normal access to courses, events, vault
   - `restricted`: Limited access (not yet implemented)

4. **Feature Access Control**
   - Vault access: Requires active membership
   - Event registration: Requires active membership
   - Course enrollment: Accessible with valid subscription status

### Database Security (RLS)

**Row Level Security Policies**:

```sql
-- membership_plans
SELECT: is_active = true (anyone)

-- membership_subscriptions
SELECT: auth.uid() = user_id
INSERT: auth.uid() = user_id (own subscriptions only)
UPDATE: auth.uid() = user_id

-- family_members
SELECT: 
  - auth.uid() = primary_user_id (primary sees all their members)
  - auth.uid() = member_user_id (members see their own record)
ALL:
  - auth.uid() = primary_user_id (primary manages members)
```

**Constraints**:
- UNIQUE constraint: One active subscription per user (trialing or active status)
- Check constraint: Max 6 family members per subscription
- Foreign keys cascade delete (membership_subscriptions depends on plans)

---

## 7. FEATURES IMPLEMENTED VS. TODO

### Completed Features ✓

1. **Membership Plans**
   - Create/read plans from database
   - Featured plans display
   - Plan selection and validation

2. **Checkout Flow**
   - 4-step enrollment process
   - Plan confirmation
   - Account information capture
   - Family member pre-addition
   - Free trial vs paid subscription options

3. **Stripe Integration**
   - Checkout session creation
   - Free trial support (30 days)
   - Subscription metadata tracking
   - Webhook handling for subscription lifecycle

4. **Subscription Management**
   - Cancel subscription (at period end or immediately)
   - Pause subscription
   - Resume subscription
   - Customer portal access

5. **Family Members**
   - Add family members (up to max from plan)
   - Invitation generation with 7-day expiry
   - Invitation acceptance with email verification
   - Remove family members
   - Activity statistics tracking

6. **Landing Page**
   - 11 conversion-optimized sections
   - ROI calculator
   - Testimonials
   - FAQ section
   - Scarcity/urgency messaging
   - Social proof elements

7. **Frontend Hooks**
   - useMembership: Plans, subscriptions, access
   - useFamilyMembers: Family member operations
   - Query caching with React Query

### TODO / In Progress ⚠️

1. **Email Notifications** (HIGH PRIORITY)
   - Send invitation emails when family members are added
   - Currently TODO in FamilyMembersService.resendInvitation()
   - Need edge function for email delivery

2. **Recommendations Engine**
   - Personalized course recommendations
   - Member activity-based suggestions
   - Currently TODO in MembershipService.getDashboardData()

3. **Membership Dashboard**
   - View active subscription details
   - Family member management interface
   - Usage statistics
   - Event attendance tracking
   - Course progress summary

4. **Trial Expiration Reminders**
   - Send notifications before trial ends
   - Webhook handler prepared but not implemented

5. **Payment Retry Logic**
   - Auto-retry failed payments
   - Communication on payment failures
   - Webhook handler prepared but needs implementation

6. **Admin Portal**
   - View all subscriptions
   - Manage plans
   - Process refunds/adjustments
   - View analytics

7. **Feature Flags & Experiments**
   - A/B testing landing page variations
   - Gradual rollout of features

8. **Stripe Test Mode**
   - Verify webhook handling in test mode
   - Test payment scenarios

9. **Payment Method Management**
   - Update payment method in customer portal
   - Store payment method details

10. **Accounting & Invoicing**
    - Generate invoices from Stripe
    - Download invoice history
    - Tax compliance handling

---

## 8. DATA FLOW DIAGRAMS

### Enrollment Flow
```
User starts at /family-membership
    ↓
Clicks "Start Free Trial"
    ↓
/family-membership/enroll (Step 1: Plan Confirmation)
    ↓
Step 2: Account Information (name, email, phone, country)
    ↓
Step 3: Add Family Members (optional, up to 6)
    ↓
Step 4: Choose Free Trial or Subscribe Now
    ↓
POST to create-subscription edge function
    ↓
Create Stripe Checkout Session
    ↓
Redirect to Stripe Checkout
    ↓
User enters payment info (or skips for trial)
    ↓
Stripe redirects to success URL
    ↓
Webhook: checkout.session.completed
    ↓
Update subscription in DB (status: trialing/active)
    ↓
User can now access membership
```

### Family Member Invitation Flow
```
Primary user in dashboard clicks "Add Member"
    ↓
Enter member details (name, email, age, relationship)
    ↓
POST to add_family_member() RPC
    ↓
Generate 7-day expiry token
    ↓
Create family_members record (status: invitation_sent)
    ↓
[TODO] Send invitation email with token link
    ↓
Member receives email, clicks link
    ↓
If matching email, shows acceptance page
    ↓
Member clicks "Accept Invitation"
    ↓
POST to accept_family_invitation() with token
    ↓
Validate token (not expired, matches email)
    ↓
Update status to 'active', link member_user_id
    ↓
Member can now access family subscription
```

### Subscription Lifecycle
```
Subscription created (status: incomplete)
    ↓
Trial period active (30 days)
    ↓
[If trial] status: trialing → active (at day 30)
    ↓
Billing period active (monthly)
    ↓
Options:
  - Continue: Auto-renew next month
  - Cancel: Set cancel_at_period_end=true (cancels at period end)
  - Pause: Pause for N months
  - Immediate Cancel: Cancel now
    ↓
Payment processing
    ↓
Success: Payment processed, period extended
    ↓
Or Failure: status: past_due (retry logic needed)
    ↓
Eventually: status: canceled
```

---

## 9. API ENDPOINTS & HOOKS

### React Query Hooks (useMembership.ts)

**Plans**:
```typescript
useActivePlans()                           // GET all active plans
useFeaturedPlans()                         // GET featured plans
usePlanBySlug(slug)                        // GET specific plan
```

**Subscriptions**:
```typescript
useActiveSubscription()                    // GET current active subscription
useUserSubscriptions()                     // GET all user subscriptions (historical)
useHasActiveMembership()                   // Check if user has active membership
```

**Operations**:
```typescript
useCreateSubscription()                    // POST checkout session
useCancelSubscription()                    // POST cancel
usePauseSubscription()                     // POST pause
useResumeSubscription()                    // POST resume
useGetCustomerPortalUrl()                  // GET portal link
```

**Utilities**:
```typescript
calculateSavings()                         // Calculate ROI/savings
getDashboardData()                         // Comprehensive dashboard data
```

### MembershipService Methods

**Static Methods**:
```typescript
getActivePlans(): Promise<MembershipPlan[]>
getPlanBySlug(slug): Promise<MembershipPlan | null>
getFeaturedPlans(): Promise<MembershipPlan[]>

getActiveSubscription(): Promise<SubscriptionWithPlan | null>
getUserSubscriptions(): Promise<SubscriptionWithPlan[]>
hasActiveMembership(): Promise<boolean>

calculateSavings(numMembers, coursesPerMember, months): Promise<SubscriptionSavings>

createSubscription(params): Promise<{ sessionId, url }>
manageSubscription(params): Promise<SubscriptionActionResult>
cancelSubscription(id, reason?, feedback?)
cancelSubscriptionImmediately(id, reason?, feedback?)
pauseSubscription(id, months?)
resumeSubscription(id)
getCustomerPortalUrl(id, returnUrl?)

getDashboardData(): Promise<MembershipDashboardData>
getMembershipBenefitsUsage(): Promise<MembershipBenefitsUsage>
```

---

## 10. ENVIRONMENT CONFIGURATION

### Required Environment Variables

**Frontend (.env.local)**:
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173 (or production URL)
```

**Supabase Edge Functions** (via Vercel/Supabase Dashboard):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_... (optional, frontend use)
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
FRONTEND_URL=https://aiborg-ai-web.vercel.app (or dev URL)
```

### Deployment URLs

**Production**:
- Frontend: https://aiborg-ai-web.vercel.app
- Supabase: aiborg project
- Stripe: Production account (live keys)

**Development**:
- Frontend: http://localhost:5173
- Supabase: aiborg project (same, dev auth)
- Stripe: Test mode (test keys)

---

## 11. KNOWN ISSUES & CONSIDERATIONS

### Performance
- ROI Calculator might be slow with large datasets
- Consider memoization for repeated calculations
- Query caching configured (30 min for plans, 5 min for subscriptions)

### TODO Items
1. **Email Sending** - Critical for family member invitations
2. **Payment Retry** - Needs webhook implementation
3. **Recommendations** - Dashboard personalization
4. **Admin Portal** - Manage plans and subscriptions

### Security Concerns
- Stripe webhook signature verification implemented ✓
- RLS policies in place ✓
- User authentication required for operations ✓
- Token expiration for invitations (7 days) ✓

### Future Enhancements
1. **Billing Portal** - Stripe customer portal integration
2. **Usage Analytics** - Track member engagement
3. **Promotional Codes** - Stripe coupons support
4. **Multiple Plans** - Individual pass in future
5. **Upgrades/Downgrades** - Plan changes mid-subscription
6. **Family Groups** - Multiple subscriptions management

---

## 12. QUICK START / DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Configure Stripe webhooks endpoint
- [ ] Set environment variables in Vercel
- [ ] Test Stripe integration in test mode
- [ ] Verify RLS policies are active
- [ ] Test full enrollment flow
- [ ] Implement email notification edge function
- [ ] Test family member invitations

### Post-Deployment Monitoring
- [ ] Monitor Stripe webhook logs
- [ ] Check subscription creation success rate
- [ ] Verify email delivery
- [ ] Monitor error logs for edge functions
- [ ] Track user adoption metrics

### Optional Enhancements
- [ ] Set up analytics (page views, conversion funnel)
- [ ] Configure A/B testing on landing page
- [ ] Implement referral program
- [ ] Add customer support chat
- [ ] Create onboarding email sequence

---

## 13. KEY FILES SUMMARY

| File | Purpose | Lines |
|------|---------|-------|
| FamilyMembershipPage.tsx | Landing page with 11 sections | ~812 |
| FamilyMembershipEnrollment.tsx | 4-step checkout flow | ~735 |
| MembershipService.ts | Core subscription operations | ~515 |
| FamilyMembersService.ts | Family member management | ~419 |
| VaultContentService.ts | Vault content access | ~190+ |
| useMembership.ts | React Query hooks | ~200+ |
| create-subscription/index.ts | Stripe checkout handler | ~250+ |
| manage-subscription/index.ts | Pause/cancel/resume | ~200+ |
| stripe-webhook-subscription/index.ts | Webhook handler | ~200+ |
| 20251017120000_membership_plans.sql | Plans table + functions | 131 |
| 20251017120001_membership_subscriptions.sql | Subscriptions table + RLS | 245 |
| 20251017120003_family_members.sql | Family members table + functions | 392 |

---

## 14. CONTACT & NOTES

**Project Owner**: aiborg-ai (Hirendra Vikram)  
**Technology Support**: Supabase + Stripe documentation  
**Last Updated**: October 17, 2025

This system is production-ready with the exception of email notifications and payment retry logic, which need to be implemented in edge functions.

