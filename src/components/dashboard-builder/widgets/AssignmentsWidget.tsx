/**
 * Assignments Widget
 *
 * Upcoming and pending assignments
 */

import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, ActivityWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function AssignmentsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ActivityWidgetConfig;
  const limit = config.limit || 8;
  const showTimestamps = config.showTimestamps !== false;

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assignments')
        .select(
          `
          id,
          title,
          description,
          due_date,
          status,
          course:courses(
            title
          )
        `
        )
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No pending assignments</p>
        <p className="text-xs mt-1">You're all caught up!</p>
      </div>
    );
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {assignments.map(assignment => {
        const daysUntilDue = getDaysUntilDue(assignment.due_date);
        const isOverdue = daysUntilDue < 0;
        const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 2;

        return (
          <div
            key={assignment.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              isOverdue
                ? 'bg-red-500/10 border border-red-500/20'
                : isUrgent
                  ? 'bg-orange-500/10 border border-orange-500/20'
                  : 'bg-muted/50'
            )}
          >
            <div
              className={cn(
                'p-2 rounded-lg',
                isOverdue
                  ? 'bg-red-500/20'
                  : isUrgent
                    ? 'bg-orange-500/20'
                    : 'bg-background'
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-1">{assignment.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {(assignment.course as any)?.title || 'Course'}
              </p>

              {showTimestamps && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span
                    className={cn(
                      'text-xs',
                      isOverdue
                        ? 'text-red-600 font-medium'
                        : isUrgent
                          ? 'text-orange-600 font-medium'
                          : 'text-muted-foreground'
                    )}
                  >
                    {isOverdue
                      ? `Overdue by ${Math.abs(daysUntilDue)} days`
                      : daysUntilDue === 0
                        ? 'Due today'
                        : daysUntilDue === 1
                          ? 'Due tomorrow'
                          : `Due in ${daysUntilDue} days`}
                  </span>
                </div>
              )}
            </div>

            <Badge
              variant={assignment.status === 'in_progress' ? 'default' : 'secondary'}
              className="text-xs shrink-0"
            >
              {assignment.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export default AssignmentsWidget;
