# Enterprise Features - Implementation Plan
**Start Date:** TBD
**Total Duration:** 9 weeks (3 phases)
**Team Size:** 1-2 developers

---

## 🎯 Overview

This plan breaks down enterprise feature development into 3 major phases with 9 sprints. Each sprint is 1 week with clear deliverables.

**Total Scope:**
- 15 new database tables
- 8 new service classes
- 12 new React pages/major components
- 50+ smaller components
- Stripe payment integration
- Email notification system
- Advanced reporting engine

---

## 📊 Phase Summary

| Phase | Focus | Duration | Priority | Business Impact |
|-------|-------|----------|----------|-----------------|
| **Phase 1** | Team Management Core | 4 weeks | 🔴 CRITICAL | Enable B2B sales |
| **Phase 2** | Advanced Reporting | 2 weeks | 🟠 HIGH | Increase contract value |
| **Phase 3** | Billing & Subscriptions | 3 weeks | 🟠 HIGH | Revenue generation |

---

## 🚀 PHASE 1: Team Management Core (4 weeks)

### Sprint 1: Database Foundation (Week 1)
**Goal:** Build database layer for team management

#### Tasks
1. **Create Migration: Team Invitations** (3 hours)
   - Table: `team_invitations`
   - Table: `team_invitation_history`
   - RLS policies
   - Indexes

2. **Create Migration: Course Assignments** (3 hours)
   - Table: `team_course_assignments`
   - Table: `team_assignment_users`
   - Triggers for auto-enrollment
   - RLS policies
   - Indexes

3. **Create Migration: Analytics Views** (2 hours)
   - View: `team_progress_summary`
   - View: `member_activity_summary`
   - Materialized views for performance

4. **Build TeamManagementService** (4 hours)
   ```typescript
   // src/services/team/TeamManagementService.ts
   - getOrganization()
   - updateOrganization()
   - getMembers()
   - inviteMember()
   - inviteMembersBulk()
   - acceptInvitation()
   - removeMember()
   - updateMemberRole()
   ```

5. **Build CourseAssignmentService** (4 hours)
   ```typescript
   // src/services/team/CourseAssignmentService.ts
   - createAssignment()
   - getAssignments()
   - getAssignmentDetails()
   - assignUsers()
   - updateAssignmentStatus()
   - deleteAssignment()
   - sendReminders()
   ```

6. **Build TeamAnalyticsService** (3 hours)
   ```typescript
   // src/services/team/TeamAnalyticsService.ts
   - getTeamProgress()
   - getMemberProgress()
   - getCourseCompletionStats()
   - getEngagementMetrics()
   ```

7. **Create React Hooks** (4 hours)
   ```typescript
   // src/hooks/useTeamManagement.ts
   // src/hooks/useCourseAssignments.ts
   // src/hooks/useTeamAnalytics.ts
   ```

8. **Write Unit Tests** (4 hours)
   - Service tests (90%+ coverage)
   - Hook tests

#### Deliverables
- ✅ 3 database migrations
- ✅ 3 service classes
- ✅ 3 React hooks
- ✅ Tests passing
- ✅ Documentation updated

**Estimated Time:** 27 hours (3-4 days)

---

### Sprint 2: Team Dashboard & Invitations (Week 2)
**Goal:** UI for viewing and inviting team members

#### Tasks

1. **Create Page: Team Dashboard** (4 hours)
   ```typescript
   // src/pages/TeamDashboard.tsx
   - Organization profile card
   - Key metrics cards (members, active, completion)
   - Quick actions (Invite, Assign, Report)
   - Recent activity feed
   ```

2. **Component: Team Member List** (5 hours)
   ```typescript
   // src/components/team/TeamMemberList.tsx
   - Searchable/filterable table
   - Sort by name, role, department, activity
   - Bulk selection
   - Action buttons (Edit, Remove)
   - Status indicators (active, inactive, invited)
   ```

3. **Component: Invite Member Dialog** (4 hours)
   ```typescript
   // src/components/team/InviteMemberDialog.tsx
   - Email input with validation
   - First/last name
   - Role selector
   - Department input
   - Custom message
   - Send invitation
   ```

