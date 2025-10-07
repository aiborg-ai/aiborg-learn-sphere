import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

import { logger } from '@/utils/logger';
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  like_count?: number;
}

interface BlogComment {
  id: string;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  blog_posts?: { title: string };
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  pendingComments: number;
  totalCategories: number;
  totalTags: number;
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  recentComments: BlogComment[];
}

function BlogCMSDashboard() {
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch post counts
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, status, view_count, like_count, comment_count');

      if (postsError) throw postsError;

      const totalPosts = posts?.length || 0;
      const publishedPosts = posts?.filter(p => p.status === 'published').length || 0;
      const draftPosts = posts?.filter(p => p.status === 'draft').length || 0;
      const totalViews = posts?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
      const totalLikes = posts?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0;
      const totalComments = posts?.reduce((sum, p) => sum + (p.comment_count || 0), 0) || 0;

      // Fetch pending comments count
      const { count: pendingComments } = await supabase
        .from('blog_comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch categories count
      const { count: totalCategories } = await supabase
        .from('blog_categories')
        .select('*', { count: 'exact', head: true });

      // Fetch tags count
      const { count: totalTags } = await supabase
        .from('blog_tags')
        .select('*', { count: 'exact', head: true });

      // Fetch recent posts
      const { data: recentPosts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, view_count')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch popular posts
      const { data: popularPosts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, view_count, like_count')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5);

      // Fetch recent comments
      const { data: recentComments } = await supabase
        .from('blog_comments')
        .select(
          `
          id,
          content,
          status,
          created_at,
          user_id,
          blog_posts!inner(title)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews,
        totalLikes,
        totalComments,
        pendingComments: pendingComments || 0,
        totalCategories: totalCategories || 0,
        totalTags: totalTags || 0,
        recentPosts: recentPosts || [],
        popularPosts: popularPosts || [],
        recentComments: recentComments || [],
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p>Failed to load dashboard statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Button asChild className="btn-hero">
          <Link to="/cms/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
            <p className="text-xs text-muted-foreground">Total likes received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingComments > 0 && (
                <span className="text-warning">{stats.pendingComments} pending</span>
              )}
              {stats.pendingComments === 0 && 'All moderated'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts yet</p>
              )}
              {stats.recentPosts.map(post => (
                <div key={post.id} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-sm font-medium truncate hover:text-primary block"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {post.status === 'published' ? 'Published' : 'Draft'} • {post.view_count || 0}{' '}
                      views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts yet</p>
              )}
              {stats.popularPosts.map(post => (
                <div key={post.id} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-sm font-medium truncate hover:text-primary block"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {post.view_count || 0} views • {post.like_count || 0} likes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Comments
              {stats.pendingComments > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-warning/20 text-warning rounded">
                  {stats.pendingComments} pending
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentComments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}
              {stats.recentComments.map(comment => (
                <div key={comment.id} className="space-y-1">
                  <p className="text-sm truncate">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">on "{comment.blog_posts?.title}"</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        comment.status === 'approved'
                          ? 'bg-green-500/20 text-green-600'
                          : comment.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-red-500/20 text-red-600'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTags}</p>
                <p className="text-xs text-muted-foreground">Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.publishedPosts}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.draftPosts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BlogCMSDashboard;
