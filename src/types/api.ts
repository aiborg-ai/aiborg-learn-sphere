/**
 * API Response Type Definitions
 *
 * Comprehensive type definitions for all API responses from Supabase
 * and external services.
 */

// ============================================================================
// Common API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count: number | null;
  status: number;
  statusText: string;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  role?: 'user' | 'admin' | 'instructor';
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  preferences: UserPreferences | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showProfile: boolean;
  };
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// ============================================================================
// Course Types
// ============================================================================

export interface Course {
  id: number;
  title: string;
  description: string;
  audiences: string[];
  mode: string;
  duration: string;
  price: string;
  level: string;
  start_date: string;
  features: string[];
  keywords: string[];
  category: string;
  is_featured: boolean;
  is_active: boolean;
  instructor_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithInstructor extends Course {
  instructor: Profile | null;
}

export interface CourseWithEnrollment extends CourseWithInstructor {
  enrollment: Enrollment | null;
  progress: UserProgress | null;
}

export interface CourseMaterial {
  id: string;
  course_id: number;
  title: string;
  description: string | null;
  type: 'video' | 'document' | 'link' | 'quiz' | 'assignment';
  url: string | null;
  content: string | null;
  order: number;
  is_required: boolean;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Enrollment Types
// ============================================================================

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_amount: number | null;
  payment_method: string | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: number;
  progress_percentage: number;
  last_accessed: string;
  current_position: Record<string, unknown> | null;
  completed_materials: string[];
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: number;
  name: string;
  description: string;
  event_type: string;
  date: string;
  time: string | null;
  duration: string | null;
  location: string | null;
  venue: string | null;
  max_attendees: number | null;
  price: string;
  category: string;
  speakers: string[];
  agenda: string[];
  tags: string[];
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  user_id: string;
  event_id: number;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
  attended_at: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
}

// ============================================================================
// Assignment & Homework Types
// ============================================================================

export interface HomeworkAssignment {
  id: string;
  course_id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  rubric: Record<string, unknown> | null;
  allowed_file_types: string[];
  max_file_size_mb: number;
  allow_late_submission: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeworkSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_text: string | null;
  file_urls: string[];
  status: 'draft' | 'submitted' | 'graded';
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Assessment Types
// ============================================================================

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subcategory: string | null;
  points: number;
  time_limit_seconds: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  explanation: string | null;
  order: number;
}

export interface AssessmentSession {
  id: string;
  user_id: string;
  session_type: 'profiling' | 'adaptive' | 'practice';
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number;
  score_percentage: number | null;
  profiling_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id: string | null;
  text_response: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  confidence_level: number | null;
  responded_at: string;
}

// ============================================================================
// Blog Types
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author_id: string;
  category_id: string | null;
  tags: string[];
  featured_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithAuthor extends BlogPost {
  author: Profile;
  category: BlogCategory | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogCommentWithUser extends BlogComment {
  user: Profile;
  replies?: BlogCommentWithUser[];
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  user_id: string;
  course_id: number | null;
  event_id: number | null;
  rating: number;
  title: string | null;
  comment: string;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends Review {
  user: Profile;
}

// ============================================================================
// Achievement & Gamification Types
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  badge_icon: string;
  badge_color: string;
  criteria: AchievementCriteria;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AchievementCriteria {
  type: 'course_completion' | 'assignment_score' | 'streak' | 'engagement';
  target: number;
  conditions?: Record<string, unknown>;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
}

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
}

// ============================================================================
// Learning Path Types
// ============================================================================

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: string;
  tags: string[];
  is_ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningPathStep {
  id: string;
  path_id: string;
  course_id: number | null;
  material_id: string | null;
  title: string;
  description: string | null;
  order: number;
  is_required: boolean;
  estimated_duration_minutes: number | null;
}

export interface LearningPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  completed_steps: string[];
  progress_percentage: number;
  started_at: string;
  completed_at: string | null;
}

// ============================================================================
// Content Tracking Types
// ============================================================================

export interface ContentView {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'video' | 'pdf' | 'article' | 'quiz';
  course_id: number | null;
  progress_percentage: number;
  completion_status: 'not_started' | 'in_progress' | 'completed';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  content_type: 'course' | 'material' | 'post' | 'video';
  content_id: string;
  notes: string | null;
  created_at: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'course' | 'assignment' | 'achievement' | 'announcement' | 'system';
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface UserAnalytics {
  user_id: string;
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_time_spent_minutes: number;
  average_score: number;
  achievements_earned: number;
  streak_days: number;
  last_active: string;
}

export interface CourseAnalytics {
  course_id: number;
  total_enrollments: number;
  active_students: number;
  completion_rate: number;
  average_rating: number;
  average_progress: number;
  total_revenue: number;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface SearchFilters {
  query?: string;
  category?: string;
  level?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  sortBy?: 'newest' | 'popular' | 'rating' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  facets: {
    categories: Record<string, number>;
    levels: Record<string, number>;
    tags: Record<string, number>;
  };
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  payment_id: string;
  invoice_number: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  issued_at: string;
  due_at: string;
  paid_at: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ============================================================================
// Vault Subscription Claim Types
// ============================================================================

export interface FamilyMemberInput {
  name: string;
  email: string;
  relationship: string;
}

export interface VaultClaim {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  vault_email: string;
  vault_subscription_end_date: string;
  declaration_accepted: boolean;
  family_members: FamilyMemberInput[] | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  family_pass_grant_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VaultClaimWithReviewer extends VaultClaim {
  reviewer?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface ClaimFormData {
  userName: string;
  userEmail: string;
  vaultEmail: string;
  vaultSubscriptionEndDate: Date;
  familyMembers: FamilyMemberInput[];
  declarationAccepted: boolean;
  termsAccepted: boolean;
}

export interface VaultSubscriber {
  id: string;
  email: string;
  subscription_end_date: string | null;
  last_verified_at: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VaultSubscriptionStatus {
  is_active: boolean;
  subscription_end_date: string | null;
  has_pending_claim: boolean;
  has_approved_claim: boolean;
}

export interface ProcessClaimRequest {
  claimId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
  grantEndDate?: string;
}

export interface ClaimStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
}

// ============================================================================
// Chatbot Analytics Types
// ============================================================================

export interface ChatbotSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end: string | null;
  duration_seconds: number | null;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  user_agent: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotTopic {
  id: string;
  name: string;
  description: string | null;
  keywords: string[];
  parent_topic_id: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ChatbotFeedback {
  id: string;
  message_id: string | null;
  session_id: string | null;
  user_id: string;
  rating: number; // 1-5
  feedback_type: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotAnalyticsRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  topic_id: string | null;
  message: string;
  response: string | null;
  sentiment_score: number | null; // -1.0 to 1.0
  response_time_ms: number | null;
  tokens_used: number | null;
  cost: number | null;
  error: string | null;
  created_at: string;
}

// Analytics View Types
export interface ChatbotSessionAnalytics {
  date: string;
  total_sessions: number;
  unique_users: number;
  avg_duration_seconds: number;
  avg_messages_per_session: number;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  mobile_sessions: number;
  desktop_sessions: number;
  tablet_sessions: number;
}

export interface ChatbotTopicAnalytics {
  topic_id: string;
  topic_name: string;
  color: string;
  message_count: number;
  unique_users: number;
  avg_sentiment: number;
  avg_response_time_ms: number;
  feedback_count: number;
  avg_rating: number;
}

export interface ChatbotSentimentAnalytics {
  date: string;
  total_messages: number;
  positive_messages: number;
  neutral_messages: number;
  negative_messages: number;
  avg_sentiment: number;
  min_sentiment: number;
  max_sentiment: number;
}

export interface ChatbotFeedbackSummary {
  date: string;
  total_feedback: number;
  positive_feedback: number; // rating >= 4
  neutral_feedback: number; // rating = 3
  negative_feedback: number; // rating <= 2
  avg_rating: number;
  helpful_count: number;
  not_helpful_count: number;
  incorrect_count: number;
  incomplete_count: number;
  perfect_count: number;
}

// ============================================================================
// Individual Learner Analytics Types
// ============================================================================

export interface IndividualLearnerSummary {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  organization_id: string | null;
  department: string | null;
  total_enrollments: number;
  completed_courses: number;
  in_progress_courses: number;
  avg_progress_percentage: number;
  total_time_spent_minutes: number;
  total_submissions: number;
  submitted_assignments: number;
  avg_assignment_score: number;
  highest_score: number;
  lowest_score: number;
  last_active_date: string | null;
  active_days_count: number;
  total_achievements: number;
  first_enrollment_date: string | null;
  latest_enrollment_date: string | null;
  learner_status: 'active' | 'inactive' | 'dormant';
}

export interface IndividualCoursePerformance {
  user_id: string;
  course_id: number;
  course_title: string;
  category: string | null;
  difficulty_level: string | null;
  learner_name: string | null;
  progress_percentage: number;
  time_spent_minutes: number;
  last_accessed: string;
  completed_at: string | null;
  enrolled_at: string;
  enrollment_status: string;
  assignment_count: number;
  submitted_count: number;
  avg_assignment_score: number;
  days_to_complete: number | null;
  days_since_last_access: number;
  engagement_score: number;
}

export interface LearningVelocity {
  user_id: string;
  week_start: string;
  active_courses: number;
  weekly_time_spent: number;
  avg_progress: number;
  active_days_in_week: number;
}

export interface AssessmentPattern {
  user_id: string;
  learner_name: string | null;
  total_assignments: number;
  submitted_count: number;
  overdue_count: number;
  on_time_count: number;
  late_count: number;
  avg_score: number;
  score_stddev: number;
  avg_hours_to_submit: number;
  improvement_trend: number | null;
  recent_avg_score: number | null;
}

export interface EngagementTimeline {
  user_id: string;
  activity_date: string;
  event_type: string;
  event_count: number;
  first_event_time: string;
  last_event_time: string;
  session_duration_minutes: number;
}

export interface AtRiskLearner {
  user_id: string;
  full_name: string | null;
  organization_id: string | null;
  department: string | null;
  learner_status: 'active' | 'inactive' | 'dormant';
  avg_progress_percentage: number;
  total_time_spent_minutes: number;
  days_inactive: number;
  risk_score: number;
  recommended_action: string;
  in_progress_courses: number;
  completed_courses: number;
}

export interface LearningPathProgressDetailed {
  user_id: string;
  learning_path_id: string;
  path_title: string;
  path_description: string | null;
  learner_name: string | null;
  current_step: number;
  progress_percentage: number;
  completed_at: string | null;
  started_at: string;
  total_steps: number;
  completed_steps: number;
  days_in_progress: number;
  days_to_complete: number | null;
  estimated_days_to_complete: number | null;
}

export interface SkillsProgress {
  user_id: string;
  learner_name: string | null;
  skill_name: string;
  skill_category: string | null;
  courses_with_skill: number;
  completed_courses_with_skill: number;
  avg_progress_in_skill: number;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ManagerDirectReport {
  manager_id: string;
  manager_name: string | null;
  report_user_id: string;
  report_name: string | null;
  department: string | null;
  learner_status: 'active' | 'inactive' | 'dormant';
  total_enrollments: number;
  completed_courses: number;
  in_progress_courses: number;
  avg_progress_percentage: number;
  avg_assignment_score: number;
  total_time_spent_minutes: number;
  last_active_date: string | null;
  risk_score: number | null;
  recommended_action: string | null;
}

export interface LearnerInsight {
  metric_name: string;
  metric_value: string;
  metric_category: string;
  trend: string;
}

// ============================================================================
// Analytics Preferences Types
// ============================================================================

export interface AnalyticsPreferences {
  id: string;
  user_id: string;
  real_time_enabled: boolean;
  auto_refresh_interval: number; // milliseconds: 120000, 180000, 300000
  chatbot_analytics_refresh: boolean;
  learner_analytics_refresh: boolean;
  manager_dashboard_refresh: boolean;
  show_refresh_indicator: boolean;
  show_real_time_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsPreferencesUpdate {
  real_time_enabled?: boolean;
  auto_refresh_interval?: number;
  chatbot_analytics_refresh?: boolean;
  learner_analytics_refresh?: boolean;
  manager_dashboard_refresh?: boolean;
  show_refresh_indicator?: boolean;
  show_real_time_notifications?: boolean;
}

export interface RefreshState {
  isRefreshing: boolean;
  lastRefreshed: Date | null;
  nextRefreshIn: number | null; // seconds
  autoRefreshEnabled: boolean;
  realTimeConnected: boolean;
}

// ============================================================================
// Date Range & Comparison Types
// ============================================================================

/**
 * Date range for filtering analytics data
 */
export interface DateRange {
  start: string; // ISO date format: YYYY-MM-DD
  end: string; // ISO date format: YYYY-MM-DD
}

/**
 * Comparison date ranges (current + comparison period)
 */
export interface ComparisonDateRange {
  current: DateRange;
  comparison: DateRange;
}

/**
 * Analytics data with comparison support
 */
export interface AnalyticsDataWithComparison<T> {
  current: T;
  comparison: T | null;
  delta?: number; // Absolute difference
  percentageChange?: number; // Percentage change from comparison to current
}

/**
 * Date range preference stored in database
 */
export interface DateRangePreference {
  preset: string; // Preset option name
  startDate: string; // ISO date format
  endDate: string; // ISO date format
  lastUpdated: string; // ISO timestamp
}