4. **Component: Bulk Invite Dialog** (6 hours)
   ```typescript
   // src/components/team/BulkInviteDialog.tsx
   - CSV upload area (drag-drop)
   - CSV template download
   - Validation results table
   - Error display
   - Batch send
   ```

5. **Component: Member Detail Sheet** (4 hours)
   ```typescript
   // src/components/team/MemberDetailSheet.tsx
   - Profile information
   - Enrolled courses with progress
   - Assessment results
   - Activity timeline
   - Actions: Edit role, Remove, Assign courses
   ```

6. **Build Invitation Email Template** (2 hours)
   ```typescript
   // supabase/functions/send-team-invitation/index.ts
   - Beautiful HTML email
   - Invitation link with token
   - Company branding
   - CTA button
   ```

7. **Create Invitation Landing Page** (3 hours)
   ```typescript
   // src/pages/TeamInvitationAccept.tsx
   - Token validation
   - Accept invitation
   - Create account or sign in
   - Auto-join organization
   ```

8. **Add Navigation & Routes** (2 hours)
   - Add "Team" menu item (company admins only)
   - Configure routes
   - Route guards (company admin check)

#### Deliverables
- ✅ Team Dashboard page
- ✅ 5 major components
- ✅ Email invitation system
- ✅ Invitation acceptance flow
- ✅ CSV bulk import

**Estimated Time:** 30 hours (4 days)

---

### Sprint 3: Course Assignments (Week 3)
**Goal:** Assign courses to team members with due dates

#### Tasks

1. **Component: Assignment List** (4 hours)
   ```typescript
   // src/components/team/AssignmentList.tsx
   - Tabs: Active, Completed, Overdue
   - Assignment cards with progress
   - Filter/search
   - Create new assignment button
   ```

2. **Component: Create Assignment Dialog** (6 hours)
   ```typescript
   // src/components/team/CreateAssignmentDialog.tsx
   - Step 1: Select course(s)
   - Step 2: Select assignees (individuals, dept, all)
   - Step 3: Settings (due date, mandatory, instructions)
   - Step 4: Review & create
   - Auto-enroll checkbox
   ```

3. **Component: Assignment Detail View** (5 hours)
   ```typescript
   // src/components/team/AssignmentDetailView.tsx
   - Assignment metadata
   - Completion statistics (chart)
   - Member progress table
   - Actions: Edit, Delete, Send reminders
   - Status badges
   ```

4. **Build Assignment Notification System** (4 hours)
   ```typescript
   // supabase/functions/send-assignment-notification/index.ts
   - Email template for new assignment
   - Reminder email template (3 days before due)
   - Overdue email template
   ```

5. **Create Scheduled Job for Reminders** (3 hours)
   ```typescript
   // supabase/functions/process-assignment-reminders/index.ts
   - Run daily via cron
   - Find assignments with reminders due
   - Send batch emails
   - Update reminder_sent_at
   ```

6. **Component: Assignment Progress Charts** (4 hours)
   ```typescript
   // src/components/team/AssignmentProgressChart.tsx
   - Pie chart: Completed, In Progress, Not Started, Overdue
   - Bar chart: Progress by department
   - Timeline: Completion over time
   ```

7. **Add to Team Dashboard** (2 hours)
   - Active assignments card
   - Overdue count alert
   - Quick create assignment

#### Deliverables
- ✅ Assignment management UI
- ✅ Course assignment workflow
- ✅ Email notifications
- ✅ Automated reminders
- ✅ Progress visualization

**Estimated Time:** 28 hours (3-4 days)

---

### Sprint 4: Progress Dashboard & Analytics (Week 4)
**Goal:** Visualize team learning progress

#### Tasks

1. **Component: Team Progress Dashboard** (6 hours)
   ```typescript
   // src/components/team/TeamProgressDashboard.tsx
   - Overview metrics cards
   - Completion rate trend (line chart)
   - Courses by status (pie chart)
   - Top performers (bar chart)
   - Department comparison
   - Activity heatmap
   ```

