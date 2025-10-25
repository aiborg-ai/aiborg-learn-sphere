/**
 * useForumModeration Hook
 * Manages moderation actions (ban, warn, delete, purge)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumModerationService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type {
  BanUserRequest,
  WarnUserRequest,
  CreateReportRequest,
  AssignModeratorRequest,
} from '@/types/forum';

export function useForumModeration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is moderator
  const { data: isModerator, isLoading: isCheckingModerator } = useQuery({
    queryKey: ['forum', 'is-moderator', user?.id],
    queryFn: () => (user?.id ? ForumModerationService.isModerator(user.id) : false),
    enabled: !!user?.id,
  });

  // Get pending reports
  const { data: pendingReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['forum', 'reports', 'pending'],
    queryFn: () => ForumModerationService.getPendingReports(),
    enabled: !!isModerator,
  });

  // Get moderator actions log
  const { data: moderatorActions, isLoading: isLoadingActions } = useQuery({
    queryKey: ['forum', 'moderator-actions'],
    queryFn: () => ForumModerationService.getModeratorActions(),
    enabled: !!isModerator,
  });

  // Ban user mutation
  const banUser = useMutation({
    mutationFn: (data: BanUserRequest) => ForumModerationService.banUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'User banned successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to ban user',
        variant: 'destructive',
      });
    },
  });

  // Unban user mutation
  const unbanUser = useMutation({
    mutationFn: (userId: string) => ForumModerationService.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'User unbanned successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unban user',
        variant: 'destructive',
      });
    },
  });

  // Warn user mutation
  const warnUser = useMutation({
    mutationFn: (data: WarnUserRequest) => ForumModerationService.warnUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'Warning issued successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue warning',
        variant: 'destructive',
      });
    },
  });

  // Purge user content mutation
  const purgeUserContent = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      ForumModerationService.purgeUserContent(userId, reason),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: `Purged ${data.threads_deleted} threads and ${data.posts_deleted} posts`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to purge user content',
        variant: 'destructive',
      });
    },
  });

  // Delete thread mutation
  const deleteThread = useMutation({
    mutationFn: ({ threadId, reason }: { threadId: string; reason: string }) =>
      ForumModerationService.deleteThread(threadId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'Thread deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete thread',
        variant: 'destructive',
      });
    },
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      ForumModerationService.deletePost(postId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    },
  });

  // Create report mutation
  const createReport = useMutation({
    mutationFn: (data: CreateReportRequest) => ForumModerationService.createReport(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content reported successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report content',
        variant: 'destructive',
      });
    },
  });

  // Review report mutation
  const reviewReport = useMutation({
    mutationFn: ({
      reportId,
      status,
      actionTaken,
    }: {
      reportId: string;
      status: 'reviewed' | 'actioned' | 'dismissed';
      actionTaken?: string;
    }) => ForumModerationService.reviewReport(reportId, status, actionTaken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderator-actions'] });
      toast({
        title: 'Success',
        description: 'Report reviewed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to review report',
        variant: 'destructive',
      });
    },
  });

  return {
    isModerator,
    isCheckingModerator,
    pendingReports: pendingReports || [],
    moderatorActions: moderatorActions || [],
    isLoadingReports,
    isLoadingActions,
    banUser: banUser.mutate,
    unbanUser: unbanUser.mutate,
    warnUser: warnUser.mutate,
    purgeUserContent: purgeUserContent.mutate,
    deleteThread: deleteThread.mutate,
    deletePost: deletePost.mutate,
    createReport: createReport.mutate,
    reviewReport: reviewReport.mutate,
    isBanning: banUser.isPending,
    isWarning: warnUser.isPending,
    isPurging: purgeUserContent.isPending,
  };
}

export function useModeratorAssignment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all moderators
  const { data: moderators, isLoading } = useQuery({
    queryKey: ['forum', 'moderators'],
    queryFn: () => ForumModerationService.getModerators(),
  });

  // Assign moderator mutation
  const assignModerator = useMutation({
    mutationFn: (data: AssignModeratorRequest) => ForumModerationService.assignModerator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderators'] });
      toast({
        title: 'Success',
        description: 'Moderator assigned successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign moderator',
        variant: 'destructive',
      });
    },
  });

  // Remove moderator mutation
  const removeModerator = useMutation({
    mutationFn: ({ userId, categoryId }: { userId: string; categoryId?: string }) =>
      ForumModerationService.removeModerator(userId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'moderators'] });
      toast({
        title: 'Success',
        description: 'Moderator removed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove moderator',
        variant: 'destructive',
      });
    },
  });

  return {
    moderators: moderators || [],
    isLoading,
    assignModerator: assignModerator.mutate,
    removeModerator: removeModerator.mutate,
    isAssigning: assignModerator.isPending,
    isRemoving: removeModerator.isPending,
  };
}

export function useUserModerationStatus(userId: string) {
  return useQuery({
    queryKey: ['forum', 'user-bans', userId],
    queryFn: () => ForumModerationService.getUserBans(userId),
    enabled: !!userId,
  });
}
