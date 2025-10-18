# Enterprise Features Specification
**Version:** 1.0
**Date:** October 16, 2025
**Status:** Planning Phase

---

## 📋 Executive Summary

This document outlines the comprehensive enterprise feature set for AIBORG Learn Sphere, enabling B2B/Enterprise sales with team management, bulk operations, advanced reporting, and organizational controls.

### Business Impact
- **Target Market:** B2B/Enterprise AI training (10x higher revenue vs B2C)
- **Customer Segments:** Companies with 10-1000+ employees needing AI upskilling
- **Revenue Model:** Seat-based pricing + premium features
- **Competitive Edge:** AI-powered team analytics, adaptive learning paths, SME assessments

---

## 🏗️ Current State Analysis

### ✅ What's Already Built

#### Database Layer
1. **Company Profiles** (`company_profiles` table)
   - Linked to individual company admin users
   - Company metadata (name, industry, size, website)
   - Auto-creation on signup
   - RLS policies in place

2. **Organizations** (`organizations` table)
   - Multi-member organizational units
   - Can have multiple companies per org
   - Owner-based access control

3. **Organization Members** (`organization_members` table)
   - Role-based access (member, manager, admin, owner)
   - Department tracking
   - Join date tracking

4. **Team Assessments** (`team_assessments` + `team_assessment_results`)
   - Team-level AI assessments
   - Individual + aggregate scoring
   - Completion tracking
   - Mandatory/optional assessments

#### Application Layer
1. **Company Admin Role**
   - Separate role in profiles table
   - Permission framework ready
   - Sign-up flow implemented

2. **Services**
   - `OrganizationService.ts` (basic CRUD)
   - Assessment linking to companies

3. **Auth Flow**
   - Company admin signup with metadata
   - Account type selection (Individual vs Company Admin)

### ⚠️ What's Missing (Needs to be Built)

1. **Team Management UI** - No interface to manage teams
2. **Course Assignments** - Can't assign courses to teams
3. **Team Reporting Dashboard** - No analytics for teams
4. **Billing & License Management** - No payment handling for teams
5. **Bulk Operations** - No CSV import/invite workflows
6. **Team Progress Tracking** - No visibility into team learning
7. **Custom Branding** - No org-specific customization
8. **API for Integrations** - No external system connectors

---

## 🎯 Feature Specifications

### Phase 1: Team Management Core (MVP)
**Estimated Effort:** 2-3 weeks
**Priority:** HIGH

#### 1.1 Team Dashboard
**User Story:** As a company admin, I want to see an overview of my organization's learning activities.

**UI Components:**
- Organization profile card
- Team size and active users
- Overall completion rate
- Top performing learners
- Recent activity feed
- Quick actions (Invite, Assign, Report)

**Database:** Uses existing `organizations`, `organization_members` tables

---

#### 1.2 Team Member Management
**User Story:** As a company admin, I want to invite, manage, and remove team members.

**Features:**
- **Invite via Email**
  - Single email invite
  - Custom welcome message
  - Role assignment (member, manager, admin)
  - Department assignment
  - Expiration (7 days)

- **Bulk Invite via CSV**
  - Upload CSV with columns: `email, first_name, last_name, role, department`
  - Validation and error reporting
  - Send batch invitations
  - Track invitation status

- **Member List View**
  - Searchable/filterable table
  - Sort by name, department, role, join date, activity
  - Bulk actions (remove, change role, assign courses)
  - Activity indicators (last active, courses enrolled, completed)

- **Member Detail View**
  - Profile information
  - Enrolled courses and progress
  - Assessment results
  - Activity timeline
  - Actions: Edit role, Remove, Send message

