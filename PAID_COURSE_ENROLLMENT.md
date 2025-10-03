# Paid Course Enrollment Flow - Complete Implementation

## Overview
Users can enroll in paid courses with secure Stripe payment processing. After successful payment, the course is **immediately available** in their Learning Management System.

## Implementation Details

### Architecture

```
User → Enrollment Form → Stripe Checkout → Webhook → Auto-Enrollment → Dashboard Access
```

### Components Created/Modified

#### 1. **Stripe Webhook Handler** (NEW)
**File**: `supabase/functions/stripe-webhook/index.ts`

**Purpose**: Automatically creates enrollment when payment succeeds

**How it works**:
1. Listens for `checkout.session.completed` events from Stripe
2. Verifies webhook signature for security
3. Extracts course and user info from metadata
4. Finds user in database (checks both `profiles` and `auth.users`)
5. Finds course by ID (or fallback to name search)
6. Checks for duplicate enrollments
7. Creates enrollment record with:
   - `payment_status: 'completed'`
   - `payment_amount`: actual amount paid
   - `payment_session_id`: Stripe session ID for reference
8. Triggers invoice generation
9. Returns success response

**Environment Variables Required**:
- `STRIPE_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (from Stripe Dashboard)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

#### 2. **Enhanced EnrollmentForm**
**File**: `src/components/EnrollmentForm.tsx`

**Changes**:
- Added `courseId` prop for accurate course identification
- Passes `courseId` to payment function
- Dual-path logic: Free courses → direct enrollment, Paid courses → Stripe

#### 3. **Enhanced Payment Creation**
**File**: `supabase/functions/create-payment/index.ts`

**Changes**:
- Accepts `courseId` parameter
- Includes `courseId` in Stripe session metadata
- Metadata now includes:
  - `courseName` (display name)
  - `courseId` (database ID)
  - `studentName` (for records)
  - `email` (for user lookup)

#### 4. **Improved PaymentSuccess Page**
**File**: `src/pages/PaymentSuccess.tsx`

**Changes**:
- Shows "Course Access Granted" message
- Displays immediate access information
- Auto-redirects to dashboard (8 seconds)
- Large "Go to My Dashboard" button
- Dynamic countdown timer
- User-aware redirect logic

## Complete User Flow

### Paid Course Enrollment Process

1. **Course Selection**
   - User browses training programs
   - Identifies paid course (price displayed)
   - Clicks "Enroll Now"

2. **Enrollment Form**
   - User fills out:
     - Student name
     - Date of birth
     - Guardian name (if under 18)
     - Email address
     - WhatsApp number
     - Home address
   - Sees payment information section
   - Clicks "Proceed to Payment"

3. **Payment Processing**
   - `create-payment` edge function invoked
   - Stripe checkout session created with metadata
   - User redirected to Stripe checkout page (new tab)
   - Enters payment details securely on Stripe

4. **Stripe Webhook (Background)**
   - Stripe sends `checkout.session.completed` event
   - `stripe-webhook` function receives event
   - Verifies signature
   - Extracts metadata (courseId, email, etc.)
   - Looks up user in database
   - Creates enrollment record
   - Triggers invoice generation

5. **Payment Success**
   - User redirected to `/payment-success` page
   - Sees confirmation message
   - Countdown timer showing 8 seconds
   - "Go to My Dashboard" button available
   - Auto-redirects to dashboard

6. **Immediate Course Access**
   - Dashboard shows enrolled course
   - Course materials available
   - Progress tracking begins
   - Full LMS access granted

## Database Schema

### Enrollment Record
```sql
INSERT INTO enrollments (
  user_id,          -- UUID from auth.users
  course_id,        -- Integer course ID
  payment_status,   -- 'completed'
  payment_amount,   -- Actual amount in base currency
  payment_session_id -- Stripe session ID
)
```

### Key Fields
- `payment_status`: Always 'completed' after successful payment
- `payment_amount`: Amount paid (converted from cents)
- `payment_session_id`: Reference to Stripe session for refunds/tracking

## Webhook Setup Instructions

### 1. Deploy Webhook Function
```bash
npx supabase functions deploy stripe-webhook
```

### 2. Configure Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`
5. Copy webhook signing secret
6. Add to Supabase secrets:
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Environment Variables
Ensure these are set in Supabase:
```bash
npx supabase secrets set STRIPE_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Security Features

### ✅ Webhook Verification
- Validates Stripe signature on every request
- Prevents replay attacks
- Ensures events come from Stripe

### ✅ Duplicate Prevention
- Checks for existing enrollments
- Prevents double-charging
- Idempotent webhook handling

### ✅ User Validation
- Verifies user exists in database
- Matches email from payment to user account
- Uses service role for admin operations

### ✅ Metadata Validation
- Validates course ID and name
- Ensures all required fields present
- Logs errors for debugging

## Error Handling

### Webhook Errors
```typescript
// User not found
- Status 404: "User not found"
- Logs: Email address for debugging

