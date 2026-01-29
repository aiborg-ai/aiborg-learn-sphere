/**
 * Marketplace Zod Schemas
 * Runtime validation schemas for the AI Course Marketplace feature
 *
 * These schemas validate data from the external_courses, course_providers,
 * and related marketplace tables.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS - Match database constraints
// ============================================================================

export const CourseProviderCategoryEnum = z.enum(['mooc', 'ai', 'regional']);

export const CourseProviderSlugEnum = z.enum([
  // MOOCs
  'coursera',
  'udemy',
  'edx',
  'linkedin_learning',
  'pluralsight',
  // AI-Specific
  'deeplearning_ai',
  'fast_ai',
  'kaggle',
  'google_ai',
  'aws_ml',
  'huggingface',
  // Regional
  'swayam',
  'xuetangx',
  'futurelearn',
  'alison',
]);

export const ExternalCourseLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const ExternalCourseModeEnum = z.enum(['online', 'self-paced', 'cohort', 'hybrid']);

export const PriceTypeEnum = z.enum(['free', 'freemium', 'paid', 'subscription']);

export const MarketplaceSortFieldEnum = z.enum([
  'relevance',
  'rating',
  'price',
  'enrollment_count',
  'newest',
]);

export const SortDirectionEnum = z.enum(['asc', 'desc']);

// ============================================================================
// PROVIDER SCHEMAS
// ============================================================================

/**
 * Course Provider Schema
 */
export const CourseProviderSchema = z.object({
  id: z.string().uuid(),
  slug: CourseProviderSlugEnum,
  name: z.string().min(1).max(100),
  logo_url: z.string().url().nullable(),
  website_url: z.string().url().nullable(),
  category: CourseProviderCategoryEnum,
  description: z.string().nullable(),
  country: z.string().max(50).nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type CourseProviderInput = z.input<typeof CourseProviderSchema>;
export type CourseProviderOutput = z.output<typeof CourseProviderSchema>;

/**
 * Course Provider Create/Update Schema (admin operations)
 */
export const CourseProviderMutationSchema = CourseProviderSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ============================================================================
// EXTERNAL COURSE SCHEMAS
// ============================================================================

/**
 * External Course Schema
 */
export const ExternalCourseSchema = z.object({
  id: z.string().uuid(),
  provider_id: z.string().uuid(),
  external_id: z.string().max(255).nullable(),
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  instructor_name: z.string().max(255).nullable(),
  instructor_bio: z.string().nullable(),
  thumbnail_url: z.string().url().nullable(),
  external_url: z.string().url(),

  // Course attributes
  level: ExternalCourseLevelEnum.nullable(),
  mode: ExternalCourseModeEnum.nullable(),
  language: z.string().max(10).default('en'),
  duration_hours: z.number().int().positive().nullable(),
  duration_text: z.string().max(50).nullable(),

  // Pricing
  price_type: PriceTypeEnum,
  price_amount: z.number().nonnegative().nullable(),
  price_currency: z.string().length(3).default('USD'),
  original_price: z.number().nonnegative().nullable(),

  // Metrics
  rating: z.number().min(0).max(5).nullable(),
  review_count: z.number().int().nonnegative().default(0),
  enrollment_count: z.number().int().nonnegative().default(0),

  // Features
  certificate_available: z.boolean().default(false),

  // Arrays
  skills: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  learning_outcomes: z.array(z.string()).default([]),

  // Content info
  lesson_count: z.number().int().positive().nullable(),
  video_hours: z.number().positive().nullable(),

  // Metadata
  last_updated: z.string().nullable(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),

  // Optional joined provider data
  provider: CourseProviderSchema.optional(),

  // Client-side computed
  is_favorite: z.boolean().optional(),
  price_alert_id: z.string().uuid().nullable().optional(),
});

export type ExternalCourseInput = z.input<typeof ExternalCourseSchema>;
export type ExternalCourseOutput = z.output<typeof ExternalCourseSchema>;

/**
 * External Course with Provider View Schema
 */
export const ExternalCourseWithProviderSchema = ExternalCourseSchema.extend({
  provider_name: z.string(),
  provider_slug: CourseProviderSlugEnum,
  provider_logo_url: z.string().url().nullable(),
  provider_category: CourseProviderCategoryEnum,
  provider_country: z.string().nullable(),
});

export type ExternalCourseWithProvider = z.output<typeof ExternalCourseWithProviderSchema>;

/**
 * External Course Create/Update Schema (admin operations)
 */
export const ExternalCourseMutationSchema = z.object({
  provider_id: z.string().uuid(),
  external_id: z.string().max(255).optional().nullable(),
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  instructor_name: z.string().max(255).optional().nullable(),
  instructor_bio: z.string().optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  external_url: z.string().url(),
  level: ExternalCourseLevelEnum.optional().nullable(),
  mode: ExternalCourseModeEnum.optional().nullable(),
  language: z.string().max(10).default('en'),
  duration_hours: z.number().int().positive().optional().nullable(),
  duration_text: z.string().max(50).optional().nullable(),
  price_type: PriceTypeEnum,
  price_amount: z.number().nonnegative().optional().nullable(),
  price_currency: z.string().length(3).default('USD'),
  original_price: z.number().nonnegative().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  review_count: z.number().int().nonnegative().default(0),
  enrollment_count: z.number().int().nonnegative().default(0),
  certificate_available: z.boolean().default(false),
  skills: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  learning_outcomes: z.array(z.string()).default([]),
  lesson_count: z.number().int().positive().optional().nullable(),
  video_hours: z.number().positive().optional().nullable(),
  last_updated: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export type ExternalCourseMutationInput = z.input<typeof ExternalCourseMutationSchema>;

// ============================================================================
// USER INTERACTION SCHEMAS
// ============================================================================

/**
 * User Course Favorite Schema
 */
export const UserCourseFavoriteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  notes: z.string().nullable(),
  created_at: z.string().datetime().optional(),
  course: ExternalCourseSchema.optional(),
});

export type UserCourseFavorite = z.output<typeof UserCourseFavoriteSchema>;

/**
 * Add Favorite Schema
 */
export const AddFavoriteSchema = z.object({
  course_id: z.string().uuid(),
  notes: z.string().optional().nullable(),
});

export type AddFavoriteInput = z.input<typeof AddFavoriteSchema>;

/**
 * User Price Alert Schema
 */
export const UserPriceAlertSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  target_price: z.number().positive(),
  original_price_at_creation: z.number().nonnegative().nullable(),
  is_active: z.boolean().default(true),
  triggered_at: z.string().datetime().nullable(),
  notification_sent: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  course: ExternalCourseSchema.optional(),
});

