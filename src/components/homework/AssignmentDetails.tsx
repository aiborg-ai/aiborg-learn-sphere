import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Award } from 'lucide-react';
import { formatTimeRemaining, getDaysUntilDue } from '@/utils/earlySubmissionDetection';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  rubric: Record<string, unknown> | null;
  allowed_file_types: string[];
  max_file_size_mb: number;
  allow_late_submission: boolean;
  course_id: number;
}

export interface CourseInfo {
  id: number;
  title: string;
}

interface AssignmentDetailsProps {
  assignment: Assignment;
  course: CourseInfo | null;
}

export function AssignmentDetails({ assignment, course }: AssignmentDetailsProps) {
  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const daysUntilDue = getDaysUntilDue(dueDate);
  const timeRemaining = formatTimeRemaining(dueDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{assignment.title}</CardTitle>
            <CardDescription className="mt-2">
              {course?.title || 'Loading...'}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant={isOverdue ? 'destructive' : 'default'}>
              {isOverdue ? 'Overdue' : 'Active'}
            </Badge>
            {assignment.allow_late_submission && isOverdue && (
              <p className="text-xs text-muted-foreground mt-1">
                Late submission allowed
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground">{assignment.description}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Instructions</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium">
                {new Date(assignment.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time Left</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {timeRemaining}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Max Score</p>
              <p className="text-sm font-medium">{assignment.max_score} points</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">File Types</p>
              <p className="text-sm font-medium">
                {assignment.allowed_file_types.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {assignment.rubric && (
          <div>
            <h3 className="font-semibold mb-2">Grading Rubric</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(assignment.rubric, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}