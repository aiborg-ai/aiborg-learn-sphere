// ============================================================================
// Progress Tracker Component for AI-Readiness Assessment
// Visual progress bar showing completion percentage across all sections
// ============================================================================

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Target,
  Database,
  Cpu,
  Users,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import type { DimensionType } from '@/types/aiReadiness';

interface SectionProgress {
  section: DimensionType;
  label: string;
  icon: typeof Target;
  completed: boolean;
  questionsAnswered: number;
  totalQuestions: number;
  percentage: number;
}

interface ProgressTrackerProps {
  sections: SectionProgress[];
  overallPercentage: number;
  currentSection?: DimensionType;
  compact?: boolean;
  className?: string;
}

const SECTION_ICONS: Record<DimensionType, typeof Target> = {
  overall: Target,
  strategic: Target,
  data: Database,
  tech: Cpu,
  human: Users,
  process: GitBranch,
  change: RefreshCw,
};

export function ProgressTracker({
  sections,
  overallPercentage,
  currentSection,
  compact = false,
  className,
}: ProgressTrackerProps) {
  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.filter(s => s.section !== 'overall').length;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Overall Progress</span>
          <span className="font-semibold text-white">{Math.round(overallPercentage)}%</span>
        </div>
        <Progress value={overallPercentage} className="h-2" />
        <div className="text-xs text-white/50 text-center">
          {completedSections} of {totalSections} sections completed
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Assessment Progress
            </h3>
            <Badge
              variant={overallPercentage === 100 ? 'default' : 'secondary'}
              className={cn(
                overallPercentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-white/10 text-white'
              )}
            >
              {Math.round(overallPercentage)}% Complete
            </Badge>
          </div>

          <Progress
            value={overallPercentage}
            className="h-3 bg-white/10"
            aria-label={`Overall progress: ${Math.round(overallPercentage)}%`}
          />

          <p className="text-sm text-white/60">
            {completedSections} of {totalSections} sections completed
          </p>
        </div>

        {/* Section Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Section Breakdown</h4>
          <div className="grid gap-3">
            {sections
              .filter(s => s.section !== 'overall')
              .map(section => {
                const SectionIcon = SECTION_ICONS[section.section] || Target;
                const isActive = currentSection === section.section;

                return (
                  <div
                    key={section.section}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      isActive
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/5',
                      section.completed && 'border-emerald-500/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        section.completed
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : isActive
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-white/10'
                      )}
                    >
                      {section.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <SectionIcon className="h-5 w-5 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            'text-sm font-medium truncate',
                            isActive ? 'text-white' : 'text-white/80'
                          )}
                        >
                          {section.label}
                        </span>
                        <span className="text-xs text-white/50 ml-2">
                          {section.questionsAnswered}/{section.totalQuestions}
                        </span>
                      </div>
                      <Progress
                        value={section.percentage}
                        className="h-1.5 bg-white/10"
                        aria-label={`${section.label} progress: ${Math.round(section.percentage)}%`}
                      />
                    </div>

                    {isActive && (
                      <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tips */}
        {overallPercentage < 100 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-white/70">
              💡 <span className="font-medium">Tip:</span> You can save your progress at any time
              and return later to complete the assessment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
