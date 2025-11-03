/**
 * Calendar Event Service
 *
 * Unified service to aggregate all calendar events from multiple sources:
 * - Assignments
 * - Events
 * - Workshop Sessions
 * - Free Sessions
 * - Classroom Sessions
 * - Course Milestones
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  CalendarEvent,
  CalendarEventType,
  EventStatus,
  EventPriority,
  DateRange,
  CalendarStats,
} from '@/types/calendar';
import { parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';

/**
 * Event type color configuration
 */
export const EVENT_TYPE_COLORS: Record<
  CalendarEventType,
  { bg: string; text: string; border: string; hex: string }
> = {
  assignment: {
    bg: 'bg-blue-500',
    text: 'text-blue-700',
    border: 'border-blue-500',
    hex: '#3b82f6',
  },
  exam: {
    bg: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-red-500',
    hex: '#ef4444',
  },
  course: {
    bg: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-500',
    hex: '#22c55e',
  },
  workshop_session: {
    bg: 'bg-purple-500',
    text: 'text-purple-700',
    border: 'border-purple-500',
    hex: '#a855f7',
  },
  free_session: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-700',
    border: 'border-yellow-500',
    hex: '#eab308',
  },
  event: {
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    border: 'border-orange-500',
    hex: '#f97316',
  },
  classroom_session: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-700',
    border: 'border-cyan-500',
    hex: '#06b6d4',
  },
  deadline: {
    bg: 'bg-pink-500',
    text: 'text-pink-700',
    border: 'border-pink-500',
    hex: '#ec4899',
  },
};

/**
 * Fetch assignments and transform to CalendarEvent format
 */
async function fetchAssignments(
  userId: string | undefined,
  dateRange: DateRange
): Promise<CalendarEvent[]> {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(
        `
        id,
        title,
        description,
        due_date,
        course_id,
        courses (
          id,
          title
        )
      `
      )
      .gte('due_date', dateRange.start.toISOString())
      .lte('due_date', dateRange.end.toISOString());

    if (error) throw error;
    if (!assignments) return [];

    // Fetch user submissions if user is logged in
    let submissionMap = new Map<string, { created_at: string; grade?: number }>();
    if (userId) {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id, created_at, grade')
        .eq('user_id', userId);

      submissionMap = new Map(
        submissions?.map(s => [s.assignment_id, { created_at: s.created_at, grade: s.grade }]) || []
      );
    }

    return assignments.map(assignment => {
      const dueDate = parseISO(assignment.due_date);
      const submission = submissionMap.get(assignment.id);
      const isSubmitted = !!submission;
      const isOverdue = !isSubmitted && isBefore(dueDate, new Date());

      const status: EventStatus = isSubmitted ? 'completed' : isOverdue ? 'overdue' : 'upcoming';

      const priority: EventPriority = isOverdue
        ? 'high'
        : dueDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
          ? 'medium'
          : 'low';

      return {
        id: `assignment_${assignment.id}`,
        type: 'assignment',
        title: assignment.title,
        description: assignment.description,
        startDate: dueDate,
        endDate: null,
        isAllDay: false,
        status,
        priority,
        userRelationship: 'assigned',
        color: EVENT_TYPE_COLORS.assignment.hex,
        location: null,
        courseId: assignment.course_id,
        courseTitle: assignment.courses?.title || null,
        instructorName: null,
        instructorId: null,
        metadata: {
          sourceTable: 'assignments',
          sourceId: assignment.id,
          submissionStatus: isSubmitted ? 'submitted' : 'not_submitted',
          grade: submission?.grade,
          rawData: assignment,
        },
        isCompleted: isSubmitted,
        participantCount: null,
        maxCapacity: null,
        isFull: false,
        canJoin: false,
        detailUrl: `/assignment/${assignment.id}`,
      };
    });
  } catch (error) {
    logger.error('Error fetching assignments for calendar:', error);
    return [];
  }
}

/**
 * Fetch events and transform to CalendarEvent format
 */
