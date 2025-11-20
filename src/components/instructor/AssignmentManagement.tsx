import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, Clock, CheckCircle } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

interface AssignmentManagementProps {
  courseId: number;
  courseName: string;
  onUpdate?: () => void;
}

interface SubmissionStats {
  submitted: number;
  graded: number;
  total: number;
}

interface Assignment {
  id: string;
  course_id: number;
  title: string;
  description?: string;
  due_date: string;
  max_points?: number;
  created_at?: string;
  submissionStats: SubmissionStats;
}

export function AssignmentManagement({
  courseId,
  courseName,
  onUpdate: _onUpdate,
}: AssignmentManagementProps) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAssignments is stable
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      // Fetch assignments for this course
      const { data: assignmentsData, error: assignError } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (assignError) throw assignError;

      // For each assignment, count submissions
      const enrichedAssignments = await Promise.all(
        (assignmentsData || []).map(async assignment => {
          const { data: submissions } = await supabase
            .from('homework_submissions')
            .select('id, status')
            .eq('assignment_id', assignment.id);

          const submitted =
            submissions?.filter(s => s.status === 'submitted' || s.status === 'grading').length ||
            0;
          const graded = submissions?.filter(s => s.status === 'graded').length || 0;
          const total = submissions?.length || 0;

          return {
            ...assignment,
            submissionStats: {
              submitted,
              graded,
              total,
            },
          };
        })
      );

      setAssignments(enrichedAssignments);
    } catch (error) {
      logger.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const { submitted, graded } = assignment.submissionStats;

    if (submitted > 0) {
      return <Badge variant="destructive">{submitted} Pending Review</Badge>;
    }

    if (graded > 0) {
      return <Badge variant="default">{graded} Graded</Badge>;
    }

    const dueDate = new Date(assignment.due_date);
    const now = new Date();

    if (dueDate < now) {
      return <Badge variant="secondary">Past Due</Badge>;
    }

    return <Badge variant="outline">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Assignments ({assignments.length})
        </CardTitle>
        <CardDescription>Manage assignments and submissions for {courseName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                    </div>
                    {getStatusBadge(assignment)}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {assignment.due_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {assignment.submissionStats.total} Submissions
                    </span>
                    {assignment.max_score && <span>Max Score: {assignment.max_score}</span>}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/assignment/${assignment.id}`)}
                    >
                      View Assignment
                    </Button>
                    {assignment.submissionStats.submitted > 0 && (
                      <Button size="sm" onClick={() => navigate(`/assignment/${assignment.id}`)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Grade Submissions ({assignment.submissionStats.submitted})
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assignments created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Assignments can be created through the admin panel
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
