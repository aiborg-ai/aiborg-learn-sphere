/**
 * Calendar Type Definitions
 *
 * Unified type system for the comprehensive calendar feature
 * supporting assignments, courses, events, workshops, and sessions.
 */

/**
 * All supported calendar event types
 */
export type CalendarEventType =
  | 'assignment'
  | 'exam'
  | 'course'
  | 'workshop_session'
  | 'free_session'
  | 'classroom_session'
  | 'event'
  | 'deadline';

/**
 * Calendar view modes
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Event status
 */
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'overdue' | 'cancelled';

/**
 * Event priority levels
 */
export type EventPriority = 'low' | 'medium' | 'high';

/**
 * User's relationship to the event
 */
export type UserEventRelationship =
  | 'assigned'
  | 'enrolled'
  | 'registered'
  | 'invited'
  | 'facilitator'
  | 'instructor'
  | 'participant'
  | 'none';

/**
 * Unified calendar event interface
 * All events from different sources are transformed into this structure
 */
export interface CalendarEvent {
  /** Unique identifier (prefixed with type, e.g., 'assignment_123') */
  id: string;

  /** Event type */
  type: CalendarEventType;

  /** Event title */
  title: string;

  /** Event description */
  description: string | null;

  /** Start date and time */
  startDate: Date;

  /** End date and time (null for events without duration) */
  endDate: Date | null;

  /** Whether this is an all-day event */
  isAllDay: boolean;

  /** Event status */
  status: EventStatus;

  /** Event priority */
  priority: EventPriority;

  /** User's relationship to this event */
  userRelationship: UserEventRelationship;

  /** Display color (hex) */
  color: string;

  /** Location (for physical events) */
  location: string | null;

  /** Related course ID (if applicable) */
  courseId: string | null;

  /** Related course title (if applicable) */
  courseTitle: string | null;

  /** Instructor/facilitator name */
  instructorName: string | null;

  /** Instructor/facilitator ID */
  instructorId: string | null;

  /** Additional metadata (type-specific data) */
  metadata: EventMetadata;

  /** Whether user has completed/submitted */
  isCompleted: boolean;

  /** Number of participants/attendees */
  participantCount: number | null;

  /** Maximum capacity */
  maxCapacity: number | null;

  /** Whether the event is at capacity */
  isFull: boolean;

  /** Whether user can join/register */
  canJoin: boolean;

  /** URL to view full details */
  detailUrl: string;
}

/**
 * Type-specific metadata for calendar events
 */
export interface EventMetadata {
  /** Original source table */
  sourceTable:
    | 'assignments'
    | 'events'
    | 'courses'
    | 'workshop_sessions'
    | 'free_sessions'
    | 'classroom_sessions';

  /** Original record ID */
  sourceId: string;

  /** Submission status (for assignments) */
  submissionStatus?: 'not_submitted' | 'submitted' | 'graded';

  /** Grade/score (for assignments) */
  grade?: number | null;

  /** Workshop stage (for workshop sessions) */
  workshopStage?: 'brainstorm' | 'ideate' | 'prototype' | 'present';

  /** Registration ID (for sessions user registered for) */
  registrationId?: string | null;

  /** Session price (for paid events) */
  price?: number | null;

  /** Event category (for events) */
  category?: string | null;

  /** Activities/tags */
  activities?: string[] | null;

  /** Is published/visible */
  isPublished?: boolean;

  /** Raw data from source (for debugging) */
  rawData?: Record<string, unknown>;
}

/**
 * Calendar filter options
 */
export interface CalendarFilters {
  /** Selected event types to display */
  eventTypes: CalendarEventType[];

  /** Filter by specific courses */
  courseIds: string[];

  /** Filter by status */
  statuses: EventStatus[];

  /** Date range start */
  dateRangeStart: Date | null;

  /** Date range end */
  dateRangeEnd: Date | null;

  /** Show only user's events (assigned/enrolled/registered) */
  showOnlyUserEvents: boolean;

  /** Text search query */
  searchQuery: string;
}

/**
 * Calendar view state
 */
export interface CalendarViewState {
  /** Current view mode */
  currentView: CalendarView;

  /** Currently selected/focused date */
  selectedDate: Date;

  /** Visible date range start */
  visibleRangeStart: Date;

  /** Visible date range end */
  visibleRangeEnd: Date;
}

/**
 * Calendar preferences (persisted)
 */
export interface CalendarPreferences {
  /** Default view on load */
  defaultView: CalendarView;

  /** Default filters */
  defaultFilters: Partial<CalendarFilters>;

  /** Show weekends */
  showWeekends: boolean;

  /** Week start day (0 = Sunday, 1 = Monday) */
  weekStartDay: 0 | 1;

  /** Time format */
  timeFormat: '12h' | '24h';

  /** Compact mode */
  compactMode: boolean;
}

/**
 * Event type configuration
 */
export interface EventTypeConfig {
  type: CalendarEventType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}

/**
 * Helper type for date range queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calendar statistics
 */
export interface CalendarStats {
  totalEvents: number;
  upcomingThisWeek: number;
  upcomingToday: number;
  overdueCount: number;
  completedCount: number;
  byType: Record<CalendarEventType, number>;
}

/**
 * Event grouping (for agenda view)
 */
export interface EventGroup {
  date: Date;
  dateLabel: string;
  events: CalendarEvent[];
  isToday: boolean;
  isPast: boolean;
}