export type UserPriceAlert = z.output<typeof UserPriceAlertSchema>;

/**
 * Create Price Alert Schema
 */
export const CreatePriceAlertSchema = z.object({
  course_id: z.string().uuid(),
  target_price: z.number().positive(),
});

export type CreatePriceAlertInput = z.input<typeof CreatePriceAlertSchema>;

/**
 * Course Reviews Aggregated Schema
 */
export const CourseReviewsAggregatedSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  source: z.string().max(50),
  avg_rating: z.number().min(0).max(5).nullable(),
  total_reviews: z.number().int().nonnegative().default(0),
  rating_distribution: z.object({
    '5': z.number().int().nonnegative(),
    '4': z.number().int().nonnegative(),
    '3': z.number().int().nonnegative(),
    '2': z.number().int().nonnegative(),
    '1': z.number().int().nonnegative(),
  }),
  sentiment_score: z.number().min(-1).max(1).nullable(),
  highlights: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  last_synced_at: z.string().datetime().optional(),
});

export type CourseReviewsAggregated = z.output<typeof CourseReviewsAggregatedSchema>;

// ============================================================================
// FILTER & SEARCH SCHEMAS
// ============================================================================

/**
 * Marketplace Filters Schema
 */
export const MarketplaceFiltersSchema = z.object({
  search: z.string().optional(),
  providers: z.array(CourseProviderSlugEnum).optional(),
  levels: z.array(ExternalCourseLevelEnum).optional(),
  modes: z.array(ExternalCourseModeEnum).optional(),
  priceTypes: z.array(PriceTypeEnum).optional(),
  priceRange: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().positive(),
    })
    .optional(),
  minRating: z.number().min(0).max(5).optional(),
  categories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  certificateOnly: z.boolean().optional(),
  language: z.string().max(10).optional(),
  featuredOnly: z.boolean().optional(),
});

export type MarketplaceFiltersInput = z.input<typeof MarketplaceFiltersSchema>;

