# WebSocket Authentication Fix (#7)

## Overview

Fixed WebSocket authentication issues preventing Supabase Realtime features from working properly. This enables real-time updates for comments, reviews, and other interactive features.

## Problem

The application was experiencing WebSocket connection failures when trying to subscribe to real-time database changes:

1. **Missing Realtime Configuration**: Supabase client didn't have explicit realtime settings
2. **No Error Handling**: Subscription errors were not properly caught or logged
3. **Database Replication Not Enabled**: Tables weren't added to the realtime publication
4. **No Reconnection Logic**: Failed connections didn't automatically retry

## Solution

### 1. Updated Supabase Client Configuration

**File**: `src/integrations/supabase/client.ts`

Added explicit realtime configuration:

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'aiborg-learn-sphere',
    },
  },
});
```

### 2. Enhanced Subscription Error Handling

**Files**:
- `src/services/ReviewsDataService.ts`
- `src/components/blog/CommentSection.tsx`

Added comprehensive status tracking and error handling:

```typescript
.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    logger.log('✅ Subscription active');
  } else if (status === 'CHANNEL_ERROR') {
    logger.error('❌ Subscription error:', err);
  } else if (status === 'TIMED_OUT') {
    logger.error('⏱️ Subscription timed out');
  } else if (status === 'CLOSED') {
    logger.log('🔌 Subscription closed');
  }
});
```

### 3. Enabled Realtime Replication

**File**: `supabase/migrations/20251011000000_enable_realtime_replication.sql`

Added tables to the realtime publication:

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE blog_bookmarks;
```

### 4. Created Realtime Helper Utility

**File**: `src/utils/realtimeHelper.ts`

Built a reusable subscription manager with:
- Automatic reconnection with exponential backoff
- Connection status tracking
- Error handling
- TypeScript support

**Usage Example**:

```typescript
import { createRealtimeSubscription } from '@/utils/realtimeHelper';

const subscription = createRealtimeSubscription({
  channelName: 'my-reviews',
  table: 'reviews',
  filter: 'approved=eq.true',
  onData: (payload) => {
    console.log('Review changed:', payload);
  },
  onStatusChange: (status, error) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Connection error:', error);
    }
  },
  autoReconnect: true,
  maxReconnectAttempts: 5
});

subscription.subscribe();

// Later...
subscription.unsubscribe();
```

## Database Setup

To enable realtime features, run the migration:

```bash
# Using Supabase CLI
npx supabase db push

# Or manually in Supabase Dashboard SQL Editor
# Run the contents of: supabase/migrations/20251011000000_enable_realtime_replication.sql
```

## Verification

### Check Realtime Status

Use the provided SQL function to verify realtime is enabled:

```sql
SELECT check_realtime_enabled('reviews');
SELECT check_realtime_enabled('blog_comments');
```

Both should return `true`.

### Monitor Subscriptions

Check browser console for realtime logs:

```
✅ Subscription active: reviews-changes
🔔 Realtime event: reviews INSERT
```

### Test Real-Time Updates

1. **Blog Comments**:
   - Open a blog post in two browser tabs
   - Add a comment in one tab
   - See it appear instantly in the other tab

2. **Reviews**:
   - Admin approves a review in the admin panel
   - Review appears instantly on the homepage

## Features Enabled

### 1. Real-Time Blog Comments
- **Location**: Blog post pages
- **Functionality**: Comments appear instantly without refresh
- **Users Affected**: All blog readers

### 2. Real-Time Reviews
- **Location**: Homepage reviews section
- **Functionality**: New approved reviews appear automatically
- **Users Affected**: All visitors

### 3. Real-Time Likes & Bookmarks
- **Location**: Blog posts
- **Functionality**: Like counts update in real-time
- **Users Affected**: Authenticated users

## RLS Policies

All realtime-enabled tables have proper Row Level Security:

### Reviews Table
```sql
-- Public can view approved reviews
CREATE POLICY "Users can view approved reviews"
ON reviews FOR SELECT
USING (approved = true);

-- Users can create their own reviews
CREATE POLICY "Users can create their own reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Blog Comments Table
```sql
-- Public can view approved comments
CREATE POLICY "Public can view approved comments"
ON blog_comments FOR SELECT
USING (is_approved = true AND EXISTS (...));

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON blog_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

## Troubleshooting

### Subscriptions Not Working

1. **Check Browser Console**: Look for connection errors or timeout messages
2. **Verify Realtime Enabled**: Run the SQL check function
3. **Check RLS Policies**: Ensure user has SELECT permission on the table
4. **Network Issues**: Check for WebSocket blocking by firewall/proxy

### Connection Keeps Dropping

1. **Check Rate Limits**: Default is 10 events/second
2. **Increase Timeout**: Adjust realtime params in client config
3. **Review Logs**: Check for specific error messages

### Not Receiving Updates

1. **Verify Filter**: Ensure the subscription filter matches the data
2. **Check Permissions**: User must have SELECT access via RLS
3. **Table Not in Publication**: Run the realtime migration

## Performance Considerations

1. **Event Rate**: Limited to 10 events/second per channel
2. **Connection Pooling**: Channels are shared across tabs
3. **Cleanup**: Always unsubscribe when component unmounts
4. **Reconnection**: Exponential backoff prevents server overload

## Security Notes

- **Authentication**: Auth token automatically included in WebSocket handshake
- **RLS Enforced**: All database policies apply to realtime events
- **HTTPS Only**: WebSocket connections use secure WSS protocol
- **Rate Limited**: Prevents abuse of realtime connections

## Next Steps

To add realtime to other tables:

1. **Add to Publication**:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
   ```

2. **Create Subscription**:
   ```typescript
   const sub = createRealtimeSubscription({
     channelName: 'my-channel',
     table: 'your_table',
     onData: handleData
   });
   sub.subscribe();
   ```

3. **Add Cleanup**:
   ```typescript
   useEffect(() => {
     return () => sub.unsubscribe();
   }, []);
   ```

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Rate Limits](https://supabase.com/docs/guides/realtime/rate-limits)
- [RLS with Realtime](https://supabase.com/docs/guides/realtime/security)

## Related Issues

- Fixes #7 - WebSocket auth
- Improves UX for blog comments
- Enables real-time review updates
- Foundation for future collaborative features
