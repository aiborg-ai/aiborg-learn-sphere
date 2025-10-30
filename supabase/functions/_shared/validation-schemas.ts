/**
 * Validation Schemas
 * Zod schemas for validating registration and other inputs
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if parent email is required (COPPA compliance)
 */
export function requiresParentEmail(birthdate: Date): boolean {
  return calculateAge(birthdate) < 13;
}

/**
 * Check if age is within target range (9-18)
 */
export function isAgeInTargetRange(birthdate: Date): { inRange: boolean; warning?: string } {
  const age = calculateAge(birthdate);

  if (age < 9) {
    return {
      inRange: false,
      warning:
        'This session is designed for students aged 9-18. You may proceed with registration if you wish.',
    };
  }

  if (age > 18) {
    return {
      inRange: false,
      warning:
        'This session is designed for students aged 9-18. You may proceed with registration if you wish.',
    };
  }

  return { inRange: true };
}

/**
 * Email validation regex (RFC 5322 simplified)
 */
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Registration request schema
 */
export const registrationSchema = z
  .object({
    sessionId: z.string().uuid('Invalid session ID format'),
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email format')
      .regex(emailRegex, 'Invalid email format')
      .toLowerCase()
      .trim(),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthdate must be in YYYY-MM-DD format'),
    parentEmail: z
      .string()
      .email('Invalid parent email format')
      .regex(emailRegex, 'Invalid parent email format')
      .toLowerCase()
      .trim()
      .optional(),
    source: z.enum(['web', 'mobile', 'admin', 'api']).default('web'),
  })
  .refine(
    data => {
      const birthdate = new Date(data.birthdate);
      const age = calculateAge(birthdate);

      // Require parent email if under 13
      if (age < 13 && !data.parentEmail) {
        return false;
      }

      return true;
    },
    {
      message: 'Parent/guardian email is required for users under 13 years old',
      path: ['parentEmail'],
    }
  );

export type RegistrationRequest = z.infer<typeof registrationSchema>;

/**
 * Attendance tracking schema
 */
export const attendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  userId: z.string().optional(),
  event: z.enum(['join', 'leave'], {
    errorMap: () => ({ message: 'Event must be either "join" or "leave"' }),
  }),
  timestamp: z.string().datetime('Invalid timestamp format'),
  jitsiParticipantId: z.string().optional(),
  displayName: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
  browser: z.string().optional(),
});

export type AttendanceRequest = z.infer<typeof attendanceSchema>;

/**
 * Session creation schema (for admin)
 */
export const sessionCreationSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  sessionTitle: z.string().min(3, 'Session title required'),
  sessionDate: z.string().datetime('Invalid session date'),
});

export type SessionCreationRequest = z.infer<typeof sessionCreationSchema>;

/**
 * Waitlist promotion schema
 */
export const waitlistPromotionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export type WaitlistPromotionRequest = z.infer<typeof waitlistPromotionSchema>;

/**
 * Email sending schema
 */
export const emailSendSchema = z.object({
  registrationId: z.string().uuid('Invalid registration ID'),
});

export type EmailSendRequest = z.infer<typeof emailSendSchema>;

/**
 * Reminder schema
 */
export const reminderSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  timeUntil: z.enum(['24h', '1h'], {
    errorMap: () => ({ message: 'Time until must be "24h" or "1h"' }),
  }),
});

export type ReminderRequest = z.infer<typeof reminderSchema>;

/**
 * Post-session email schema
 */
export const postSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  recordingUrl: z.string().url('Invalid recording URL').optional(),
  surveyUrl: z.string().url('Invalid survey URL').optional(),
});

export type PostSessionRequest = z.infer<typeof postSessionSchema>;

/**
 * Validate and parse request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error.errors };
}
