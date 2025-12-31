/**
 * Hook to fetch admin dashboard statistics from Supabase
 * Provides real-time data for dashboard metrics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface DashboardStats {
  totalUsers: number;
  activeCourses: number;
  totalEnrollments: number;
  revenue: number;
  pendingReviews: number;
  activeStudents: number;
  aiChatSessions: number;
  ragEmbeddings: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

export function useAdminDashboardStats() {
  // Fetch total users count
  const { data: totalUsers = 0 } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch active courses count
  const { data: activeCourses = 0 } = useQuery({
    queryKey: ['admin-stats-courses'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch total enrollments
  const { data: totalEnrollments = 0 } = useQuery({
    queryKey: ['admin-stats-enrollments'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch revenue (sum of all payments)
  const { data: revenue = 0 } = useQuery({
    queryKey: ['admin-stats-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      if (error) throw error;
      return data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    },
  });

  // Fetch pending reviews count
  const { data: pendingReviews = 0 } = useQuery({
    queryKey: ['admin-stats-pending-reviews'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch active students (users with at least one enrollment)
  const { data: activeStudents = 0 } = useQuery({
    queryKey: ['admin-stats-active-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('user_id')
        .not('user_id', 'is', null);

      if (error) throw error;
      // Get unique user IDs
      const uniqueUsers = new Set(data?.map(e => e.user_id) || []);
      return uniqueUsers.size;
    },
  });

  // Fetch AI chat sessions count
  const { data: aiChatSessions = 0 } = useQuery({
    queryKey: ['admin-stats-ai-chats'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error fetching chat sessions:', error);
        return 0;
      }
      return count || 0;
    },
  });

  // Fetch RAG embeddings count
  const { data: ragEmbeddings = 0 } = useQuery({
    queryKey: ['admin-stats-rag-embeddings'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('content_embeddings')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error fetching RAG embeddings:', error);
        return 0;
      }
      return count || 0;
    },
  });

  // Fetch recent activity from audit logs
  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, user_email, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        logger.error('Error fetching recent activity:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        action: log.action || 'Unknown action',
        user: log.user_email || 'System',
        time: formatTimeAgo(new Date(log.created_at)),
        status: (log.status as 'success' | 'info' | 'warning' | 'error') || 'info',
      }));
    },
  });

  const stats: DashboardStats = {
    totalUsers,
    activeCourses,
    totalEnrollments,
    revenue,
    pendingReviews,
    activeStudents,
    aiChatSessions,
    ragEmbeddings,
  };

  return {
    stats,
    recentActivity,
    isLoading: false, // Simplified - individual queries handle their own loading states
  };
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
