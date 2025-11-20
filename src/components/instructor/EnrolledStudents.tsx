import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Mail, Calendar, Loader2, TrendingUp } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

interface EnrolledStudentsProps {
  courseId: number;
  courseName: string;
}

interface StudentProfile {
  display_name?: string;
  email?: string;
}

interface StudentProgress {
  progress_percentage: number;
  time_spent_minutes: number;
  last_accessed: string | null;
}

interface EnrolledStudent {
  id: string;
  enrolled_at: string;
  payment_status: string;
  user_id: string;
  profiles?: StudentProfile;
  progress?: StudentProgress;
}

export function EnrolledStudents({ courseId, courseName }: EnrolledStudentsProps) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch enrollments with user details and progress
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(
          `
          id,
          enrolled_at,
          payment_status,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        `
        )
        .eq('course_id', courseId)
        .eq('payment_status', 'completed')
        .order('enrolled_at', { ascending: false });

      if (enrollError) throw enrollError;

      // Fetch progress for each student
      const enrichedStudents = await Promise.all(
        (enrollments || []).map(async enrollment => {
          const { data: progress } = await supabase
            .from('user_progress')
            .select('progress_percentage, time_spent_minutes, last_accessed')
            .eq('user_id', enrollment.user_id)
            .eq('course_id', courseId)
            .single();

          return {
            ...enrollment,
            progress: progress || {
              progress_percentage: 0,
              time_spent_minutes: 0,
              last_accessed: null,
            },
          };
        })
      );

      setStudents(enrichedStudents);
    } catch (error) {
      logger.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [fetchEnrolledStudents]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Enrolled Students ({students.length})
        </CardTitle>
        <CardDescription>Students enrolled in {courseName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(
                        student.profiles?.display_name || student.profiles?.email || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">
                      {student.profiles?.display_name || 'Anonymous Student'}
                    </h4>
                    {student.profiles?.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        {student.profiles.email}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                      </span>
                      {student.progress?.last_accessed && (
                        <span>
                          Last active:{' '}
                          {new Date(student.progress.last_accessed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">
                        {student.progress?.progress_percentage || 0}%
                      </span>
                    </div>
                    <Badge
                      variant={
                        student.progress?.progress_percentage >= 50 ? 'default' : 'secondary'
                      }
                    >
                      {student.progress?.progress_percentage >= 100
                        ? 'Completed'
                        : student.progress?.progress_percentage >= 50
                          ? 'Active'
                          : 'Started'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students enrolled yet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