2. **Component: Member Progress Table** (4 hours)
   ```typescript
   // src/components/team/MemberProgressTable.tsx
   - Columns: Name, Enrolled, Completed, In Progress, Avg Score
   - Sortable, filterable
   - Export to CSV
   - Click to see member detail
   ```

3. **Component: Course Completion Summary** (3 hours)
   ```typescript
   // src/components/team/CourseCompletionSummary.tsx
   - Table of courses with completion stats
   - Progress bars
   - Average time to complete
   - Top rated courses
   ```

4. **Build Progress Export Functionality** (5 hours)
   ```typescript
   // src/services/team/ProgressExportService.ts
   - Export to PDF (formatted report with charts)
   - Export to Excel (raw data)
   - Export to CSV (simple)
   - Include charts in PDF
   ```

5. **Create Real-time Progress Updates** (4 hours)
   - Supabase Realtime subscription
   - Update dashboard when enrollments change
   - Update when courses completed
   - Toast notifications for milestones

6. **Component: Learning Activity Feed** (3 hours)
   ```typescript
   // src/components/team/LearningActivityFeed.tsx
   - Recent completions
   - High scores
   - New enrollments
   - Achievements earned
   - Time-based (today, this week, this month)
   ```

7. **Add Date Range Picker** (2 hours)
   - Filter all metrics by date range
   - Presets: Last 7 days, Last 30 days, Last 90 days, Custom
   - Persist selection

#### Deliverables
- ✅ Visual progress dashboard
- ✅ Multiple chart types
- ✅ Export functionality (PDF/Excel/CSV)
- ✅ Real-time updates
- ✅ Activity feed

**Estimated Time:** 27 hours (3-4 days)

---

## 📊 PHASE 2: Advanced Reporting (2 weeks)

### Sprint 5: Report Infrastructure (Week 5)
**Goal:** Build foundation for advanced reporting

#### Tasks

1. **Create Migration: Reporting Tables** (3 hours)
   ```sql
   - team_reports table
   - team_learning_analytics table
   - report_schedules table
   ```

2. **Build ReportingService** (6 hours)
   ```typescript
   // src/services/team/ReportingService.ts
   - generateProgressReport()
   - generateSkillsGapReport()
   - generateEngagementReport()
   - generateComplianceReport()
   - generateROIReport()
   - scheduleReport()
   - exportReport(format: 'pdf' | 'excel' | 'csv')
   ```

3. **Create Analytics Aggregation Function** (5 hours)
   ```sql
   -- Function to aggregate daily team analytics
   -- Run via cron job daily
   - Sessions, time spent
   - Videos, quizzes, exercises
   - Completions
   - Average scores
   ```

4. **Build PDF Report Generator** (6 hours)
   ```typescript
   // src/services/team/PDFReportGenerator.ts
   - Use jsPDF
   - Professional template
   - Include company logo
   - Charts as images
   - Multi-page support
   - Table formatting
   ```

5. **Build Excel Report Generator** (4 hours)
   ```typescript
   // src/services/team/ExcelReportGenerator.ts
   - Use SheetJS (xlsx)
   - Multiple worksheets
   - Formatted tables
   - Charts (if possible)
   - Pivot tables
   ```

6. **Create Scheduled Reports Edge Function** (4 hours)
   ```typescript
   // supabase/functions/generate-scheduled-reports/index.ts
   - Run daily via cron
   - Find scheduled reports due
   - Generate report
   - Upload to Storage
   - Email report link
   ```

7. **Setup Supabase Storage Bucket** (1 hour)
   - Bucket: `team-reports`
   - RLS policies (org can access own reports)
   - File size limits
   - Retention policy (30 days)

#### Deliverables
- ✅ Report database tables
- ✅ ReportingService with 5 report types
- ✅ PDF generator
- ✅ Excel generator
- ✅ Scheduled reports system
- ✅ Storage configured

**Estimated Time:** 29 hours (4 days)

---

### Sprint 6: Reports UI & Custom Builder (Week 6)
**Goal:** UI for generating and viewing reports

#### Tasks

