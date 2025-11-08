/**
 * Type definitions for Team Management features
 */

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  industry?: string;
  size_range?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_role?: string; // Role of current user in this organization
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'member' | 'manager' | 'admin' | 'owner';
  department?: string;
  joined_at: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
    last_login?: string;
  };
  // Activity stats (from member_activity_summary view)
  courses_enrolled?: number;
  courses_completed?: number;
  courses_in_progress?: number;
  avg_course_progress?: number;
  assignments_total?: number;
  assignments_completed?: number;
  assignments_overdue?: number;
  assessments_taken?: number;
  avg_assessment_score?: number;
}

// ============================================================================
// Invitation Types
// ============================================================================

export interface TeamInvitation {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'member' | 'manager' | 'admin';
  department?: string;
  invited_by: string;
  invite_token: string;
  custom_message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  inviter?: {
    full_name?: string;
    email: string;
  };
  organizations?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

export interface TeamInvitationHistory {
  id: string;
  invitation_id: string;
  action: 'sent' | 'resent' | 'accepted' | 'expired' | 'cancelled';
  performed_by?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  performer?: {
    full_name?: string;
    email: string;
  };
}

export interface BulkInviteResult {
  successful: Array<{
    email: string;
    invitationId: string;
  }>;
  failed: Array<{
    email: string;
    error: string;
  }>;
  total: number;
}

// ============================================================================
// Course Assignment Types
// ============================================================================

export interface TeamCourseAssignment {
  id: string;
  organization_id: string;
  course_id: string;
  title: string;
  description?: string;
  assigned_by: string;
  is_mandatory: boolean;
  due_date?: string;
  notify_before_days: number;
  auto_enroll: boolean;
  total_assigned: number;
  total_started: number;
  total_completed: number;
  total_overdue: number;
  avg_completion_percentage: number;
  created_at: string;
  updated_at: string;
  course?: {
    id: string;
    title: string;
    image?: string;
    duration?: number;
  };
  assigner?: {
    full_name?: string;
    email: string;
  };
}

export interface TeamAssignmentUser {
  id: string;
  assignment_id: string;
  user_id: string;
  status: 'assigned' | 'started' | 'completed' | 'overdue';
  progress_percentage: number;
  enrollment_id?: string;
  assigned_at: string;
  enrolled_at?: string;
  started_at?: string;
  completed_at?: string;
  reminder_sent_at?: string;
  last_activity_at?: string;
  user?: {
    user_id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateAssignmentParams {
  organizationId: string;
  courseId: string;
  title: string;
  description?: string;
  userIds?: string[]; // Specific users
  departments?: string[]; // All users in these departments
  includeAllMembers?: boolean; // All org members
  isMandatory?: boolean;
  dueDate?: Date;
  notifyBeforeDays?: number;
  autoEnroll?: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface TeamProgressSummary {
  organization_id: string;
  organization_name: string;
  industry?: string;
  size_range?: string;
  total_members: number;
  active_members_7d: number;
  active_members_30d: number;
  total_enrollments: number;
  completed_enrollments: number;
  in_progress_enrollments: number;
  completion_rate_percentage: number;
  avg_progress_percentage: number;
  total_assignments: number;
  overdue_count: number;
  total_team_assessments: number;
  avg_assessment_score: number;
  organization_created_at: string;
}

export interface MemberActivitySummary {
  organization_id: string;
  organization_name: string;
  user_id: string;
  full_name?: string;
  email: string;
  org_role: string;
  department?: string;
  member_since: string;
  last_login?: string;
  courses_enrolled: number;
  courses_completed: number;
  courses_in_progress: number;
  avg_course_progress: number;
  assignments_total: number;
  assignments_completed: number;
  assignments_overdue: number;
  assessments_taken: number;
  avg_assessment_score: number;
  last_course_activity?: string;
  last_assignment_activity?: string;
}

export interface AssignmentCompletionSummary {
  assignment_id: string;
  organization_id: string;
  organization_name: string;
  course_id: string;
  course_title: string;
  course_image?: string;
  assignment_title: string;
  is_mandatory: boolean;
  due_date?: string;
  assigned_at: string;
  assigned_by_name?: string;
  total_assigned: number;
  total_started: number;
  total_completed: number;
  total_overdue: number;
  avg_completion_percentage: number;
  completion_rate_percentage: number;
  engagement_rate_percentage: number;
  status: 'no_due_date' | 'overdue' | 'due_soon' | 'on_track';
}

export interface TeamLearningTrend {
  organization_id: string;
  organization_name: string;
  date: string;
  enrollments: number;
  completions: number;
  assignment_completions: number;
}

export interface TopPerformer {
  user_id: string;
  full_name?: string;
  department?: string;
  courses_completed: number;
  avg_progress: number;
  avg_assessment_score: number;
  performance_score: number;
}

export interface DepartmentComparison {
  department: string;
  member_count: number;
  avg_courses_completed: number;
  avg_progress: number;
  avg_assessment_score: number;
}

export interface PopularCourse {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  completion_count: number;
  avg_progress: number;
  completion_rate: number;
}

export interface LearningVelocity {
  month: string;
  courses_completed: number;
  members_active: number;
  velocity: number; // Courses per active member
}

// ============================================================================
// Enhanced Team Analytics Types (8 New Metrics)
// ============================================================================

// METRIC 1: Skills Gap Analysis
export interface SkillsGap {
  skill_name: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  skill_category?: string;
  total_members: number;
  members_with_skill: number;
  members_without_skill: number;
  gap_percentage: number;
  related_courses: Array<{
    course_id: number;
    course_title: string;
    course_level?: string;
  }>;
}

// METRIC 2: Team Momentum Score
export interface TeamMomentum {
  week_start: string; // Date
  current_completions: number;
  prev_week_completions: number;
  week_over_week_change: number; // Percentage
  four_week_avg: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
}

export interface MomentumSummary {
  current_momentum: TeamMomentum;
  historical_trends: TeamMomentum[];
  overall_trend: 'accelerating' | 'stable' | 'decelerating';
  momentum_score: number; // 0-100
}

// METRIC 3: Collaboration Metrics
export interface CollaborationMetrics {
  course_id: number;
  course_title: string;
  teams_enrolled: number;
  total_learners: number;
  team_breakdown: Array<{
    team_id: string;
    team_name: string;
    member_count: number;
  }>;
}

export interface CollaborationSummary {
  total_cross_team_courses: number;
  avg_teams_per_course: number;
  most_collaborative_course: CollaborationMetrics;
  collaboration_score: number; // 0-100
}

// METRIC 4: Learning Path Effectiveness
export interface LearningPathEffectiveness {
  learning_path_id: string;
  path_title: string;
  difficulty_level: string;
  total_enrolled: number;
  total_completed: number;
  completion_rate: number;
  avg_days_to_complete: number;
  common_dropout_index?: number; // Course index where most dropouts occur
  total_courses_in_path?: number;
}

// METRIC 5: Time-to-Competency
export interface TimeToCompetency {
  course_id: number;
  course_title: string;
  course_level?: string;
  total_completions: number;
  avg_days: number;
  median_days: number;
  p90_days: number; // 90th percentile
  fastest_days: number;
}

export interface CompetencyFilters {
  department?: string;
  course_level?: string;
}

// METRIC 6: Team Health Score
export interface TeamHealthScore {
  engagement_score: number; // 0-100
  completion_rate: number; // 0-100
  activity_consistency: number; // 0-100
  on_time_rate: number; // 0-100
  velocity_score: number; // 0-100
  health_score: number; // 0-100 (weighted composite)
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface HealthScoreBreakdown extends TeamHealthScore {
  recommendations: string[];
  areas_of_concern: string[];
  strengths: string[];
}

// METRIC 7: Manager Dashboard Metrics
export interface ManagerMetrics {
  organization_id: string;
  organization_name: string;
  manager_department: string;
  direct_reports_count: number;
  avg_team_progress: number;
  team_completion_rate: number;
  active_members_week: number;
  members_with_overdue: number;
  team_members_detail: Array<{
    user_id: string;
    name: string;
    enrollments: number;
    completions: number;
    last_active?: string;
  }>;
}

export interface ManagerDashboardSummary extends ManagerMetrics {
  at_risk_members: Array<{
    user_id: string;
    name: string;
    risk_factors: string[];
  }>;
  top_performers: Array<{
    user_id: string;
    name: string;
    performance_score: number;
  }>;
}

// METRIC 8: ROI Metrics
export interface ROIMetrics {
  total_enrollments: number;
  total_completions: number;
  total_investment: number; // USD
  overall_completion_rate: number; // Percentage
  cost_per_enrollment: number; // USD
  cost_per_completion: number; // USD
  roi_ratio: number; // Completion rate as ratio
  course_breakdown: Array<{
    course: string;
    enrollments: number;
    completions: number;
    total_spent: number;
    cost_per_completion: number;
    completion_rate: number;
  }>;
}

export interface ROISummary extends ROIMetrics {
  best_value_courses: Array<{
    course: string;
    roi_score: number;
    completion_rate: number;
  }>;
  worst_value_courses: Array<{
    course: string;
    roi_score: number;
    completion_rate: number;
  }>;
  projected_annual_spend: number;
}

// ============================================================================
// Combined Enhanced Analytics Response
// ============================================================================
export interface EnhancedTeamAnalytics {
  organization_id: string;
  organization_name: string;
  generated_at: string;
  skills_gap?: SkillsGap[];
  momentum?: MomentumSummary;
  collaboration?: CollaborationSummary;
  learning_paths?: LearningPathEffectiveness[];
  time_to_competency?: TimeToCompetency[];
  health_score?: HealthScoreBreakdown;
  manager_metrics?: ManagerDashboardSummary;
  roi?: ROISummary;
}
