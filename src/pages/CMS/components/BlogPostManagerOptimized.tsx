import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination-controls';
import { TableSkeleton } from '@/components/ui/loading-states';
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
} from 'lucide-react';
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

/**
 * Optimized Blog Post Manager with pagination and query optimization
 * @returns {JSX.Element} Blog post management interface
 */
function BlogPostManagerOptimized() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();

  // Use the pagination hook with optimized queries
  const {
    data: posts,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    setPageSize,
    setFilters,
    setOrdering,
    refresh,
  } = usePagination<BlogPost>({
    table: 'blog_posts',
    selectFields: `
      *,
      blog_categories!inner(name, color),
      profiles!blog_posts_author_id_fkey(email)
    `,
    filters: statusFilter !== 'all' ? { status: statusFilter } : {},
    initialPageSize: 20,
    initialOrderBy: 'created_at',
    initialOrderDirection: 'desc',
    transform: (item: Record<string, unknown>) => ({
      ...item,
      category: item.blog_categories,
      author: item.profiles,
    }),
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply search filter
  useEffect(() => {
    if (debouncedSearch) {
      // For now, we'll filter client-side
      // In production, you'd want to implement server-side search
      logger.log('Search term:', debouncedSearch);
    }
  }, [debouncedSearch]);

  // Update filters when status changes
  useEffect(() => {
    setFilters(statusFilter !== 'all' ? { status: statusFilter } : {});
  }, [statusFilter, setFilters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      refresh();
    } catch (error) {
      logger.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${!currentStatus ? 'featured' : 'unfeatured'} successfully`,
      });
      refresh();
    } catch (error) {
      logger.error('Error toggling featured status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'published' && !posts.find(p => p.id === id)?.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase.from('blog_posts').update(updateData).eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post status updated successfully',
      });
      refresh();
    } catch (error) {
      logger.error('Error updating post status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      published: 'default',
      draft: 'secondary',
      scheduled: 'outline',
      archived: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Filter posts based on search term (client-side for now)
  const filteredPosts = posts.filter(
    post =>
      !debouncedSearch ||
      post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      post.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">Error loading posts: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Blog Posts</CardTitle>
            <Button onClick={() => setShowEditor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
        </CardHeader>

        <CardContent>
          {loading ? (
            <TableSkeleton rows={pageSize} columns={6} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Published</TableHead>
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
                              <Badge variant="outline" className="text-xs">
                                Sticky
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">/{post.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        {post.category && (
                          <Badge
                            style={{ backgroundColor: post.category.color }}
                            className="text-white"
                          >
                            {post.category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.author?.email?.split('@')[0] || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">❤️ {post.like_count}</span>
                          <span className="flex items-center gap-1">💬 {post.comment_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.published_at
                          ? format(new Date(post.published_at), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(`/blog/${post.slug}`);
                                toast({
                                  description: 'Link copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                            >
                              {post.is_featured ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Remove Featured
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Set Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            {post.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(post.id, 'published')}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(post.id, 'archived')}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                  loading={loading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <BlogPostEditor
          post={selectedPost}
          onClose={() => {
            setShowEditor(false);
            setSelectedPost(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

export default BlogPostManagerOptimized;