async function fetchEvents(dateRange: DateRange): Promise<CalendarEvent[]> {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .gte('event_date', dateRange.start.toISOString().split('T')[0])
      .lte('event_date', dateRange.end.toISOString().split('T')[0]);

    if (error) throw error;
    if (!events) return [];

    return events.map(event => {
      const eventDate = parseISO(event.event_date);
      const startTime = event.start_time
        ? parseISO(`${event.event_date}T${event.start_time}`)
        : eventDate;
      const endTime = event.end_time ? parseISO(`${event.event_date}T${event.end_time}`) : null;

      const status: EventStatus = isBefore(eventDate, new Date()) ? 'completed' : 'upcoming';

      const registeredCount = event.registered_count || 0;
      const isFull = event.max_capacity ? registeredCount >= event.max_capacity : false;

      return {
        id: `event_${event.id}`,
        type: 'event',
        title: event.title,
        description: event.description,
        startDate: startTime,
        endDate: endTime,
        isAllDay: !event.start_time,
        status,
        priority: 'medium',
        userRelationship: 'none',
        color: EVENT_TYPE_COLORS.event.hex,
        location: event.location,
        courseId: null,
        courseTitle: null,
        instructorName: null,
        instructorId: null,
        metadata: {
          sourceTable: 'events',
          sourceId: event.id,
          price: event.price,
          category: event.category,
          activities: event.activities,
          isPublished: event.is_visible,
          rawData: event,
        },
        isCompleted: status === 'completed',
        participantCount: registeredCount,
        maxCapacity: event.max_capacity,
        isFull,
        canJoin: !isFull && status === 'upcoming',
        detailUrl: `/event/${event.id}`,
      };
    });
  } catch (error) {
    logger.error('Error fetching events for calendar:', error);
    return [];
  }
}

/**
 * Fetch workshop sessions and transform to CalendarEvent format
 */
async function fetchWorkshopSessions(
  userId: string | undefined,
  dateRange: DateRange
): Promise<CalendarEvent[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('workshop_sessions')
      .select(
        `
        id,
        workshop_id,
        scheduled_start,
        scheduled_end,
        status,
        current_stage,
        facilitator_id,
        workshops (
          id,
          title,
          description
        ),
        profiles:facilitator_id (
          full_name
        )
      `
      )
      .gte('scheduled_start', dateRange.start.toISOString())
      .lte('scheduled_start', dateRange.end.toISOString());

    if (error) throw error;
    if (!sessions) return [];

    // Check user participation if logged in
    let participationMap = new Map<string, boolean>();
    if (userId) {
      const { data: participants } = await supabase
        .from('workshop_participants')
        .select('session_id')
        .eq('user_id', userId);

      participationMap = new Map(participants?.map(p => [p.session_id, true]) || []);
    }

    return sessions.map(session => {
      const startDate = parseISO(session.scheduled_start);
      const endDate = session.scheduled_end ? parseISO(session.scheduled_end) : null;
      const now = new Date();

      let status: EventStatus = 'upcoming';
      if (session.status === 'completed') {
        status = 'completed';
      } else if (session.status === 'cancelled') {
        status = 'cancelled';
      } else if (endDate && isAfter(now, endDate)) {
        status = 'completed';
      } else if (isWithinInterval(now, { start: startDate, end: endDate || startDate })) {
        status = 'ongoing';
      }

      const isParticipant = participationMap.get(session.id) || false;

      return {
        id: `workshop_${session.id}`,
        type: 'workshop_session',
        title: session.workshops?.title || 'Workshop Session',
        description: session.workshops?.description || null,
        startDate,
        endDate,
        isAllDay: false,
        status,
        priority: status === 'ongoing' ? 'high' : 'medium',
        userRelationship: isParticipant
          ? userId === session.facilitator_id
            ? 'facilitator'
            : 'participant'
          : 'none',
        color: EVENT_TYPE_COLORS.workshop_session.hex,
        location: 'Online',
        courseId: null,
        courseTitle: null,
        instructorName: session.profiles?.full_name || null,
        instructorId: session.facilitator_id,
        metadata: {
          sourceTable: 'workshop_sessions',
          sourceId: session.id,
          workshopStage: session.current_stage,
          rawData: session,
        },
        isCompleted: status === 'completed',
        participantCount: null,
        maxCapacity: null,
        isFull: false,
        canJoin: status === 'upcoming' || status === 'ongoing',
        detailUrl: `/workshop/session/${session.id}`,
      };
    });
  } catch (error) {
    logger.error('Error fetching workshop sessions for calendar:', error);
    return [];
  }
}

