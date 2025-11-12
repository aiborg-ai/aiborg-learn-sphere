# Quick Start: Enhanced Chatbot Analytics

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration

```bash
cd aiborg-learn-sphere
npx supabase db push
```

### Step 2: Restart Development Server

```bash
npm run dev
```

### Step 3: Navigate to Analytics

Go to: `http://localhost:5173/admin/chatbot-analytics`

---

## 📊 Dashboard Overview

### 8 Tabs Available:

#### 1. **Overview** (Existing)

- Daily cost charts
- 30-day summary statistics
- Token usage trends

#### 2. **🕐 Sessions** (NEW)

See chatbot conversation sessions:

- How many sessions per day
- Average session duration
- Device breakdown (Desktop/Mobile/Tablet)
- Messages per session

**Example Data:**

```
Today: 45 sessions
Avg Duration: 12 minutes
Avg Messages: 8.5 per session
Device Split: 60% Desktop, 30% Mobile, 10% Tablet
```

#### 3. **🏷️ Topics** (NEW)

See what users are talking about:

- 7 auto-categorized topics
- Most popular topics
- Average response time per topic
- User ratings per topic

**Pre-configured Topics:**

1. Course Help
2. Technical Support
3. Account & Enrollment
4. Assessments & Grades
5. Learning Paths
6. Certificates
7. General Inquiry

#### 4. **😊 Sentiment** (NEW)

Track conversation mood:

- Positive vs. Negative messages
- Daily sentiment trends
- Average sentiment scores

**Sentiment Scale:**

- +1.0 = Very Positive
- 0.0 = Neutral
- -1.0 = Very Negative

#### 5. **⭐ Feedback** (NEW)

User satisfaction ratings:

- 1-5 star ratings
- Feedback types:
  - ✅ Helpful
  - 💯 Perfect
  - ⚠️ Incomplete
  - ❌ Incorrect
  - 👎 Not Helpful
- Daily rating trends

#### 6. **Messages** (Existing)

- Recent chatbot messages
- User vs Assistant messages
- Token and cost tracking

#### 7. **Audience** (Existing)

- Usage by audience type
- Cost breakdown

#### 8. **Errors** (Existing)

- Error and fallback tracking
- 7-day error statistics

---

## 🎨 What You'll See

### KPI Cards (Top of Each Tab):

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Sessions  │ Avg Msg/Session │ Total Messages  │
│      1,234      │      8.5        │     10,489      │
│  Last 30 days   │  Per convo      │   All sessions  │
└─────────────────┴─────────────────┴─────────────────┘
```

### Daily Breakdowns:

```
2025-11-11  ▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️  145 sessions  15m avg
  💻 87  📱 45  📲 13

2025-11-10  ▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️  98 sessions  12m avg
  💻 60  📱 30  📲 8
```

### Topic Distribution:

```
🟢 Course Help           245 messages ████████████ 60%
🔴 Technical Support      89 messages ████ 22%
🔵 Account & Enrollment   45 messages ██ 11%
🟡 Assessments & Grades   30 messages █ 7%
```

### Sentiment Trends:

```
2025-11-11  😊 120  😐 45  ☹️ 10  Avg: +0.65
  ████████████░░░░  (68% positive)

2025-11-10  😊 98   😐 56  ☹️ 8   Avg: +0.58
  ██████████░░░░░░  (60% positive)
```

### Feedback Ratings:

```
2025-11-11  ⭐ 4.2/5
  ✅ 45  💯 12  ⚠️ 5  ❌ 2  👎 1
  █████████░ (70% positive)
