/**
 * useForumPosts Hook
 * Manages forum posts with nested replies and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ForumPostService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CreatePostRequest, UpdatePostRequest } from '@/types/forum';

export function useForumPosts(threadId: string, sortBy: 'oldest' | 'newest' | 'top' = 'oldest') {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['forum', 'posts', threadId, sortBy],
    queryFn: () => ForumPostService.getThreadPosts(threadId, sortBy),
    enabled: !!threadId,
  });

  // Real-time subscription for new posts
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`forum_posts_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_posts',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          // Invalidate query to refetch posts
          queryClient.invalidateQueries({ queryKey: ['forum', 'posts', threadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  // Create post mutation
  const createPost = useMutation({
    mutationFn: (data: CreatePostRequest) => ForumPostService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', threadId] });
      toast({
        title: 'Success',
        description: 'Reply posted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post reply',
        variant: 'destructive',
      });
    },
  });

  // Update post mutation
  const updatePost = useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: UpdatePostRequest }) =>
      ForumPostService.updatePost(postId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', threadId] });
      toast({
        title: 'Success',
        description: 'Post updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post',
        variant: 'destructive',
      });
    },
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: (postId: string) => ForumPostService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', threadId] });
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

  // Mark best answer mutation
  const markBestAnswer = useMutation({
    mutationFn: (postId: string) => ForumPostService.markBestAnswer(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts', threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'thread', threadId] });
      toast({
        title: 'Success',
        description: 'Marked as best answer',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as best answer',
        variant: 'destructive',
      });
    },
  });

  // Update online status
  useEffect(() => {
    if (!threadId) return;

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      ForumPostService.updateOnlineStatus(threadId, false);
    }, 30000);

    // Initial update
    ForumPostService.updateOnlineStatus(threadId, false);

    return () => {
      clearInterval(interval);
    };
  }, [threadId]);

  return {
    posts: data?.posts || [],
    totalCount: data?.total_count || 0,
    onlineUsers: data?.online_users || [],
    isLoading,
    error,
    createPost: createPost.mutate,
    updatePost: updatePost.mutate,
    deletePost: deletePost.mutate,
    markBestAnswer: markBestAnswer.mutate,
    isCreating: createPost.isPending,
    isUpdating: updatePost.isPending,
    isDeleting: deletePost.isPending,
  };
}

export function useTypingIndicator(threadId: string) {
  const updateTyping = (isTyping: boolean) => {
    ForumPostService.updateOnlineStatus(threadId, isTyping);
  };

  return { updateTyping };
}
