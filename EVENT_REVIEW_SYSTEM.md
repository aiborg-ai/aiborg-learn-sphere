# Event Review System Documentation

## ✅ Successfully Implemented Features

### Database Structure
- **event_reviews** table - Stores all event reviews with ratings and comments
- **event_registrations** table - Tracks which events users have attended
- Proper foreign key relationships with events and users tables
- Row Level Security (RLS) policies for data protection

### User Features

#### 1. Submit Event Reviews
- Select from events they've attended
- Rate events from 1-5 stars with visual feedback
- Choose event mode (Online/In-Person/Hybrid)
- Add detailed text comments
- Option for anonymous reviews
- Voice and video review capabilities (UI ready, processing pending)

#### 2. Review Display Options
- **Show my name** - Display reviewer's name publicly
- **Anonymous** - Hide reviewer identity

#### 3. Review Management
- Users can view their own reviews
- Users can edit/delete their own reviews
- Reviews require admin approval before public display

### Admin Features

#### 1. Review Moderation
- Approve or reject reviews
- Control public visibility
- View all reviews regardless of status
- Edit/delete any review

#### 2. Event Registration Management
- Track who registered for events
- Mark attendance status
- View registration analytics

### How to Use

#### For Users:
1. Navigate to the review form page
2. Select "Event Review" tab
3. Choose the event you attended
4. Rate and write your review
5. Submit for approval

#### For Admins:
1. Go to Admin Dashboard → Reviews
2. View pending event reviews
3. Approve/reject reviews
4. Toggle display visibility

### API Endpoints Used

#### Supabase Tables:
- `event_reviews` - Main reviews storage
- `event_registrations` - Attendance tracking
- `events` - Event information
- `profiles` - User information

### Security Features

1. **Row Level Security (RLS)**
   - Users can only create reviews for events they attended
   - Users can only edit/delete their own reviews
   - Public can only see approved reviews
   - Admins have full access

2. **Data Validation**
   - Rating must be between 1-5
   - Event mode restricted to valid options
   - Required fields enforced

### Component Structure

```tsx
// Main Components
EventReviewForm - Standalone event review form
UnifiedReviewForm - Combined course and event reviews
ReviewForm - Original course review form

// Usage
import EventReviewForm from '@/components/EventReviewForm';
import UnifiedReviewForm from '@/components/UnifiedReviewForm';
```

### Sample SQL Queries

#### Get all approved event reviews:
```sql
SELECT
  er.*,
  e.title as event_title,
  p.display_name as reviewer_name
FROM event_reviews er
JOIN events e ON er.event_id = e.id
JOIN profiles p ON er.user_id = p.user_id
WHERE er.approved = true
  AND er.display = true;
```

#### Get reviews for a specific event:
```sql
SELECT * FROM event_reviews
WHERE event_id = [event_id]
  AND approved = true
  AND display = true;
```

#### Mark user as attended:
```sql
INSERT INTO event_registrations (user_id, event_id, registration_status, attended_at)
VALUES ([user_id], [event_id], 'attended', NOW())
ON CONFLICT (user_id, event_id)
DO UPDATE SET
  registration_status = 'attended',
  attended_at = NOW();
```

### Future Enhancements

1. **Analytics Dashboard**
   - Average ratings per event
   - Review trends over time
   - Most reviewed events

2. **Enhanced Features**
   - Review helpfulness voting
   - Review responses from organizers
   - Photo uploads with reviews
   - Verified attendee badges

3. **Notifications**
   - Email when review is approved
   - Reminder to review after event
   - Response notifications

### Testing the System

1. **Create Test Registration:**
```sql
-- Register yourself for an event
INSERT INTO event_registrations (user_id, event_id, registration_status)
SELECT
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  (SELECT id FROM events LIMIT 1),
  'attended';
```

2. **Submit Test Review:**
   - Go to review form
   - Select the event
   - Submit review

3. **Approve Review (Admin):**
```sql
UPDATE event_reviews
SET approved = true, display = true
WHERE id = [review_id];
```

### Troubleshooting

**Issue: Can't see events in dropdown**
- Check if events exist in database
- Verify user has attended events
- Check console for errors

**Issue: Review not showing publicly**
- Ensure review is approved by admin
- Check display flag is true
- Verify RLS policies

**Issue: Can't submit review**
- Confirm user is logged in
- Verify event attendance record exists
- Check form validation errors

### Success Metrics

- ✅ Users can submit event reviews
- ✅ Reviews require admin approval
- ✅ Anonymous review option works
- ✅ Rating system functional
- ✅ Integration with existing events table
- ✅ Secure with RLS policies
- ✅ Mobile-responsive design

## Summary

The event review system is fully operational and integrated with your existing platform. Users can now provide valuable feedback on events they've attended, helping improve future events and providing social proof for potential attendees.