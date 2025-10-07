import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type {
  Download,
  DownloadWithRelations,
  CreateDownloadInput,
  DownloadFilters,
  DownloadStats,
} from '@/types/content-access';

interface UseDownloadsOptions {
  filters?: DownloadFilters;
  autoLoad?: boolean;
}

export const useDownloads = (options: UseDownloadsOptions = {}) => {
  const { filters, autoLoad = true } = options;
  const [downloads, setDownloads] = useState<DownloadWithRelations[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch downloads with optional filters
  const fetchDownloads = useCallback(async () => {
    if (!user) {
      setDownloads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('downloads')
        .select(
          `
          *,
          material:course_materials(id, title, material_type, description),
          course:courses(id, title)
        `
        )
        .eq('user_id', user.id)
        .order('download_date', { ascending: false });

      // Apply filters
      if (filters?.course_id) {
        query = query.eq('course_id', filters.course_id);
      }

      if (filters?.file_type) {
        query = query.eq('file_type', filters.file_type);
      }

      if (filters?.date_from) {
        query = query.gte('download_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('download_date', filters.date_to);
      }

      if (filters?.search) {
        query = query.ilike('file_name', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDownloads((data || []) as DownloadWithRelations[]);
    } catch (err) {
      logger.error('Error fetching downloads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch downloads');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Fetch download statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: statsError } = await supabase
        .from('downloads')
        .select('file_type, file_size, access_count, material_id, material:course_materials(title)')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      if (!data) return;

      // Calculate stats
      const total_count = data.length;
      let total_size = 0;
      const by_type: Record<string, number> = {};
      const accessMap = new Map<string, { title: string; count: number }>();

      interface DownloadStatsData {
        file_type?: string;
        file_size?: number;
        access_count: number;
        material_id: string;
        material?: {
          title?: string;
        };
      }

      data.forEach((download: DownloadStatsData) => {
        // Sum file sizes
        if (download.file_size) {
          total_size += download.file_size;
        }

        // Count by type
        const fileType = download.file_type || 'other';
        by_type[fileType] = (by_type[fileType] || 0) + 1;

        // Track most accessed
        const materialId = download.material_id;
        const title = download.material?.title || 'Unknown';
        const current = accessMap.get(materialId) || { title, count: 0 };
        accessMap.set(materialId, {
          title,
          count: current.count + download.access_count,
        });
      });

      // Get top 5 most accessed
      const most_accessed = Array.from(accessMap.entries())
        .map(([material_id, { title, count }]) => ({
          material_id,
          material_title: title,
          access_count: count,
        }))
        .sort((a, b) => b.access_count - a.access_count)
        .slice(0, 5);

      setStats({
        total_count,
        total_size,
        by_type: by_type as Record<DownloadWithRelations['file_type'] & string, number>,
        most_accessed,
      });
    } catch (err) {
      logger.error('Error fetching download stats:', err);
    }
  }, [user]);

  // Track a new download
  const trackDownload = useCallback(
    async (input: CreateDownloadInput) => {
      if (!user) {
        throw new Error('User must be authenticated to track downloads');
      }

      try {
        // Check if already downloaded
        const { data: existing } = await supabase
          .from('downloads')
          .select('id, access_count')
          .eq('user_id', user.id)
          .eq('material_id', input.material_id)
          .single();

        if (existing) {
          // Update access count and last accessed
          const { data, error: updateError } = await supabase
            .from('downloads')
            .update({
              last_accessed: new Date().toISOString(),
              access_count: existing.access_count + 1,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          logger.log('Download access updated:', existing.id);
          await fetchDownloads();
          await fetchStats();
          return data as Download;
        } else {
          // Create new download record
          const { data, error: createError } = await supabase
            .from('downloads')
            .insert({
              user_id: user.id,
              ...input,
              device_info: input.device_info || {},
            })
            .select()
            .single();

          if (createError) throw createError;

          logger.log('Download tracked successfully:', data.id);
          await fetchDownloads();
          await fetchStats();
          return data as Download;
        }
      } catch (err) {
        logger.error('Error tracking download:', err);
        throw err;
      }
    },
    [user, fetchDownloads, fetchStats]
  );

  // Delete download record
  const deleteDownload = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete downloads');
      }

      try {
        const { error: deleteError } = await supabase
          .from('downloads')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        await fetchDownloads();
        await fetchStats();

        logger.log('Download record deleted:', id);
      } catch (err) {
        logger.error('Error deleting download:', err);
        throw err;
      }
    },
    [user, fetchDownloads, fetchStats]
  );

  // Check if material is downloaded
  const isDownloaded = useCallback(
    (materialId: string): boolean => {
      return downloads.some(d => d.material_id === materialId);
    },
    [downloads]
  );

  // Get download record for material
  const getDownload = useCallback(
    (materialId: string): DownloadWithRelations | null => {
      return downloads.find(d => d.material_id === materialId) || null;
    },
    [downloads]
  );

  // Clear all download history
  const clearAllDownloads = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to clear downloads');
    }

    try {
      const { error: deleteError } = await supabase
        .from('downloads')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchDownloads();
      await fetchStats();

      logger.log('All download records cleared');
    } catch (err) {
      logger.error('Error clearing downloads:', err);
      throw err;
    }
  }, [user, fetchDownloads, fetchStats]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchDownloads();
      fetchStats();
    }
  }, [autoLoad, fetchDownloads, fetchStats]);

  return {
    downloads,
    stats,
    loading,
    error,
    trackDownload,
    deleteDownload,
    clearAllDownloads,
    isDownloaded,
    getDownload,
    refetch: fetchDownloads,
    refetchStats: fetchStats,
  };
};

// Helper function to format file size
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// Helper to get device info
export const getDeviceInfo = () => {
  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
  };
};
