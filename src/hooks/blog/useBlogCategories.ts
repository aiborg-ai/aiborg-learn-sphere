import { useState, useEffect } from 'react';
import { BlogService } from '@/services/blog/BlogService';
import type { BlogCategory } from '@/types/blog';

import { logger } from '@/utils/logger';
export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await BlogService.getCategories();
        setCategories(data);
      } catch (err) {
        logger.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};