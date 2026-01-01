import type { Database } from '@/integrations/supabase/types';
import type { User, Session } from '@supabase/supabase-js';

type Course = Database['public']['Tables']['courses']['Row'];
type Enrollment = Database['public']['Tables']['enrollments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type AssessmentResult = Database['public']['Tables']['assessment_results']['Row'];
type Material = Database['public']['Tables']['course_materials']['Row'];

// Type definitions for entities that might not be in the database types yet
interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  icon_url: string;
  earned_at: string;
}

interface Download {
  id: string;
  user_id: string;
  material_id: string;
  file_type: string;
  file_name: string;
  file_url: string;
  downloaded_at: string;
}

interface Bookmark {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  item_url: string;
  notes: string | null;
  created_at: string;
}

/**
 * Mock factory for creating test users
 */
export const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    role: 'authenticated',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }) as User;

/**
 * Mock factory for creating test sessions
 */
export const createMockSession = (userOverrides?: Partial<User>): Session =>
  ({
    user: createMockUser(userOverrides),
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  }) as Session;

/**
 * Mock factory for creating test profiles
 */
export const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'profile-123',
  user_id: 'user-123',
  display_name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  role: 'user',
  preferences: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  bio: null,
  skills: null,
  learning_goals: null,
  aiborg_points: 0,
  current_level: 1,
  total_xp: 0,
  ...overrides,
});

/**
 * Mock factory for creating test courses
 */
export const createMockCourse = (overrides?: Partial<Course>): Course => ({
  id: 'course-123',
  title: 'Introduction to AI',
  description: 'Learn the basics of artificial intelligence',
  instructor_id: '00000000-0000-0000-0000-000000000001',
  audience_type: 'professionals',
  price: 99.99,
  duration: '4 weeks',
  level: 'beginner',
  category: 'ai-fundamentals',
  tags: ['ai', 'machine-learning'],
  image_url: 'https://example.com/course.jpg',
  syllabus: null,
  learning_objectives: null,
  prerequisites: null,
  is_published: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  enrollment_count: 0,
  rating: null,
  ...overrides,
});

/**
 * Mock factory for creating test enrollments
 */
export const createMockEnrollment = (overrides?: Partial<Enrollment>): Enrollment => ({
  id: 'enrollment-123',
  user_id: 'user-123',
  course_id: 'course-123',
  enrolled_at: '2024-01-01T00:00:00Z',
  status: 'active',
  progress: 0,
  completed_at: null,
  payment_status: 'paid',
  payment_amount: 99.99,
  payment_id: 'payment-123',
  certificate_issued: false,
  last_accessed_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock factory for creating test course materials
 */
export const createMockMaterial = (overrides?: Partial<Material>): Material => ({
  id: 'material-123',
  course_id: 'course-123',
  title: 'Week 1: Introduction',
  type: 'video',
  url: 'https://example.com/video.mp4',
  description: 'Introduction to the course',
  order_index: 1,
  duration: 600,
  is_free: false,
  created_at: '2024-01-01T00:00:00Z',
  thumbnail_url: null,
  file_size: null,
  mime_type: 'video/mp4',
  ...overrides,
});

/**
 * Mock factory for creating test assessment results
 */
export const createMockAssessmentResult = (
  overrides?: Partial<AssessmentResult>
): AssessmentResult => ({
  id: 'assessment-123',
  user_id: 'user-123',
  assessment_type: 'ai-readiness',
  audience_type: 'professionals',
  score: 75,
  total_questions: 20,
  correct_answers: 15,
  responses: {},
  recommendations: [],
  profiling_data: null,
  completed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  ability_estimate: null,
  difficulty_level: null,
  time_taken_seconds: null,
  ...overrides,
});

/**
 * Mock factory for creating test badges
 */
export const createMockBadge = (overrides?: Partial<Badge>): Badge => ({
  id: 'badge-123',
  user_id: 'user-123',
  badge_type: 'first-course',
  badge_name: 'First Steps',
  badge_description: 'Completed your first course',
  icon_url: 'https://example.com/badge.png',
  earned_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock factory for creating test downloads
 */
export const createMockDownload = (overrides?: Partial<Download>): Download => ({
  id: 'download-123',
  user_id: 'user-123',
  material_id: 'material-123',
  file_type: 'pdf',
  file_name: 'course-notes.pdf',
  file_url: 'https://example.com/notes.pdf',
  downloaded_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock factory for creating test bookmarks
 */
export const createMockBookmark = (overrides?: Partial<Bookmark>): Bookmark => ({
  id: 'bookmark-123',
  user_id: 'user-123',
  item_type: 'course',
  item_id: 'course-123',
  item_title: 'Introduction to AI',
  item_url: '/course/course-123',
  notes: 'Great course!',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
