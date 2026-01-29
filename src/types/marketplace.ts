/**
 * Marketplace Types
 * Type definitions for the AI Course Marketplace feature
 */

// =====================================================
// Provider Types
// =====================================================

export type CourseProviderCategory = 'mooc' | 'ai' | 'regional';

export type CourseProviderSlug =
  // MOOCs
  | 'coursera'
  | 'udemy'
  | 'edx'
  | 'linkedin_learning'
  | 'pluralsight'
  // AI-Specific
  | 'deeplearning_ai'
  | 'fast_ai'
  | 'kaggle'
  | 'google_ai'
  | 'aws_ml'
  | 'huggingface'
  // Regional
  | 'swayam'
  | 'xuetangx'
  | 'futurelearn'
  | 'alison';

export interface CourseProvider {
  id: string;
  slug: CourseProviderSlug;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  category: CourseProviderCategory;
  description: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Course Types
// =====================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CourseMode = 'online' | 'self-paced' | 'cohort' | 'hybrid';

export type PriceType = 'free' | 'freemium' | 'paid' | 'subscription';

export interface ExternalCourse {
  id: string;
  provider_id: string;
  external_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
  thumbnail_url: string | null;
  external_url: string;

  // Course attributes
  level: CourseLevel | null;
  mode: CourseMode | null;
  language: string;
  duration_hours: number | null;
  duration_text: string | null;

  // Pricing
  price_type: PriceType;
  price_amount: number | null;
  price_currency: string;
  original_price: number | null;

  // Metrics
  rating: number | null;
  review_count: number;
  enrollment_count: number;

  // Features
  certificate_available: boolean;

  // Categorization
  skills: string[];
  topics: string[];
  categories: string[];
  prerequisites: string[];
  learning_outcomes: string[];

  // Content info
  lesson_count: number | null;
  video_hours: number | null;

  // Metadata
  last_updated: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  provider?: CourseProvider;