/**
 * Marketplace Sort Schema
 */
export const MarketplaceSortSchema = z.object({
  field: MarketplaceSortFieldEnum,
  direction: SortDirectionEnum,
});

export type MarketplaceSort = z.output<typeof MarketplaceSortSchema>;

/**
 * Marketplace Pagination Schema
 */
export const MarketplacePaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type MarketplacePagination = z.output<typeof MarketplacePaginationSchema>;

/**
 * Marketplace Search Params Schema
 */
export const MarketplaceSearchParamsSchema = z.object({
  filters: MarketplaceFiltersSchema.optional(),
  sort: MarketplaceSortSchema.optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type MarketplaceSearchParams = z.output<typeof MarketplaceSearchParamsSchema>;

// ============================================================================
// RECOMMENDATION SCHEMAS
// ============================================================================

/**
 * Match Reason Schema
 */
export const MatchReasonSchema = z.object({
  type: z.enum(['skill_level', 'learning_goal', 'topic', 'popularity', 'career_path']),
  description: z.string(),
  weight: z.number().min(0).max(100),
});

export type MatchReason = z.output<typeof MatchReasonSchema>;

/**
 * Course Recommendation Schema
 */
export const CourseRecommendationSchema = ExternalCourseSchema.extend({
  matchScore: z.number().min(0).max(100),
  matchReasons: z.array(MatchReasonSchema),
  skillGapsFilled: z.array(z.string()),
  estimatedCompletionDays: z.number().positive().nullable(),
});

export type CourseRecommendation = z.output<typeof CourseRecommendationSchema>;

/**
 * User Learning Profile Schema (for recommendations)
 */
export const UserLearningProfileSchema = z.object({
  currentSkillLevel: ExternalCourseLevelEnum,
  learningGoals: z.array(z.string()),
  preferredTopics: z.array(z.string()),
  completedCourseIds: z.array(z.string().uuid()),
  preferredProviders: z.array(CourseProviderSlugEnum),
  timeCommitmentHoursPerWeek: z.number().positive(),
  budgetPreference: z.array(PriceTypeEnum),
  preferredLanguage: z.string().max(10).default('en'),
});

export type UserLearningProfile = z.output<typeof UserLearningProfileSchema>;

/**
 * Learning Path Suggestion Schema
 */
export const LearningPathSuggestionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  courses: z.array(ExternalCourseSchema),
  totalDurationHours: z.number().nonnegative(),
  estimatedWeeks: z.number().positive(),
  targetSkillLevel: ExternalCourseLevelEnum,
  skills: z.array(z.string()),
  matchScore: z.number().min(0).max(100),
});

export type LearningPathSuggestion = z.output<typeof LearningPathSuggestionSchema>;

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Facet Item Schema
 */
export const FacetItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export type FacetItem = z.output<typeof FacetItemSchema>;

/**
 * Marketplace Facets Schema
 */
export const MarketplaceFacetsSchema = z.object({
  providers: z.array(FacetItemSchema),
  levels: z.array(FacetItemSchema),
  priceTypes: z.array(FacetItemSchema),
  categories: z.array(FacetItemSchema),
  languages: z.array(FacetItemSchema),
});

export type MarketplaceFacets = z.output<typeof MarketplaceFacetsSchema>;

/**
 * Marketplace Courses Response Schema
 */
export const MarketplaceCoursesResponseSchema = z.object({
  courses: z.array(ExternalCourseWithProviderSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  facets: MarketplaceFacetsSchema.optional(),
});

export type MarketplaceCoursesResponse = z.output<typeof MarketplaceCoursesResponseSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate external course data
 */
export function validateExternalCourse(data: unknown): ExternalCourseOutput {
  return ExternalCourseSchema.parse(data);
}

/**
 * Validate marketplace filters
 */
export function validateMarketplaceFilters(data: unknown): MarketplaceFiltersInput {
  return MarketplaceFiltersSchema.parse(data);
}

/**
 * Safely parse external course (returns null on failure)
 */
export function safeParseExternalCourse(data: unknown): ExternalCourseOutput | null {
  const result = ExternalCourseSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate price alert creation
 */
export function validateCreatePriceAlert(data: unknown): CreatePriceAlertInput {
  return CreatePriceAlertSchema.parse(data);
}
