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
