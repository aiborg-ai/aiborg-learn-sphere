/**
 * Course Assignment Service
 *
 * Handles all operations related to assigning courses to team members:
 * - Creating assignments
 * - Assigning to individuals, departments, or entire teams
 * - Tracking progress
 * - Sending reminders
 * - Managing assignment lifecycle
 *
 * @module services/team/CourseAssignmentService
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TeamCourseAssignment,
  TeamAssignmentUser,
  CreateAssignmentParams,
  AssignmentCompletionSummary,
} from './types';

export class CourseAssignmentService {
  // ============================================================================
  // Assignment CRUD Operations
  // ============================================================================

  /**
   * Create a new course assignment
   */
  static async createAssignment(params: CreateAssignmentParams): Promise<TeamCourseAssignment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('team_course_assignments')
      .insert({
        organization_id: params.organizationId,
        course_id: params.courseId,
        title: params.title,
        description: params.description,
        assigned_by: user.id,
        is_mandatory: params.isMandatory || false,
        due_date: params.dueDate?.toISOString(),
        notify_before_days: params.notifyBeforeDays || 3,
        auto_enroll: params.autoEnroll !== false, // Default true
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Determine which users to assign
    let userIds: string[] = [];

    if (params.includeAllMembers) {
      // Get all members of the organization
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', params.organizationId);

      if (membersError) throw membersError;
      userIds = members.map(m => m.user_id);
    } else if (params.departments && params.departments.length > 0) {
      // Get all members in specified departments
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', params.organizationId)
        .in('department', params.departments);

      if (membersError) throw membersError;
      userIds = members.map(m => m.user_id);
    } else if (params.userIds && params.userIds.length > 0) {
      // Use specified user IDs
      userIds = params.userIds;
    } else {
      throw new Error('Must specify userIds, departments, or includeAllMembers');
    }

    // Assign to users
    await this.assignUsers(assignment.id, userIds);

    return assignment;
  }

  /**
   * Get assignment by ID
   */
  static async getAssignment(assignmentId: string): Promise<TeamCourseAssignment> {
    const { data, error } = await supabase
      .from('team_course_assignments')
      .select(
        `
        *,
        course:course_id (
          id,
          title,
          image,
          duration
        ),
        assigner:assigned_by (
          full_name,
          email
        )
      `
      )
      .eq('id', assignmentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all assignments for an organization
   */
  static async getAssignments(
    organizationId: string,
    filters?: {
      status?: 'active' | 'completed' | 'overdue';
      courseId?: string;
      isMandatory?: boolean;
    }
  ): Promise<AssignmentCompletionSummary[]> {
    let query = supabase
      .from('assignment_completion_summary')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.isMandatory !== undefined) {
      query = query.eq('is_mandatory', filters.isMandatory);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('assigned_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Update assignment details
   */
  static async updateAssignment(
    assignmentId: string,
    updates: Partial<TeamCourseAssignment>
  ): Promise<TeamCourseAssignment> {
    const { data, error } = await supabase
      .from('team_course_assignments')
      .update({
        title: updates.title,
        description: updates.description,
        is_mandatory: updates.is_mandatory,
        due_date: updates.due_date,
        notify_before_days: updates.notify_before_days,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('team_course_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
  }

  // ============================================================================
  // Assignment User Management
  // ============================================================================

  /**
   * Assign course to specific users
   */
  static async assignUsers(assignmentId: string, userIds: string[]): Promise<void> {
    const assignmentUsers = userIds.map(userId => ({
      assignment_id: assignmentId,
      user_id: userId,
    }));

    const { error } = await supabase.from('team_assignment_users').insert(assignmentUsers);

    if (error) {
      // Ignore duplicate errors
      if (error.code !== '23505') {
        throw error;
      }
    }
  }

  /**
   * Remove user from assignment
   */
  static async removeUser(assignmentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_assignment_users')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get assignment users with progress
   */
  static async getAssignmentUsers(assignmentId: string): Promise<TeamAssignmentUser[]> {
    const { data, error } = await supabase
      .from('team_assignment_users')
      .select(
        `
        *,
        user:user_id (
          user_id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq('assignment_id', assignmentId)
      .order('assigned_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get user's assignments
   */
  static async getUserAssignments(
    userId: string,
    organizationId?: string,
    status?: 'assigned' | 'started' | 'completed' | 'overdue'
  ): Promise<TeamAssignmentUser[]> {
    let query = supabase
      .from('team_assignment_users')
      .select(
        `
        *,
        assignment:assignment_id (
          *,
          course:course_id (
            id,
            title,
            image,
            duration
          )
        )
      `
      )
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    if (organizationId) {
      query = query.eq('assignment.organization_id', organizationId);
    }

    query = query.order('assigned_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Update assignment user status
   */
  static async updateAssignmentUser(
    assignmentId: string,
    userId: string,
    updates: Partial<TeamAssignmentUser>
  ): Promise<TeamAssignmentUser> {
    const { data, error } = await supabase
      .from('team_assignment_users')
      .update({
        status: updates.status,
        progress_percentage: updates.progress_percentage,
      })
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Reminder & Notification Methods
  // ============================================================================

  /**
   * Send reminder to specific user about assignment
   */
  static async sendReminder(assignmentId: string, userId: string): Promise<void> {
    // TODO: Implement via edge function
    // For now, just update reminder_sent_at
    const { error } = await supabase
      .from('team_assignment_users')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Send reminders to all users with pending assignments
   */
  static async sendBulkReminders(assignmentId: string): Promise<number> {
    const _assignment = await this.getAssignment(assignmentId);
    const users = await this.getAssignmentUsers(assignmentId);

    // Filter users who need reminders
    const usersNeedingReminders = users.filter(
      u => u.status !== 'completed' && !u.reminder_sent_at
    );

    // Send reminders
    for (const user of usersNeedingReminders) {
      await this.sendReminder(assignmentId, user.user_id);
    }

    return usersNeedingReminders.length;
  }

  /**
   * Get assignments due soon (for reminder cron job)
   */
  static async getAssignmentsDueSoon(daysAhead: number = 3): Promise<TeamCourseAssignment[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('team_course_assignments')
      .select('*')
      .lte('due_date', targetDate.toISOString())
      .gte('due_date', new Date().toISOString());

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Statistics & Analytics
  // ============================================================================

  /**
   * Refresh assignment statistics (should be called periodically)
   */
  static async refreshStatistics(assignmentId: string): Promise<void> {
    const { error } = await supabase.rpc('update_assignment_statistics', {
      p_assignment_id: assignmentId,
    });

    if (error) throw error;
  }

  /**
   * Get completion statistics for assignment
   */
  static async getCompletionStats(assignmentId: string): Promise<{
    total: number;
    assigned: number;
    started: number;
    completed: number;
    overdue: number;
    completionRate: number;
    engagementRate: number;
  }> {
    const assignment = await this.getAssignment(assignmentId);

    const completionRate =
      assignment.total_assigned > 0
        ? (assignment.total_completed / assignment.total_assigned) * 100
        : 0;

    const engagementRate =
      assignment.total_assigned > 0
        ? (assignment.total_started / assignment.total_assigned) * 100
        : 0;

    return {
      total: assignment.total_assigned,
      assigned: assignment.total_assigned - assignment.total_started,
      started: assignment.total_started - assignment.total_completed - assignment.total_overdue,
      completed: assignment.total_completed,
      overdue: assignment.total_overdue,
      completionRate: Math.round(completionRate * 100) / 100,
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  }

  /**
   * Get average completion time for assignment
   */
  static async getAverageCompletionTime(assignmentId: string): Promise<number | null> {
    const users = await this.getAssignmentUsers(assignmentId);
    const completedUsers = users.filter(u => u.completed_at && u.started_at);

    if (completedUsers.length === 0) return null;

    const totalTime = completedUsers.reduce((sum, u) => {
      const startTime = new Date(u.started_at!).getTime();
      const completedTime = new Date(u.completed_at!).getTime();
      return sum + (completedTime - startTime);
    }, 0);

    // Return average time in days
    const avgMilliseconds = totalTime / completedUsers.length;
    return avgMilliseconds / (1000 * 60 * 60 * 24);
  }

  /**
   * Get department-wise completion stats
   */
  static async getDepartmentStats(assignmentId: string): Promise<
    Array<{
      department: string;
      total: number;
      completed: number;
      completionRate: number;
    }>
  > {
    const { data, error } = await supabase.rpc('get_assignment_department_stats', {
      p_assignment_id: assignmentId,
    });

    if (error) {
      // Fallback if function doesn't exist
      const users = await this.getAssignmentUsers(assignmentId);
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, department')
        .in(
          'user_id',
          users.map(u => u.user_id)
        );

      const deptMap = new Map<string, { total: number; completed: number }>();

      users.forEach(u => {
        const member = members?.find(m => m.user_id === u.user_id);
        const dept = member?.department || 'Unassigned';

        if (!deptMap.has(dept)) {
          deptMap.set(dept, { total: 0, completed: 0 });
        }

        const stats = deptMap.get(dept)!;
        stats.total++;
        if (u.status === 'completed') {
          stats.completed++;
        }
      });

      return Array.from(deptMap.entries()).map(([department, stats]) => ({
        department,
        total: stats.total,
        completed: stats.completed,
        completionRate: (stats.completed / stats.total) * 100,
      }));
    }

    return data;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if user has access to assignment
   */
  static async canAccessAssignment(userId: string, assignmentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('team_assignment_users')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Mark overdue assignments (should be run daily via cron)
   */
  static async markOverdueAssignments(): Promise<number> {
    const { data, error } = await supabase.rpc('mark_overdue_assignments');

    if (error) throw error;
    return data;
  }
}
