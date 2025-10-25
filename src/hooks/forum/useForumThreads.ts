/**
 * useForumThreads Hook
 * Manages forum threads with filtering and pagination
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { ForumThreadService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import type { ThreadFilters, CreateThreadRequest, UpdateThreadRequest } from '@/types/forum';

export function useForumThreads(filters: ThreadFilters = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['forum', 'threads', filters],
      queryFn: ({ pageParam = 1 }) =>
        ForumThreadService.getThreads({
          ...filters,
          page: pageParam,
        }),
      getNextPageParam: lastPage => (lastPage.has_more ? lastPage.page + 1 : undefined),
      initialPageParam: 1,
    });

  // Flatten pages for easier consumption
  const threads = data?.pages.flatMap(page => page.data) || [];
  const pinnedThreads = data?.pages[0]?.pinned_threads || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Create thread mutation
  const createThread = useMutation({
    mutationFn: (data: CreateThreadRequest) => ForumThreadService.createThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast({
        title: 'Success',
        description: 'Thread created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create thread',
        variant: 'destructive',
      });
    },
  });

  // Update thread mutation
  const updateThread = useMutation({
    mutationFn: ({ threadId, updates }: { threadId: string; updates: UpdateThreadRequest }) =>
      ForumThreadService.updateThread(threadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      toast({
        title: 'Success',
        description: 'Thread updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update thread',
        variant: 'destructive',
      });
    },
  });

  // Delete thread mutation
  const deleteThread = useMutation({
    mutationFn: (threadId: string) => ForumThreadService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
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

  // Toggle pin mutation
  const togglePin = useMutation({
    mutationFn: (threadId: string) => ForumThreadService.togglePinThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      toast({
        title: 'Success',
        description: 'Thread pin status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle pin',
        variant: 'destructive',
      });
    },
  });

  // Toggle lock mutation
  const toggleLock = useMutation({
    mutationFn: (threadId: string) => ForumThreadService.toggleLockThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      toast({
        title: 'Success',
        description: 'Thread lock status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle lock',
        variant: 'destructive',
      });
    },
  });

  return {
    threads,
    pinnedThreads,
    totalCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createThread: createThread.mutate,
    updateThread: updateThread.mutate,
    deleteThread: deleteThread.mutate,
    togglePin: togglePin.mutate,
    toggleLock: toggleLock.mutate,
    isCreating: createThread.isPending,
    isUpdating: updateThread.isPending,
    isDeleting: deleteThread.isPending,
  };
}

export function useForumThread(threadId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: thread,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['forum', 'thread', threadId],
    queryFn: () => ForumThreadService.getThreadById(threadId),
    enabled: !!threadId,
  });

  // Bookmark mutations
  const { data: isBookmarked } = useQuery({
    queryKey: ['forum', 'thread', threadId, 'bookmarked'],
    queryFn: async () => thread?.is_bookmarked || false,
    enabled: !!thread,
  });

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load thread',
      variant: 'destructive',
    });
  }

  return {
    thread,
    isBookmarked,
    isLoading,
    error,
    refreshThread: () => queryClient.invalidateQueries({ queryKey: ['forum', 'thread', threadId] }),
  };
}

export function useTrendingThreads(limit: number = 10) {
  return useQuery({
    queryKey: ['forum', 'threads', 'trending', limit],
    queryFn: () => ForumThreadService.getTrendingThreads(limit),
  });
}

export function useHotThreads(limit: number = 10) {
  return useQuery({
    queryKey: ['forum', 'threads', 'hot', limit],
    queryFn: () => ForumThreadService.getHotThreads(limit),
  });
}