/**
 * Fetch free sessions and transform to CalendarEvent format
 */
async function fetchFreeSessions(
  userId: string | undefined,
  dateRange: DateRange
): Promise<CalendarEvent[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('free_sessions')
      .select('*')
      .eq('is_published', true)
      .gte('session_date', dateRange.start.toISOString().split('T')[0])
      .lte('session_date', dateRange.end.toISOString().split('T')[0]);

    if (error) throw error;
    if (!sessions) return [];

    // Check user registrations if logged in
    let registrationMap = new Map<string, string>();
    if (userId) {
      const { data: registrations } = await supabase
        .from('session_registrations')
        .select('session_id, id')
        .eq('user_id', userId);

      registrationMap = new Map(registrations?.map(r => [r.session_id, r.id]) || []);
    }

    return sessions.map(session => {
      const sessionDate = parseISO(session.session_date);
      const startTime = session.start_time
        ? parseISO(`${session.session_date}T${session.start_time}`)
        : sessionDate;
      const endTime = session.end_time
        ? parseISO(`${session.session_date}T${session.end_time}`)
        : null;

      const status: EventStatus =
        session.status === 'cancelled'
          ? 'cancelled'
          : isBefore(sessionDate, new Date())
            ? 'completed'
            : 'upcoming';

      const registeredCount = session.registered_count || 0;
      const isFull = session.capacity ? registeredCount >= session.capacity : false;
      const registrationId = registrationMap.get(session.id);
      const isRegistered = !!registrationId;

      return {
        id: `free_session_${session.id}`,
        type: 'free_session',
        title: session.title,
        description: session.description,
        startDate: startTime,
        endDate: endTime,
        isAllDay: !session.start_time,
        status,
        priority: 'medium',
        userRelationship: isRegistered ? 'registered' : 'none',
        color: EVENT_TYPE_COLORS.free_session.hex,
        location: 'Online',
        courseId: null,
        courseTitle: null,
        instructorName: null,
        instructorId: null,
        metadata: {
          sourceTable: 'free_sessions',
          sourceId: session.id,
          registrationId,
          isPublished: session.is_published,
          rawData: session,
        },
        isCompleted: isRegistered && status === 'completed',
        participantCount: registeredCount,
        maxCapacity: session.capacity,
        isFull,
        canJoin: !isFull && status === 'upcoming' && !isRegistered,
        detailUrl: `/session/${session.id}`,
      };
    });
  } catch (error) {
    logger.error('Error fetching free sessions for calendar:', error);
    return [];
  }
}

/**
 * Fetch classroom sessions and transform to CalendarEvent format
 */
async function fetchClassroomSessions(
  userId: string | undefined,
  dateRange: DateRange
): Promise<CalendarEvent[]> {
  try {
    // Query for active or recently ended sessions
    const { data: sessions, error } = await supabase
      .from('classroom_sessions')
      .select(
        `
        id,
        course_id,
        instructor_id,
        started_at,
        ended_at,
        is_active,
        courses (
          id,
          title
        ),
        profiles:instructor_id (
          full_name
        )
      `
      )
      .gte('started_at', dateRange.start.toISOString())
      .lte('started_at', dateRange.end.toISOString());

    if (error) throw error;
    if (!sessions) return [];

    // Check user enrollment if logged in
    let enrollmentMap = new Map<string, boolean>();
    if (userId) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      enrollmentMap = new Map(enrollments?.map(e => [e.course_id, true]) || []);
    }

    return sessions.map(session => {
      const startDate = parseISO(session.started_at);
      const endDate = session.ended_at ? parseISO(session.ended_at) : null;

      const status: EventStatus = session.is_active
        ? 'ongoing'
        : session.ended_at
          ? 'completed'
          : 'upcoming';

      const isEnrolled = session.course_id ? enrollmentMap.get(session.course_id) || false : false;
      const isInstructor = userId === session.instructor_id;

      return {
        id: `classroom_${session.id}`,
        type: 'classroom_session',
        title: `Live Class: ${session.courses?.title || 'Classroom Session'}`,
        description: null,
        startDate,
        endDate,
        isAllDay: false,
        status,
        priority: status === 'ongoing' ? 'high' : 'medium',
        userRelationship: isInstructor ? 'instructor' : isEnrolled ? 'enrolled' : 'none',
        color: EVENT_TYPE_COLORS.classroom_session.hex,
        location: 'Online',
        courseId: session.course_id,
        courseTitle: session.courses?.title || null,
        instructorName: session.profiles?.full_name || null,
        instructorId: session.instructor_id,
        metadata: {
          sourceTable: 'classroom_sessions',
          sourceId: session.id,
          rawData: session,
        },
        isCompleted: status === 'completed',
        participantCount: null,
        maxCapacity: null,
        isFull: false,
        canJoin: (isEnrolled || isInstructor) && status !== 'completed',
        detailUrl: `/classroom/${session.id}`,
      };
    });
  } catch (error) {
    logger.error('Error fetching classroom sessions for calendar:', error);
    return [];
  }
}

