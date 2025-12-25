/**
 * TimelineRoadmap Component
 *
 * Print-optimized visual timeline showing career progression path
 * Foundation → Build → Mastery phases with milestones
 */

import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp, CheckCircle2 } from '@/components/ui/icons';

interface TimelineRoadmapProps {
  weeksToGoal: number;
  nextMilestone: string;
  currentReadiness?: number;
}

interface Phase {
  name: string;
  icon: typeof Calendar;
  weeks: string;
  description: string;
  goals: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

export function TimelineRoadmap({
  weeksToGoal,
  nextMilestone,
  currentReadiness = 0,
}: TimelineRoadmapProps) {
  const totalWeeks = Math.max(weeksToGoal, 12); // Minimum 12 weeks
  const foundationWeeks = Math.ceil(totalWeeks * 0.3);
  const buildWeeks = Math.ceil(totalWeeks * 0.4);
  const masteryWeeks = totalWeeks - foundationWeeks - buildWeeks;

  const today = new Date();
  const foundationEnd = new Date(today);
  foundationEnd.setDate(today.getDate() + foundationWeeks * 7);

  const buildEnd = new Date(foundationEnd);
  buildEnd.setDate(foundationEnd.getDate() + buildWeeks * 7);

  const masteryEnd = new Date(buildEnd);
  masteryEnd.setDate(buildEnd.getDate() + masteryWeeks * 7);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const phases: Phase[] = [
    {
      name: 'Foundation',
      icon: Target,
      weeks: `0-${foundationWeeks} weeks`,
      description: 'Build fundamental skills and close critical gaps',
      goals: [
        'Complete critical path skills',
        'Close high-priority skill gaps',
        'Achieve basic proficiency in core areas',
        'Set up learning routine',
      ],
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    {
      name: 'Build',
      icon: TrendingUp,
      weeks: `${foundationWeeks}-${foundationWeeks + buildWeeks} weeks`,
      description: 'Develop intermediate skills and gain practical experience',
      goals: [
        'Complete accelerator skills',
        'Apply skills in real projects',
        'Build portfolio of work',
        'Gain confidence in role-specific tasks',
      ],
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
    },
    {
      name: 'Mastery',
      icon: CheckCircle2,
      weeks: `${foundationWeeks + buildWeeks}+ weeks`,
      description: 'Achieve career readiness and excel in your role',
      goals: [
        'Complete bonus skills',
        'Demonstrate expertise',
        'Lead projects independently',
        'Ready for target role',
      ],
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
    },
  ];

  return (
    <div className="print:block">
      <h2 className="text-2xl font-bold mb-6 print:text-black print:border-b-2 print:border-black print:pb-2">
        Career Progression Timeline
      </h2>

      {/* Current Status */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-8 print:bg-white print:border-black print:mb-10">
        <div className="grid md:grid-cols-3 gap-4 print:grid-cols-3">
          <div>
            <p className="text-sm text-purple-700 print:text-gray-700 mb-1">Current Readiness</p>
            <p className="text-3xl font-bold text-purple-900 print:text-black">
              {currentReadiness.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-purple-700 print:text-gray-700 mb-1">Weeks to Goal</p>
            <p className="text-3xl font-bold text-purple-900 print:text-black">{weeksToGoal}</p>
          </div>
          <div>
            <p className="text-sm text-purple-700 print:text-gray-700 mb-1">Next Milestone</p>
            <p className="text-sm font-semibold text-purple-900 print:text-black mt-2">
              {nextMilestone || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Phases */}
      <div className="space-y-6 print:space-y-8">
        {phases.map((phase, index) => {
          const PhaseIcon = phase.icon;
          const isCurrentPhase =
            (index === 0 && currentReadiness < 40) ||
            (index === 1 && currentReadiness >= 40 && currentReadiness < 80) ||
            (index === 2 && currentReadiness >= 80);

          return (
            <div
              key={phase.name}
              className={`relative p-6 rounded-lg border-2 ${phase.bgColor} ${phase.borderColor} print:bg-white print:border-black print:break-inside-avoid`}
            >
              {/* Phase Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${phase.bgColor} border-2 ${phase.borderColor} print:border-black flex items-center justify-center`}
                  >
                    <PhaseIcon className={`h-6 w-6 ${phase.color} print:text-black`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-bold ${phase.color} print:text-black`}>
                        Phase {index + 1}: {phase.name}
                      </h3>
                      {isCurrentPhase && (
                        <Badge className="bg-yellow-200 text-yellow-900 border-yellow-900 print:border-black">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground print:text-gray-700 mt-1">
                      {phase.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1 print:bg-white print:border print:border-black"
                >
                  <Calendar className="h-3 w-3" />
                  {phase.weeks}
                </Badge>
              </div>

              {/* Phase Goals */}
              <div className="ml-15 print:ml-0 print:mt-4">
                <p className="text-sm font-semibold mb-2 print:text-black">Key Goals:</p>
                <ul className="space-y-2">
                  {phase.goals.map((goal, goalIndex) => (
                    <li key={goalIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className={`h-4 w-4 ${phase.color} print:text-black flex-shrink-0 mt-0.5`}
                      />
                      <span className="text-muted-foreground print:text-gray-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estimated Completion Date */}
              <div className="mt-4 pt-4 border-t border-gray-200 print:border-black">
                <p className="text-xs text-muted-foreground print:text-gray-700">
                  <strong className="print:text-black">Target Completion:</strong>{' '}
                  {index === 0 && formatDate(foundationEnd)}
                  {index === 1 && formatDate(buildEnd)}
                  {index === 2 && formatDate(masteryEnd)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Summary */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg print:bg-white print:border-2 print:border-black print:mt-10">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-purple-600 print:text-black flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-900 print:text-black mb-2">
              Your Personalized Timeline
            </p>
            <p className="text-sm text-muted-foreground print:text-gray-700">
              This timeline is customized based on your current skills, career goal, and learning
              pace. Stay consistent, track your progress, and adjust as needed. You're estimated to
              be career-ready by{' '}
              <strong className="print:text-black">{formatDate(masteryEnd)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