1. **Create Page: Reports** (5 hours)
   ```typescript
   // src/pages/TeamReports.tsx
   - Report library (past reports)
   - Quick report buttons (5 types)
   - Custom report builder
   - Scheduled reports list
   ```

2. **Component: Quick Report Generator** (4 hours)
   ```typescript
   // src/components/team/QuickReportGenerator.tsx
   - Select report type
   - Choose date range
   - Select members/departments (optional)
   - Generate button
   - Progress indicator
   - Download when ready
   ```

3. **Component: Custom Report Builder** (8 hours)
   ```typescript
   // src/components/team/CustomReportBuilder.tsx
   - Step 1: Choose metrics
   - Step 2: Choose dimensions
   - Step 3: Apply filters
   - Step 4: Choose visualization
   - Preview report
   - Save as template
   ```

4. **Component: Report Library** (4 hours)
   ```typescript
   // src/components/team/ReportLibrary.tsx
   - List of generated reports
   - Filter by type, date
   - Download button
   - Delete button
   - Re-generate button
   ```

5. **Component: Schedule Report Dialog** (3 hours)
   ```typescript
   // src/components/team/ScheduleReportDialog.tsx
   - Select report type/template
   - Choose frequency (daily, weekly, monthly)
   - Select recipients (emails)
   - Start date
   - Save schedule
   ```

6. **Build Skills Gap Report Logic** (4 hours)
   ```typescript
   - Analyze assessment results
   - Compare to target skills (from job roles or learning paths)
   - Calculate gaps
   - Recommend courses to fill gaps
   - Priority ranking
   ```

7. **Add Reports to Navigation** (1 hour)
   - "Reports" menu item
   - Notification badge (new reports)

#### Deliverables
- ✅ Reports page
- ✅ 5 quick report types working
- ✅ Custom report builder
- ✅ Scheduled reports
- ✅ Skills gap analysis

**Estimated Time:** 29 hours (4 days)

---

## 💳 PHASE 3: Billing & Subscriptions (3 weeks)

### Sprint 7: Stripe Integration & Subscription Backend (Week 7)
**Goal:** Payment processing infrastructure

#### Tasks

1. **Create Migration: Billing Tables** (3 hours)
   ```sql
   - organization_subscriptions
   - organization_invoices
   - organization_usage_logs
   - Functions: check_seat_availability()
   ```

2. **Setup Stripe Account** (2 hours)
   - Create products (Starter, Professional, Enterprise)
   - Create prices (monthly, annual)
   - Setup webhooks URL
   - Get API keys (test & live)

3. **Build BillingService** (6 hours)
   ```typescript
   // src/services/team/BillingService.ts
   - createSubscription()
   - updateSubscription()
   - cancelSubscription()
   - addSeats()
   - removeSeats()
   - getInvoices()
   - downloadInvoice()
   - updatePaymentMethod()
   ```

4. **Build Stripe Webhook Handler** (5 hours)
   ```typescript
   // supabase/functions/stripe-webhook/index.ts
   - Handle subscription.created
   - Handle subscription.updated
   - Handle subscription.deleted
   - Handle invoice.paid
   - Handle invoice.payment_failed
   - Update database accordingly
   ```

5. **Build Invoice Generator** (4 hours)
   ```typescript
   // src/services/team/InvoiceGenerator.ts
   - Generate invoice PDF
   - Include line items
   - Calculate tax
   - Apply discounts
   - Company branding
   ```

6. **Create Seat Management Logic** (4 hours)
   ```typescript
   - Check seat availability before adding member
   - Block if at capacity
   - Suggest upgrade
   - Auto-remove on subscription downgrade
   ```

7. **Build Usage Tracking** (3 hours)
   ```typescript
   // Track daily usage
   - Active seats (logged in last 30 days)
   - Total seats purchased
   - Usage percentage
   - Trends
   ```

#### Deliverables
- ✅ Billing database tables
- ✅ Stripe integration complete
- ✅ BillingService
- ✅ Webhook handler
- ✅ Invoice generation
- ✅ Seat management logic