```

---

## 🎯 Key Features

### Automatic Categorization

Messages are automatically categorized based on keywords:

- "course material" → Course Help
- "error", "bug" → Technical Support
- "login", "password" → Account & Enrollment
- "assignment", "quiz" → Assessments & Grades

### Sentiment Analysis

Basic keyword-based sentiment:

- Positive words: good, great, excellent, thanks, helpful
- Negative words: bad, poor, terrible, useless, error

### Session Tracking

Automatically tracks:

- Session start/end times
- Message count
- Token usage
- Total cost
- Device type

### User Feedback

Users can rate chatbot responses:

- 1-5 star ratings
- Feedback types (helpful, incorrect, etc.)
- Optional comments

---

## 🔍 Common Use Cases

### Use Case 1: Monitor Costs

1. Go to **Overview** tab
2. Check daily cost trends
3. See total spend for last 30 days

### Use Case 2: Identify Popular Topics

1. Go to **Topics** tab
2. See which topics have most messages
3. Review average ratings per topic
4. Create better content for low-rated topics

### Use Case 3: Check User Satisfaction

1. Go to **Feedback** tab
2. See average rating (out of 5 stars)
3. Review daily trends
4. Check feedback types distribution

### Use Case 4: Analyze Session Patterns

1. Go to **Sessions** tab
2. See peak usage days
3. Check average session duration
4. Review device breakdown

### Use Case 5: Track Sentiment

1. Go to **Sentiment** tab
2. Monitor positive/negative ratios
3. Check for negative trend spikes
4. Investigate causes of low sentiment

---

## 📱 Device Type Detection

Sessions automatically detect device type:

- **Desktop:** Browser on computer (💻)
- **Mobile:** Phone browser (📱)
- **Tablet:** Tablet browser (📲)

Based on user agent string.

---

## 🎨 Color Coding

### Sentiment:

- 🟢 Green = Positive (>0.5)
- ⚪ Gray = Neutral (-0.5 to 0.5)
- 🔴 Red = Negative (<-0.5)

### Feedback:

- 🟢 Green = Helpful, Perfect (ratings 4-5)
- 🟡 Yellow = Neutral (rating 3)
- 🔴 Red = Not Helpful, Incorrect (ratings 1-2)

### Topics:

Each topic has unique color (configurable in database)

---

## 🔧 Admin Functions

### Add Custom Topics:

Currently requires database access:

```sql
INSERT INTO chatbot_topics (name, description, keywords, color)
VALUES (
  'Billing Questions',
  'Payment and subscription inquiries',
  ARRAY['payment', 'billing', 'subscription', 'invoice'],
  '#ff6b6b'
);
```

### Adjust Session Timeout:

Default: 30 minutes Change in database function: `close_inactive_sessions()`

### Configure Sentiment Keywords:

Located in: `src/services/EnhancedChatbotAnalyticsService.ts` Method: `analyzeSentiment()`

---

## 📊 Export Data

### CSV Export (Existing):

Click "Export" button on Overview tab Downloads: `chatbot-analytics-YYYY-MM-DD.csv`

Includes:

- Date
- Total cost
- Total messages
- Total tokens
- Error rate

---

## 🐛 Troubleshooting

### "No data available" messages?

**Cause:** No chatbot usage yet **Solution:** Wait for users to interact with chatbot

### Empty Sessions tab?

**Cause:** Migration not applied **Solution:** Run `npx supabase db push`

### Topics not showing?

**Cause:** Messages not categorized **Solution:** Topics auto-categorize on new messages

### Sentiment always neutral?

**Cause:** Basic keyword matching **Solution:** Normal - basic sentiment is approximate

---

## 🎓 Understanding the Data

### What is a "Session"?

A continuous conversation between user and chatbot:

- Starts: First message
- Ends: 30 minutes of inactivity OR manual close
- Tracks: Duration, messages, tokens, cost

### What is "Sentiment Score"?

A number from -1 to 1:

- **+0.8 to +1.0:** Very positive
- **+0.2 to +0.8:** Somewhat positive
- **-0.2 to +0.2:** Neutral
- **-0.8 to -0.2:** Somewhat negative
- **-1.0 to -0.8:** Very negative

### What are "Feedback Types"?

User classifications of chatbot responses:

- **Helpful:** Response helped solve problem
- **Perfect:** Exactly what user needed
- **Incomplete:** Response missing information
- **Incorrect:** Response was wrong
- **Not Helpful:** Response didn't help

---

## 📈 Best Practices

### Daily Monitoring:

1. Check **Overview** for cost trends
2. Review **Feedback** for satisfaction
3. Monitor **Errors** for issues

### Weekly Analysis:

1. Review **Topics** for popular questions
2. Check **Sentiment** trends
3. Analyze **Sessions** for usage patterns

### Monthly Review:

1. Compare costs month-over-month
2. Identify topic trends
3. Review overall satisfaction ratings
4. Plan content improvements

---

## 🚦 Status Indicators

### Green (Good):

- High star ratings (4-5)
- Positive sentiment
- Helpful feedback
- Low error rates

### Yellow (Attention):

- Neutral ratings (3 stars)
- Mixed sentiment
- Some incomplete responses

### Red (Action Needed):

- Low ratings (1-2)
- Negative sentiment
- Many "not helpful" responses
- High error rates

---

## 🔒 Security & Privacy

### Data Access:

- **Students:** See only their own data
- **Instructors:** See organization data
- **Admins:** See all data

### RLS Policies:

All tables have Row Level Security:

- Users can't access other users' data
- Sessions tied to user accounts
- Feedback linked to submitter

---

## 📞 Need Help?

### Common Questions:

**Q: How do I add more topics?** A: Currently requires SQL. Future: Admin UI

**Q: Can I export all analytics?** A: Phase 3 will add comprehensive export

**Q: Can I see real-time updates?** A: Phase 5 will add auto-refresh

**Q: Can I filter by date range?** A: Phase 4 will add date filters

**Q: Can I get predicted insights?** A: Phase 6 will add predictive analytics

---

**Ready to explore?** Navigate to `/admin/chatbot-analytics` and start monitoring!

Last Updated: 2025-11-11
