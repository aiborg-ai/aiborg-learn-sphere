/**
 * useForumCategories Hook
 * Manages forum categories with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumCategoryService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import type { ForumCategory } from '@/types/forum';

export function useForumCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all categories
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: () => ForumCategoryService.getCategories(),
  });

  // Get categories with stats
  const { data: categoriesWithStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['forum', 'categories', 'stats'],
    queryFn: () => ForumCategoryService.getCategoriesWithStats(),
  });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
    }) => ForumCategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: ({
      categoryId,
      updates,
    }: {
      categoryId: string;
      updates: Partial<ForumCategory>;
    }) => ForumCategoryService.updateCategory(categoryId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: (categoryId: string) => ForumCategoryService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  return {
    categories: categories || [],
    categoriesWithStats: categoriesWithStats || [],
    isLoading,
    isLoadingStats,
    error,
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
  };
}

export function useForumCategory(categorySlug: string) {
  const { toast } = useToast();

  const {
    data: category,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['forum', 'category', categorySlug],
    queryFn: () => ForumCategoryService.getCategoryBySlug(categorySlug),
    enabled: !!categorySlug,
  });

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load category',
      variant: 'destructive',
    });
  }

  return {
    category,
    isLoading,
    error,
  };
}