/**
 * Fetch all calendar events for a date range
 */
export async function fetchCalendarEvents(
  dateRange: DateRange,
  userId?: string,
  eventTypes?: CalendarEventType[]
): Promise<CalendarEvent[]> {
  try {
    // Determine which event types to fetch
    const typesToFetch =
      eventTypes && eventTypes.length > 0
        ? eventTypes
        : [
            'assignment',
            'exam',
            'course',
            'workshop_session',
            'free_session',
            'classroom_session',
            'event',
            'deadline',
          ];

    // Fetch all event types in parallel
    const promises: Promise<CalendarEvent[]>[] = [];

    if (typesToFetch.includes('assignment')) {
      promises.push(fetchAssignments(userId, dateRange));
    }
    if (typesToFetch.includes('event')) {
      promises.push(fetchEvents(dateRange));
    }
    if (typesToFetch.includes('workshop_session')) {
      promises.push(fetchWorkshopSessions(userId, dateRange));
    }
    if (typesToFetch.includes('free_session')) {
      promises.push(fetchFreeSessions(userId, dateRange));
    }
    if (typesToFetch.includes('classroom_session')) {
      promises.push(fetchClassroomSessions(userId, dateRange));
    }

    const results = await Promise.all(promises);

    // Flatten and sort by start date
    const allEvents = results.flat().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return allEvents;
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    return [];
  }
}

/**
 * Calculate calendar statistics
 */
export function calculateCalendarStats(events: CalendarEvent[]): CalendarStats {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const stats: CalendarStats = {
    totalEvents: events.length,
    upcomingThisWeek: 0,
    upcomingToday: 0,
    overdueCount: 0,
    completedCount: 0,
    byType: {
      assignment: 0,
      exam: 0,
      course: 0,
      workshop_session: 0,
      free_session: 0,
      classroom_session: 0,
      event: 0,
      deadline: 0,
    },
  };

  events.forEach(event => {
    // Count by type
    stats.byType[event.type]++;

    // Count by status
    if (event.status === 'completed') {
      stats.completedCount++;
    } else if (event.status === 'overdue') {
      stats.overdueCount++;
    }

    // Count upcoming events
    if (event.status === 'upcoming' || event.status === 'ongoing') {
      if (isWithinInterval(event.startDate, { start: today, end: endOfWeek })) {
        stats.upcomingThisWeek++;
      }
      if (
        event.startDate >= today &&
        event.startDate < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      ) {
        stats.upcomingToday++;
      }
    }
  });

  return stats;
}

/**
 * Get event type label
 */
export function getEventTypeLabel(type: CalendarEventType): string {
  const labels: Record<CalendarEventType, string> = {
    assignment: 'Assignment',
    exam: 'Exam',
    course: 'Course',
    workshop_session: 'Workshop',
    free_session: 'Free Session',
    classroom_session: 'Live Class',
    event: 'Event',
    deadline: 'Deadline',
  };
  return labels[type];
}
