# Family Membership Pass System - Documentation Index

## Quick Navigation

This directory contains comprehensive documentation for the Family Membership Pass system. Choose the document based on your role and needs:

### For Everyone - Start Here
- **[FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md](./FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md)** (27 KB)
  - Complete system overview covering all aspects
  - 14 sections with detailed explanations
  - Database schema, architecture, features status
  - Best for: Understanding the full system

### For Developers - Quick Reference
- **[MEMBERSHIP_QUICK_START.md](./MEMBERSHIP_QUICK_START.md)** (3.9 KB)
  - Quick reference guide
  - File locations by role
  - Common tasks and troubleshooting
  - Best for: Finding specific information quickly

---

## Key File Locations (Absolute Paths)

### Frontend Pages & Components
```
/home/vik/aiborg_CC/aiborg-learn-sphere/src/pages/FamilyMembershipPage.tsx
/home/vik/aiborg_CC/aiborg-learn-sphere/src/pages/FamilyMembershipEnrollment.tsx
/home/vik/aiborg_CC/aiborg-learn-sphere/src/components/membership/FamilyPassBanner.tsx
/home/vik/aiborg_CC/aiborg-learn-sphere/src/components/membership/ROISavingsCalculator.tsx
```

### Services & Hooks
```
/home/vik/aiborg_CC/aiborg-learn-sphere/src/services/membership/MembershipService.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/src/services/membership/FamilyMembersService.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/src/services/membership/VaultContentService.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/src/hooks/useMembership.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/src/hooks/useFamilyMembers.ts
```

### Database Migrations
```
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120000_membership_plans.sql
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120001_membership_subscriptions.sql
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120003_family_members.sql
```

### Stripe Integration
```
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/create-subscription/index.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/manage-subscription/index.ts
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/stripe-webhook-subscription/index.ts
```

---

## Documentation Structure

### FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md (27 KB)

Complete reference documentation with 14 sections:

1. **Project Structure & Technology Stack**
   - Frontend tech (React, Vite, Tailwind, React Query)
   - Backend tech (Supabase, Edge Functions, Stripe)
   - Directory structure

2. **Database Schema**
   - `membership_plans` table
   - `membership_subscriptions` table
   - `family_members` table
   - RLS policies
   - 10+ helper functions

3. **Helper Functions**
   - SQL RPC functions for subscriptions, family members, calculations

4. **Frontend Pages & Components**
   - Landing page (11 conversion sections)
   - 4-step checkout flow
   - Components (Calculator, Banner)

5. **Stripe Integration**
   - create-subscription function
   - manage-subscription function
   - stripe-webhook-subscription function
   - Configuration details

6. **Access Control & Security**
   - Authentication mechanisms
   - Authorization checks
   - RLS policies
   - Constraints

7. **Features Status**
   - Completed features
   - In-progress items
   - TODO items by priority

8. **Data Flow Diagrams**
   - Enrollment flow
   - Family member invitation flow
   - Subscription lifecycle

9. **API Endpoints & Hooks**
   - React Query hooks
   - Service methods

10. **Environment Configuration**
    - Required environment variables
    - Deployment URLs

11. **Known Issues**
    - Performance notes
    - TODO items
    - Security concerns
    - Future enhancements

12. **Deployment Checklist**
    - Pre-deployment tasks
    - Post-deployment monitoring
    - Optional enhancements

13. **Key Files Summary**
    - File purposes and line counts

14. **Contact & Notes**
    - Project owner
    - Last updated date

---

### MEMBERSHIP_QUICK_START.md (3.9 KB)

Quick reference guide for busy developers:

- Key URLs
- Files by developer role
- Implementation status (Phase 1/2/3)
- Database quick reference
- Stripe checklist
- Common tasks
- Performance notes
- Security checklist
- Deployment notes

---

## System Architecture Overview

```
Frontend (React)
    ↓
React Query Hooks (useMembership.ts)
    ↓
Service Layer (MembershipService.ts, FamilyMembersService.ts)
    ↓
Supabase Client (JavaScript)
    ↓
┌─────────────────────────────────────────────┐
│          Supabase Backend                   │
│  ┌───────────────────────────────────────┐  │
│  │  PostgreSQL Database                  │  │
│  │  - membership_plans                   │  │
│  │  - membership_subscriptions           │  │
│  │  - family_members                     │  │
│  │  - 10+ RPC functions                  │  │
│  └───────────────────────────────────────┘  │
│              ↓                               │
│  ┌───────────────────────────────────────┐  │
│  │  Edge Functions (Deno)                │  │
│  │  - create-subscription                │  │
│  │  - manage-subscription                │  │
│  │  - stripe-webhook-subscription        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│          Stripe API                         │
│  - Checkout Sessions                        │
│  - Subscriptions                            │
│  - Webhooks                                 │
│  - Customers                                │
└─────────────────────────────────────────────┘
```

---

## Current Implementation Status

**Phase 1: COMPLETE** (80%)
- Database schema with RLS
- Landing page (11 sections)
- 4-step checkout flow
- Stripe checkout integration
- Family member system
- Subscription management (pause/cancel/resume)
- React Query hooks

**Phase 2: IN PROGRESS** (20%)
- Email notifications (TODO)
- Membership dashboard (TODO)
- Admin portal (TODO)

**Phase 3: PLANNED**
- Recommendations engine
- Payment retry logic
- Advanced analytics

---

## Critical TODOs (By Priority)

### HIGH
1. Email notifications for family member invitations
2. Trial expiration reminders
3. Payment failure handling

### MEDIUM
4. Membership dashboard
5. Admin portal
6. Recommendations engine

### LOW
7. A/B testing framework
8. Invoice management
9. Accounting integration

---

## Environment Setup

### Required Environment Variables

**Frontend (.env.local)**:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=
```

**Supabase Edge Functions**:
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
```

---

## Testing the System

### Local Development
```bash
npm run dev
# Frontend runs on http://localhost:5173

# Test /family-membership (landing page)
# Test /family-membership/enroll (checkout flow)
```

### Stripe Testing
- Use Stripe test keys
- Use test card numbers from Stripe documentation
- Monitor webhook events in Stripe Dashboard

### Database Testing
- Use Supabase dev environment
- Check RLS policies are working
- Verify subscription creation flows

---

## Deployment

### Production URLs
- Frontend: https://aiborg-ai-web.vercel.app
- Database: aiborg Supabase project
- Stripe: Production account

### Deployment Process
1. Code changes pushed to GitHub main branch
2. GitHub Actions triggers Vercel deployment
3. Frontend rebuilds and deploys
4. Supabase Edge Functions auto-deployed

### Monitoring
- Monitor Stripe webhook logs
- Check edge function error logs
- Track subscription success rates
- Verify email delivery (once implemented)

---

## Support & Additional Resources

### Documentation
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [React Router Documentation](https://reactrouter.com/)

### Related Files in This Project
- `/src/App.tsx` - Main routing
- `/src/integrations/supabase/client.ts` - Supabase client setup
- `/.env.example` - Environment variable template
- `/vercel.json` - Vercel configuration

---

## Questions or Issues?

For questions about this system, refer to:
1. FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md (complete reference)
2. MEMBERSHIP_QUICK_START.md (quick answers)
3. Code comments in the respective files
4. Git commit history for context

Last Updated: October 17, 2025

---
