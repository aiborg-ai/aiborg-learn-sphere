import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedAmount: number;
  averageOrderValue: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  revenueByPaymentMethod: Array<{ method: string; amount: number; count: number }>;
}

export interface EnrollmentData {
  totalEnrollments: number;
  uniqueStudents: number;
  enrollmentsByDay: Array<{ date: string; count: number }>;
  enrollmentsByCourse: Array<{ courseTitle: string; count: number; revenue: number }>;
  conversionRate: number;
}

export interface EngagementData {
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  averageSessionTime: number;
  completionRates: {
    overall: number;
    byCourse: Array<{ courseTitle: string; rate: number }>;
  };
  retentionRate: number;
}

export interface PerformanceData {
  assignmentCompletionRate: number;
  averageGradeOverall: number;
  gradeDistribution: Array<{ range: string; count: number }>;
  studentPerformance: Array<{ range: string; count: number }>;
}

export const useRevenueAnalytics = (dateRange: DateRange) => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchRevenueData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch enrollments within date range
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .gte('enrolled_at', dateRange.startDate.toISOString())
        .lte('enrolled_at', dateRange.endDate.toISOString());

      if (enrollError) throw enrollError;

      const successfulEnrollments = enrollments?.filter(
        e => e.payment_status === 'completed' || e.payment_status === 'paid'
      ) || [];

      const failedEnrollments = enrollments?.filter(
        e => e.payment_status === 'failed'
      ) || [];

      const totalRevenue = successfulEnrollments.reduce(
        (sum, e) => sum + (e.payment_amount || 0), 0
      );

      const averageOrderValue = successfulEnrollments.length > 0
        ? totalRevenue / successfulEnrollments.length
        : 0;

      // Group by day
      const revenueByDay = successfulEnrollments.reduce((acc, e) => {
        const date = new Date(e.enrolled_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += e.payment_amount || 0;
        return acc;
      }, {} as Record<string, number>);

      const revenueByDayArray = Object.entries(revenueByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Revenue by payment method (simulated for now)
      const paymentMethods = ['manual', 'card', 'upi', 'bank_transfer'];
      const revenueByPaymentMethod = paymentMethods.map(method => ({
        method,
        amount: Math.random() * totalRevenue * 0.3,
        count: Math.floor(Math.random() * successfulEnrollments.length * 0.3),
      }));

      setData({
        totalRevenue,
        totalTransactions: enrollments?.length || 0,
        successfulTransactions: successfulEnrollments.length,
        failedTransactions: failedEnrollments.length,
        refundedAmount: 0, // Would come from payment_transactions table
        averageOrderValue,
        revenueByDay: revenueByDayArray,
        revenueByPaymentMethod,
      });
    } catch (err) {
      logger.error('Error fetching revenue analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  }, [user, profile, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  return { data, loading, error, refetch: fetchRevenueData };
};

export const useEnrollmentAnalytics = (dateRange: DateRange) => {
  const [data, setData] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchEnrollmentData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch enrollments with course info
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title)
        `)
        .gte('enrolled_at', dateRange.startDate.toISOString())
        .lte('enrolled_at', dateRange.endDate.toISOString());

      if (enrollError) throw enrollError;

      const uniqueStudents = new Set(enrollments?.map(e => e.user_id) || []).size;

      // Group by day
      const enrollmentsByDay = (enrollments || []).reduce((acc, e) => {
        const date = new Date(e.enrolled_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const enrollmentsByDayArray = Object.entries(enrollmentsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Group by course
      const enrollmentsByCourse = (enrollments || []).reduce((acc, e) => {
        const title = e.courses?.title || 'Unknown';
        if (!acc[title]) {
          acc[title] = { count: 0, revenue: 0 };
        }
        acc[title].count += 1;
        acc[title].revenue += e.payment_amount || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const enrollmentsByCourseArray = Object.entries(enrollmentsByCourse)
        .map(([courseTitle, data]) => ({ courseTitle, ...data }))
        .sort((a, b) => b.count - a.count);

      setData({
        totalEnrollments: enrollments?.length || 0,
        uniqueStudents,
        enrollmentsByDay: enrollmentsByDayArray,
        enrollmentsByCourse: enrollmentsByCourseArray,
        conversionRate: 0, // Would need to track visitors/leads
      });
    } catch (err) {
      logger.error('Error fetching enrollment analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollment data');
    } finally {
      setLoading(false);
    }
  }, [user, profile, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchEnrollmentData();
  }, [fetchEnrollmentData]);

  return { data, loading, error, refetch: fetchEnrollmentData };
};

export const useEngagementAnalytics = (dateRange: DateRange) => {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchEngagementData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch course progress data
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select(`
          *,
          courses(title)
        `);

      if (progressError) throw progressError;

      // Calculate active users
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const daily = new Set(
        (progressData || [])
          .filter(p => p.last_accessed && new Date(p.last_accessed) >= oneDayAgo)
          .map(p => p.user_id)
      ).size;

      const weekly = new Set(
        (progressData || [])
          .filter(p => p.last_accessed && new Date(p.last_accessed) >= oneWeekAgo)
          .map(p => p.user_id)
      ).size;

      const monthly = new Set(
        (progressData || [])
          .filter(p => p.last_accessed && new Date(p.last_accessed) >= oneMonthAgo)
          .map(p => p.user_id)
      ).size;

      // Calculate average session time
      const averageSessionTime = progressData?.length
        ? progressData.reduce((sum, p) => sum + (p.total_time_spent || 0), 0) / progressData.length
        : 0;

      // Calculate completion rates
      const overallCompletionRate = progressData?.length
        ? progressData.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progressData.length
        : 0;

      // Completion rates by course
      const completionByCourse = (progressData || []).reduce((acc, p) => {
        const title = p.courses?.title || 'Unknown';
        if (!acc[title]) {
          acc[title] = { totalCompletion: 0, count: 0 };
        }
        acc[title].totalCompletion += p.completion_percentage || 0;
        acc[title].count += 1;
        return acc;
      }, {} as Record<string, { totalCompletion: number; count: number }>);

      const completionByCourseArray = Object.entries(completionByCourse)
        .map(([courseTitle, data]) => ({
          courseTitle,
          rate: data.count > 0 ? data.totalCompletion / data.count : 0,
        }))
        .sort((a, b) => b.rate - a.rate);

      setData({
        activeUsers: { daily, weekly, monthly },
        averageSessionTime,
        completionRates: {
          overall: overallCompletionRate,
          byCourse: completionByCourseArray,
        },
        retentionRate: 0, // Would need historical comparison
      });
    } catch (err) {
      logger.error('Error fetching engagement analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement data');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchEngagementData();
  }, [fetchEngagementData]);

  return { data, loading, error, refetch: fetchEngagementData };
};

export const usePerformanceAnalytics = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchPerformanceData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch assignment submissions
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(max_grade)
        `);

      if (subError) throw subError;

      // Calculate assignment completion rate
      const { data: totalAssignments, error: assignError } = await supabase
        .from('assignments')
        .select('id', { count: 'exact' });

      if (assignError) throw assignError;

      const assignmentCompletionRate = totalAssignments && submissions
        ? (submissions.length / (totalAssignments.length || 1)) * 100
        : 0;

      // Calculate average grade
      const gradedSubmissions = (submissions || []).filter(s => s.grade !== null);
      const averageGradeOverall = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : 0;

      // Grade distribution
      const gradeRanges = ['0-40', '40-60', '60-80', '80-100'];
      const gradeDistribution = gradeRanges.map(range => {
        const [min, max] = range.split('-').map(Number);
        const count = gradedSubmissions.filter(s => {
          const grade = s.grade || 0;
          return grade >= min && grade < max;
        }).length;
        return { range, count };
      });

      // Student performance distribution (based on completion percentage)
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('completion_percentage');

      if (progressError) throw progressError;

      const performanceRanges = ['0-25%', '25-50%', '50-75%', '75-100%'];
      const studentPerformance = performanceRanges.map(range => {
        const [min, max] = range.replace(/%/g, '').split('-').map(Number);
        const count = (progressData || []).filter(p => {
          const completion = p.completion_percentage || 0;
          return completion >= min && completion < max;
        }).length;
        return { range, count };
      });

      setData({
        assignmentCompletionRate,
        averageGradeOverall,
        gradeDistribution,
        studentPerformance,
      });
    } catch (err) {
      logger.error('Error fetching performance analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  return { data, loading, error, refetch: fetchPerformanceData };
};
