# Admin Analytics Dashboard

## Overview

The Admin Analytics Dashboard provides comprehensive platform insights and business intelligence for administrators. It aggregates data across users, courses, revenue, engagement, and assessments to give a complete view of platform performance.

## Features

### 1. Platform Overview Metrics

Quick summary cards showing:
- **Total Users**: Total platform users with breakdown by role (Students, Instructors, Admins)
- **Total Revenue**: Revenue from all successful transactions
- **Active Users**: Active users in the last 30 days, 7 days, and today
- **Total Enrollments**: All course enrollments across the platform

### 2. Overview Tab

**User Growth Chart** (30 days)
- Line chart showing new users and active users over time
- Helps identify growth trends and user retention

**Engagement Overview**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Average session duration
- Content completion rate
- Assessment take rate
- Average courses per user

### 3. Users Tab

**User Distribution**
- Pie chart showing user distribution by role (Students, Instructors, Admins)
- Helps understand platform composition

**User Activity Trend**
- Line chart showing active users over time
- Identifies engagement patterns

### 4. Courses Tab

**Top Courses by Enrollment**
- Bar chart comparing enrollments vs completions for top 10 courses
- Identifies most popular courses

**Course Performance Table**
- Detailed table with:
  - Course name
  - Enrollment count
  - Completion rate
  - Average rating
  - Revenue generated
- Sortable and filterable data

### 5. Revenue Tab

**Revenue Trend** (30 days)
- Area chart showing daily revenue
- Helps identify revenue patterns and trends

**Revenue by Course**
- Bar chart showing top 10 revenue-generating courses
- Identifies most profitable courses

**Revenue Summary Cards**
- Total revenue
- Total transactions
- Success rate
- Average transaction value

### 6. Assessments Tab

**Assessment Performance Trend**
- Line chart showing average scores over time
- Tracks learning outcomes

**Assessment Types Distribution**
- Pie chart showing breakdown by assessment type (Adaptive vs Standard)

**Assessment Metrics Cards**
- Total assessments taken
- Completed assessments
- Completion rate
- Average score
- Average time spent

## Data Sources

The dashboard queries the following database tables:
- `profiles` - User information and roles
- `courses` - Course data
- `enrollments` - Enrollment and payment data
- `user_progress` - Learning progress and activity
- `reviews` - Course ratings
- `user_ai_assessments` - Assessment data

## Service Layer

### AdminAnalyticsService

Located at: `src/services/analytics/AdminAnalyticsService.ts`

**Methods:**
- `getPlatformMetrics()` - Get overall platform statistics
- `getUserGrowth(days)` - Get user growth data over time
- `getCourseAnalytics()` - Get course performance metrics
- `getRevenueMetrics(days)` - Get revenue analytics
- `getEngagementMetrics()` - Get user engagement data
- `getAssessmentAnalytics(days)` - Get assessment statistics

All methods return typed data structures for type safety.

## Component Architecture

### EnhancedAnalyticsDashboard
Location: `src/components/admin/EnhancedAnalyticsDashboard.tsx`

**Features:**
- Tab-based navigation
- Responsive charts using Recharts
- Real-time data refresh
- Export functionality (planned)
- Loading states
- Error handling

**Charts Used:**
- Area Charts - For trends and growth
- Bar Charts - For comparisons
- Pie Charts - For distribution
- Line Charts - For performance over time

## Usage

The dashboard is automatically integrated into the Admin Panel:

1. Navigate to `/admin`
2. Click on the "Analytics" tab
3. View comprehensive platform analytics

**Refresh Data:**
Click the "Refresh" button in the top-right to reload all analytics data.

**Export Report:**
Click "Export Report" to download analytics data (feature in development).

## Performance Considerations

- Data is fetched in parallel using `Promise.all()` for faster load times
- Queries are optimized with proper indexing
- Chart rendering is optimized using ResponsiveContainer
- Loading states prevent UI blocking

## Future Enhancements

1. **Date Range Filters**
   - Custom date range selector
   - Comparison with previous periods

2. **Export Functionality**
   - PDF report generation
   - CSV data export
   - Scheduled reports

3. **Real-time Updates**
   - WebSocket integration for live data
   - Auto-refresh intervals

4. **Advanced Filters**
   - Filter by course category
   - Filter by user role
   - Filter by revenue source

5. **Predictive Analytics**
   - Revenue forecasting
   - Churn prediction
   - Course recommendations

6. **Custom Dashboards**
   - Save custom views
   - Share dashboards
   - Role-based dashboards

## Troubleshooting

### Data Not Loading
- Check Supabase connection
- Verify user has admin role
- Check browser console for errors

### Slow Performance
- Reduce date range for queries
- Check database indexes
- Monitor Supabase usage limits

### Charts Not Rendering
- Ensure Recharts is installed: `npm install recharts`
- Check browser compatibility
- Verify data format matches chart expectations

## Related Documentation

- [Admin Panel Guide](./ADMIN_PANEL_GUIDE.md)
- [Analytics Service API](./ANALYTICS_API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
