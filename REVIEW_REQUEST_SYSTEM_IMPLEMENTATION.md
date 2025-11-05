# Post-Session Review Request System - Implementation Guide

## Overview

This document outlines the implementation of a comprehensive review request system where admins can
send review requests to session participants, with messages appearing as notifications on user
login.

## ✅ Completed Implementation

### 1. Database Foundation (COMPLETE)

**File**: `supabase/migrations/20251104075236_add_review_request_system.sql`

**What it includes**:

- Extended `notifications` table to include 'review_request' type
- Created `review_requests` table with full tracking capabilities
- Added review request counters to all three session types (workshop, free_session, classroom)
- Implemented Row Level Security (RLS) policies
- Created triggers for automatic count updates
- Enabled Supabase Realtime for live updates
- Created `review_request_stats` view for analytics
- Added helper function `get_user_pending_review_requests()`

**Key Features**:

- Tracks status: pending, completed, dismissed
- Links to notifications and reviews
- Supports reminder counts and timestamps
- Automatic session count updates
- Performance-optimized indexes

### 2. TypeScript Types (COMPLETE)

**File**: `src/types/reviewRequest.ts`

**Interfaces Defined**:

- `ReviewRequest` - Main database record
- `SessionParticipant` - Participant info with review status
- `SessionWithReviewInfo` - Extended session data for admin
- `ReviewRequestStats` - Analytics data
- `SendReviewRequestPayload` - API payload
- `SendReviewRequestResponse` - API response
- `PendingReviewRequest` - User-facing pending requests
- `ReviewRequestFilters` - Filter options
- `ReviewRequestWithDetails` - Full details for admin display

### 3. Review Request Service (COMPLETE)

**File**: `src/services/review/ReviewRequestService.ts`

**Methods Implemented**:

- `sendReviewRequests()` - Invoke edge function to send requests
- `getReviewRequestsForSession()` - Fetch requests with user details
- `getReviewRequestsForUser()` - Get user's requests
- `getPendingReviewRequestsForUser()` - Login notification data
- `markRequestCompleted()` - Mark as completed with review ID
- `dismissRequest()` - User dismisses request
- `sendReminder()` - Resend review request
- `getSessionsWithReviewInfo()` - Admin dashboard data
- `getSessionParticipants()` - Fetch participants with review status
- `getReviewRequestStats()` - Analytics data

### 4. Edge Function (COMPLETE)

**File**: `supabase/functions/send-review-request/index.ts`

**Capabilities**:

- Creates notifications for all participants
- Creates review_request tracking records
- Sends personalized emails (respecting user preferences)
- Supports custom messages
- Handles reminders
- Batch processing with error handling
- Returns detailed success/failure report

## 🚧 Remaining Implementation (Frontend Components)

### 5. React Hook: useReviewRequests

**File to Create**: `src/hooks/useReviewRequests.ts`

**Purpose**: Custom hook for managing review requests

**What it should include**:

```typescript
export function useReviewRequests(filters?: ReviewRequestFilters) {
  // Fetch review requests with filters
  // Real-time subscription for updates
  // Actions: send, resend, dismiss
  // Loading and error states
  // Cache management with TanStack Query
}
```

**Key Features**:

- Real-time updates via Supabase channel
- Automatic cache invalidation
- Optimistic updates
- Error handling

### 6. Admin Component: ReviewRequestManagement

**File to Create**: `src/components/admin/ReviewRequestManagement.tsx`

**Purpose**: Main admin interface for managing review requests

**Sections**:

1. **Session List**:
   - Filter by type, date range, status
   - Display cards showing:
     - Session title, date, type
     - Participant count
     - Review request statistics (sent, pending, completed)
     - Response rate percentage
     - Actions: View participants, Send requests

2. **Participant Modal**:
   - List of all session participants
   - Show review request status per participant
   - Bulk select checkboxes
   - Individual actions: Send, Resend, View review
   - Send button with confirmation dialog

3. **Send Request Dialog**:
   - Preview selected participants
   - Custom message editor (with default template)
   - Email preview
   - Send button with loading state

4. **Analytics Dashboard**:
   - Overall response rate
   - Response rate by session type
   - Average response time
   - Recent submissions timeline

### 7. Login Notification Checker

**File to Create**: `src/components/notifications/LoginNotificationChecker.tsx`

**Purpose**: Check for pending review requests on login and show toast

**Logic**:

```typescript
export function LoginNotificationChecker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkPendingReviewRequests();
    }
  }, [user]);

  const checkPendingReviewRequests = async () => {
    const pending = await getPendingReviewRequestsForUser(user.id);

    if (pending.length > 0) {
      toast({
        title: `Review Request${pending.length > 1 ? 's' : ''}`,
        description: `You have ${pending.length} pending review request(s)`,
        action: (
          <Button onClick={() => navigate('/notifications')}>
            View
          </Button>
        ),
        duration: 10000,
      });
    }
  };
}
```