**New Database Tables:**
```sql
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'member',
    department TEXT,
    invited_by UUID REFERENCES auth.users(id),
    invite_token TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE team_invitation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES team_invitations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'sent', 'resent', 'accepted', 'expired', 'cancelled'
    performed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### 1.3 Course Assignments
**User Story:** As a company admin, I want to assign specific courses to team members with due dates.

**Features:**
- **Create Assignment**
  - Select course(s) from catalog
  - Choose assignees (individuals, departments, or entire team)
  - Set due date
  - Mark as mandatory/optional
  - Add instructions/context
  - Set completion notifications

- **Assignment List View**
  - Active assignments
  - Completed assignments
  - Overdue assignments
  - Filter by course, assignee, status
  - Progress indicators

- **Assignment Detail View**
  - Assignment metadata
  - Completion statistics
  - Individual progress table
  - Send reminders (bulk or individual)
  - Edit/delete assignment

**New Database Tables:**
```sql
CREATE TABLE team_course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    notify_before_days INTEGER DEFAULT 3, -- Send reminder 3 days before due
    auto_enroll BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_assignment_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES team_course_assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('assigned', 'started', 'completed', 'overdue')) DEFAULT 'assigned',
    enrolled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(assignment_id, user_id)
);

-- Trigger to auto-enroll users when assignment is created
CREATE OR REPLACE FUNCTION auto_enroll_assignment_users()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auto_enroll = true THEN
        -- Enroll all users from assignment_users into the course
        INSERT INTO enrollments (user_id, course_id, created_at)
        SELECT
            tau.user_id,
            tca.course_id,
            NOW()
        FROM team_assignment_users tau
        JOIN team_course_assignments tca ON tau.assignment_id = tca.id
        WHERE tau.assignment_id = NEW.id
        ON CONFLICT (user_id, course_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_enroll_assignment_users
    AFTER INSERT ON team_course_assignments
    FOR EACH ROW
    EXECUTE FUNCTION auto_enroll_assignment_users();
```

---

#### 1.4 Team Progress Dashboard
**User Story:** As a company admin, I want to see real-time progress of my team's learning activities.

**Metrics & Visualizations:**
- **Overview Cards**
  - Total team members
  - Active learners (last 7 days)
  - Courses in progress
  - Average completion rate
  - Total hours learned
  - Overdue assignments

- **Charts**
  - Completion rate trend (line chart)
  - Courses by status (pie chart)
  - Top performers (bar chart)
  - Department comparison (bar chart)
  - Learning activity heatmap (by day/week)

- **Tables**
  - Member progress summary
  - Course completion summary
  - Assessment results summary
  - Overdue assignments

**Database Views:**
```sql
-- View for team progress analytics
CREATE OR REPLACE VIEW team_progress_summary AS
SELECT
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT om.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN p.last_login > NOW() - INTERVAL '7 days' THEN om.user_id END) as active_members,
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END) as completed_enrollments,
    ROUND(AVG(CASE WHEN e.completed_at IS NOT NULL THEN 100 ELSE e.progress_percentage END), 2) as avg_completion_rate,
    COUNT(DISTINCT CASE WHEN tau.status = 'overdue' THEN tau.id END) as overdue_assignments
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN profiles p ON om.user_id = p.user_id
LEFT JOIN enrollments e ON om.user_id = e.user_id
LEFT JOIN team_assignment_users tau ON om.user_id = tau.user_id
GROUP BY o.id, o.name;
```

---

### Phase 2: Advanced Reporting (2-3 weeks)
**Priority:** HIGH

#### 2.1 Team Analytics Dashboard
**User Story:** As a company admin, I want detailed analytics and insights about my team's learning.

**Report Types:**

1. **Learning Progress Report**
   - Member-by-member breakdown
   - Course completion timeline
   - Time spent per course
   - Assessment scores
   - Skill acquisition tracking

2. **Skills Gap Analysis**
   - Current skills inventory (from assessments)
   - Target skills (from job roles or learning paths)
   - Gap identification
   - Recommended courses to fill gaps
   - Priority ranking

3. **Engagement Report**
   - Login frequency
   - Active learning hours
   - Content interaction (videos watched, quizzes taken)
   - Discussion participation
   - Peer collaboration metrics

4. **Compliance Report** (for mandatory training)
   - Completion status by user
   - Overdue trainings
   - Certification expiration dates
   - Audit trail
   - Export for compliance officers

5. **ROI Report**
   - Training investment (cost)
   - Skills acquired (value)
   - Productivity improvements (if tracked)
   - Course effectiveness ratings
   - Recommended optimizations

**Export Formats:**
- PDF (formatted reports with charts)
- Excel (raw data with pivot tables)
- CSV (simple data export)
- JSON (API integrations)

**New Database Tables:**
```sql
CREATE TABLE team_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_type TEXT CHECK (report_type IN ('progress', 'skills_gap', 'engagement', 'compliance', 'roi')) NOT NULL,
    report_name TEXT NOT NULL,
    parameters JSONB, -- Filters, date ranges, members selected
    generated_by UUID REFERENCES auth.users(id),
    file_url TEXT, -- S3/Supabase Storage URL
    status TEXT CHECK (status IN ('generating', 'completed', 'failed')) DEFAULT 'generating',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE team_learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Engagement metrics
    sessions_count INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    exercises_submitted INTEGER DEFAULT 0,

    -- Progress metrics
    courses_started INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,

    -- Performance metrics
    avg_quiz_score DECIMAL(5,2),
    avg_exercise_score DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id, date)
);

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION update_team_learning_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO team_learning_analytics (
        organization_id, user_id, date,
        sessions_count, total_time_minutes,
        videos_watched, quizzes_taken, exercises_submitted,
        courses_started, courses_completed, lessons_completed,
        avg_quiz_score, avg_exercise_score
    )
    SELECT
        om.organization_id,
        e.user_id,
        CURRENT_DATE,
        -- Add aggregation logic here based on your activity tracking
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    FROM enrollments e
    JOIN organization_members om ON e.user_id = om.user_id
    ON CONFLICT (organization_id, user_id, date)
    DO UPDATE SET
        -- Update fields
        sessions_count = EXCLUDED.sessions_count;
        -- ... other fields