**Estimated Time:** 27 hours (3-4 days)

---

### Sprint 8: Subscription & Billing UI (Week 8)
**Goal:** User-facing billing and subscription management

#### Tasks

1. **Create Page: Subscription** (5 hours)
   ```typescript
   // src/pages/TeamSubscription.tsx
   - Current plan card
   - Usage meter (seats used vs purchased)
   - Billing cycle
   - Next invoice preview
   - Actions: Upgrade, Add seats, Cancel
   ```

2. **Component: Plan Selection** (5 hours)
   ```typescript
   // src/components/team/PlanSelection.tsx
   - 3 plan cards (Starter, Professional, Enterprise)
   - Feature comparison
   - Price calculator (based on seats)
   - Monthly/Annual toggle
   - Select plan button
   ```

3. **Component: Checkout Flow** (6 hours)
   ```typescript
   // src/components/team/CheckoutFlow.tsx
   - Step 1: Plan confirmation
   - Step 2: Number of seats
   - Step 3: Billing info (Stripe Elements)
   - Step 4: Review & confirm
   - Success page
   ```

4. **Component: Manage Seats Dialog** (3 hours)
   ```typescript
   // src/components/team/ManageSeatsDialog.tsx
   - Current: X seats
   - Slider to add/remove seats
   - Price preview (prorated)
   - Confirm changes
   ```

5. **Component: Invoice History** (3 hours)
   ```typescript
   // src/components/team/InvoiceHistory.tsx
   - Table of past invoices
   - Status badges (paid, pending, failed)
   - Download PDF button
   - View hosted invoice link
   ```

6. **Component: Payment Method Card** (3 hours)
   ```typescript
   // src/components/team/PaymentMethodCard.tsx
   - Display card (masked)
   - Update payment method
   - Stripe card update flow
   ```

7. **Component: Cancel Subscription Dialog** (3 hours)
   ```typescript
   // src/components/team/CancelSubscriptionDialog.tsx
   - Reason dropdown
   - Feedback textarea
   - Offer discount to retain
   - Confirm cancellation
   - Specify when (end of period vs immediate)
   ```

8. **Add Billing to Navigation** (1 hour)
   - "Billing" menu item
   - Payment failed alert (if any)

#### Deliverables
- ✅ Subscription management page
- ✅ Plan selection & checkout
- ✅ Seat management
- ✅ Invoice history
- ✅ Payment method update
- ✅ Cancellation flow

**Estimated Time:** 29 hours (4 days)

---

### Sprint 9: Polish, Testing & Launch Prep (Week 9)
**Goal:** Production-ready enterprise features

#### Tasks

1. **Write E2E Tests** (8 hours)
   ```typescript
   // tests/e2e/team-management.spec.ts
   - Invite member flow
   - Accept invitation flow
   - Bulk CSV import
   - Create assignment
   - Generate report
   - Subscribe to plan
   - Add/remove seats
   ```

2. **Manual QA Testing** (4 hours)
   - Test all user flows
   - Cross-browser testing
   - Mobile responsiveness
   - Edge cases (errors, limits)
   - Create bug list

3. **Fix Critical Bugs** (8 hours)
   - Address bugs from QA
   - Performance issues
   - UI polish

4. **Write User Documentation** (6 hours)
   ```markdown
   - Admin Guide: Getting Started
   - How to Invite Team Members
   - How to Assign Courses
   - How to View Reports
   - Billing & Subscription Management
   - FAQ
   ```

5. **Create Demo Video** (4 hours)
   - 5-minute walkthrough
   - Show key features
   - Professional narration
   - Upload to YouTube

6. **Build Pricing Page** (4 hours)
   ```typescript
   // src/pages/Pricing.tsx
   - Plan comparison table
   - Feature checklist
   - ROI calculator
   - FAQ section
   - CTA buttons
   ```

7. **Create Sales Collateral** (3 hours)
   - One-pager (PDF)
   - Feature comparison sheet
   - Case study template
   - Email templates for outreach

8. **Setup Beta Program** (3 hours)
   - Identify 5 pilot customers
   - Create beta signup form
   - Offer 50% discount for 3 months
   - Setup feedback collection