// Course not found
- Status 404: "Course not found"
- Logs: Course name/ID for debugging

// Enrollment creation failed
- Status 500: "Failed to create enrollment"
- Logs: Database error details

// Already enrolled
- Status 200: "Already enrolled"
- Prevents duplicate entries
```

### Client-Side Errors
- Payment creation failures show user-friendly message
- Network errors handled gracefully
- Stripe errors displayed to user

## Testing the Flow

### Test Mode Setup
1. Use Stripe test keys in development
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC

### Testing Steps
1. **Create Test Course**
   - Set price to "£50" or similar
   - Note the course ID

2. **Test Enrollment**
   - Log in as test user
   - Navigate to course
   - Fill enrollment form
   - Use Stripe test card
   - Complete payment

3. **Verify Webhook**
   - Check Supabase logs
   - Verify enrollment created
   - Confirm user_id and course_id match

4. **Verify User Experience**
   - PaymentSuccess page shows
   - Auto-redirect to dashboard
   - Course visible in enrolled courses
   - Materials accessible

### Webhook Testing
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Monitoring & Logs

### Supabase Function Logs
```bash
# View recent webhook logs
npx supabase functions logs stripe-webhook --tail

# View payment creation logs
npx supabase functions logs create-payment --tail
```

### Key Log Messages
- ✅ "Enrollment created successfully"
- ✅ "Already enrolled" (duplicate prevention)
- ❌ "User not found with email"
- ❌ "Course not found"
- ❌ "Error creating enrollment"

## Files Modified Summary

### New Files
1. `supabase/functions/stripe-webhook/index.ts` - Webhook handler

### Modified Files
1. `src/components/EnrollmentForm.tsx` - Added courseId, dual-path enrollment
2. `src/components/TrainingPrograms.tsx` - Pass courseId to form
3. `supabase/functions/create-payment/index.ts` - Include courseId in metadata
4. `src/pages/PaymentSuccess.tsx` - Dashboard redirect, better UX

## Comparison: Free vs Paid Courses

| Feature | Free Courses | Paid Courses |
|---------|-------------|--------------|
| Payment Gateway | ❌ No | ✅ Yes (Stripe) |
| Enrollment Creation | Frontend (direct) | Backend (webhook) |
| Access Timing | Immediate | Immediate (after payment) |
| Email Confirmation | ❌ Not yet | ✅ Yes (via invoice) |
| Invoice | ❌ No | ✅ Yes |
| Payment Reference | ❌ N/A | ✅ Session ID stored |
| Redirect Target | Dashboard | PaymentSuccess → Dashboard |

## Future Enhancements

### Potential Improvements
1. **Email Notifications**
   - Welcome email with course access
   - Payment receipt
   - Course schedule reminder

2. **WhatsApp Integration**
   - Payment confirmation
   - Course start reminders
   - Material updates

3. **Refund Handling**
   - Webhook for `charge.refunded`
   - Automatic enrollment removal
   - Access revocation

4. **Failed Payment Recovery**
   - Retry failed payments
   - Email follow-ups
   - Alternative payment methods

5. **Analytics**
   - Conversion tracking
   - Payment abandonment analysis
   - Revenue reporting

## Troubleshooting

### Enrollment Not Created
1. Check Stripe webhook logs
2. Verify webhook secret is correct
3. Ensure metadata includes courseId and email
4. Check Supabase function logs for errors

### Course Not Found
1. Verify course exists in database
2. Check courseId is passed correctly
3. Ensure course title matches exactly (fallback)

### User Not Found
1. Verify user registered before payment
2. Check email matches exactly
3. Look in both `profiles` and `auth.users` tables

### Webhook Signature Verification Failed
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check it matches the endpoint in Stripe Dashboard
3. Ensure no middleware is modifying the request

## Support & Maintenance

### Regular Checks
- Monitor webhook success rate
- Check for failed enrollments
- Verify invoice generation
- Review error logs weekly

### Dashboard Metrics
- Total enrollments
- Payment success rate
- Average enrollment time
- Failed webhook count

---

**Implementation Complete**: Users can now enroll in paid courses and get immediate access to their LMS dashboard after successful payment! 🎉