END;
$$ LANGUAGE plpgsql;
```

---

#### 2.2 Custom Report Builder
**User Story:** As a company admin, I want to create custom reports with my chosen metrics and filters.

**Features:**
- Drag-and-drop report builder
- Choose metrics (completion rate, scores, time, etc.)
- Choose dimensions (user, course, department, time period)
- Apply filters (date range, departments, specific users, courses)
- Visualize (table, chart, graph)
- Schedule automated reports (daily, weekly, monthly)
- Email distribution lists

---

### Phase 3: Billing & License Management (2 weeks)
**Priority:** MEDIUM-HIGH

#### 3.1 Subscription Plans

**Plan Tiers:**
1. **Starter** (1-10 seats)
   - £50/seat/month
   - All courses included
   - Basic reporting
   - Email support

2. **Professional** (11-50 seats)
   - £40/seat/month
   - All Starter features
   - Advanced reporting
   - Custom branding
   - Priority support
   - API access

3. **Enterprise** (51+ seats)
   - £35/seat/month (volume discount)
   - All Professional features
   - SSO integration
   - Dedicated account manager
   - Custom integrations
   - SLA guarantee

**New Database Tables:**
```sql
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('starter', 'professional', 'enterprise')) NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')) NOT NULL,
    seats_purchased INTEGER NOT NULL,
    seats_used INTEGER DEFAULT 0,
    price_per_seat DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Stripe/Payment integration
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Subscription status
    status TEXT CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing', 'paused')) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id),
    invoice_number TEXT UNIQUE NOT NULL,

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Status
    status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')) DEFAULT 'open',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Payment info
    stripe_invoice_id TEXT,
    payment_method TEXT,

    -- URLs
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    active_seats INTEGER NOT NULL, -- Number of users who logged in
    total_seats INTEGER NOT NULL, -- Purchased seats
    new_members_added INTEGER DEFAULT 0,
    members_removed INTEGER DEFAULT 0,
    courses_assigned INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- Function to check seat availability
