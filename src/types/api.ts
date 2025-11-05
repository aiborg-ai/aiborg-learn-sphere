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
