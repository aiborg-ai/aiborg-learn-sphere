/**
 * useForumVoting Hook
 * Manages upvote/downvote actions
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ForumVoteService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import type { VotableType, VoteType } from '@/types/forum';

export function useForumVoting(votableType: VotableType, votableId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's current vote
  const { data: userVote } = useQuery({
    queryKey: ['forum', 'vote', votableType, votableId],
    queryFn: () => ForumVoteService.getUserVote(votableType, votableId),
    enabled: !!votableId,
  });

  // Upvote mutation
  const upvote = useMutation({
    mutationFn: () => ForumVoteService.upvote(votableType, votableId),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['forum', 'vote', votableType, votableId],
      });

      const previousVote = queryClient.getQueryData(['forum', 'vote', votableType, votableId]);

      // Update to upvote optimistically
      queryClient.setQueryData(['forum', 'vote', votableType, votableId], 'upvote' as VoteType);

      return { previousVote };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'vote'] });
    },
    onError: (error: Error, _, context) => {
      // Revert optimistic update
      if (context?.previousVote !== undefined) {
        queryClient.setQueryData(['forum', 'vote', votableType, votableId], context.previousVote);
      }

      // Only show toast if not "Vote removed" (which is expected when toggling off)
      if (!error.message.includes('Vote removed')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to upvote',
          variant: 'destructive',
        });
      }
    },
  });

  // Downvote mutation
  const downvote = useMutation({
    mutationFn: () => ForumVoteService.downvote(votableType, votableId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['forum', 'vote', votableType, votableId],
      });

      const previousVote = queryClient.getQueryData(['forum', 'vote', votableType, votableId]);

      queryClient.setQueryData(['forum', 'vote', votableType, votableId], 'downvote' as VoteType);

      return { previousVote };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'vote'] });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousVote !== undefined) {
        queryClient.setQueryData(['forum', 'vote', votableType, votableId], context.previousVote);
      }

      if (!error.message.includes('Vote removed')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to downvote',
          variant: 'destructive',
        });
      }
    },
  });

  // Remove vote mutation
  const removeVote = useMutation({
    mutationFn: () => ForumVoteService.removeVote(votableType, votableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'vote'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove vote',
        variant: 'destructive',
      });
    },
  });

  return {
    userVote,
    upvote: upvote.mutate,
    downvote: downvote.mutate,
    removeVote: removeVote.mutate,
    isVoting: upvote.isPending || downvote.isPending || removeVote.isPending,
  };
}

export function useUserVotingStats(userId: string) {
  return useQuery({
    queryKey: ['forum', 'voting-stats', userId],
    queryFn: () => ForumVoteService.getUserVotingStats(userId),
    enabled: !!userId,
  });
}
