import { useState, useEffect } from 'react';
import { BlogService } from '@/services/blog/BlogService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';

export default function BlogManager() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Form state for new/edit post
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    status: 'draft' as BlogPost['status'],
    is_featured: false,
    allow_comments: true,
    meta_title: '',
    meta_description: '',
  });

  // Form state for new category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6B46C1',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsData, categoriesData] = await Promise.all([
        BlogService.getPosts({ status: undefined }), // Get all posts
        BlogService.getCategories(),
      ]);
      setPosts(postsData.posts);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blog data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category_id: '',
      status: 'draft',
      is_featured: false,
      allow_comments: true,
      meta_title: '',
      meta_description: '',
    });
    setIsPostDialogOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image: post.featured_image || '',
      category_id: post.category_id || '',
      status: post.status,
      is_featured: post.is_featured,
      allow_comments: post.allow_comments,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
    });
    setIsPostDialogOpen(true);
  };

  const handleSavePost = async () => {
    try {
      if (editingPost) {
        await BlogService.updatePost(editingPost.id, postForm);
        toast({
          title: 'Success',
          description: 'Post updated successfully',
        });
      } else {
        await BlogService.createPost(postForm);
        toast({
          title: 'Success',
          description: 'Post created successfully',
        });
      }
      setIsPostDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await BlogService.deletePost(postId);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCategory = async () => {
    try {
      await BlogService.createCategory(categoryForm);
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
      setIsCategoryDialogOpen(false);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        color: '#6B46C1',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-gray-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'archived':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Blog Management</h2>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>
                  Add a new category for blog posts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    placeholder="e.g., Technology"
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={categoryForm.slug}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, slug: e.target.value })
                    }
                    placeholder="e.g., technology"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Category description..."
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, color: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCategory}>Create Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((p) => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((p) => p.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>Manage your blog content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          /{post.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category_name && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: post.category_color,
                            color: post.category_color,
                          }}
                        >
                          {post.category_name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.author_name}</TableCell>
                    <TableCell>{formatDate(post.published_at)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{post.view_count || 0} views</div>
                        <div>{post.like_count || 0} likes</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Post Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={postForm.title}
                  onChange={(e) =>
                    setPostForm({ ...postForm, title: e.target.value })
                  }
                  placeholder="Post title"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={postForm.slug}
                  onChange={(e) =>
                    setPostForm({ ...postForm, slug: e.target.value })
                  }
                  placeholder="post-slug (auto-generated if empty)"
                />
              </div>
            </div>

            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={postForm.excerpt}
                onChange={(e) =>
                  setPostForm({ ...postForm, excerpt: e.target.value })
                }
                placeholder="Brief description of the post..."
                rows={2}
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={postForm.content}
                onChange={(e) =>
                  setPostForm({ ...postForm, content: e.target.value })
                }
                placeholder="Write your post content here..."
                rows={10}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={postForm.category_id}
                  onValueChange={(value) =>
                    setPostForm({ ...postForm, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={postForm.status}
                  onValueChange={(value) =>
                    setPostForm({
                      ...postForm,
                      status: value as BlogPost['status'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Featured Image URL</Label>
              <Input
                value={postForm.featured_image}
                onChange={(e) =>
                  setPostForm({ ...postForm, featured_image: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={postForm.meta_title}
                  onChange={(e) =>
                    setPostForm({ ...postForm, meta_title: e.target.value })
                  }
                  placeholder="SEO title (max 160 chars)"
                  maxLength={160}
                />
              </div>
              <div>
                <Label>Meta Description (SEO)</Label>
                <Input
                  value={postForm.meta_description}
                  onChange={(e) =>
                    setPostForm({ ...postForm, meta_description: e.target.value })
                  }
                  placeholder="SEO description (max 320 chars)"
                  maxLength={320}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={postForm.is_featured}
                    onCheckedChange={(checked) =>
                      setPostForm({ ...postForm, is_featured: checked })
                    }
                  />
                  <Label>Featured Post</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={postForm.allow_comments}
                    onCheckedChange={(checked) =>
                      setPostForm({ ...postForm, allow_comments: checked })
                    }
                  />
                  <Label>Allow Comments</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePost}>
              {editingPost ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}