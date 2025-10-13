/**
 * ExerciseCard Component
 * Displays exercise summary with status, difficulty, and progress
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Code,
  FileText,
  BarChart3,
  Palette,
  Search,
  FolderKanban,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import type { ExerciseWithSubmission } from '@/services/exercise/types';

interface ExerciseCardProps {
  exercise: ExerciseWithSubmission;
  onClick?: () => void;
  showProgress?: boolean;
}

const exerciseTypeIcons = {
  coding: Code,
  writing: FileText,
  analysis: BarChart3,
  design: Palette,
  research: Search,
  project: FolderKanban,
};

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-700 border-green-200',
  intermediate: 'bg-blue-500/10 text-blue-700 border-blue-200',
  advanced: 'bg-orange-500/10 text-orange-700 border-orange-200',
  expert: 'bg-red-500/10 text-red-700 border-red-200',
};

const statusConfig = {
  draft: { icon: Circle, color: 'text-gray-500', label: 'Not Started' },
  submitted: { icon: Clock, color: 'text-blue-500', label: 'Under Review' },
  under_review: { icon: Clock, color: 'text-blue-500', label: 'Under Review' },
  passed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  needs_revision: { icon: AlertCircle, color: 'text-orange-500', label: 'Needs Revision' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onClick,
  showProgress = true,
}) => {
  const TypeIcon = exerciseTypeIcons[exercise.exercise_type];
  const submission = exercise.user_submission;
  const statusInfo = submission ? statusConfig[submission.status] : statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  const getProgressPercentage = () => {
    if (!submission) return 0;
    if (submission.status === 'completed' || submission.status === 'passed') return 100;
    if (submission.status === 'submitted' || submission.status === 'under_review') return 75;
    if (submission.status === 'needs_revision') return 50;
    return 25; // draft
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                {exercise.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{exercise.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={difficultyColors[exercise.difficulty_level]}>
            {exercise.difficulty_level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Status and Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </div>
          {submission?.score !== undefined && (
            <span className="text-sm font-semibold text-primary">Score: {submission.score}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {exercise.estimated_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{exercise.estimated_time_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="font-medium">{exercise.points_reward}</span>
            <span>points</span>
          </div>
          {exercise.exercise_type === 'coding' && exercise.test_cases && (
            <Badge variant="secondary" className="text-xs">
              Auto-graded
            </Badge>
          )}
        </div>

        {/* Feedback/Revision Notice */}
        {submission?.status === 'needs_revision' && submission.feedback && (
          <div className="p-2 rounded-md bg-orange-50 border border-orange-200">
            <p className="text-xs text-orange-800">
              <strong>Revision needed:</strong> {submission.feedback.slice(0, 100)}
              {submission.feedback.length > 100 && '...'}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Button
          variant={submission ? 'outline' : 'default'}
          className="w-full"
          onClick={e => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {!submission && 'Start Exercise'}
          {submission?.status === 'draft' && 'Continue Working'}
          {submission?.status === 'submitted' && 'View Submission'}
          {submission?.status === 'under_review' && 'View Status'}
          {submission?.status === 'needs_revision' && 'Submit Revision'}
          {(submission?.status === 'passed' || submission?.status === 'completed') &&
            'View Results'}
        </Button>
      </CardFooter>
    </Card>
  );
};
