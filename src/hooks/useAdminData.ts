import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import type { UserProfile } from '@/components/admin/UserManagement';
import type { Enrollment } from '@/components/admin/EnrollmentManagement';
import type { Announcement } from '@/components/admin/AnnouncementManagementEnhanced';

interface Course {
  id: number;
  title: string;
  description: string;
  audiences?: string[];
  [key: string]: unknown;
}

interface AdminData {
  users: UserProfile[];
  courses: Course[];
  announcements: Announcement[];
  enrollments: Enrollment[];
}

interface UseAdminDataReturn extends AdminData {
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage admin dashboard data
 * @returns Admin data, loading state, and refetch function
 */
export function useAdminData(): UseAdminDataReturn {
  const [data, setData] = useState<AdminData>({
    users: [],
    courses: [],
    announcements: [],
    enrollments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch courses with audiences
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(
          `
          *,
          course_audiences(audience)
        `
        )
        .order('sort_order', { ascending: true });

      if (coursesError) throw coursesError;

      const coursesWithAudiences = (coursesData || []).map((course) => ({
        ...course,
        audiences:
          course.course_audiences?.map((ca: { audience: string }) => ca.audience) || [],
      }));

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch enrollments (non-fatal - page works even if this fails)
      let enrollmentsData: Enrollment[] = [];
      try {
        const { data, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*')
          .order('enrolled_at', { ascending: false });

        if (enrollmentsError) throw enrollmentsError;
        enrollmentsData = data || [];
      } catch (enrollmentsErr) {
        logger.warn('Failed to fetch enrollments (non-fatal):', enrollmentsErr);
      }

      setData({
        users: usersData || [],
        courses: coursesWithAudiences,
        announcements: announcementsData || [],
        enrollments: enrollmentsData,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
}
