import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Assignment {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: string;
}

interface AssignmentsSectionProps {
  assignments: Assignment[];
}

export function AssignmentsSection({ assignments }: AssignmentsSectionProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'graded':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const pendingAssignments = assignments.filter(a =>
    a.status.toLowerCase() === 'pending' || a.status.toLowerCase() === 'overdue'
  );
  const completedAssignments = assignments.filter(a =>
    a.status.toLowerCase() === 'submitted' || a.status.toLowerCase() === 'graded'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Assignments
        </CardTitle>
        <CardDescription>
          Track and submit your course assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  PENDING ASSIGNMENTS
                </h3>
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => {
                    const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                    return (
                      <div
                        key={assignment.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.courseTitle}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant={getStatusColor(assignment.status) as any}>
                                {assignment.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                              {daysUntilDue > 0 && daysUntilDue <= 3 && (
                                <Badge variant="warning" className="text-xs">
                                  {daysUntilDue} day{daysUntilDue > 1 ? 's' : ''} left
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/assignment/${assignment.id}`)}
                          >
                            Submit
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Assignments */}
            {completedAssignments.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  COMPLETED ASSIGNMENTS
                </h3>
                <div className="space-y-3">
                  {completedAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 border rounded-lg opacity-75"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {assignment.courseTitle}
                          </p>
                          <Badge
                            variant={getStatusColor(assignment.status) as any}
                            className="mt-2"
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/assignment/${assignment.id}`)}
                        >
                          View
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No assignments yet. Check back later for course assignments.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}