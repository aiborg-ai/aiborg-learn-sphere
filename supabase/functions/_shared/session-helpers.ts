/**
 * Session Helper Functions
 * Utilities for Jitsi room generation, calendar links, and date formatting
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { format } from 'https://deno.land/x/date_fns@v2.22.1/index.js';

/**
 * Generate unique Jitsi room for a session
 */
export function generateJitsiRoom(sessionId: string): {
  url: string;
  roomName: string;
} {
  // Generate unique room name using session ID and short random suffix
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const roomName = `intro-session-${sessionId.slice(0, 8)}-${randomSuffix}`;

  return {
    url: `https://meet.jit.si/${roomName}`,
    roomName,
  };
}

/**
 * Format session date for display
 */
export function formatSessionDate(date: Date, timezone: string = 'UTC'): string {
  try {
    return format(date, "EEEE, MMMM do, yyyy 'at' h:mm a zzz");
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString();
  }
}

/**
 * Generate iCal (.ics) content for calendar
 */
export function generateICalContent(session: {
  id: string;
  title: string;
  description: string;
  session_date: string;
  duration_minutes: number;
  meeting_url: string;
}): string {
  const startTime = new Date(session.session_date);
  const endTime = new Date(startTime.getTime() + session.duration_minutes * 60000);

  // Format dates for iCal (yyyyMMddTHHmmssZ)
  const formatICalDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIborg Learn Sphere//Free Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICalDate(startTime)}`,
    `DTEND:${formatICalDate(endTime)}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `UID:session-${session.id}@aiborg.dev`,
    `SUMMARY:${session.title}`,
    `DESCRIPTION:${session.description}\\n\\nJoin: ${session.meeting_url}`,
    `LOCATION:${session.meeting_url}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'DESCRIPTION:Session reminder - 24 hours',
    'ACTION:DISPLAY',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'DESCRIPTION:Session starting in 1 hour',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icalLines.join('\r\n');
}

/**
 * Generate Google Calendar add link
 */
export function generateGoogleCalendarLink(session: {
  title: string;
  description: string;
  session_date: string;
  duration_minutes: number;
  meeting_url: string;
}): string {
  const startTime = new Date(session.session_date);
  const endTime = new Date(startTime.getTime() + session.duration_minutes * 60000);

  // Format dates for Google Calendar (yyyyMMddTHHmmssZ)
  const formatGoogleDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
    details: `${session.description}\n\nJoin: ${session.meeting_url}`,
    location: session.meeting_url,
    trp: 'false', // Don't show guests in event
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate data URI for iCal download
 */
export function generateICalDataURI(icalContent: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icalContent)}`;
}

/**
 * Convert UTC date to user's timezone display
 */
export function convertToUserTimezone(utcDateString: string, userTimezone: string = 'UTC'): string {
  try {
    const date = new Date(utcDateString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: userTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch (error) {
    console.error('Error converting timezone:', error);
    return utcDateString;
  }
}

/**
 * Get user's timezone from request (if available)
 */
export function getUserTimezone(request: Request): string {
  try {
    // Try to get timezone from header (if client sends it)
    const timezone = request.headers.get('X-Timezone');
    if (timezone) return timezone;

    // Default to UTC
    return 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
}

/**
 * Check if session date is in the past
 */
export function isSessionPassed(sessionDate: string): boolean {
  return new Date(sessionDate) < new Date();
}

/**
 * Check if session starts within specified hours
 */
export function sessionStartsWithinHours(sessionDate: string, hours: number): boolean {
  const now = new Date();
  const sessionTime = new Date(sessionDate);
  const hoursInMillis = hours * 60 * 60 * 1000;

  const timeDiff = sessionTime.getTime() - now.getTime();

  return timeDiff > 0 && timeDiff <= hoursInMillis;
}
