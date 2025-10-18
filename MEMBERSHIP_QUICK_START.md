# Family Membership Pass - Quick Reference Guide

## Key URLs
- **Landing Page**: `/family-membership`
- **Enrollment**: `/family-membership/enroll`
- **Routing File**: `src/App.tsx`

## Key Files by Role

### Frontend Engineers
- Pages: `src/pages/FamilyMembershipPage.tsx`, `FamilyMembershipEnrollment.tsx`
- Components: `src/components/membership/` (FamilyPassBanner, ROISavingsCalculator)
- Hooks: `src/hooks/useMembership.ts`
- Services: `src/services/membership/MembershipService.ts`

### Backend/Database Engineers
- Migrations: `supabase/migrations/202510170*_*.sql`
- RPC Functions: See migrations for SQL function definitions
- Schema: membership_plans, membership_subscriptions, family_members tables

### DevOps/Infrastructure
- Edge Functions: `supabase/functions/{create,manage}-subscription/`
- Webhooks: `supabase/functions/stripe-webhook-subscription/`
- Environment: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`

## Critical Implementation Status

### Phase 1: COMPLETE
- Database schema (3 core tables with 10+ helper functions)
- Landing page (11 conversion sections)
- Checkout flow (4-step form)
- Stripe integration (checkout + manage + webhooks)
- Family member system (invitations + management)

### Phase 2: IN PROGRESS
- Email notifications (TODO: Edge function needed)
- Membership dashboard (TODO: UI needed)
- Admin portal (TODO: Full implementation)

### Phase 3: FUTURE
- Recommendations engine
- Analytics dashboard
- Multi-plan support
- Upgrade/downgrade flows

## Database Quick Reference

### Main Tables
| Table | Purpose | Rows Expected |
|-------|---------|---------------|
| membership_plans | Plan definitions | 2-5 plans |
| membership_subscriptions | User subscriptions | Grows with users |
| family_members | Family member records | 1-6 per subscription |

### Key RPC Functions
- `check_membership_access(user_id)` - Boolean check
- `get_active_subscription(user_id)` - Get subscription + plan
- `calculate_family_savings(...)` - ROI calculation
- `add_family_member(...)` - Create invitation
- `accept_family_invitation(token)` - Accept invitation

## Stripe Configuration Checklist

- [ ] Stripe product created for "Family Pass"
- [ ] Monthly price configured (£20)
- [ ] Webhook endpoint registered
- [ ] STRIPE_SECRET_KEY set in Vercel
- [ ] STRIPE_WEBHOOK_SECRET set in Vercel
- [ ] Test mode verified with test keys

## Common Tasks

### Add a New Feature
1. Update database schema in migration file
2. Add RPC function if needed
3. Update TypeScript types in `src/services/membership/types.ts`
4. Add service method in `MembershipService.ts`
5. Add React Query hook in `useMembership.ts`
6. Update UI components

### Debug Subscription Issues
1. Check `membership_subscriptions` table status
2. Verify Stripe webhook logs in Stripe Dashboard
3. Check edge function logs in Supabase
4. Validate RLS policies are not blocking queries

### Test Email Invitations
1. TODO: Implement edge function for email
2. Update `FamilyMembersService.resendInvitation()`
3. Configure email provider (SendGrid, AWS SES, etc.)

## Performance Notes
- Plans cached for 30 minutes
- Subscriptions cached for 5 minutes
- Family members fetched on demand
- ROI calculator is synchronous (consider memoization)

## Security Checklist
- [x] Stripe signature verification on webhooks
- [x] RLS policies on all tables
- [x] User authentication required for mutations
- [x] Token expiration (7 days for invitations)
- [x] Email verification for family member acceptance
- [ ] Rate limiting on API endpoints
- [ ] CSRF protection on forms

## Deployment Notes
- Production URL: https://aiborg-ai-web.vercel.app
- Database: aiborg Supabase project
- Stripe: Production account (live keys)
- Deployment: Automatic on push to main (GitHub)

## Support & Documentation
- Full guide: `FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md`
- Stripe docs: https://stripe.com/docs
- Supabase docs: https://supabase.com/docs
- React Query: https://tanstack.com/query

