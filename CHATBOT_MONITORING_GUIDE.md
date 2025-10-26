# AI Chatbot Monitoring & Cost Optimization Guide

**Created:** 2025-10-26 **Version:** 1.0 **Status:** ✅ Ready for Implementation

---

## 📊 Overview

This guide documents the comprehensive monitoring and optimization system implemented for the AI
chatbot, including:

- **Real-time usage tracking** (tokens, costs, response times)
- **Cost monitoring dashboard** with alerts
- **Performance analytics** (P95, P99 latency tracking)
- **Error tracking** and fallback monitoring
- **Daily/weekly/monthly cost reports**

---

## 🗄️ Database Schema

### Tables Created

#### 1. `chatbot_conversations`

Tracks individual chat sessions.

**Key Fields:**

- `id` - UUID primary key
- `user_id` - Optional (for logged-in users)
- `session_id` - Client-generated session ID
- `audience` - Type: primary, secondary, professional, business
- `total_messages` - Message count in conversation
- `total_tokens` - Total tokens used
- `total_cost_usd` - Total cost of conversation
- `started_at`, `ended_at` - Timestamps

**Indexes:**

- User ID, Session ID, Started At, Audience

---

#### 2. `chatbot_messages`

Stores every message with detailed API metrics.

**Key Fields:**

- `conversation_id` - Links to conversation
- `role` - user, assistant, system
- `content` - Message text
- `model` - GPT model used
- `prompt_tokens`, `completion_tokens`, `total_tokens` - Token usage
- `response_time_ms` - API latency
- `cost_usd` - Message cost
- `is_error`, `is_fallback` - Error tracking
- `error_message` - Error details if failed

**Cost Calculation:**

```sql
-- GPT-4 Turbo: $0.01/1K prompt, $0.03/1K completion
cost_usd = (prompt_tokens / 1000) * 0.01 + (completion_tokens / 1000) * 0.03
```

---

#### 3. `chatbot_daily_stats`

Pre-aggregated daily statistics for fast reporting.

**Metrics Tracked:**

- Volume: conversations, messages, API calls
- Tokens: prompt, completion, total
- Costs: total, average per message
- Performance: avg, P95, P99 response times
- Errors: count, rate, fallback count
- Audience breakdown: messages per audience type

**Auto-updated via trigger** on every new message.

---

#### 4. `chatbot_cost_alerts`

Cost threshold alerts and notifications.

**Default Thresholds:**

- Daily: $10.00
- Weekly: $50.00
- Monthly: $200.00
- Threshold: $5.00 (immediate alert)

---

## 📈 Usage Tracking

### Edge Function Changes

The enhanced edge function (`ai-chat-with-analytics`) tracks:

1. **Response Time**

   ```typescript
   const startTime = Date.now();
   // ... API call ...
   const responseTimeMs = Date.now() - startTime;
   ```

2. **Cost Calculation**

   ```typescript
   const PRICING = {
     'gpt-4-turbo-preview': {
       prompt: 0.01 / 1000,
       completion: 0.03 / 1000,
     },
   };
   const costUsd =
     usage.prompt_tokens * pricing.prompt + usage.completion_tokens * pricing.completion;
   ```

3. **Database Logging**
   - Logs user message
   - Logs assistant response with metrics
   - Updates conversation totals
   - Tracks errors and fallbacks

---

## 💰 Cost Monitoring

### Current Pricing (GPT-4 Turbo)

| Token Type | Rate              | Example Cost             |
| ---------- | ----------------- | ------------------------ |
| Prompt     | $0.01 / 1K tokens | 300 tokens = $0.003      |
| Completion | $0.03 / 1K tokens | 150 tokens = $0.0045     |
| **Total**  | -                 | **450 tokens = $0.0075** |

### Estimated Monthly Costs

| Scenario  | Messages/Day | Avg Tokens | Daily Cost | Monthly Cost |
| --------- | ------------ | ---------- | ---------- | ------------ |
| Low       | 100          | 400        | $0.75      | $22.50       |
| Medium    | 500          | 400        | $3.75      | $112.50      |
| High      | 1,000        | 400        | $7.50      | $225.00      |
| Very High | 2,000        | 400        | $15.00     | $450.00      |

### Cost Optimization Strategies

1. **Use GPT-3.5 Turbo for Simple Queries**
   - 10-20x cheaper than GPT-4
   - Good for: greetings, simple questions, FAQs
   - Example: "Hello" → Use GPT-3.5 ($0.0001 vs $0.0075)

2. **Implement Response Caching**
   - Cache common questions/answers
   - 90% cost reduction for cached responses
   - TTL: 24 hours for course info

3. **Reduce Max Tokens**
   - Current: 500 tokens max
   - Consider: 300 tokens for concise responses
   - Savings: ~40% on completion costs

4. **Add Rate Limiting**
   - Limit: 10 messages per user per hour
   - Prevents abuse and runaway costs

---

## 📊 Analytics Queries

### Get Cost Summary

```sql
SELECT * FROM get_chatbot_cost_summary(
  p_start_date := CURRENT_DATE - INTERVAL '30 days',
  p_end_date := CURRENT_DATE
);
```

**Returns:**

- Total cost (USD)
- Total messages
- Total tokens
- Average cost per message
- Error rate (%)

---

### Daily Stats Query

```sql
SELECT
  date,
  total_cost_usd,
  total_messages,
  avg_response_time_ms,
  error_rate
FROM chatbot_daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

---

### Top Cost Days

```sql
SELECT
  date,
  total_cost_usd,
  total_messages,
  (total_cost_usd / total_messages) as cost_per_message
