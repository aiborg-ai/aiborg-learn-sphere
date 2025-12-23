/**
 * User Progress Types
 *
 * Type definitions for the User Progress Dashboard.
 */

// User summary data
export interface UserProgressSummary {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_activity_at?: string;

  // Lingo progress
  lingo_xp: number;
  lingo_streak: number;
  lingo_lessons_completed: number;

  // Course progress
  enrolled_courses: number;
  completed_courses: number;
  avg_course_progress: number;

  // Assessment progress
  assessments_taken: number;
  avg_assessment_score: number;
}

// Detailed Lingo progress
export interface UserLingoProgress {
  user_id: string;
  total_xp: number;
  current_streak: number;
  max_streak: number;
  lessons_completed: number;
  total_lessons: number;
  skill_breakdown: Record<
    string,
    {
      lessons_completed: number;
      total_lessons: number;
      xp_earned: number;
    }
  >;
  recent_activity: Array<{
    date: string;
    xp_earned: number;
    lessons_completed: number;
  }>;
}

// Detailed Course progress
export interface UserCourseProgress {
  user_id: string;
  enrollments: Array<{
    course_id: number;
    course_title: string;
    enrolled_at: string;
    progress_percent: number;
    completed_at?: string;
    status: 'active' | 'completed' | 'dropped';
  }>;
  total_enrolled: number;
  total_completed: number;
  avg_progress: number;
}

// Detailed Assessment progress
export interface UserAssessmentProgress {
  user_id: string;
  attempts: Array<{
    assessment_type: string;
    attempted_at: string;
    score: number;
    passed: boolean;
    time_taken?: number;
  }>;
  total_attempts: number;
  avg_score: number;
  pass_rate: number;
}

// Filter options
export interface UserProgressFilters {
  search: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  progressRange: {
    min: number;
    max: number;
  };
  enrolledCourseId?: number;
  role?: string;
  activityStatus?: 'all' | 'active' | 'inactive' | 'at_risk';
}

// Dashboard metrics
export interface UserProgressMetrics {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  at_risk_users: number;
  avg_completion_rate: number;
  avg_assessment_score: number;
  total_lingo_xp: number;
  avg_lingo_streak: number;
}

// Sort options
export type UserProgressSortField =
  | 'full_name'
  | 'email'
  | 'lingo_xp'
  | 'enrolled_courses'
  | 'avg_course_progress'
  | 'assessments_taken'
  | 'avg_assessment_score'
  | 'last_activity_at';

export interface UserProgressSort {
  field: UserProgressSortField;
  direction: 'asc' | 'desc';
}

// Pagination
export interface UserProgressPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Export format
export type UserProgressExportFormat = 'json' | 'csv';

// Dashboard tab
export type UserProgressTab = 'overview' | 'lingo' | 'courses' | 'assessments' | 'engagement';
