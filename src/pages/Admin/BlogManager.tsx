import { useState, useEffect } from 'react';
import { BlogService } from '@/services/blog/BlogService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { logger } from '@/utils/logger';
import {
  BlogManagerHeader,
  BlogStatsCards,
  BlogTable,
  CategoryDialog,
  PostDialog,
} from '@/components/blog-manager';

export default function BlogManager() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(50);

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
  }, [isAdmin, currentPage, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsData, categoriesData] = await Promise.all([
        BlogService.getPosts({
          status: undefined,
          page: currentPage,
          limit: pageSize,
        }),
        BlogService.getCategories(),
      ]);
      setPosts(postsData.posts);
      setTotalCount(postsData.count || 0);
      setCategories(categoriesData);
    } catch (error) {
      logger.error('Error fetching blog data:', error);
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
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image: post.featured_image || '',
      category_id: post.category_id || '',
      status: post.status || 'draft',
      is_featured: post.is_featured || false,
      allow_comments: post.allow_comments ?? true,
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
      logger.error('Error saving post:', error);
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
      logger.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePostStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      await BlogService.updatePost(post.id, { status: newStatus });
      toast({
        title: 'Success',
        description: `Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      });
      fetchData();
    } catch (error) {
      logger.error('Error updating post status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post status',
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
      logger.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handlePostFormChange = (field: string, value: string | boolean) => {
    setPostForm({ ...postForm, [field]: value });
  };

  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryForm({ ...categoryForm, [field]: value });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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
      <BlogManagerHeader
        onNewCategory={() => setIsCategoryDialogOpen(true)}
        onNewPost={handleCreatePost}
      />

      <BlogStatsCards posts={posts} totalCount={totalCount} categoriesCount={categories.length} />

      <BlogTable
        posts={posts}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        onToggleStatus={handleTogglePostStatus}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onView={slug => window.open(`/blog/${slug}`, '_blank')}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categoryForm={categoryForm}
        onFormChange={handleCategoryFormChange}
        onSubmit={handleCreateCategory}
      />

      <PostDialog
        open={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        editingPost={editingPost}
        postForm={postForm}
        categories={categories}
        onFormChange={handlePostFormChange}
        onSubmit={handleSavePost}
      />
    </div>
  );
}
