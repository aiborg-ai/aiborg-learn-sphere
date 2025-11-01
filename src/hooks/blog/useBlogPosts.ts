import { useState, useEffect, useCallback } from 'react';
import { BlogService } from '@/services/blog/BlogService';
import type { BlogPost, BlogFilters } from '@/types/blog';
import { useToast } from '@/components/ui/use-toast';

import { logger } from '@/utils/logger';
export const useBlogPosts = (initialFilters: BlogFilters = {}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { posts: fetchedPosts, count } = await BlogService.getPosts(filters);
      setPosts(fetchedPosts);
      setTotalCount(count || 0);
    } catch (err) {
      logger.error('Error fetching blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const updateFilters = (newFilters: BlogFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return {
    posts,
    loading,
    error,
    totalCount,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchPosts,
  };
};

export const useBlogPost = (slug: string) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);
        const fetchedPost = await BlogService.getPostBySlug(slug);
        setPost(fetchedPost);
      } catch (err) {
        logger.error('Error fetching blog post:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
        toast({
          title: 'Error',
          description: 'Failed to load blog post',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, toast]);

  return { post, loading, error };
};