**Mount Location**: Add to `src/App.tsx` alongside other global components

### 8. Update NotificationsSection

**File to Modify**: `src/components/dashboard/NotificationsSection.tsx`

**Changes Needed**:

1. Add icon handling for review_request type:

```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'review_request':
      return <Star className="h-4 w-4 text-yellow-500" />;
    // ... existing cases
  }
};
```

2. Add action button for review requests:

```typescript
{notification.type === 'review_request' && (
  <Button
    size="sm"
    onClick={() => navigate(notification.action_url)}
  >
    Submit Review
  </Button>
)}
```

### 9. Review Submission Page

**File to Create**: `src/pages/ReviewSubmissionPage.tsx`

**Purpose**: Dedicated page for submitting reviews from notifications

**Features**:

- Parse URL params: `?sessionId=xxx&sessionType=xxx&requestId=xxx`
- Fetch session details
- Display session info (title, date, type)
- Render ReviewForm with session context
- Auto-link review to request on submission
- Show success message with thank you
- Redirect to dashboard after submit

**Route to Add** in `src/App.tsx`:

```typescript
<Route path="/review/submit" element={<ReviewSubmissionPage />} />
```

### 10. Enhance ReviewForm

**File to Modify**: `src/components/forms/ReviewForm.tsx`

**New Props to Add**:

```typescript
interface ReviewFormProps {
  // Existing props...
  requestId?: string; // NEW
  sessionId?: string; // NEW
  sessionType?: SessionType; // NEW
  onSuccess?: () => void; // NEW
}
```

**Logic to Add**:

1. If `requestId` provided, fetch request details
2. If `sessionId` provided, fetch session details and prefill course info
3. On submit:
   - Create review as usual
   - If `requestId` exists, call `markRequestCompleted(requestId, reviewId)`
   - Call `onSuccess` callback
   - Show success toast

### 11. Add Admin Tab

**File to Modify**: `src/pages/AdminRefactored.tsx`

**Add Tab**:

```typescript
<TabsTrigger value="review-requests">
  <MessageSquare className="h-4 w-4 mr-2" />
  Review Requests
  {pendingCount > 0 && (
    <Badge variant="destructive" className="ml-2">
      {pendingCount}
    </Badge>
  )}
</TabsTrigger>

<TabsContent value="review-requests">
  <ReviewRequestManagement />
</TabsContent>
```

**Fetch Pending Count**:

```typescript
const { data: pendingCount } = useQuery({
  queryKey: ['review-requests-pending-count'],
  queryFn: async () => {
    const { count } = await supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    return count || 0;
  },
});
```

## Database Migration

### To Apply the Migration:

1. **Development (Local)**:

```bash
npx supabase db push
```

2. **Production (via Dashboard)**:

- Go to Supabase Dashboard → SQL Editor
- Copy contents of `/supabase/migrations/20251104075236_add_review_request_system.sql`
- Run the SQL

3. **Verify Migration**:

```sql
-- Check review_requests table exists
SELECT * FROM review_requests LIMIT 1;

-- Check notification type was updated
SELECT DISTINCT type FROM notifications;

-- Check realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'review_requests';
```

## User Flows

### Admin Flow

1. Admin logs in → Goes to Admin Panel
2. Clicks "Review Requests" tab
3. Sees list of completed sessions with statistics
4. Clicks session → Modal shows participants
5. Selects participants (bulk or individual)
6. Clicks "Send Review Request"
7. Optionally customizes message
8. Confirms → Requests sent
9. See real-time status updates as users respond

### User Flow

1. User logs in
2. Toast notification appears: "You have a review request!"
3. Clicks "View" → Navigates to Notifications page
4. Sees review request notification with "Submit Review" button
5. Clicks button → Goes to review submission page
6. Sees session details pre-filled
7. Fills out review form (rating, comments)
8. Submits → Request marked as completed
9. Notification marked as read
10. Success message: "Thank you for your feedback!"

## Real-time Updates

### Admin Dashboard Subscription:

```typescript
const channel = supabase
  .channel('review-requests-admin')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'review_requests',
    },
    payload => {
      // Refresh admin dashboard
      queryClient.invalidateQueries(['review-requests']);
    }
  )
  .subscribe();
```

### User Notifications Subscription:

```typescript
const channel = supabase
  .channel(`notifications-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    payload => {
      if (payload.new.type === 'review_request') {
        showToast(payload.new);
      }
    }
  )
  .subscribe();
```

## Email Template

### Review Request Email

**Subject**: `We'd love your feedback on {sessionTitle}`

**Body**:

```html
Hi {userName}, Thank you for participating in "{sessionTitle}" on {sessionDate}! We'd love to hear
about your experience. Your feedback helps us improve and helps other learners make informed
decisions. [Submit Your Review Button] This will only take 2-3 minutes. Thank you for being part of
our community!
```