#### Deliverables
- ✅ E2E tests passing
- ✅ All bugs fixed
- ✅ User documentation complete
- ✅ Demo video published
- ✅ Pricing page live
- ✅ Beta customers onboarded
- ✅ Production-ready!

**Estimated Time:** 40 hours (5 days)

---

## 📈 Effort Summary

| Phase | Duration | Estimated Hours | Days (8hr/day) |
|-------|----------|-----------------|----------------|
| Phase 1: Team Management | 4 weeks | 112 hours | 14 days |
| Phase 2: Advanced Reporting | 2 weeks | 58 hours | 7 days |
| Phase 3: Billing & Subscriptions | 3 weeks | 96 hours | 12 days |
| **TOTAL** | **9 weeks** | **266 hours** | **33 days** |

**With 1 developer:** 9 weeks (full-time)
**With 2 developers:** 5-6 weeks (parallel work)

---

## 🎯 Success Criteria

### Technical
- [ ] All E2E tests passing
- [ ] 90%+ unit test coverage on services
- [ ] No critical bugs
- [ ] Performance <2s page load
- [ ] Mobile responsive (100% features)

### Product
- [ ] 5 beta customers using successfully
- [ ] Avg 4/5 satisfaction score
- [ ] <10% support ticket rate
- [ ] 80%+ feature adoption (team invites, assignments)
- [ ] $10K ARR from beta customers

### Documentation
- [ ] Admin user guide complete
- [ ] API documentation published
- [ ] Sales deck ready
- [ ] Demo video published
- [ ] FAQ with 20+ questions

---

## 🚧 Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe integration issues | HIGH | MEDIUM | Start early, thorough testing |
| Complex reporting requirements | MEDIUM | HIGH | Start with simple reports, iterate |
| Performance with large teams | HIGH | MEDIUM | Optimize queries, add caching |
| Scope creep | MEDIUM | HIGH | Stick to MVP, defer enhancements |
| Beta customers give negative feedback | HIGH | LOW | User testing before beta launch |

---

## 🛠️ Tools & Technologies

### New Dependencies
```json
{
  "@stripe/stripe-js": "^2.1.0",
  "@stripe/react-stripe-js": "^2.3.0",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.6.0",
  "xlsx": "^0.18.5",
  "papaparse": "^5.4.1"
}
```

### Services
- **Stripe:** Payment processing
- **Resend/SendGrid:** Email delivery
- **Supabase Storage:** Report files
- **Supabase Edge Functions:** Background jobs

---

## 📞 Communication Plan

### Weekly Status Updates
- **Friday EOD:** Sprint review with stakeholders
- **Monday AM:** Sprint planning for upcoming week
- **Daily standups:** 15-min async updates (Slack)

### Demos
- **End of Phase 1:** Demo team management
- **End of Phase 2:** Demo reporting
- **End of Phase 3:** Full system demo

---

## ✅ Pre-Launch Checklist

### Technical Readiness
- [ ] All migrations run successfully (dev, staging, prod)
- [ ] RLS policies tested (no data leaks)
- [ ] Stripe webhooks working (test mode)
- [ ] Email delivery working (100% rate)
- [ ] Error monitoring configured (Sentry)
- [ ] Performance benchmarks met
- [ ] Security audit passed

### Business Readiness
- [ ] Pricing finalized
- [ ] Legal terms updated
- [ ] Privacy policy updated
- [ ] Refund policy defined
- [ ] Support team trained
- [ ] Sales team trained
- [ ] Marketing materials ready

### Launch
- [ ] Beta launch (5 customers, 2 weeks)
- [ ] Gather feedback
- [ ] Iterate on bugs/improvements
- [ ] Public launch announcement
- [ ] Monitor metrics daily (week 1)
- [ ] Weekly reviews (month 1)

---

**Next Action:** Review this plan, get approval, and kick off Sprint 1! 🚀

**Questions or need clarification?** Refer to the full specification in `ENTERPRISE_FEATURES_SPECIFICATION.md`.
