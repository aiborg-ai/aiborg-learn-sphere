/**
 * Onboarding Progress Widget
 *
 * Shows user's onboarding progress with milestones and completion percentage.
 */

import { CheckCircle2, Circle, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';

interface Milestone {
  key: keyof Pick<
    NonNullable<ReturnType<typeof useOnboardingContext>['progress']>,
    | 'has_completed_profile'
    | 'has_enrolled_in_course'
    | 'has_attended_event'
    | 'has_completed_assessment'
    | 'has_explored_dashboard'
    | 'has_used_ai_chat'
    | 'has_created_content'
  >;
  label: string;
  description: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  {
    key: 'has_explored_dashboard',
    label: 'Explore Dashboard',
    description: 'View your personalized learning dashboard',
    icon: 'LayoutDashboard',
  },
  {
    key: 'has_completed_profile',
    label: 'Complete Profile',
    description: 'Add your bio and learning goals',
    icon: 'UserCircle',
  },
  {
    key: 'has_enrolled_in_course',
    label: 'Enroll in Course',
    description: 'Join your first learning course',
    icon: 'GraduationCap',
  },
  {
    key: 'has_attended_event',
    label: 'Attend Event',
    description: 'Participate in a workshop or webinar',
    icon: 'Calendar',
  },
  {
    key: 'has_completed_assessment',
    label: 'Complete Assessment',
    description: 'Test your knowledge',
    icon: 'Brain',
  },
  {
    key: 'has_used_ai_chat',
    label: 'Try AI Assistant',
    description: 'Get help from our AI chatbot',
    icon: 'MessageCircle',
  },
];

export function OnboardingProgress() {
  const {
    progress,
    loading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    getCompletionPercentage,
  } = useOnboardingContext();

  if (loading || !progress) {
    return null;
  }

  // Don't show if skipped or completed
  if (progress.onboarding_skipped || progress.onboarding_completed) {
    return null;
  }

  const completionPercentage = getCompletionPercentage();
  const completedMilestones = MILESTONES.filter(m => progress[m.key]).length;
  const totalMilestones = MILESTONES.length;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Getting Started
              <Badge variant="secondary" className="text-xs">
                {completedMilestones}/{totalMilestones}
              </Badge>
            </CardTitle>
            <CardDescription>
              Complete these steps to get the most out of the platform
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {MILESTONES.map(milestone => {
            const isCompleted = progress[milestone.key];

            return (
              <div
                key={milestone.key}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  isCompleted ? 'bg-muted/50' : 'hover:bg-muted/30'
                )}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-primary" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}
                  >
                    {milestone.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {completionPercentage === 100 && (
          <div className="pt-4 border-t">
            <Button onClick={completeOnboarding} className="w-full" size="sm">
              <CheckCircle2 size={16} className="mr-2" />
              Mark as Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for minimal space
 */
export function OnboardingProgressCompact() {
  const { progress, loading, getCompletionPercentage } = useOnboardingContext();

  if (loading || !progress || progress.onboarding_skipped || progress.onboarding_completed) {
    return null;
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Getting Started</span>
        <span className="font-medium">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-1.5" />
    </div>
  );
}
