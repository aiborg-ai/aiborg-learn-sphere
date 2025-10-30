# API Rate Limiting & Quota Management

**Last Updated:** October 29, 2025 **Version:** 1.0 **Applies To:** AI Chatbot System

---

## Table of Contents

1. [Overview](#overview)
2. [OpenAI API Limits](#openai-api-limits)
3. [Supabase Edge Functions Limits](#supabase-edge-functions-limits)
4. [Current Implementation](#current-implementation)
5. [Recommended Rate Limits](#recommended-rate-limits)
6. [Implementation Guide](#implementation-guide)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Handling Rate Limit Errors](#handling-rate-limit-errors)
9. [Cost Controls](#cost-controls)
10. [Best Practices](#best-practices)

---

## Overview

Rate limiting is critical for:

- ✅ Preventing abuse and spam
- ✅ Controlling costs
- ✅ Ensuring fair usage
- ✅ Avoiding OpenAI API quota exhaustion
- ✅ Maintaining service quality for all users

### Current Status

**⚠️ WARNING:** Rate limiting is not fully implemented yet!

**What exists:**

- ✅ Input sanitization (message length limits)
- ✅ Cost tracking per message
- ✅ Cost alerts for daily/weekly/monthly spending
- ❌ No per-user message limits
- ❌ No IP-based rate limiting
- ❌ No request queuing

**Priority:** HIGH - Should be implemented before production deployment at scale.

---

## OpenAI API Limits

### Current Tier Limits (as of October 2025)

OpenAI enforces limits based on your usage tier:

| Tier   | Usage       | TPM (GPT-4) | TPM (GPT-3.5) | RPM    | Cost/Month |
| ------ | ----------- | ----------- | ------------- | ------ | ---------- |
| Free   | $0 spent    | 40,000      | 200,000       | 500    | $0         |
| Tier 1 | $5+ spent   | 90,000      | 2,000,000     | 3,500  | ~$100      |
| Tier 2 | $50+ spent  | 450,000     | 10,000,000    | 3,500  | ~$500      |
| Tier 3 | $100+ spent | 900,000     | 10,000,000    | 3,500  | ~$1,000    |
| Tier 4 | $250+ spent | 1,800,000   | 10,000,000    | 10,000 | ~$2,500    |

**TPM** = Tokens Per Minute **RPM** = Requests Per Minute

**Check your tier:** https://platform.openai.com/account/limits

### Understanding the Limits

**Tokens Per Minute (TPM):**

- Includes both prompt and completion tokens
- Shared across all requests in that minute
- Example: 10 requests × 1,000 tokens each = 10,000 TPM

**Requests Per Minute (RPM):**

- Maximum number of API calls per minute
- Independent of token count
- Rate limit: 429 error if exceeded

### Our Current Usage Pattern

Based on our implementation:

**Average Message:**

```
Prompt: ~500 tokens (system prompt + user message + context)
Completion: ~300 tokens (AI response)
Total: ~800 tokens per message
```

**At Tier 1 (90,000 TPM for GPT-4):**

```
Max messages per minute: 90,000 / 800 = ~112 messages/min
Max messages per hour: 112 × 60 = ~6,720 messages/hour
Max messages per day: 6,720 × 24 = ~161,000 messages/day
```

**At typical usage (1,000 messages/day):**

```
Usage: 1,000 / 161,000 = 0.6% of capacity ✅
Status: Well within limits
```

### OpenAI Error Codes

**429 - Rate Limit Exceeded:**

```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

**Retry-After header:**

```
Retry-After: 20  // Seconds to wait before retrying
```

---

## Supabase Edge Functions Limits

### Compute Limits

**Free Tier:**

- 500,000 invocations/month
- 100 GB-hours compute/month
- 1 GB memory per function
- 10-minute timeout

**Pro Tier ($25/month):**

- 2,000,000 invocations/month
- 1,000 GB-hours compute/month
- 1 GB memory per function
- 10-minute timeout

### Our Current Usage

**Per message:**

- Invocations: 1 (per user message)
- Duration: ~2-3 seconds
- Memory: ~50 MB

**Monthly estimates (1,000 messages/day):**

```
Invocations: 1,000 × 30 = 30,000/month ✅
Compute: 30,000 × 3s = 90,000s = 25 hours ✅
Status: Free tier sufficient
```

**At scale (10,000 messages/day):**

```
Invocations: 300,000/month ✅ (Free tier OK)
Compute: 250 hours ✅ (Free tier OK)
```

---

## Current Implementation

### Input Sanitization

**AIChatbot (ai-chat-with-analytics):**

```typescript
const maxMessageLength = 1000; // characters
const sanitizedMessages = messages.map((msg: any) => ({
  ...msg,
  content: typeof msg.content === 'string' ? msg.content.slice(0, maxMessageLength) : '',
}));
```

**AIStudyAssistant (ai-study-assistant):**

```typescript
const maxMessageLength = 2000; // characters (longer for study help)
const sanitizedMessages = messages.map((msg: any) => ({
  role: msg.role,
  content: typeof msg.content === 'string' ? msg.content.slice(0, 2000) : '',
}));
```

### Cost Tracking

**Automatic logging:**

```typescript
// After OpenAI API call
await supabase.from('chatbot_messages').insert({
  conversation_id: conversationId,
  role: 'assistant',
  content: aiResponse,
  model: model,
  prompt_tokens: usage.prompt_tokens,
  completion_tokens: usage.completion_tokens,
  total_tokens: usage.total_tokens,
  response_time_ms: responseTimeMs,
  cost_usd: costUsd,
  is_error: false,
  is_fallback: false,
});
```

### Cost Alerts

**Configured thresholds:**

```sql
INSERT INTO chatbot_cost_alerts (alert_type, threshold_usd)
VALUES
  ('daily', 10.00),    -- Alert if >$10/day
  ('weekly', 50.00),   -- Alert if >$50/week
  ('monthly', 200.00), -- Alert if >$200/month
  ('threshold', 5.00); -- Alert on single spike
```

---

## Recommended Rate Limits

### User-Level Limits

**Anonymous Users:**

```
- 5 messages per 5 minutes
- 20 messages per hour
- 50 messages per day
```

**Authenticated Users:**

```
- 10 messages per 5 minutes
- 50 messages per hour
- 200 messages per day
```

**Premium/Business Users:**

```
- 20 messages per 5 minutes
- 100 messages per hour
- Unlimited per day
```

### IP-Based Limits

**Prevent DDoS/spam:**

```
- 10 requests per minute per IP
- 100 requests per hour per IP
- Block after 3 violations
```

### Global Limits

**System-wide:**

```
- Max 1,000 concurrent conversations
- Max 100 messages/second across all users
- Emergency throttle at 80% OpenAI quota
```

---

## Implementation Guide

### Phase 1: Database Schema

**Create rate limit tracking table:**

```sql
-- Rate Limit Tracking
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id, IP, or session_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip', 'session')),
  endpoint TEXT NOT NULL, -- 'ai-chat' or 'ai-study-assistant'

  -- Counters
  count_1min INTEGER DEFAULT 0,
  count_5min INTEGER DEFAULT 0,
  count_1hour INTEGER DEFAULT 0,
  count_1day INTEGER DEFAULT 0,

  -- Timestamps
  window_1min_start TIMESTAMPTZ DEFAULT NOW(),
  window_5min_start TIMESTAMPTZ DEFAULT NOW(),
  window_1hour_start TIMESTAMPTZ DEFAULT NOW(),
  window_1day_start TIMESTAMPTZ DEFAULT NOW(),

  -- Violations
  violation_count INTEGER DEFAULT 0,
  last_violation TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(is_blocked) WHERE is_blocked = TRUE;

-- Auto-cleanup old entries (24 hours)
CREATE INDEX idx_rate_limits_cleanup ON rate_limits(updated_at)
  WHERE updated_at < NOW() - INTERVAL '24 hours';
```

### Phase 2: Edge Function Middleware

**Add to both edge functions:**

```typescript
// supabase/functions/ai-chat-with-analytics/rate-limit.ts
interface RateLimitConfig {
  messages_per_5min: number;
  messages_per_hour: number;
  messages_per_day: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  anonymous: {
    messages_per_5min: 5,
    messages_per_hour: 20,
    messages_per_day: 50,
  },
  authenticated: {
    messages_per_5min: 10,
    messages_per_hour: 50,
    messages_per_day: 200,
  },
  premium: {
    messages_per_5min: 20,
    messages_per_hour: 100,
    messages_per_day: 999999, // Unlimited
  },
};

async function checkRateLimit(
  supabase: any,
  identifier: string,
  identifierType: 'user' | 'ip' | 'session',
  userTier: 'anonymous' | 'authenticated' | 'premium'
): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
  const limits = RATE_LIMITS[userTier];

  // Get or create rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('identifier_type', identifierType)
    .single();

  let record = existing;
  const now = new Date();

  if (!record) {
    // Create new record
    const { data: newRecord } = await supabase
      .from('rate_limits')
      .insert({
        identifier,
        identifier_type: identifierType,
        endpoint: 'ai-chat',
        count_1min: 0,
        count_5min: 0,
        count_1hour: 0,
        count_1day: 0,
      })
      .select()
      .single();
    record = newRecord;
  }

  // Check if blocked
  if (record.is_blocked && record.blocked_until > now) {
    const retryAfter = Math.ceil((new Date(record.blocked_until).getTime() - now.getTime()) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: 'Blocked due to rate limit violations',
    };
  }

  // Reset windows if expired
  const updates: any = {};

  if (new Date(record.window_5min_start).getTime() + 5 * 60 * 1000 < now.getTime()) {
    updates.count_5min = 0;
    updates.window_5min_start = now;
  }

  if (new Date(record.window_1hour_start).getTime() + 60 * 60 * 1000 < now.getTime()) {
    updates.count_1hour = 0;
    updates.window_1hour_start = now;
  }

  if (new Date(record.window_1day_start).getTime() + 24 * 60 * 60 * 1000 < now.getTime()) {
    updates.count_1day = 0;
    updates.window_1day_start = now;
  }

  // Check limits
  const current5min = updates.count_5min ?? record.count_5min;
  const current1hour = updates.count_1hour ?? record.count_1hour;
  const current1day = updates.count_1day ?? record.count_1day;

  if (current5min >= limits.messages_per_5min) {
    await recordViolation(supabase, identifier);
    return {
      allowed: false,
      retryAfter: 300, // 5 minutes
      reason: 'Rate limit exceeded: 5 minute window',
    };
  }

  if (current1hour >= limits.messages_per_hour) {
    await recordViolation(supabase, identifier);
    return {
      allowed: false,
      retryAfter: 3600, // 1 hour
      reason: 'Rate limit exceeded: 1 hour window',
    };
  }

  if (current1day >= limits.messages_per_day) {
    await recordViolation(supabase, identifier);
    return {
      allowed: false,
      retryAfter: 86400, // 24 hours
      reason: 'Rate limit exceeded: daily limit',
    };
  }

  // Increment counters
  await supabase
    .from('rate_limits')
    .update({
      ...updates,
      count_5min: current5min + 1,
      count_1hour: current1hour + 1,
      count_1day: current1day + 1,
      updated_at: now,
    })
    .eq('identifier', identifier)
    .eq('identifier_type', identifierType);

  return { allowed: true };
}

async function recordViolation(supabase: any, identifier: string) {
  const { data } = await supabase
    .from('rate_limits')
    .select('violation_count')
    .eq('identifier', identifier)
    .single();

  const violations = (data?.violation_count || 0) + 1;

  // Block after 3 violations
  const shouldBlock = violations >= 3;
  const blockedUntil = shouldBlock
    ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    : null;

  await supabase
    .from('rate_limits')
    .update({
      violation_count: violations,
      last_violation: new Date(),
      is_blocked: shouldBlock,
      blocked_until: blockedUntil,
    })
    .eq('identifier', identifier);
}
```

### Phase 3: Integration

**In edge function handler:**

```typescript
serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, audience } = await req.json();

    // Determine identifier and tier
    const identifier = userId || req.headers.get('x-forwarded-for') || 'unknown';
    const identifierType = userId ? 'user' : 'ip';
    const userTier = userId ? 'authenticated' : 'anonymous';

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabase, identifier, identifierType, userTier);

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          reason: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '300',
          },
        }
      );
    }

    // Continue with normal flow...
    // ... existing code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

### Phase 4: Frontend Handling

**Update frontend components to handle 429 errors:**

```typescript
// src/components/features/AIChatbot.tsx
const generateAIResponse = async (userMessage: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-with-analytics', {
      body: {
        messages: [{ role: 'user', content: userMessage }],
        audience: selectedAudience,
        coursesData: coursesData,
        sessionId: currentConversation?.sessionId,
        conversationId: currentConversation?.id,
      },
    });

    if (error) {
      // Check for rate limit error
      if (error.status === 429 || error.message?.includes('Rate limit')) {
        const retryAfter = error.retryAfter || 300;
        setShowRateLimitMessage(true);
        setRateLimitRetryAfter(retryAfter);

        return `You've reached the message limit. Please wait ${Math.ceil(retryAfter / 60)} minutes before sending more messages. For urgent help, contact us on WhatsApp: +44 7404568207`;
      }

      throw error;
    }

    return data.response;
  } catch (error) {
    logger.error('Error generating AI response:', error);

    // Use fallback
    const fallback = generateFallbackResponse(
      userMessage,
      selectedAudience,
      getCourseRecommendations()
    );

    return fallback.message;
  }
};
```

---

## Monitoring & Alerts

### Dashboard Queries

**Check current rate limit violations:**

```sql
SELECT
  identifier,
  identifier_type,
  violation_count,
  is_blocked,
  blocked_until,
  count_1hour,
  count_1day