## Testing Checklist

### Backend Testing:

- [ ] Migration applies successfully
- [ ] Review requests table has correct schema
- [ ] RLS policies work (users can't see others' requests)
- [ ] Edge function sends notifications successfully
- [ ] Edge function sends emails successfully
- [ ] Triggers update session counts correctly
- [ ] Helper function returns correct pending requests
- [ ] Real-time updates work

### Frontend Testing:

- [ ] useReviewRequests hook fetches data
- [ ] Admin can view sessions with review info
- [ ] Admin can select participants
- [ ] Admin can send review requests (bulk and individual)
- [ ] Review requests appear in user notifications
- [ ] Login toast shows pending requests
- [ ] User can submit review from notification
- [ ] Review submission links to request
- [ ] Request status updates to 'completed'
- [ ] User can dismiss review request
- [ ] Admin can send reminders
- [ ] Analytics display correctly
- [ ] Mobile responsive

### Integration Testing:

- [ ] End-to-end flow: Admin sends → User receives → User submits
- [ ] Email delivery works
- [ ] Notification preferences respected
- [ ] Real-time updates appear in admin panel
- [ ] Multiple requests don't duplicate
- [ ] Reminders increment counter
- [ ] Statistics calculate correctly

## Performance Considerations

1. **Database Indexes**: Already created for optimal query performance
2. **Batch Processing**: Edge function processes users in sequence (consider parallel for large
   batches)
3. **Real-time Subscriptions**: Filter by user_id to reduce bandwidth
4. **Query Caching**: Use TanStack Query with 5-minute stale time
5. **Pagination**: Implement for session list if >100 sessions

## Security

1. **RLS Policies**: ✅ Implemented
   - Users can only view their own requests
   - Admins can view/manage all requests
   - Service role used in edge function

2. **Input Validation**: Add validation for:
   - Session ID exists
   - User IDs are valid
   - Custom message length limit

3. **Rate Limiting**: Consider adding:
   - Max 1 request per session per user
   - Max 3 reminders per request
   - Admin action throttling

## Future Enhancements

1. **Scheduled Sends**: Auto-send X days after session
2. **A/B Testing**: Test different message templates
3. **Incentives**: Offer badges/points for completing reviews
4. **Review Quality Scoring**: Analyze helpfulness
5. **Automated Thank You**: Send thank you message after review
6. **Calendar Integration**: Add to session calendar events
7. **Analytics Dashboard**: Dedicated analytics page
8. **Export Reports**: Download CSV of review request data
9. **Bulk Reminders**: Send reminders to all pending requests
10. **Custom Templates**: Allow admins to create message templates

## File Structure Summary

```
Project Root
├── supabase/
│   ├── migrations/
│   │   └── 20251104075236_add_review_request_system.sql ✅
│   └── functions/
│       └── send-review-request/
│           └── index.ts ✅
├── src/
│   ├── types/
│   │   └── reviewRequest.ts ✅
│   ├── services/
│   │   └── review/
│   │       └── ReviewRequestService.ts ✅
│   ├── hooks/
│   │   └── useReviewRequests.ts ⏳ TO DO
│   ├── components/
│   │   ├── admin/
│   │   │   └── ReviewRequestManagement.tsx ⏳ TO DO
│   │   ├── notifications/
│   │   │   └── LoginNotificationChecker.tsx ⏳ TO DO
│   │   ├── dashboard/
│   │   │   └── NotificationsSection.tsx (MODIFY) ⏳
│   │   └── forms/
│   │       └── ReviewForm.tsx (MODIFY) ⏳
│   ├── pages/
│   │   ├── AdminRefactored.tsx (MODIFY) ⏳
│   │   └── ReviewSubmissionPage.tsx ⏳ TO DO
│   └── App.tsx (ADD ROUTE & COMPONENT) ⏳
└── REVIEW_REQUEST_SYSTEM_IMPLEMENTATION.md (THIS FILE) ✅
```

## Next Steps

1. **Apply Database Migration** ✅
2. **Deploy Edge Function** ⏳
3. **Create useReviewRequests Hook** ⏳
4. **Build ReviewRequestManagement Component** ⏳
5. **Create LoginNotificationChecker** ⏳
6. **Update NotificationsSection** ⏳
7. **Create ReviewSubmissionPage** ⏳
8. **Enhance ReviewForm** ⏳
9. **Add Admin Tab** ⏳
10. **Test End-to-End** ⏳
11. **Deploy to Production** ⏳

## Support & Documentation

- **Database Schema**: See migration file for complete schema
- **API Reference**: See ReviewRequestService.ts for all available methods
- **Edge Function**: See send-review-request/index.ts for email template
- **Types**: See reviewRequest.ts for all TypeScript interfaces

---

**Status**: Foundation Complete (Database + Backend) **Next**: Frontend Implementation **Estimated
Remaining Time**: 15-20 hours
