/**
 * Family Membership Enrollment Types
 * Type definitions and validation schemas for the enrollment wizard
 */

import { z } from 'zod';

// Form validation schemas
export const accountInfoSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().min(2, 'Please select a country'),
});

export const familyMemberSchema = z.object({
  member_name: z.string().min(2, 'Name required'),
  member_email: z.string().email('Invalid email'),
  member_age: z.number().min(5).max(120),
  relationship: z.string(),
});

export const authSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Inferred types from schemas
export type AccountInfo = z.infer<typeof accountInfoSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
export type AuthInput = z.infer<typeof authSchema>;

// Enrollment data interface
export interface EnrollmentData {
  accountInfo?: AccountInfo;
  familyMembers: FamilyMemberInput[];
  startTrial: boolean;
}

// Wizard step configuration
export interface WizardStep {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}
