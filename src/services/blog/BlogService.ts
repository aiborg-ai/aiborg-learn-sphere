import { supabase } from '@/integrations/supabase/client';
import type {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogFilters,
  BlogStats
} from '@/types/blog';

export class BlogService {
  // Posts
  static async getPosts(filters: BlogFilters = {}) {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories(name, slug, color),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to published posts for public
      query = query.eq('status', 'published')
        .lte('published_at', new Date().toISOString());
    }

    if (filters.category) {
      query = query.eq('blog_categories.slug', filters.category);
    }

    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }

    if (filters.author) {
      query = query.eq('author_id', filters.author);
    }

    if (filters.search) {
      query = query.textSearch('title', filters.search, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'trending':
        // Trending: combination of recent + popular
        query = query
          .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('view_count', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to match our types
    const posts = (data || []).map(post => ({
      ...post,
      author_name: 'Admin',  // Default author name since profiles might not exist
      author_avatar: null,
      category_name: post.blog_categories?.name,
      category_slug: post.blog_categories?.slug,
      category_color: post.blog_categories?.color,
      tags: post.blog_post_tags?.map((pt: { blog_tags: BlogTag }) => pt.blog_tags) || []
    }));

    return { posts, count };
  }

  static async getPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories(name, slug, color),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    // Get engagement stats
    const [likes, comments, bookmarks] = await Promise.all([
      this.getPostLikeCount(data.id),
      this.getPostCommentCount(data.id),
      this.isPostBookmarked(data.id)
    ]);

    // Increment view count
    await this.incrementViewCount(data.id);

    return {
      ...data,
      author_name: 'Admin',  // Default author name
      author_avatar: null,
      author_bio: null,
      category_name: data.blog_categories?.name,
      category_slug: data.blog_categories?.slug,
      category_color: data.blog_categories?.color,
      tags: data.blog_post_tags?.map((pt: { blog_tags: BlogTag }) => pt.blog_tags) || [],
      like_count: likes,
      comment_count: comments,
      is_bookmarked: bookmarks
    };
  }

  static async createPost(post: Partial<BlogPost>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...post,
        author_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePost(id: string, updates: Partial<BlogPost>) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePost(id: string) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async incrementViewCount(postId: string) {
    const { error } = await supabase.rpc('increment', {
      table_name: 'blog_posts',
      column_name: 'view_count',
      row_id: postId
    });

    if (error) console.error('Failed to increment view count:', error);
  }

  // Categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as BlogCategory[];
  }

  static async createCategory(category: Partial<BlogCategory>) {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Tags
  static async getTags() {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('post_count', { ascending: false });

    if (error) throw error;
    return data as BlogTag[];
  }

  static async getPostTags(postId: string) {
    const { data, error } = await supabase
      .from('blog_post_tags')
      .select('blog_tags(*)')
      .eq('post_id', postId);

    if (error) throw error;
    return data?.map(item => item.blog_tags) || [];
  }

  static async updatePostTags(postId: string, tagIds: string[]) {
    // Remove existing tags
    await supabase
      .from('blog_post_tags')
      .delete()
      .eq('post_id', postId);

    // Add new tags
    if (tagIds.length > 0) {
      const { error } = await supabase
        .from('blog_post_tags')
        .insert(tagIds.map(tagId => ({ post_id: postId, tag_id: tagId })));

      if (error) throw error;
    }
  }

  // Comments
  static async getPostComments(postId: string) {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        profiles!blog_comments_user_id_fkey(display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform to hierarchical structure
    const comments = (data || []).map(comment => ({
      ...comment,
      user_name: comment.profiles?.display_name,
      user_avatar: comment.profiles?.avatar_url
    }));

    // Build tree structure for nested comments
    const commentMap = new Map();
    const rootComments: BlogComment[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  static async createComment(postId: string, content: string, parentId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId
      })
      .select(`
        *,
        profiles!blog_comments_user_id_fkey(display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: data.profiles?.display_name,
      user_avatar: data.profiles?.avatar_url
    };
  }

  static async updateComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('blog_comments')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }

  static async getPostCommentCount(postId: string) {
    const { count, error } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_approved', true);

    if (error) throw error;
    return count || 0;
  }

  // Likes
  static async likePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_likes')
      .insert({
        post_id: postId,
        user_id: user.id
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  }

  static async unlikePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async isPostLiked(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return !!data && !error;
  }

  static async getPostLikeCount(postId: string) {
    const { count, error } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  }

  // Bookmarks
  static async bookmarkPost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_bookmarks')
      .insert({
        post_id: postId,
        user_id: user.id
      });

    if (error && error.code !== '23505') throw error;
  }

  static async unbookmarkPost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async isPostBookmarked(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return !!data && !error;
  }

  static async getUserBookmarks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select(`
        blog_posts (
          *,
          profiles!blog_posts_author_id_fkey(display_name, avatar_url),
          blog_categories(name, slug, color)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(item => ({
      ...item.blog_posts,
      author_name: item.blog_posts?.profiles?.display_name,
      author_avatar: item.blog_posts?.profiles?.avatar_url,
      category_name: item.blog_posts?.blog_categories?.name,
      category_slug: item.blog_posts?.blog_categories?.slug,
      category_color: item.blog_posts?.blog_categories?.color
    })) || [];
  }

  // Shares
  static async sharePost(postId: string, platform: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('blog_shares')
      .insert({
        post_id: postId,
        user_id: user?.id || null,
        platform
      });

    if (error) throw error;
  }

  // Stats
  static async getBlogStats(): Promise<BlogStats> {
    const { data: { user } } = await supabase.auth.getUser();

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
      popularCategories
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
      this.getPosts({ sortBy: 'trending', limit: 5 }),
      supabase
        .from('blog_categories')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(5)
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
      popular_categories: popularCategories.data || []
    };
  }
}