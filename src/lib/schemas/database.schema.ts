/**
 * Database Zod Schemas
 * Runtime validation schemas for Supabase database tables
 *
 * IMPORTANT: These schemas should mirror the generated types from:
 * src/integrations/supabase/types.ts
 *
 * After running `npm run types:generate`, verify these schemas match
 * the generated Database types.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS - Match database enums
// ============================================================================

export const AudienceEnum = z.enum(['kids', 'students', 'professionals', 'enterprises']);
export const CourseModeEnum = z.enum(['in-person', 'online', 'hybrid']);
export const CourseLevelEnum = z.enum(['beginner', 'intermediate', 'advanced']);
export const CourseStatusEnum = z.enum(['draft', 'published', 'archived']);
export const EnrollmentStatusEnum = z.enum(['pending', 'active', 'completed', 'cancelled']);
export const UserRoleEnum = z.enum([
  'student',
  'instructor',
  'admin',
  'super_admin',
  'company_admin',
]);
export const EventTypeEnum = z.enum(['webinar', 'workshop', 'conference', 'meetup']);
export const PaymentStatusEnum = z.enum(['pending', 'completed', 'failed', 'refunded']);

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Profiles Table Schema
 */
export const ProfileSchema = z.object({
  user_id: z.string().uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().email().nullable(),
  role: UserRoleEnum.nullable(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

/**
 * Courses Table Schema
 */
export const CourseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string(),
  instructor_id: z.string().uuid().nullable().optional(),
  audience: AudienceEnum.nullable().optional(),
  audiences: z.array(AudienceEnum).nullable().optional(),
  mode: CourseModeEnum.nullable().optional(),
  level: CourseLevelEnum.nullable().optional(),
  status: CourseStatusEnum.default('draft').optional(),
  duration: z.string().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  max_enrollments: z.number().int().positive().nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  prerequisites: z.array(z.string()).nullable().optional(),
  learning_outcomes: z.array(z.string()).nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

export type Course = z.infer<typeof CourseSchema>;

/**
 * Enrollments Table Schema
 */
export const EnrollmentSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  course_id: z.number().int().positive(),
  status: EnrollmentStatusEnum.default('active'),
  enrolled_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  progress_percentage: z.number().min(0).max(100).default(0).optional(),
  payment_id: z.string().nullable().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

export type Enrollment = z.infer<typeof EnrollmentSchema>;

/**
 * Events Table Schema
 */
export const EventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string(),
  event_type: EventTypeEnum,
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable().optional(),
  location: z.string().nullable().optional(),
  virtual_link: z.string().url().nullable().optional(),
  max_attendees: z.number().int().positive().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  is_free: z.boolean().default(false).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Reviews Table Schema
 */
export const ReviewSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  course_id: z.number().int().positive().nullable().optional(),
  event_id: z.number().int().positive().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  is_approved: z.boolean().default(false).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Review = z.infer<typeof ReviewSchema>;

/**
 * User Progress Table Schema
 */
export const UserProgressSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  course_id: z.number().int().positive(),
  module_id: z.string().nullable().optional(),
  lesson_id: z.string().nullable().optional(),
  progress_percentage: z.number().min(0).max(100).default(0),
  completed: z.boolean().default(false),
  last_accessed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;

/**
 * Achievements Table Schema
 */
export const AchievementSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  description: z.string(),
  icon_url: z.string().url().nullable().optional(),
  badge_url: z.string().url().nullable().optional(),
  points: z.number().int().nonnegative().default(0),
  requirement_type: z.string().nullable().optional(),
  requirement_value: z.number().nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

/**
 * Assessment Questions Table Schema
 */
export const AssessmentQuestionSchema = z.object({
  id: z.number().int().positive(),
  category_id: z.number().int().positive().nullable().optional(),
  question_text: z.string().min(1),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  points: z.number().int().nonnegative().default(1),
  correct_answer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

/**
 * Blog Posts Table Schema
 */
export const BlogPostSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string(),
  excerpt: z.string().nullable().optional(),
  author_id: z.string().uuid(),
  category_id: z.number().int().positive().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  is_published: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional(),
  view_count: z.number().int().nonnegative().default(0).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

/**
 * Vault Claims Table Schema
 */
export const VaultClaimSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  claim_code: z.string().min(1),
  subscription_type: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_active: z.boolean().default(true),
  claimed_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
});

export type VaultClaim = z.infer<typeof VaultClaimSchema>;

// ============================================================================
// TENANT TABLES (Multi-tenancy)
// ============================================================================

/**
 * Tenants Table Schema
 */
export const TenantSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100),
  display_name: z.string().min(1).max(255),
  owner_id: z.string().uuid(),
  tier: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
  status: z.enum(['active', 'suspended', 'cancelled']).default('active'),
  subdomain: z.string().nullable().optional(),
  custom_domain: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

/**
 * Tenant Members Table Schema
 */
export const TenantMemberSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'manager', 'instructor', 'student']),
  status: z.enum(['active', 'invited', 'suspended']).default('active'),
  joined_at: z.string().datetime().optional(),
  invited_by: z.string().uuid().nullable().optional(),
});

export type TenantMember = z.infer<typeof TenantMemberSchema>;

// ============================================================================
// ARRAY VALIDATORS (for collections)
// ============================================================================

export const ProfilesArraySchema = z.array(ProfileSchema);
export const CoursesArraySchema = z.array(CourseSchema);
export const EnrollmentsArraySchema = z.array(EnrollmentSchema);
export const EventsArraySchema = z.array(EventSchema);
export const ReviewsArraySchema = z.array(ReviewSchema);
export const UserProgressArraySchema = z.array(UserProgressSchema);
export const AchievementsArraySchema = z.array(AchievementSchema);
export const AssessmentQuestionsArraySchema = z.array(AssessmentQuestionSchema);
export const BlogPostsArraySchema = z.array(BlogPostSchema);
export const VaultClaimsArraySchema = z.array(VaultClaimSchema);

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 * Throws ZodError if validation fails
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates data, returning success/error result
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates an array of items
 */
export function validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): T[] {
  return z.array(schema).parse(data);
}
