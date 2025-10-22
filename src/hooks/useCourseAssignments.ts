/**
 * useCourseAssignments Hook
 *
 * React Query hooks for course assignment operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourseAssignmentService } from '@/services/team';
import type { TeamCourseAssignment, CreateAssignmentParams } from '@/services/team/types';
import { useToast } from '@/components/ui/use-toast';

// Query keys
export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (orgId: string, filters?: unknown) => [...assignmentKeys.lists(), orgId, filters] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  users: (assignmentId: string) => [...assignmentKeys.all, 'users', assignmentId] as const,
  userAssignments: (userId: string, orgId?: string) =>
    [...assignmentKeys.all, 'userAssignments', userId, orgId] as const,
  stats: (assignmentId: string) => [...assignmentKeys.all, 'stats', assignmentId] as const,
};

// ============================================================================
// Assignment CRUD Hooks
// ============================================================================

/**
 * Get all assignments for an organization
 */
export function useAssignments(
  organizationId: string,
  filters?: {
    status?: 'active' | 'completed' | 'overdue';
    courseId?: string;
    isMandatory?: boolean;
  }
) {
  return useQuery({
    queryKey: assignmentKeys.list(organizationId, filters),
    queryFn: () => CourseAssignmentService.getAssignments(organizationId, filters),
    enabled: !!organizationId,
  });
}

/**
 * Get single assignment
 */
export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(assignmentId),
    queryFn: () => CourseAssignmentService.getAssignment(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Create new assignment
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: CreateAssignmentParams) =>
      CourseAssignmentService.createAssignment(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.list(variables.organizationId),
      });
      toast({
        title: 'Assignment created',
        description: `${data.title} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update assignment
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      assignmentId,
      updates,
    }: {
      assignmentId: string;
      updates: Partial<TeamCourseAssignment>;
    }) => CourseAssignmentService.updateAssignment(assignmentId, updates),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.detail(data.id),
      });
      toast({
        title: 'Assignment updated',
        description: 'Assignment has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete assignment
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assignmentId: string) => CourseAssignmentService.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast({
        title: 'Assignment deleted',
        description: 'Assignment has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Assignment User Hooks
// ============================================================================

/**
 * Get all users assigned to an assignment
 */
export function useAssignmentUsers(assignmentId: string) {
  return useQuery({
    queryKey: assignmentKeys.users(assignmentId),
    queryFn: () => CourseAssignmentService.getAssignmentUsers(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Get assignments for a specific user
 */
export function useUserAssignments(
  userId: string,
  organizationId?: string,
  status?: 'assigned' | 'started' | 'completed' | 'overdue'
) {
  return useQuery({
    queryKey: assignmentKeys.userAssignments(userId, organizationId),
    queryFn: () => CourseAssignmentService.getUserAssignments(userId, organizationId, status),
    enabled: !!userId,
  });
}

/**
 * Assign users to an assignment
 */
export function useAssignUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ assignmentId, userIds }: { assignmentId: string; userIds: string[] }) =>
      CourseAssignmentService.assignUsers(assignmentId, userIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.users(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.detail(variables.assignmentId),
      });
      toast({
        title: 'Users assigned',
        description: `${variables.userIds.length} user(s) assigned successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Assignment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove user from assignment
 */
export function useRemoveUserFromAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ assignmentId, userId }: { assignmentId: string; userId: string }) =>
      CourseAssignmentService.removeUser(assignmentId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.users(variables.assignmentId),
      });
      toast({
        title: 'User removed',
        description: 'User has been removed from the assignment.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Reminder Hooks
// ============================================================================

/**
 * Send reminder to a single user
 */
export function useSendReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ assignmentId, userId }: { assignmentId: string; userId: string }) =>
      CourseAssignmentService.sendReminder(assignmentId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.users(variables.assignmentId),
      });
      toast({
        title: 'Reminder sent',
        description: 'Reminder has been sent successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reminder failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Send bulk reminders to all pending users
 */
export function useSendBulkReminders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assignmentId: string) => CourseAssignmentService.sendBulkReminders(assignmentId),
    onSuccess: (count, assignmentId) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.users(assignmentId),
      });
      toast({
        title: 'Reminders sent',
        description: `${count} reminder(s) sent successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reminders failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Statistics Hooks
// ============================================================================

/**
 * Get completion statistics for assignment
 */
export function useCompletionStats(assignmentId: string) {
  return useQuery({
    queryKey: assignmentKeys.stats(assignmentId),
    queryFn: () => CourseAssignmentService.getCompletionStats(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Get average completion time
 */
export function useAverageCompletionTime(assignmentId: string) {
  return useQuery({
    queryKey: [...assignmentKeys.stats(assignmentId), 'avgTime'],
    queryFn: () => CourseAssignmentService.getAverageCompletionTime(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Get department-wise stats
 */
export function useDepartmentStats(assignmentId: string) {
  return useQuery({
    queryKey: [...assignmentKeys.stats(assignmentId), 'departments'],
    queryFn: () => CourseAssignmentService.getDepartmentStats(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Refresh assignment statistics
 */
export function useRefreshStatistics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => CourseAssignmentService.refreshStatistics(assignmentId),
    onSuccess: (_data, assignmentId) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.detail(assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.stats(assignmentId),
      });
    },
  });
}