FROM chatbot_daily_stats
ORDER BY total_cost_usd DESC
LIMIT 10;
```

---

### Error Analysis

```sql
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) FILTER (WHERE is_error = TRUE) as errors,
  COUNT(*) FILTER (WHERE is_fallback = TRUE) as fallbacks,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE is_error = TRUE)::DECIMAL / COUNT(*) * 100, 2) as error_rate
FROM chatbot_messages
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;
```

---

### Audience Performance

```sql
SELECT
  audience,
  COUNT(*) as total_messages,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(response_time_ms) as avg_response_time
FROM chatbot_messages
WHERE role = 'assistant'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY audience
ORDER BY total_cost DESC;
```

---

## 🔔 Setting Up Cost Alerts

### OpenAI Dashboard

1. Go to https://platform.openai.com/account/billing/limits
2. Set up usage limits:
   - **Soft Limit:** $50/month (email notification)
   - **Hard Limit:** $100/month (API stops)

### Supabase Monitoring

Create a daily cron job to check costs:

```sql
-- Check if daily cost exceeds threshold
SELECT
  date,
  total_cost_usd,
  (SELECT threshold_usd FROM chatbot_cost_alerts WHERE alert_type = 'daily') as threshold
FROM chatbot_daily_stats
WHERE date = CURRENT_DATE
  AND total_cost_usd > (SELECT threshold_usd FROM chatbot_cost_alerts WHERE alert_type = 'daily' LIMIT 1);
```

**Send alert** if query returns results.

---

## 📱 Admin Dashboard (To Be Built)

### Recommended Components

#### 1. Cost Overview Card

- Today's spend
- This week's spend
- This month's spend
- Projected monthly cost
- Budget remaining (%)

#### 2. Usage Chart

- Line chart: Daily costs over time
- Bar chart: Messages per day
- Pie chart: Cost by audience type

#### 3. Performance Metrics

- Average response time
- P95 latency
- Error rate (%)
- Fallback rate (%)

#### 4. Recent Activity Table

- Last 50 messages
- Columns: Time, Audience, Tokens, Cost, Response Time
- Filter by: Date, Audience, Errors

#### 5. Cost Alerts Panel

- Current thresholds
- Alert status (triggered/ok)
- Edit thresholds button

---

## 🚀 Implementation Steps

### Phase 1: Database Setup ✅ DONE

- [x] Create migration file
- [x] Define tables and indexes
- [x] Create helper functions
- [x] Set up RLS policies
- [ ] Run migration on Supabase

### Phase 2: Edge Function Update

- [ ] Deploy enhanced edge function with analytics
- [ ] Test logging functionality
- [ ] Verify cost calculations
- [ ] Monitor for errors

### Phase 3: Admin Dashboard

- [ ] Create ChatbotAnalytics component
- [ ] Add to admin panel
- [ ] Build cost overview cards
- [ ] Add usage charts (recharts/visx)
- [ ] Create activity table

### Phase 4: Alerts & Monitoring

- [ ] Set up OpenAI billing alerts
- [ ] Create email notification function
- [ ] Set up daily cron job
- [ ] Test alert system

### Phase 5: Optimization

- [ ] Implement response caching
- [ ] Add GPT-3.5 fallback for simple queries
- [ ] Reduce max tokens to 300
- [ ] Add rate limiting

---

## 🔧 Configuration

### Environment Variables

Required in Supabase Edge Functions:

```bash
OPENAI_API_KEY=sk-...                    # OpenAI API key
SUPABASE_URL=https://....supabase.co     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Service role key (for logging)
```

### Cost Alert Thresholds

Edit in database:

```sql
UPDATE chatbot_cost_alerts
SET threshold_usd = 20.00
WHERE alert_type = 'daily';
```

---

## 📊 Sample Queries for Monitoring

### Real-Time Cost Today

```sql
SELECT
  COALESCE(SUM(cost_usd), 0) as cost_today,
  COUNT(*) as messages_today
FROM chatbot_messages
WHERE DATE(created_at) = CURRENT_DATE;
```

### Last Hour Activity

```sql
SELECT
  COUNT(*) as messages,
  SUM(total_tokens) as tokens,
  SUM(cost_usd) as cost,
  AVG(response_time_ms) as avg_response_time
FROM chatbot_messages
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND role = 'assistant';
```

### Most Expensive Conversations

```sql
SELECT
  c.id,
  c.session_id,
  c.audience,
  c.total_messages,
  c.total_tokens,
  c.total_cost_usd,
  c.started_at
FROM chatbot_conversations c
ORDER BY c.total_cost_usd DESC
LIMIT 20;
```

---

## 🎯 Success Metrics

### Target KPIs

- **Cost per message:** < $0.01
- **Response time (P95):** < 3 seconds
- **Error rate:** < 1%
- **Fallback rate:** < 5%
- **Monthly cost:** < $200

### Monitoring Dashboard

Check daily:

- [ ] Daily cost (should be < $7)
- [ ] Error count (should be < 10)
- [ ] Response time trends
- [ ] Unusual usage spikes

---

## 🛠️ Next Steps

1. **Run the migration:**

   ```bash
   # Via Supabase dashboard or CLI
   psql -h ... -d postgres -f supabase/migrations/20251026143000_create_chatbot_analytics.sql
   ```

2. **Deploy enhanced edge function:**

   ```bash
   npx supabase functions deploy ai-chat-with-analytics --project-ref afrulkxxzcmngbrdfuzj
   ```

3. **Update frontend to pass sessionId and conversationId**

4. **Build admin dashboard for visualization**

5. **Set up OpenAI billing alerts**

---

## 📚 Resources

- **OpenAI Pricing:** https://openai.com/pricing
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **GPT-4 Documentation:** https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4

---

**Status:** Ready for deployment **Estimated Setup Time:** 4-6 hours **Expected ROI:** 30-50% cost
reduction through optimization
