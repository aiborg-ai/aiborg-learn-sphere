/**
 * useUserProgressData Hook
 *
 * Aggregates user progress data from multiple sources:
 * - profiles: User info
 * - user_progress: Course completion
 * - enrollments: Course enrollments
 * - lingo_analytics: XP, streaks
 * - quiz_attempts: Assessment scores
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  UserProgressSummary,
  UserProgressMetrics,
  UserProgressFilters,
  UserProgressSort,
  UserProgressPagination,
} from '@/types/user-progress.types';

const DEFAULT_PAGE_SIZE = 20;

interface UseUserProgressDataReturn {
  users: UserProgressSummary[];
  metrics: UserProgressMetrics | null;
  pagination: UserProgressPagination;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setFilters: (filters: Partial<UserProgressFilters>) => void;
  setSort: (sort: UserProgressSort) => void;
  setPage: (page: number) => void;
  filters: UserProgressFilters;
  sort: UserProgressSort;
}

const defaultFilters: UserProgressFilters = {
  search: '',
  dateRange: { start: null, end: null },
  progressRange: { min: 0, max: 100 },
  activityStatus: 'all',
};

const defaultSort: UserProgressSort = {
  field: 'last_activity_at',
  direction: 'desc',
};

export function useUserProgressData(): UseUserProgressDataReturn {
  const [users, setUsers] = useState<UserProgressSummary[]>([]);
  const [metrics, setMetrics] = useState<UserProgressMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<UserProgressFilters>(defaultFilters);
  const [sort, setSortState] = useState<UserProgressSort>(defaultSort);
  const [pagination, setPagination] = useState<UserProgressPagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data sources in parallel
      const [
        { data: profiles, error: profilesError },
        { data: enrollments, error: _enrollmentsError },
        { data: lingoData, error: _lingoError },
        { data: quizAttempts, error: _quizError },
        { data: userProgress, error: _progressError },
      ] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role, created_at'),
        supabase.from('enrollments').select('user_id, course_id, enrolled_at, status'),
        supabase.from('lingo_analytics').select('user_id, event_type, payload, created_at'),
        supabase.from('quiz_attempts').select('user_id, quiz_id, score, passed, completed_at'),
        supabase.from('user_progress').select('user_id, course_id, progress_percent, completed'),
      ]);

      if (profilesError) throw profilesError;

      // Build user progress map
      const userMap = new Map<string, UserProgressSummary>();

      // Initialize from profiles
      (profiles || []).forEach(profile => {
        userMap.set(profile.id, {
          user_id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name || 'Unknown',
          role: profile.role || 'user',
          created_at: profile.created_at,
          last_activity_at: undefined,
          lingo_xp: 0,
          lingo_streak: 0,
          lingo_lessons_completed: 0,
          enrolled_courses: 0,
          completed_courses: 0,
          avg_course_progress: 0,
          assessments_taken: 0,
          avg_assessment_score: 0,
        });
      });

      // Aggregate enrollment data
      const enrollmentsByUser = new Map<string, { count: number; completed: number }>();
      (enrollments || []).forEach(e => {
        const current = enrollmentsByUser.get(e.user_id) || { count: 0, completed: 0 };
        current.count++;
        if (e.status === 'completed') current.completed++;
        enrollmentsByUser.set(e.user_id, current);
      });

      enrollmentsByUser.forEach((data, userId) => {
        const user = userMap.get(userId);
        if (user) {
          user.enrolled_courses = data.count;
          user.completed_courses = data.completed;
        }
      });

      // Aggregate progress data
      const progressByUser = new Map<string, { total: number; count: number }>();
      (userProgress || []).forEach(p => {
        const current = progressByUser.get(p.user_id) || { total: 0, count: 0 };
        current.total += p.progress_percent || 0;
        current.count++;
        progressByUser.set(p.user_id, current);
      });

      progressByUser.forEach((data, userId) => {
        const user = userMap.get(userId);
        if (user && data.count > 0) {
          user.avg_course_progress = Math.round(data.total / data.count);
        }
      });

      // Aggregate Lingo data
      const lingoByUser = new Map<
        string,
        {
          xp: number;
          streak: number;
          lessons: number;
          lastActivity?: string;
        }
      >();

      (lingoData || []).forEach(event => {
        const current = lingoByUser.get(event.user_id) || {
          xp: 0,
          streak: 0,
          lessons: 0,
        };

        // Parse payload safely
        const payload =
          typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

        if (event.event_type === 'xp_earned' && payload?.xp) {
          current.xp += payload.xp;
        }
        if (event.event_type === 'lesson_completed') {
          current.lessons++;
        }
        if (event.event_type === 'streak_updated' && payload?.streak) {
          current.streak = Math.max(current.streak, payload.streak);
        }

        // Track last activity
        if (!current.lastActivity || event.created_at > current.lastActivity) {
          current.lastActivity = event.created_at;
        }

        lingoByUser.set(event.user_id, current);
      });

      lingoByUser.forEach((data, userId) => {
        const user = userMap.get(userId);
        if (user) {
          user.lingo_xp = data.xp;
          user.lingo_streak = data.streak;
          user.lingo_lessons_completed = data.lessons;
          if (
            data.lastActivity &&
            (!user.last_activity_at || data.lastActivity > user.last_activity_at)
          ) {
            user.last_activity_at = data.lastActivity;
          }
        }
      });

      // Aggregate quiz/assessment data
      const quizByUser = new Map<string, { total: number; count: number; lastAttempt?: string }>();
      (quizAttempts || []).forEach(attempt => {
        const current = quizByUser.get(attempt.user_id) || { total: 0, count: 0 };
        current.total += attempt.score || 0;
        current.count++;
        if (
          !current.lastAttempt ||
          (attempt.completed_at && attempt.completed_at > current.lastAttempt)
        ) {
          current.lastAttempt = attempt.completed_at;
        }
        quizByUser.set(attempt.user_id, current);
      });

      quizByUser.forEach((data, userId) => {
        const user = userMap.get(userId);
        if (user) {
          user.assessments_taken = data.count;
          user.avg_assessment_score = data.count > 0 ? Math.round(data.total / data.count) : 0;
          if (
            data.lastAttempt &&
            (!user.last_activity_at || data.lastAttempt > user.last_activity_at)
          ) {
            user.last_activity_at = data.lastAttempt;
          }
        }
      });

      // Convert to array and apply filters
      let usersArray = Array.from(userMap.values());

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        usersArray = usersArray.filter(
          u =>
            u.full_name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply role filter
      if (filters.role) {
        usersArray = usersArray.filter(u => u.role === filters.role);
      }

      // Apply activity status filter
      if (filters.activityStatus && filters.activityStatus !== 'all') {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        usersArray = usersArray.filter(u => {
          const lastActivity = u.last_activity_at ? new Date(u.last_activity_at) : null;

          switch (filters.activityStatus) {
            case 'active':
              return lastActivity && lastActivity >= sevenDaysAgo;
            case 'inactive':
              return !lastActivity || lastActivity < thirtyDaysAgo;
            case 'at_risk':
              return lastActivity && lastActivity < sevenDaysAgo && lastActivity >= thirtyDaysAgo;
            default:
              return true;
          }
        });
      }

      // Apply sorting
      usersArray.sort((a, b) => {
        let aVal: string | number = a[sort.field] ?? '';
        let bVal: string | number = b[sort.field] ?? '';

        // Handle date sorting
        if (sort.field === 'last_activity_at') {
          aVal = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
          bVal = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        return sort.direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });

      // Calculate metrics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const allUsers = Array.from(userMap.values());
      const metricsData: UserProgressMetrics = {
        total_users: allUsers.length,
        active_users_7d: allUsers.filter(
          u => u.last_activity_at && new Date(u.last_activity_at) >= sevenDaysAgo
        ).length,
        active_users_30d: allUsers.filter(
          u => u.last_activity_at && new Date(u.last_activity_at) >= thirtyDaysAgo
        ).length,
        at_risk_users: allUsers.filter(u => {
          const lastActivity = u.last_activity_at ? new Date(u.last_activity_at) : null;
          return lastActivity && lastActivity < sevenDaysAgo && lastActivity >= thirtyDaysAgo;
        }).length,
        avg_completion_rate:
          allUsers.length > 0
            ? Math.round(
                allUsers.reduce((sum, u) => sum + u.avg_course_progress, 0) / allUsers.length
              )
            : 0,
        avg_assessment_score:
          allUsers.filter(u => u.assessments_taken > 0).length > 0
            ? Math.round(
                allUsers
                  .filter(u => u.assessments_taken > 0)
                  .reduce((sum, u) => sum + u.avg_assessment_score, 0) /
                  allUsers.filter(u => u.assessments_taken > 0).length
              )
            : 0,
        total_lingo_xp: allUsers.reduce((sum, u) => sum + u.lingo_xp, 0),
        avg_lingo_streak:
          allUsers.length > 0
            ? Math.round(
                (allUsers.reduce((sum, u) => sum + u.lingo_streak, 0) / allUsers.length) * 10
              ) / 10
            : 0,
      };

      setMetrics(metricsData);

      // Apply pagination
      const total = usersArray.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      const start = (pagination.page - 1) * pagination.pageSize;
      const paginatedUsers = usersArray.slice(start, start + pagination.pageSize);

      setUsers(paginatedUsers);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (err) {
      logger.error('Failed to fetch user progress data', err);
      setError('Failed to load user progress data');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setFilters = useCallback((newFilters: Partial<UserProgressFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setSort = useCallback((newSort: UserProgressSort) => {
    setSortState(newSort);
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  return {
    users,
    metrics,
    pagination,
    isLoading,
    error,
    refetch: fetchData,
    setFilters,
    setSort,
    setPage,
    filters,
    sort,
  };
}
