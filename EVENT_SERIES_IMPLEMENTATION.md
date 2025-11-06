# Event Series Implementation - "Forum on AI"

## Overview

This document describes the implementation of recurring event series with session-based ticketing
system for the "Forum on AI" event.

## ✅ Completed Phase 1: Backend Infrastructure

### Database Migrations (4 files)

1. **20251106000000_add_event_series_support.sql**
   - Extends `events` table with:
     - `meeting_url` - For online meeting links
     - `is_series` - Marks event as recurring
     - `series_name` - Unique identifier for series
     - `recurrence_pattern` - JSONB for recurrence rules

2. **20251106000001_create_event_sessions.sql**
   - Creates `event_sessions` table
   - Tracks individual session instances
   - Auto-sets check-in windows (30 mins before, 15 mins after)
   - Supports QR code check-in
   - RLS policies for public/authenticated/admin access

3. **20251106000002_create_event_session_tickets.sql**
   - Creates `event_session_tickets` table
   - Auto-generates unique ticket numbers (EVT-YYYY-NNNNNN)
   - QR code data for check-in
   - Auto-updates session registration counts via triggers

4. **20251106000003_create_event_series_registrations.sql**
   - Creates `event_series_registrations` table
   - **AUTO-GENERATES TICKETS** when user registers for series
   - Auto-generates tickets for new sessions added later
   - Supports free events (payment_status: completed, amount: 0.00)

### Edge Functions (4 functions)

1. **bulk-create-event-sessions**
   - Creates recurring sessions for event series
   - Parameters: eventId, startDate, endDate, dayOfWeek, frequency, etc.
   - Supports weekly, biweekly, monthly frequencies
   - Admin-only access

2. **register-event-series**
   - Handles user registration for entire series
   - Auto-triggers ticket generation via database trigger
   - Returns registration details and upcoming sessions
   - Prevents duplicate registrations

3. **check-in-event-session**
   - Handles check-in via QR code, manual, or host methods
   - Validates check-in window
   - Updates ticket status to 'attended'
   - Returns meeting URL after check-in

4. **manage-event-session-tickets**
   - Actions: claim, cancel, reactivate tickets
   - Validates ticket ownership
   - Checks session capacity before claiming
   - Prevents duplicate tickets

### Frontend Hooks (2 files)

1. **useEventSeries.ts**
   - `useEventSeries()` - Fetch all event series
   - `useEventSeriesDetails(eventId)` - Get series with upcoming sessions
   - `useEventSeriesRegistration(eventId)` - Check user registration status
   - `useRegisterEventSeries()` - Register for series
   - `useEventSessions(eventId)` - Get all sessions for a series

2. **useEventSessionTickets.ts**
   - `useEventSessionTickets()` - Fetch user's tickets
   - `useUpcomingEventTickets()` - Get next 10 upcoming tickets
   - `useCheckInEventSession()` - Check in to session
   - `useManageEventTicket()` - Cancel/reactivate/claim tickets

## 🚧 Pending Phase 2: Frontend Components

### To Be Created:

1. **EventSeriesCard.tsx** - Display event series on events page
2. **EventSessionTicketCard.tsx** - Individual ticket display with QR code
3. **MyEventTicketsPage.tsx** - User's ticket dashboard
4. **Admin/EventSeriesDialog.tsx** - Admin interface to create series
5. **Admin/EventSessionsTable.tsx** - Manage generated sessions

## How It Works

### For "Forum on AI" Setup:

1. **Admin Creates Event Series**:

   ```typescript
   // Event record in database
   {
     title: "Forum on AI",
     description: "Weekly forum for AI enthusiasts",
     is_series: true,
     series_name: "forum-on-ai",
     price: "0.00", // FREE
     meeting_url: "https://meet.google.com/xxx-yyyy-zzz",
     recurrence_pattern: {
       day_of_week: 5, // Friday
       frequency: "weekly"
     }
   }
   ```

2. **Admin Generates Sessions**:

   ```typescript
   // Call bulk-create-event-sessions
   {
     eventId: 1,
     startDate: "2025-11-14", // First Friday
     endDate: "2026-05-14",   // 6 months later
     dayOfWeek: 5,
     startTime: "21:00",      // 9 PM UK
     endTime: "22:30",
     frequency: "weekly",
     maxCapacity: 50
   }
   // Creates ~26 sessions automatically
   ```

3. **User Registers for Series**:
   - User clicks "Register for Series"
   - Creates record in `event_series_registrations`
   - **Database trigger auto-generates tickets** for all future sessions
   - User receives ~26 tickets immediately

4. **User Checks In**:
   - Opens ticket on session day
   - Clicks "Show QR Code" or "Check In"
   - Status updates to 'attended'
   - Meeting link revealed

## Key Features

✅ **Auto-Ticket Generation** - Database triggers handle everything ✅ **QR Code Check-In** -
Professional ticketing experience ✅ **Capacity Management** - 50 seats per session ✅ **Check-In
Windows** - 30 mins before to 15 mins after start ✅ **Free Events** - Properly handles ₹0.00
pricing ✅ **Online Meetings** - Meeting URLs stored and revealed after check-in ✅ **Recurring
Patterns** - Weekly, biweekly, monthly frequencies ✅ **RLS Security** - Proper row-level security
policies

## Database Triggers (Automatic)

1. **Auto-generate ticket numbers** (EVT-2025-000001, EVT-2025-000002, etc.)
2. **Auto-set check-in windows** (30 mins before to 15 mins after)
3. **Auto-update session registration counts**
4. **Auto-generate tickets on series registration**
5. **Auto-generate tickets for new sessions**

## Next Steps

1. Create frontend components (EventSeriesCard, etc.)
2. Test database migrations locally
3. Deploy Edge Functions to Supabase
4. Test full user flow
5. Create "Forum on AI" event series
6. Generate first batch of sessions

## Example User Flow

```
1. User visits Events page
   → Sees "Forum on AI" card
   → Shows "Every Friday, 9 PM UK • FREE • Online"

2. User clicks "Register for Series"
   → Confirmation dialog shows next 3 sessions
   → User confirms

3. Registration API called
   → Creates registration record
   → Trigger generates 26 tickets
   → User redirected to My Tickets page

4. User sees all tickets
   → Grouped by "Forum on AI"
   → Each ticket shows date, time, QR code button
   → Upcoming sessions highlighted

5. On session day (Friday 9 PM)
   → User opens ticket
   → Clicks "Check In" or shows QR code
   → Status → "Attended"
   → Meeting link revealed: "Join Meeting" button

6. User joins session
   → Clicks meeting link
   → Joins Google Meet/Zoom
```

## Files Created

### Database

- `supabase/migrations/20251106000000_add_event_series_support.sql`
- `supabase/migrations/20251106000001_create_event_sessions.sql`
- `supabase/migrations/20251106000002_create_event_session_tickets.sql`
- `supabase/migrations/20251106000003_create_event_series_registrations.sql`

### Edge Functions

- `supabase/functions/bulk-create-event-sessions/index.ts`
- `supabase/functions/register-event-series/index.ts`
- `supabase/functions/check-in-event-session/index.ts`
- `supabase/functions/manage-event-session-tickets/index.ts`

### Frontend Hooks

- `src/hooks/useEventSeries.ts`
- `src/hooks/useEventSessionTickets.ts`

### Documentation

- `EVENT_SERIES_IMPLEMENTATION.md` (this file)

---

**Status**: Phase 1 Complete ✅ | Phase 2 Pending 🚧 **Ready for**: Database testing and Edge
Function deployment
