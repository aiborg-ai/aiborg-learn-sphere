/**
 * Blog Stats Service
 * Handles blog analytics and statistics
 */

import { supabase } from '@/integrations/supabase/client';
import type { BlogStats } from '@/types/blog';
import { BlogPostService } from './BlogPostService';

export class BlogStatsService {
  /**
   * Get comprehensive blog statistics (admin only)
   */
  static async getBlogStats(): Promise<BlogStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user?.id || '')
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Get various stats
    const [
      postsCount,
      viewsSum,
      likesCount,
      commentsCount,
      sharesCount,
      monthlyPosts,
      trendingPosts,
      popularCategories,
    ] = await Promise.all([
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('view_count'),
      supabase.from('blog_likes').select('*', { count: 'exact', head: true }),
      supabase.from('blog_comments').select('*', { count: 'exact', head: true }),
      supabase.from('blog_shares').select('*', { count: 'exact', head: true }),
      supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      BlogPostService.getPosts({ sortBy: 'trending', limit: 5 }),
      supabase
        .from('blog_categories')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(5),
    ]);

    const totalViews = viewsSum.data?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

    return {
      total_posts: postsCount.count || 0,
      total_views: totalViews,
      total_likes: likesCount.count || 0,
      total_comments: commentsCount.count || 0,
      total_shares: sharesCount.count || 0,
      posts_this_month: monthlyPosts.count || 0,
      trending_posts: trendingPosts.posts,
      popular_categories: popularCategories.data || [],
    };
  }
}