  // Client-side computed
  is_favorite?: boolean;
  price_alert_id?: string | null;
}

export interface ExternalCourseWithProvider extends ExternalCourse {
  provider_name: string;
  provider_slug: CourseProviderSlug;
  provider_logo_url: string | null;
  provider_category: CourseProviderCategory;
  provider_country: string | null;
}

// =====================================================
// User Interaction Types
// =====================================================

export interface UserCourseFavorite {
  id: string;
  user_id: string;
  course_id: string;
  notes: string | null;
  created_at: string;
  course?: ExternalCourse;
}

export interface UserPriceAlert {
  id: string;
  user_id: string;
  course_id: string;
  target_price: number;
  original_price_at_creation: number | null;
  is_active: boolean;
  triggered_at: string | null;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
  course?: ExternalCourse;
}

export interface CourseReviewsAggregated {
  id: string;
  course_id: string;
  source: string;
  avg_rating: number | null;
  total_reviews: number;
  rating_distribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  sentiment_score: number | null;
  highlights: string[];
  concerns: string[];
  last_synced_at: string;
}

// =====================================================
// Filter & Sort Types
// =====================================================

export interface MarketplaceFilters {
  search?: string;
  providers?: CourseProviderSlug[];
  levels?: CourseLevel[];
  modes?: CourseMode[];
  priceTypes?: PriceType[];
  priceRange?: {
    min: number;
    max: number;
  };
  minRating?: number;
  categories?: string[];
  skills?: string[];
  topics?: string[];
  certificateOnly?: boolean;
  language?: string;
  featuredOnly?: boolean;
}

export type MarketplaceSortField = 'relevance' | 'rating' | 'price' | 'enrollment_count' | 'newest';

export type SortDirection = 'asc' | 'desc';

export interface MarketplaceSortOption {
  field: MarketplaceSortField;
  direction: SortDirection;
}

export interface MarketplacePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// =====================================================
// Recommendation Types
// =====================================================

export interface CourseRecommendation extends ExternalCourse {
  matchScore: number; // 0-100
  matchReasons: MatchReason[];
  skillGapsFilled: string[];
  estimatedCompletionDays: number | null;
}

export interface MatchReason {
  type: 'skill_level' | 'learning_goal' | 'topic' | 'popularity' | 'career_path';
  description: string;
  weight: number; // Contribution to matchScore
}

export interface UserLearningProfile {
  currentSkillLevel: CourseLevel;
  learningGoals: string[];
  preferredTopics: string[];
  completedCourseIds: string[];
  preferredProviders: CourseProviderSlug[];
  timeCommitmentHoursPerWeek: number;
  budgetPreference: PriceType[];
  preferredLanguage: string;
}

// =====================================================
// Learning Path Types
// =====================================================

export interface LearningPathSuggestion {
  id: string;
  name: string;
  description: string;
  courses: ExternalCourse[];
  totalDurationHours: number;
  estimatedWeeks: number;
  targetSkillLevel: CourseLevel;
  skills: string[];
  matchScore: number;
}

// =====================================================
// Comparison Types
// =====================================================

export interface CourseComparisonItem {
  course: ExternalCourse;
  addedAt: Date;
}

export interface ComparisonMetric {
  label: string;
  getValue: (course: ExternalCourse) => React.ReactNode;
}

// =====================================================
// API Response Types
// =====================================================

export interface MarketplaceCoursesResponse {
  courses: ExternalCourseWithProvider[];
  pagination: MarketplacePagination;
  facets?: MarketplaceFacets;
}

export interface MarketplaceFacets {
  providers: FacetItem[];
  levels: FacetItem[];
  priceTypes: FacetItem[];
  categories: FacetItem[];
  languages: FacetItem[];
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

// =====================================================
// Search Types
// =====================================================

export interface MarketplaceSearchParams {
  filters: MarketplaceFilters;
  sort: MarketplaceSortOption;
  page: number;
  pageSize: number;
}

export interface SearchSuggestion {
  type: 'course' | 'topic' | 'skill' | 'instructor';
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

// =====================================================
// Constants
// =====================================================

export const PROVIDER_INFO: Record<
  CourseProviderSlug,
  { name: string; category: CourseProviderCategory }
> = {
  // MOOCs
  coursera: { name: 'Coursera', category: 'mooc' },
  udemy: { name: 'Udemy', category: 'mooc' },
  edx: { name: 'edX', category: 'mooc' },
  linkedin_learning: { name: 'LinkedIn Learning', category: 'mooc' },
  pluralsight: { name: 'Pluralsight', category: 'mooc' },
  // AI-Specific
  deeplearning_ai: { name: 'DeepLearning.AI', category: 'ai' },
  fast_ai: { name: 'fast.ai', category: 'ai' },
  kaggle: { name: 'Kaggle Learn', category: 'ai' },
  google_ai: { name: 'Google AI', category: 'ai' },
  aws_ml: { name: 'AWS Machine Learning', category: 'ai' },
  huggingface: { name: 'Hugging Face', category: 'ai' },
  // Regional
  swayam: { name: 'SWAYAM', category: 'regional' },
  xuetangx: { name: 'XuetangX', category: 'regional' },
  futurelearn: { name: 'FutureLearn', category: 'regional' },
  alison: { name: 'Alison', category: 'regional' },
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const MODE_LABELS: Record<CourseMode, string> = {
  online: 'Online',
  'self-paced': 'Self-Paced',
  cohort: 'Cohort-Based',
  hybrid: 'Hybrid',
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  subscription: 'Subscription',
};

export const DEFAULT_FILTERS: MarketplaceFilters = {};

export const DEFAULT_SORT: MarketplaceSortOption = {
  field: 'relevance',
  direction: 'desc',
};

export const DEFAULT_PAGE_SIZE = 20;

// AI Course Categories
export const AI_CATEGORIES = [
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Generative AI',
  'Large Language Models',
  'Prompt Engineering',
  'AI Ethics',
  'MLOps',
  'Data Science',
  'Neural Networks',
  'Reinforcement Learning',
  'AI for Business',
  'AI Applications',
  'AI Fundamentals',
] as const;

export type AICategory = (typeof AI_CATEGORIES)[number];
