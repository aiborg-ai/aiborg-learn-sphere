# Adaptive Assessment Production Monitoring Guide

**Status:** ✅ Production Ready
**Last Updated:** 2025-10-09
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Monitoring Setup](#monitoring-setup)
3. [Key Metrics](#key-metrics)
4. [Dashboards](#dashboards)
5. [Alerts & Thresholds](#alerts--thresholds)
6. [SQL Queries](#sql-queries)
7. [Engagement Tracking](#engagement-tracking)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 📊 Overview

The Adaptive Assessment Monitoring System provides comprehensive visibility into user engagement, performance metrics, and system health for the adaptive assessment feature.

### What's Monitored

- **Engagement Metrics**: Completion rates, quick exits, return users
- **Performance Metrics**: Ability scores, confidence levels, question distribution
- **System Health**: Alert conditions, anomaly detection
- **Time-based Trends**: Daily, hourly, and weekly patterns
- **User Behavior**: Individual engagement levels, learning patterns

---

## 🛠️ Monitoring Setup

### Step 1: Database Migration

Run the engagement events table migration:

```bash
# Via Supabase SQL Editor
# Copy and paste: supabase/migrations/20251009000000_engagement_events.sql

# Or via psql
psql -h your-db-host -U postgres -d your-db \\
  -f supabase/migrations/20251009000000_engagement_events.sql
```

### Step 2: Integrate Monitoring Dashboard

Add the monitoring dashboard to the admin panel:

```typescript
// In src/pages/AdminRefactored.tsx
import { AdaptiveAssessmentMonitor } from '@/components/admin/AdaptiveAssessmentMonitor';

// Add new tab
<TabsContent value="adaptive-monitor">
  <AdaptiveAssessmentMonitor />
</TabsContent>
```

### Step 3: Enable Event Tracking

Events are automatically tracked by the engagement service. No additional setup required.

---

## 📈 Key Metrics

### 1. **Engagement Metrics**

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Completion Rate** | % of started assessments completed | >70% | <50% (critical) |
| **Quick Exit Rate** | % exiting in first 2 questions | <20% | >30% (critical) |
| **Engagement Score** | Composite engagement index (0-100) | >70 | <50 (warning) |
| **Return Rate** | % of users retaking assessment | >40% | <20% (info) |

### 2. **Performance Metrics**

| Metric | Description | Target | Notes |
|--------|-------------|--------|-------|
| **Avg Ability Score** | Mean theta across all assessments | 0.0 ± 0.5 | Centered at 0 |
| **Avg Confidence** | Mean confidence level (0-100%) | >70% | Based on SEM |
| **Avg Questions** | Mean questions per assessment | 8-12 | Adaptive range |
| **Avg Completion Time** | Mean minutes to complete | 8-15 min | Efficiency indicator |

### 3. **System Health Metrics**

| Metric | Description | Healthy Range |
|--------|-------------|---------------|
| **Total Assessments** | Cumulative count | Increasing trend |
| **Active Users (24h)** | Unique users in last day | >10 |
| **Error Rate** | Failed assessments | <5% |
| **Median Completion** | 50th percentile time | 8-12 min |

---

## 📊 Dashboards

### Admin Dashboard

Access: **Admin Panel → Adaptive Monitor Tab**

#### Overview Tab
- Key metrics cards (Completion Rate, Engagement Score, etc.)
- Ability distribution pie chart
- Assessment metrics summary

#### Trends Tab
- Daily completions vs abandons (line chart)
- Average ability score trend (line chart)
- 30-day historical data

#### Users Tab
- Top 50 users by activity
- Individual engagement levels
- Latest ability scores

#### Performance Tab
- Questions per assessment (bar chart)
- System health status
- Time-based metrics

### Real-time Alerts

Alerts appear at the top of the dashboard:

- **🔴 Critical**: Requires immediate attention
- **⚠️ Warning**: Monitor closely
- **ℹ️ Info**: Informational only

---

## 🚨 Alerts & Thresholds

### Critical Alerts

1. **Low Completion Rate (<50%)**
   - **Impact**: Users aren't finishing assessments
   - **Action**: Check question difficulty, UI/UX issues
   - **Query**: See [Completion Rate Analysis](#completion-rate)

2. **High Quick Exit Rate (>30%)**
   - **Impact**: Users leaving immediately
   - **Action**: Review first questions, check instructions
   - **Query**: See [Early Exit Analysis](#early-exit)

3. **System Error Rate (>5%)**
   - **Impact**: Technical issues affecting users
   - **Action**: Check logs, database connectivity
   - **Query**: See [Error Logs](#error-logs)

### Warning Alerts

1. **Completion Rate Below Target (50-70%)**
   - Monitor for trends
   - May need question pool expansion

2. **Low Confidence Levels (<60%)**
   - Assessment may need tuning
   - Consider adjusting stopping criterion

3. **Engagement Score Low (50-70)**
   - User engagement declining
   - Review user feedback

---

## 🔍 SQL Queries

### Quick Health Check

```sql
-- Run daily for health snapshot
SELECT
  COUNT(*) as total_assessments,
  COUNT(*) FILTER (WHERE is_complete = true) as completed,
  ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0), 3) as completion_rate,
  ROUND(AVG(questions_answered_count), 1) as avg_questions,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '24 hours';
```

### Completion Rate

```sql
-- Detailed completion analysis
SELECT
  DATE(started_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_complete = true) as completed,
  ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0), 3) as rate
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### Early Exit Analysis

```sql
-- Users leaving in first 2 questions
SELECT
  COUNT(*) as quick_exits,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM user_ai_assessments WHERE is_adaptive = true AND started_at >= NOW() - INTERVAL '24 hours'), 3) as quick_exit_rate
FROM user_ai_assessments
WHERE is_adaptive = true
  AND is_complete = false
  AND questions_answered_count <= 2
  AND started_at >= NOW() - INTERVAL '24 hours';
```

### Error Logs

```sql
-- Check for system errors
SELECT
  error_type,
  COUNT(*) as error_count,
  MAX(created_at) as last_occurrence
FROM system_logs
WHERE log_level = 'ERROR'
  AND source = 'adaptive_assessment'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY error_count DESC;
```

**Full Query Library**: See `scripts/ADAPTIVE_ASSESSMENT_MONITORING_QUERIES.sql`

---

## 📍 Engagement Tracking

### Automatic Event Tracking

The system automatically tracks:

- `assessment_started` - User begins assessment
- `assessment_completed` - User completes assessment
- `assessment_abandoned` - User exits without completing
- `question_answered` - User answers a question
- `early_exit` - User exits in first 2 questions

### Manual Event Tracking

```typescript
import { AdaptiveAssessmentEngagementService } from '@/services/analytics/AdaptiveAssessmentEngagementService';

// Track custom event
await AdaptiveAssessmentEngagementService.trackEvent(
  userId,
  'custom_event_type',
  {
    additionalData: 'value',
    timestamp: new Date().toISOString()
  }
);
```

### Viewing Events

```sql
-- User's recent events
SELECT * FROM engagement_events
WHERE user_id = '<user-id>'
ORDER BY created_at DESC
LIMIT 50;

-- Daily event summary
SELECT
  DATE(created_at) as date,
  event_type,
  COUNT(*) as count
FROM engagement_events
WHERE event_source = 'adaptive_assessment'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY date, event_type
ORDER BY date DESC, count DESC;
```

---

## 🔧 Troubleshooting

### Issue: Low Completion Rate

**Symptoms:**
- Completion rate <50%
- High abandonment

**Diagnosis:**
1. Check question difficulty distribution
2. Review average time per question
3. Analyze drop-off points

**Resolution:**
```sql
-- Find difficult questions
SELECT q.question_text, q.difficulty_level,
  AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) as success_rate
FROM assessment_questions q
JOIN assessment_answer_performance ap ON q.id = ap.question_id
GROUP BY q.id
HAVING AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) < 0.3
ORDER BY success_rate;
```

### Issue: High Quick Exit Rate

**Symptoms:**
- >30% users exit in first 2 questions
- Negative feedback

**Diagnosis:**
1. Review first question difficulty
2. Check UI clarity
3. Analyze user feedback

**Resolution:**
- Adjust initial question difficulty
- Improve instructions/onboarding
- A/B test different starting questions

### Issue: Low Confidence Levels

**Symptoms:**
- Average confidence <60%
- Most assessments reach max questions

**Diagnosis:**
1. Check question discrimination values
2. Review stopping threshold

**Resolution:**
```typescript
// In src/config/adaptiveAssessment.ts
export const ADAPTIVE_CONFIG = {
  STOPPING_SEM_THRESHOLD: 0.4,  // Increase from 0.3
  // ... other config
};
```

---

## ✅ Best Practices

### Daily Monitoring Routine

1. **Morning Check (5 min)**
   - Review dashboard alerts
   - Check 24h completion rate
   - Scan quick exit rate

2. **Weekly Review (15 min)**
   - Analyze 7-day trends
   - Review question performance
   - Check user engagement levels

3. **Monthly Deep Dive (30 min)**
   - Ability distribution analysis
   - Return user patterns
   - System optimization opportunities

### Alert Response SLA

| Alert Level | Response Time | Action Required |
|-------------|---------------|-----------------|
| Critical | 1 hour | Immediate investigation |
| Warning | 4 hours | Analysis and planning |
| Info | 24 hours | Documentation and tracking |

### Data Retention

- **Engagement Events**: 90 days
- **Assessment Data**: Indefinite
- **Performance Metrics**: 1 year
- **Log Files**: 30 days

### Performance Optimization

1. **Database Indexes**: Ensure all monitoring indexes exist
2. **Query Caching**: Use 5-minute cache for dashboard
3. **Batch Processing**: Aggregate metrics hourly
4. **Archival**: Move old data to analytics warehouse

---

## 📊 Reporting

### Weekly Report Template

```markdown
# Adaptive Assessment Weekly Report

**Period:** [Start Date] - [End Date]

## Key Metrics
- Total Assessments: [X]
- Completion Rate: [X%]
- Engagement Score: [X]
- Avg Ability: [X]

## Highlights
- 📈 [Positive trend]
- 📉 [Area for improvement]
- 💡 [Insight or recommendation]

## Actions Taken
1. [Action 1]
2. [Action 2]

## Next Steps
- [ ] [Planned improvement]
- [ ] [Follow-up item]
```

### Monthly Executive Summary

- Trend analysis (MoM growth)
- User engagement insights
- System health status
- Recommendations for improvement

---

## 🔗 Resources

### Documentation
- [Adaptive Assessment Implementation](./docs/ADAPTIVE_ASSESSMENT_IMPLEMENTATION.md)
- [Feature Flags](./docs/FEATURE_FLAGS.md)
- [SQL Query Library](./scripts/ADAPTIVE_ASSESSMENT_MONITORING_QUERIES.sql)

### Tools
- **Admin Dashboard**: `/admin` → Adaptive Monitor tab
- **Supabase Dashboard**: Database logs and metrics
- **Vercel Analytics**: Performance monitoring

### Support
- **Technical Issues**: Check Supabase logs
- **User Feedback**: Review engagement events
- **Performance**: Run diagnostic queries

---

## 🎯 Success Metrics

### Goals

| Metric | Q4 2025 Target | Current |
|--------|---------------|---------|
| Completion Rate | >75% | [TBD] |
| Engagement Score | >75 | [TBD] |
| Quick Exit Rate | <15% | [TBD] |
| Return Rate | >50% | [TBD] |
| Avg Completion Time | 10-12 min | [TBD] |

### KPIs

1. **User Satisfaction**: >4.5/5 rating
2. **Assessment Efficiency**: <12 min average
3. **Accuracy**: 90% confidence level
4. **Adoption**: 80% of users try adaptive mode

---

## 📝 Changelog

### Version 1.0.0 (2025-10-09)
- ✅ Initial monitoring system deployment
- ✅ Engagement tracking service
- ✅ Admin dashboard component
- ✅ SQL query library
- ✅ Alert system
- ✅ Documentation

---

## 👥 Team

- **Product Owner**: [Name]
- **Tech Lead**: [Name]
- **Data Analyst**: [Name]
- **DevOps**: [Name]

**For questions or issues, contact: [support-email]**

---

**Last Review:** 2025-10-09
**Next Review:** 2025-10-16
**Status:** ✅ Active Monitoring