FROM rate_limits
WHERE violation_count > 0
  OR is_blocked = TRUE
ORDER BY violation_count DESC, updated_at DESC;
```

**Rate limit usage by tier:**

```sql
-- Requires user tier tracking
SELECT
  CASE
    WHEN identifier_type = 'user' THEN 'Authenticated'
    ELSE 'Anonymous'
  END as user_tier,
  COUNT(*) as users,
  AVG(count_1day) as avg_messages_per_day,
  MAX(count_1day) as max_messages_per_day,
  SUM(CASE WHEN violation_count > 0 THEN 1 ELSE 0 END) as users_with_violations
FROM rate_limits
WHERE updated_at >= CURRENT_DATE
GROUP BY identifier_type;
```

**Top users by volume:**

```sql
SELECT
  identifier,
  identifier_type,
  count_1day,
  violation_count,
  is_blocked
FROM rate_limits
WHERE updated_at >= CURRENT_DATE
ORDER BY count_1day DESC
LIMIT 20;
```

### Alerts Configuration

**Set up monitoring alerts:**

```sql
-- Alert if >10 users are blocked
-- Alert if >100 rate limit violations per day
-- Alert if anonymous:authenticated ratio > 5:1 (possible bot attack)
```

**Email/Slack notifications:**

```sql
-- Trigger function for critical violations
CREATE OR REPLACE FUNCTION notify_rate_limit_block()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_blocked = TRUE AND NEW.violation_count >= 5 THEN
    -- Send notification (integrate with notification system)
    PERFORM pg_notify('rate_limit_alert',
      json_build_object(
        'identifier', NEW.identifier,
        'violations', NEW.violation_count,
        'blocked_until', NEW.blocked_until
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rate_limit_block
  AFTER UPDATE ON rate_limits
  FOR EACH ROW
  WHEN (NEW.is_blocked = TRUE AND OLD.is_blocked = FALSE)
  EXECUTE FUNCTION notify_rate_limit_block();
```

---

## Handling Rate Limit Errors

### OpenAI 429 Errors

**Implement exponential backoff:**

```typescript
async function callOpenAIWithRetry(apiKey: string, payload: any, maxRetries = 3): Promise<any> {
  let retries = 0;
  let delay = 1000; // Start with 1 second

  while (retries < maxRetries) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limit hit
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;

        console.log(`Rate limit hit, retrying after ${waitTime}ms`);

        await new Promise(resolve => setTimeout(resolve, waitTime));

        retries++;
        delay *= 2; // Exponential backoff
        continue;
      }

      // Other error
      throw new Error(`OpenAI API error: ${response.status}`);
    } catch (error) {
      if (retries === maxRetries - 1) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
      delay *= 2;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### User Communication

**Clear error messages:**

```typescript
const rateLimitMessages = {
  '5min': 'You can send up to 5 messages every 5 minutes. Please wait a moment before trying again.',
  '1hour': 'You've reached the hourly message limit. Please wait before sending more messages, or sign in for higher limits.',
  '1day': 'Daily message limit reached. Please try again tomorrow, or contact us for assistance.',
};

// In UI
{showRateLimitMessage && (
  <Alert variant="warning">
    <AlertTitle>Message Limit Reached</AlertTitle>
    <AlertDescription>
      {rateLimitMessage}
      <br />
      <br />
      Need immediate help? <a href="https://wa.me/447404568207">Contact us on WhatsApp</a>
    </AlertDescription>
  </Alert>
)}
```

---

## Cost Controls

### Hard Limits

**Emergency stop switches:**

```sql
-- Global kill switch
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value)
VALUES ('chatbot_enabled', '{"enabled": true}'::jsonb);

-- In edge function
const { data: config } = await supabase
  .from('system_config')
  .select('value')
  .eq('key', 'chatbot_enabled')
  .single();

if (!config?.value?.enabled) {
  return new Response(
    JSON.stringify({
      error: 'Chatbot is temporarily unavailable for maintenance.'
    }),
    { status: 503 }
  );
}
```

### Budget-Based Throttling

**Slow down when budget 80% consumed:**

```typescript
async function shouldThrottle(supabase: any): Promise<boolean> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('chatbot_daily_stats')
    .select('total_cost_usd')
    .gte('date', monthStart.toISOString().split('T')[0]);

  const totalSpent = data?.reduce((sum, day) => sum + parseFloat(day.total_cost_usd), 0) || 0;
  const monthlyBudget = 200; // $200/month

  return totalSpent >= monthlyBudget * 0.8; // 80% threshold
}

// If throttling needed
if (await shouldThrottle(supabase)) {
  // Force GPT-3.5 only
  model = 'gpt-3.5-turbo';

  // Reduce max_tokens
  maxTokens = 300;

  // Add delay
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

---

## Best Practices

### Implementation Checklist

**Before Production:**

- [ ] Implement rate limiting tables
- [ ] Add rate limit middleware to edge functions
- [ ] Update frontend error handling
- [ ] Set up monitoring alerts
- [ ] Test with various user types
- [ ] Document rate limits in user-facing docs
- [ ] Train support team on rate limit issues

**Monitoring:**

- [ ] Daily: Check for blocked users
- [ ] Weekly: Review rate limit violations
- [ ] Monthly: Adjust limits based on usage patterns
- [ ] Quarterly: Review and update limits

### Performance Considerations

**Database Optimization:**

```sql
-- Regular cleanup of old rate limit records
DELETE FROM rate_limits
WHERE updated_at < NOW() - INTERVAL '7 days'
  AND is_blocked = FALSE;

-- Vacuum regularly
VACUUM ANALYZE rate_limits;
```

**Caching:**

```typescript
// Cache rate limit checks for 1 minute
const rateLimitCache = new Map<
  string,
  {
    allowed: boolean;
    expiresAt: number;
  }
>();

function getCachedRateLimit(identifier: string) {
  const cached = rateLimitCache.get(identifier);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.allowed;
  }
  return null;
}
```

### Security Considerations

**Prevent circumvention:**

- Use IP + User Agent + User ID for identifier
- Implement device fingerprinting
- Block VPN/proxy IPs if abused
- Monitor for rapid IP changes

**Whitelist:**

```sql
CREATE TABLE IF NOT EXISTS rate_limit_whitelist (
  identifier TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add internal testing accounts
INSERT INTO rate_limit_whitelist (identifier, reason)
VALUES
  ('admin@aiborg.ai', 'Admin testing'),
  ('test-user-1', 'QA testing');
```

---

## Testing

### Test Scenarios

**1. Anonymous User Hitting Limit:**

```bash
# Send 6 messages rapidly (limit is 5/5min)
for i in {1..6}; do
  curl -X POST https://[project].supabase.co/functions/v1/ai-chat-with-analytics \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"test"}],"audience":"default"}';
  echo "Request $i";
done

# Expected: First 5 succeed, 6th returns 429
```

**2. Authenticated User Higher Limit:**

```bash
# Send 11 messages (limit is 10/5min)
# Should allow more than anonymous
```

**3. Recovery After Block:**

```sql
-- Simulate block
UPDATE rate_limits
SET is_blocked = TRUE,
    blocked_until = NOW() + INTERVAL '5 minutes'
WHERE identifier = 'test-user';

-- Wait 5 minutes
-- Try again - should work
```

### Load Testing

**Recommended tools:**

- Artillery
- K6
- Apache JMeter

**Test plan:**

```yaml
# artillery-test.yml
config:
  target: 'https://[project].supabase.co'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users/sec
scenarios:
  - name: 'Chatbot messaging'
    flow:
      - post:
          url: '/functions/v1/ai-chat-with-analytics'
          json:
            messages:
              - role: 'user'
                content: 'Hello'
            audience: 'professional'
```

---

## Conclusion

### Summary

**Critical Actions:**

1. ✅ Implement rate limiting before scale
2. ✅ Monitor OpenAI quota usage
3. ✅ Set up cost alerts
4. ✅ Test thoroughly
5. ✅ Communicate limits to users

**Success Metrics:**

- Rate limit violations <1% of requests
- No unexpected API quota exhaustion
- Monthly costs within budget
- Fair usage for all users

**Next Steps:**

1. Review and approve rate limits
2. Implement Phase 1-4 from guide
3. Test in staging environment
4. Deploy to production
5. Monitor for 1 week
6. Adjust limits as needed

---

**Related Documentation:**

- Architecture: `CHATBOT_ARCHITECTURE.md`
- Maintenance: `CHATBOT_MAINTENANCE_GUIDE.md`

**External Resources:**

- OpenAI Rate Limits: https://platform.openai.com/docs/guides/rate-limits
- Supabase Limits: https://supabase.com/docs/guides/platform/limits
