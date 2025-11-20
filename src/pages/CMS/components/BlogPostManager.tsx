import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  Clock,
  FileText,
  Copy,
  ExternalLink,
} from '@/components/ui/icons';
import BlogPostEditor from './BlogPostEditor';
import { format } from 'date-fns';

import { logger } from '@/utils/logger';
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_sticky: boolean;
  category?: {
    name: string;
    color: string;
  };
  author?: {
    email: string;
  };
  reading_time: number;
  updated_at: string;
}

function BlogPostManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPosts is stable
  }, [statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('blog_posts')
        .select(
          `
          *,
          blog_categories(name, color),
          profiles!blog_posts_author_id_fkey(email)
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch {
      logger.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      fetchPosts();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updateData: { status: string; published_at?: string } = { status };

      if (status === 'published' && !posts.find(p => p.id === id)?.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase.from('blog_posts').update(updateData).eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${status === 'published' ? 'published' : `changed to ${status}`} successfully`,
      });
      fetchPosts();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update post status',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (id: string, is_featured: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !is_featured })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${!is_featured ? 'featured' : 'unfeatured'} successfully`,
      });
      fetchPosts();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const toggleSticky = async (id: string, is_sticky: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_sticky: !is_sticky })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${!is_sticky ? 'pinned' : 'unpinned'} successfully`,
      });
      fetchPosts();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update sticky status',
        variant: 'destructive',
      });
    }
  };

  const duplicatePost = async (post: BlogPost) => {
    try {
      const { data: originalPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', post.id)
        .single();

      if (fetchError) throw fetchError;

      const newPost = {
        ...originalPost,
        id: undefined,
        title: `${originalPost.title} (Copy)`,
        slug: `${originalPost.slug}-copy-${Date.now()}`,
        status: 'draft',
        published_at: null,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        created_at: undefined,
        updated_at: undefined,
      };

      const { error: insertError } = await supabase.from('blog_posts').insert(newPost);

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Post duplicated successfully',
      });
      fetchPosts();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate post',
        variant: 'destructive',
      });
    }
  };

  const filteredPosts = posts.filter(
    post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-600';
      case 'draft':
        return 'bg-gray-500/20 text-gray-600';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-600';
      case 'archived':
        return 'bg-red-500/20 text-red-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  if (showEditor) {
    return (
      <BlogPostEditor
        post={selectedPost}
        onClose={() => {
          setShowEditor(false);
          setSelectedPost(null);
          fetchPosts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <Button onClick={() => setShowEditor(true)} className="btn-hero">
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{post.title}</p>
                          {post.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                          {post.is_sticky && (
                            <Badge variant="secondary" className="text-xs">
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{post.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category && (
                        <Badge
                          style={{
                            backgroundColor: post.category.color + '20',
                            color: post.category.color,
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          {post.view_count || 0} views
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          {post.comment_count || 0} comments
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {post.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.published_at), 'MMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {format(new Date(post.updated_at), 'MMM d')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPost(post);
                              setShowEditor(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicatePost(post)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleFeatured(post.id, post.is_featured)}
                          >
                            {post.is_featured ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSticky(post.id, post.is_sticky)}>
                            {post.is_sticky ? 'Unpin' : 'Pin to Top'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {post.status !== 'published' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post.id, 'published')}
                            >
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status !== 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'draft')}>
                              Convert to Draft
                            </DropdownMenuItem>
                          )}
                          {post.status !== 'archived' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post.id, 'archived')}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BlogPostManager;
