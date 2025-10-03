import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: number;
  completion_percentage: number;
  last_accessed: string | null;
  total_time_spent: number;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string | null;
    email: string | null;
  };
  course?: {
    title: string;
  };
}

export interface MaterialProgress {
  id: string;
  user_id: string;
  material_id: string;
  is_completed: boolean;
  time_spent: number;
  last_position: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_text: string | null;
  file_url: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  status: 'submitted' | 'graded' | 'late' | 'pending';
  assignment?: {
    id: string;
    title: string;
    course_id: number;
    due_date: string;
    max_grade: number;
  };
  user?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface StudentProgress {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: number;
  courseName: string;
  completionPercentage: number;
  totalTimeSpent: number;
  lastAccessed: string | null;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  averageGrade: number | null;
  materialsCompleted: number;
  materialsTotal: number;
  isAtRisk: boolean;
  riskFactors: string[];
}

interface UseProgressTrackingOptions {
  courseId?: number;
  userId?: string;
}

export const useProgressTracking = (options: UseProgressTrackingOptions = {}) => {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchCourseProgress = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setCourseProgress([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('course_progress')
        .select(`
          *,
          user:profiles!user_id(display_name, email),
          course:courses(title)
        `)
        .order('updated_at', { ascending: false });

      if (options.courseId) {
        query = query.eq('course_id', options.courseId);
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCourseProgress(data || []);
    } catch (err) {
      logger.error('Error fetching course progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course progress');
    } finally {
      setLoading(false);
    }
  }, [user, profile, options.courseId, options.userId]);

  useEffect(() => {
    fetchCourseProgress();
  }, [fetchCourseProgress]);

  return {
    courseProgress,
    loading,
    error,
    refetch: fetchCourseProgress,
  };
};

export const useAssignmentTracking = (courseId?: number) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchSubmissions = useCallback(async () => {
    if (!user || (profile?.role !== 'admin' && profile?.role !== 'instructor')) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(id, title, course_id, due_date, max_grade),
          user:profiles!user_id(display_name, email)
        `)
        .order('submitted_at', { ascending: false });

      if (courseId) {
        // Need to filter by course_id through the assignment relationship
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);

        if (assignments) {
          const assignmentIds = assignments.map(a => a.id);
          query = query.in('assignment_id', assignmentIds);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSubmissions(data || []);
    } catch (err) {
      logger.error('Error fetching assignment submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [user, profile, courseId]);

  const gradeSubmission = useCallback(async (
    submissionId: string,
    grade: number,
    feedback?: string
  ) => {
    if (!user || (profile?.role !== 'admin' && profile?.role !== 'instructor')) {
      throw new Error('Only admins and instructors can grade submissions');
    }

    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? data : s)
      );

      return data;
    } catch (err) {
      logger.error('Error grading submission:', err);
      throw err;
    }
  }, [user, profile]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions,
    gradeSubmission,
  };
};

export const useStudentProgressDetails = (userId: string, courseId: number) => {
  const [progressDetails, setProgressDetails] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchProgressDetails = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch course progress
      const { data: courseProgressData, error: cpError } = await supabase
        .from('course_progress')
        .select(`
          *,
          user:profiles!user_id(display_name, email),
          course:courses(title)
        `)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (cpError) throw cpError;

      // Fetch material progress count
      const { data: materials, error: matError } = await supabase
        .from('course_materials')
        .select('id')
        .eq('course_id', courseId);

      if (matError) throw matError;

      const { data: completedMaterials, error: cmError } = await supabase
        .from('material_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('material_id', materials?.map(m => m.id) || []);

      if (cmError) throw cmError;

      // Fetch assignments
      const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('id, max_grade')
        .eq('course_id', courseId);

      if (assignError) throw assignError;

      const { data: submittedAssignments, error: subError } = await supabase
        .from('assignment_submissions')
        .select('grade, status')
        .eq('user_id', userId)
        .in('assignment_id', assignments?.map(a => a.id) || []);

      if (subError) throw subError;

      // Calculate average grade
      const gradedSubmissions = submittedAssignments?.filter(s => s.grade !== null) || [];
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : null;

      // Identify at-risk factors
      const riskFactors: string[] = [];
      const completionPercentage = courseProgressData.completion_percentage || 0;
      const assignmentsCompleted = submittedAssignments?.length || 0;
      const assignmentsTotal = assignments?.length || 0;

      if (completionPercentage < 30) {
        riskFactors.push('Low completion rate');
      }

      if (averageGrade !== null && averageGrade < 50) {
        riskFactors.push('Low average grade');
      }

      if (assignmentsTotal > 0 && (assignmentsCompleted / assignmentsTotal) < 0.5) {
        riskFactors.push('Missing assignments');
      }

      const daysSinceAccess = courseProgressData.last_accessed
        ? Math.floor((Date.now() - new Date(courseProgressData.last_accessed).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceAccess > 7) {
        riskFactors.push('Inactive for over a week');
      }

      const details: StudentProgress = {
        userId,
        userName: courseProgressData.user?.display_name || 'Unknown',
        userEmail: courseProgressData.user?.email || 'Unknown',
        courseId,
        courseName: courseProgressData.course?.title || 'Unknown',
        completionPercentage,
        totalTimeSpent: courseProgressData.total_time_spent || 0,
        lastAccessed: courseProgressData.last_accessed,
        assignmentsCompleted,
        assignmentsTotal,
        averageGrade,
        materialsCompleted: completedMaterials?.length || 0,
        materialsTotal: materials?.length || 0,
        isAtRisk: riskFactors.length > 0,
        riskFactors,
      };

      setProgressDetails(details);
    } catch (err) {
      logger.error('Error fetching student progress details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress details');
    } finally {
      setLoading(false);
    }
  }, [user, profile, userId, courseId]);

  useEffect(() => {
    fetchProgressDetails();
  }, [fetchProgressDetails]);

  return {
    progressDetails,
    loading,
    error,
    refetch: fetchProgressDetails,
  };
};
