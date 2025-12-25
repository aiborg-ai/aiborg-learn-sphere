/**
 * TimelineRoadmap Component
 * Visual milestone timeline showing career progression path
 * Foundation → Build → Mastery phases
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Target, Calendar } from '@/components/ui/icons';

interface TimelineRoadmapProps {
  weeksToGoal: number;
  nextMilestone: string;
  currentReadiness?: number;
}

interface Phase {
  name: string;
  description: string;
  duration: string;
  status: 'completed' | 'current' | 'upcoming';
  milestones: string[];
}

export function TimelineRoadmap({
  weeksToGoal,
  nextMilestone,
  currentReadiness = 0,
}: TimelineRoadmapProps) {
  // Calculate phase durations based on total weeks to goal
  const totalMonths = Math.ceil(weeksToGoal / 4);

  // Define phases based on progression
  const phases: Phase[] = [
    {
      name: 'Foundation',
      description: 'Build core competencies and close critical gaps',
      duration: `0-${Math.min(3, totalMonths)} months`,
      status: currentReadiness >= 50 ? 'completed' : 'current',
      milestones: [
        'Complete critical path skills',
        'Achieve 50% career readiness',
        'Verify foundational competencies',
      ],
    },
    {
      name: 'Build',
      description: 'Develop advanced skills and gain practical experience',
      duration: `${Math.min(3, totalMonths)}-${Math.min(6, totalMonths)} months`,
      status:
        currentReadiness >= 50 && currentReadiness < 80
          ? 'current'
          : currentReadiness >= 80
            ? 'completed'
            : 'upcoming',
      milestones: [
        'Master accelerator skills',
        'Achieve 80% career readiness',
        'Build portfolio projects',
      ],
    },
    {
      name: 'Mastery',
      description: 'Refine expertise and prepare for role transition',
      duration: `${Math.min(6, totalMonths)}-${totalMonths} months`,
      status: currentReadiness >= 80 ? 'current' : 'upcoming',
      milestones: [
        'Complete bonus skills',
        'Achieve 90%+ career readiness',
        'Ready for role transition',
      ],
    },
  ];

  // Calculate target completion date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);

  // Get phase icon and color
  const getPhaseIndicator = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'current':
        return {
          icon: Target,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'upcoming':
        return {
          icon: Circle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  return (
    <div className="space-y-6 print:break-inside-avoid">
      <div>
        <h2 className="text-2xl font-bold mb-2 print:text-xl">Career Roadmap Timeline</h2>
        <p className="text-muted-foreground print:text-black print:text-sm">
          Your personalized path to career readiness ({totalMonths} months to goal)
        </p>
      </div>

      {/* Timeline Overview */}
      <div className="p-4 bg-muted/50 rounded-lg print:bg-gray-100 print:border print:border-black print:p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground mb-1 print:text-black print:text-xs">
              Current Readiness
            </div>
            <div className="text-2xl font-bold text-primary print:text-black print:text-xl">
              {currentReadiness}%
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1 print:text-black print:text-xs">
              Weeks to Goal
            </div>
            <div className="text-2xl font-bold print:text-xl">{weeksToGoal}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1 print:text-black print:text-xs">
              Target Date
            </div>
            <div className="text-lg font-semibold print:text-base">
              {targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Next Milestone Callout */}
      {nextMilestone && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg print:bg-gray-100 print:border-black print:p-3">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-blue-600 mt-0.5 print:text-black print:h-4 print:w-4" />
            <div>
              <div className="font-semibold text-blue-900 print:text-black mb-1 print:text-sm">
                Next Milestone
              </div>
              <p className="text-sm text-blue-700 print:text-black print:text-xs">
                {nextMilestone}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold print:text-base">Learning Phases</h3>

        {phases.map((phase, index) => {
          const indicator = getPhaseIndicator(phase.status);
          const PhaseIcon = indicator.icon;

          return (
            <div
              key={phase.name}
              className={`relative border rounded-lg p-5 ${indicator.bgColor} ${indicator.borderColor} print:bg-white print:border-black print:p-4 print:break-inside-avoid`}
            >
              {/* Phase Header */}
              <div className="flex items-start gap-4 mb-3 print:mb-2">
                <div
                  className={`rounded-full p-2 ${indicator.bgColor} print:bg-white print:border print:border-black print:p-1.5`}
                >
                  <PhaseIcon
                    className={`h-6 w-6 ${indicator.color} print:text-black print:h-4 print:w-4`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-semibold print:text-base">{phase.name}</h4>
                    <Badge
                      variant={
                        phase.status === 'completed'
                          ? 'default'
                          : phase.status === 'current'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="print:border-black print:bg-white print:text-black print:text-xs"
                    >
                      {phase.status === 'completed'
                        ? 'Completed'
                        : phase.status === 'current'
                          ? 'In Progress'
                          : 'Upcoming'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground print:text-black mb-2 print:text-xs">
                    {phase.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm print:text-xs">
                    <Calendar
                      className={`h-4 w-4 ${indicator.color} print:text-black print:h-3 print:w-3`}
                    />
                    <span className={`font-medium ${indicator.color} print:text-black`}>
                      {phase.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="ml-14 space-y-2 print:ml-10">
                <div className="text-sm font-medium text-muted-foreground print:text-black print:text-xs">
                  Key Milestones:
                </div>
                <ul className="space-y-1">
                  {phase.milestones.map((milestone, mIndex) => (
                    <li key={mIndex} className="text-sm flex items-start gap-2 print:text-xs">
                      <span className="text-muted-foreground print:text-black mt-1">•</span>
                      <span className="print:text-black">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connector line (not on last phase) */}
              {index < phases.length - 1 && (
                <div
                  className={`absolute left-9 -bottom-4 w-0.5 h-4 ${
                    phase.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                  } print:bg-black print:hidden`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 print:break-inside-avoid">
        <div className="flex justify-between text-sm print:text-xs">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground print:text-black">
            {currentReadiness}% Complete
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden print:border print:border-black print:rounded-none">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 print:bg-black"
            style={{ width: `${currentReadiness}%` }}
          />
        </div>
      </div>

      {/* Timeline Footer Note */}
      <div className="text-xs text-muted-foreground print:text-black italic text-center pt-4 border-t print:border-black print:text-[10px]">
        Timeline estimates are based on average learning pace and assume consistent effort. Actual
        duration may vary based on prior experience and time commitment.
      </div>
    </div>
  );
}