CREATE OR REPLACE FUNCTION check_seat_availability(p_organization_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_seats_purchased INTEGER;
    v_seats_used INTEGER;
BEGIN
    SELECT seats_purchased, seats_used INTO v_seats_purchased, v_seats_used
    FROM organization_subscriptions
    WHERE organization_id = p_organization_id
    AND status = 'active'
    LIMIT 1;

    IF v_seats_used < v_seats_purchased THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

#### 3.2 License Management UI
**Features:**
- View current subscription details
- See seats used vs purchased
- Add/remove seats
- Upgrade/downgrade plan
- View billing history
- Download invoices
- Update payment method
- Cancel subscription

---

### Phase 4: Advanced Features (3-4 weeks)
**Priority:** MEDIUM

#### 4.1 Custom Branding
- Upload organization logo
- Choose brand colors
- Custom domain (enterprise.aiborg.ai)
- White-label option (remove AIBORG branding)

#### 4.2 SSO Integration
- SAML 2.0 support
- Azure AD integration
- Okta integration
- Google Workspace SSO
- Auto-provision users

#### 4.3 Learning Paths for Teams
- Create custom learning paths
- Assign to departments/roles
- Sequential course unlocking
- Prerequisites handling
- Certification upon completion

#### 4.4 Discussion Forums (Team-only)
- Private team discussion boards
- Course-specific threads
- Announcements from admins
- @mentions and notifications

---

## 🚀 Implementation Roadmap

### Sprint 1: Foundation (Week 1)
**Goal:** Core team management functionality

**Tasks:**
1. Create new database tables for team invitations
2. Create new tables for course assignments
3. Build `TeamManagementService.ts`
4. Build `CourseAssignmentService.ts`
5. Create React hooks: `useTeamMembers`, `useCourseAssignments`
6. Unit tests for services

**Deliverables:**
- Database migrations
- Service layer complete
- Hooks ready
- Tests passing

---

### Sprint 2: Team Management UI (Week 2)
**Goal:** Invite, manage, and view team members

**Tasks:**
1. Create `TeamDashboard.tsx` page
2. Create `TeamMemberList.tsx` component
3. Create `InviteMemberDialog.tsx` component
4. Create `BulkInviteDialog.tsx` component (CSV upload)
5. Create `MemberDetailView.tsx` component
6. Add routes and navigation
7. Implement email invitation system (Supabase function)

**Deliverables:**
- Working team management UI
- Email invitations functional
- Bulk CSV import working

---

### Sprint 3: Course Assignments (Week 3)
**Goal:** Assign courses to team members

**Tasks:**
1. Create `CourseAssignmentList.tsx` component
2. Create `CreateAssignmentDialog.tsx` component
3. Create `AssignmentDetailView.tsx` component
4. Implement assignment notifications
5. Auto-enroll logic
6. Assignment status tracking
7. Reminder system (edge function)

**Deliverables:**
- Course assignment UI complete
- Auto-enrollment working
- Reminders sending

---

### Sprint 4: Team Progress Dashboard (Week 4)
**Goal:** Visualize team learning progress

**Tasks:**
1. Create database views for analytics
2. Create `TeamProgressDashboard.tsx` component
3. Implement charts (using recharts)
4. Create `MemberProgressTable.tsx` component
5. Create `CourseCompletionSummary.tsx` component
6. Real-time progress updates
7. Export progress report (PDF/Excel)

**Deliverables:**
- Visual dashboard complete
- Real-time metrics
- Export functionality

---

### Sprint 5: Advanced Reporting (Week 5-6)
**Goal:** Detailed analytics and reports

**Tasks:**
1. Create `team_reports` table
2. Create `team_learning_analytics` table
3. Build `ReportingService.ts`
4. Create `ReportsPage.tsx`
5. Implement report generators for each type
6. Build PDF export (using jsPDF)
7. Build Excel export (using SheetJS)
8. Schedule automated reports (edge function)

**Deliverables:**
- 5 report types implemented
- Export to PDF/Excel working
- Scheduled reports functional

---

### Sprint 6: Billing & Subscriptions (Week 7-8)
**Goal:** Monetization and license management

**Tasks:**
1. Create subscription tables
2. Stripe integration
3. Create `BillingService.ts`
4. Create `SubscriptionPage.tsx`
5. Implement plan selection and checkout
6. Seat management (add/remove)
7. Invoice generation
8. Webhook handling (Stripe events)

**Deliverables:**
- Subscription plans live
- Payment processing working
- Seat management functional
- Invoices generating

---

### Sprint 7: Polish & Launch Prep (Week 9)
**Goal:** Testing, documentation, and go-to-market

**Tasks:**
1. Comprehensive E2E tests
2. User acceptance testing
3. Documentation (user guides)
4. Sales collateral (pricing page, feature comparison)
5. Demo video
6. Beta launch with 5 pilot customers
7. Gather feedback and iterate

**Deliverables:**
- Production-ready system
- Documentation complete
- Beta customers onboarded

---

## 📊 Success Metrics

### Product Metrics
- **Team Size:** Average seats per organization (Target: 25+)
- **Engagement:** % of purchased seats active monthly (Target: 70%+)
- **Adoption:** % of orgs using assignments (Target: 80%+)
- **Retention:** Monthly churn rate (Target: <5%)
- **NPS:** Net Promoter Score (Target: 50+)

### Business Metrics
- **ARR:** Annual Recurring Revenue from enterprise (Target: £500K in year 1)
- **ACV:** Average Contract Value (Target: £15K/year)
- **CAC:** Customer Acquisition Cost (Target: <£5K)
- **LTV:CAC Ratio:** (Target: >3:1)
- **Expansion Revenue:** Seat upgrades (Target: 30% of revenue)

---

## 🎨 UI/UX Design Principles

### For Company Admins
1. **Dashboard-first:** Quick overview of team status
2. **Actionable insights:** Not just data, but recommendations
3. **Minimal clicks:** Common tasks in 2-3 clicks max
4. **Bulk operations:** Everything should work for 1 or 100 users
5. **Export everything:** Admins love Excel and PDF

### For Team Members
1. **Seamless experience:** Should not feel "corporate"
2. **Clear requirements:** What's mandatory vs optional
3. **Progress visibility:** Always know where they stand
4. **Social proof:** See team progress (if privacy allows)
5. **Recognition:** Celebrate completions and achievements

---

## 🔐 Security Considerations

1. **Data Isolation:** Strict RLS policies (org can only see own data)
2. **Role Permissions:** Proper RBAC for admin/manager/member
3. **Audit Logs:** Track all admin actions (invites, assignments, deletions)
4. **PII Protection:** Comply with GDPR for employee data
5. **SSO Security:** Proper SAML implementation, no shortcuts
6. **Payment Security:** PCI compliance via Stripe (never store CC)

---

## 🧪 Testing Strategy

### Unit Tests
- All service methods
- Business logic in hooks
- Utility functions

### Integration Tests
- Database operations
- Supabase RLS policies
- Email delivery
- Payment webhooks

### E2E Tests (Playwright)
- Complete invitation flow
- Course assignment workflow
- Report generation
- Subscription checkout

---

## 📚 Dependencies & Integrations

### Required Services
- **Stripe:** Payment processing and subscriptions
- **Resend/SendGrid:** Transactional emails (invitations, reminders)
- **Supabase Storage:** Report files (PDF/Excel)
- **Supabase Edge Functions:** Background jobs (reminders, analytics)

### Optional (Future)
- **Auth0/Okta:** SSO providers
- **Zapier/Make:** No-code integrations
- **Slack/Teams:** Notifications integration
- **Salesforce:** CRM integration

---

## 💰 Pricing Strategy

### Launch Pricing
- **Starter:** £50/seat/month (£40 annual)
- **Professional:** £40/seat/month (£32 annual)
- **Enterprise:** Custom pricing (min £35/seat/month)

### Add-ons
- **Custom Branding:** +£500/month
- **SSO Integration:** +£1,000/month
- **Premium Support:** +£2,000/month
- **Custom Integrations:** Quote-based

---

## 🎯 Go-to-Market Strategy

### Target Customers
1. **Tech Companies** (50-500 employees)
   - Need: AI upskilling for developers
   - Pain: Skills gap, rapid AI evolution
   - Budget: £50K-£200K/year

2. **Professional Services** (100-1000 employees)
   - Need: Client-facing AI capabilities
   - Pain: Competitive pressure, efficiency
   - Budget: £100K-£500K/year

3. **Enterprise** (1000+ employees)
   - Need: Organization-wide AI transformation
   - Pain: Change management, compliance
   - Budget: £500K+ /year

### Sales Motion
1. **Self-serve:** Starter plan (credit card, instant activation)
2. **Sales-assisted:** Professional (demo → trial → contract)
3. **Enterprise sales:** Enterprise (RFP → POC → negotiation)

### Marketing Channels
1. LinkedIn ads targeting L&D directors, CTOs
2. Content marketing (case studies, ROI calculators)
3. Partnerships with HR tech platforms
4. Referral program (10% discount for referrals)

---

## 📞 Support Strategy

### Tiered Support
- **Starter:** Email support (48hr SLA)
- **Professional:** Priority email + chat (24hr SLA)
- **Enterprise:** Dedicated account manager + phone (4hr SLA)

### Onboarding
- **Self-serve:** Video tutorials, documentation
- **Professional:** 1-hour onboarding call
- **Enterprise:** Dedicated onboarding program (2-4 weeks)

---

## ✅ Launch Checklist

### Technical
- [ ] All database migrations tested
- [ ] RLS policies validated
- [ ] Services fully tested
- [ ] UI components accessible
- [ ] Email templates designed
- [ ] Payment flow tested (test mode)
- [ ] Error monitoring setup (Sentry)
- [ ] Performance testing completed

### Business
- [ ] Pricing page live
- [ ] Legal terms updated (enterprise TOS)
- [ ] Privacy policy updated
- [ ] Sales deck created
- [ ] Demo video recorded
- [ ] Case study (if available)
- [ ] Support docs published

### Operations
- [ ] Support team trained
- [ ] Runbook for common issues
- [ ] Stripe webhooks monitored
- [ ] Backup and recovery tested
- [ ] Compliance review completed

---

## 🔮 Future Roadmap (6-12 months)

### Advanced Features
1. **AI-Powered Insights**
   - Predictive analytics (who will drop off?)
   - Personalized learning recommendations per user
   - Skills gap forecasting

2. **Mobile App for Team Members**
   - Native iOS/Android app
   - Offline learning
   - Push notifications

3. **Advanced Integrations**
   - Workday/BambooHR HRIS sync
   - Salesforce LMS connector
   - Slack bot for learning reminders
   - MS Teams app

4. **Certification & Compliance**
   - Industry certifications (ISO, GDPR, etc.)
   - Compliance tracking dashboards
   - Audit trail exports

5. **Marketplace**
   - Allow 3rd party course creators
   - Revenue sharing model
   - Curated enterprise content

---

## 📖 References & Resources

### Design Inspiration
- **LinkedIn Learning Admin:** Great team management UX
- **Coursera for Business:** Excellent reporting dashboards
- **Udemy Business:** Clean assignment workflows

### Technical References
- Supabase RLS patterns
- Stripe Subscriptions API
- React Query best practices
- Recharts documentation

---

**Next Step:** Review this specification, prioritize features, and begin Sprint 1 implementation!
