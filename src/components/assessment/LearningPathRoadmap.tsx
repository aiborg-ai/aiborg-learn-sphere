/**
 * LearningPathRoadmap Component
 * Visualizes a personalized learning path based on assessment results
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  GraduationCap,
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  Target,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'blog' | 'quiz' | 'practice';
  priority: number;
  estimatedTime: string;
  resourceId?: number;
  resourceSlug?: string;
}

interface LearningPathRoadmapProps {
  steps: LearningPathStep[];
  className?: string;
}

const stepTypeConfig = {
  blog: {
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Read',
  },
  course: {
    icon: GraduationCap,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Learn',
  },
  practice: {
    icon: PenTool,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Practice',
  },
  quiz: {
    icon: RotateCcw,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Assess',
  },
};

export function LearningPathRoadmap({ steps, className }: LearningPathRoadmapProps) {
  const navigate = useNavigate();

  if (steps.length === 0) {
    return null;
  }

  const handleStepClick = (step: LearningPathStep) => {
    if (step.type === 'blog' && step.resourceSlug) {
      navigate(`/blog/${step.resourceSlug}`);
    } else if (step.type === 'course' && step.resourceId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Personalized Learning Path
            </CardTitle>
            <CardDescription className="mt-1">
              Follow these steps to improve your skills systematically
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {steps.length} steps
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const config = stepTypeConfig[step.type];
            const Icon = config.icon;
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-muted-foreground/20 to-transparent" />
                )}

                <div
                  className={cn(
                    'group relative flex gap-4 p-4 rounded-lg border-2 transition-all',
                    config.borderColor,
                    config.bgColor,
                    step.resourceId || step.resourceSlug
                      ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                      : ''
                  )}
                  onClick={() =>
                    step.resourceId || step.resourceSlug ? handleStepClick(step) : undefined
                  }
                >
                  {/* Step Number Circle */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br',
                        config.color,
                        isFirst && 'ring-4 ring-primary/20'
                      )}
                    >
                      {isFirst ? (
                        <Circle className="h-5 w-5 text-white fill-white" />
                      ) : (
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      )}
                    </div>
                    {isFirst && (
                      <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-white/50 dark:bg-black/20 text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {isFirst && <Badge className="bg-primary text-xs">Start Here</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{step.estimatedTime}</span>
                      </div>
                    </div>

                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {(step.resourceId || step.resourceSlug) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-3 h-8 px-3 text-xs group-hover:bg-white/50 dark:group-hover:bg-black/20"
                      >
                        {step.type === 'blog' ? 'Read Article' : 'View Course'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <Card className="mt-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Complete This Path</h4>
                <p className="text-sm text-muted-foreground">
                  By following this personalized learning path, you'll address your weak areas and
                  build a strong foundation in AI. Take it one step at a time!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
