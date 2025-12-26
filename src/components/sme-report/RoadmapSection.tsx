/**
 * RoadmapSection Component
 *
 * Displays implementation roadmap with phased accordion view
 * Shows roadmap items, phases, and milestones
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import type {
  SMERoadmapItem,
  SMERoadmapPhase,
  SMERoadmapMilestone,
  RoadmapPhase,
} from '@/types/aiAssessment';

interface RoadmapSectionProps {
  roadmapItems?: SMERoadmapItem[];
  roadmapPhases?: SMERoadmapPhase[];
  roadmapMilestones?: SMERoadmapMilestone[];
}

export function RoadmapSection({
  roadmapItems = [],
  roadmapPhases = [],
  roadmapMilestones = [],
}: RoadmapSectionProps) {
  // If no roadmap data, show placeholder
  if (roadmapItems.length === 0 || roadmapPhases.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Implementation Roadmap</h2>
          <p className="text-muted-foreground">
            Roadmap generation in progress. Please refresh the page in a moment.
          </p>
        </div>
      </div>
    );
  }

  const phaseConfig: Record<RoadmapPhase, { color: string; icon: string; label: string }> = {
    quick_wins: {
      color: 'bg-green-100 text-green-800',
      icon: '🚀',
      label: 'Quick Wins',
    },
    short_term: {
      color: 'bg-blue-100 text-blue-800',
      icon: '📈',
      label: 'Short-term',
    },
    medium_term: {
      color: 'bg-orange-100 text-orange-800',
      icon: '🎯',
      label: 'Medium-term',
    },
    long_term: {
      color: 'bg-purple-100 text-purple-800',
      icon: '🌟',
      label: 'Long-term',
    },
  };

  // Group items by phase
  const groupedItems = roadmapItems.reduce(
    (acc, item) => {
      if (!acc[item.phase]) acc[item.phase] = [];
      acc[item.phase].push(item);
      return acc;
    },
    {} as Record<RoadmapPhase, SMERoadmapItem[]>
  );

  // Calculate total timeline
  const totalWeeks = roadmapPhases.reduce((sum, p) => sum + p.duration_weeks, 0);

  return (
    <section className="space-y-6" aria-labelledby="roadmap-heading">
      <div>
        <h2 id="roadmap-heading" className="text-2xl font-bold mb-2">
          Implementation Roadmap
        </h2>
        <p className="text-muted-foreground">
          Your personalized step-by-step plan to AI implementation success
        </p>
      </div>

      {/* Timeline Overview */}
      <Card
        className="p-6 bg-gradient-to-r from-purple-50 to-blue-50"
        aria-label="Roadmap overview statistics"
      >
        <dl className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Total Timeline</dt>
            <dd className="text-3xl font-bold">{totalWeeks} weeks</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Milestones</dt>
            <dd className="text-3xl font-bold">{roadmapMilestones.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Total Items</dt>
            <dd className="text-3xl font-bold">{roadmapItems.length}</dd>
          </div>
        </dl>
      </Card>

      {/* Visual Timeline */}
      <Card className="p-6" aria-label="Visual timeline representation">
        <h3 className="text-lg font-semibold mb-4">Timeline Visualization</h3>
        <div className="space-y-3">
          {/* Timeline bar */}
          <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {roadmapPhases.map(phase => {
              const config = phaseConfig[phase.phase];
              const leftPercent = (phase.start_week / totalWeeks) * 100;
              const widthPercent = (phase.duration_weeks / totalWeeks) * 100;

              return (
                <div
                  key={phase.phase}
                  className={`absolute h-full ${config.color} border-r border-white/50 flex items-center justify-center transition-all hover:opacity-80 cursor-pointer group`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`${config.label}: Weeks ${phase.start_week}-${phase.start_week + phase.duration_weeks} (${phase.duration_weeks} weeks)`}
                >
                  <span className="text-xs font-semibold px-2 text-center truncate">
                    {widthPercent > 15 ? config.label : config.icon}
                  </span>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {config.label}: {phase.duration_weeks} weeks
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}

            {/* Milestone markers */}
            {roadmapMilestones.map(milestone => {
              const leftPercent = (milestone.target_week / totalWeeks) * 100;

              return (
                <div
                  key={milestone.id}
                  className="absolute top-0 bottom-0 w-1 bg-red-500 hover:bg-red-600 cursor-pointer group z-10"
                  style={{ left: `${leftPercent}%` }}
                  title={milestone.milestone_name}
                >
                  {/* Milestone marker triangle */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-8 border-transparent border-t-red-500" />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {milestone.milestone_name}
                    <div className="text-[10px] text-gray-300">Week {milestone.target_week}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week labels */}
          <div className="relative h-6 text-xs text-muted-foreground">
            <div className="absolute left-0">Week 0</div>
            <div className="absolute left-1/4 -translate-x-1/2">
              Week {Math.round(totalWeeks * 0.25)}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2">
              Week {Math.round(totalWeeks * 0.5)}
            </div>
            <div className="absolute left-3/4 -translate-x-1/2">
              Week {Math.round(totalWeeks * 0.75)}
            </div>
            <div className="absolute right-0">Week {totalWeeks}</div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                {roadmapPhases.map(phase => {
                  const config = phaseConfig[phase.phase];
                  return (
                    <div key={phase.phase} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${config.color}`} />
                      <span className="text-sm">
                        {config.label} ({phase.duration_weeks}w)
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red-500" />
                <span className="text-sm">Milestones</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Phased Accordion */}
      <Accordion type="multiple" className="space-y-4" aria-label="Roadmap phases by timeline">
        {(Object.keys(phaseConfig) as RoadmapPhase[]).map(phase => {
          const items = groupedItems[phase] || [];
          if (items.length === 0) return null;

          const config = phaseConfig[phase];
          const phaseData = roadmapPhases.find(p => p.phase === phase);

          return (
            <AccordionItem key={phase} value={phase} className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-4 w-full">
                  <span className="text-2xl" aria-hidden="true">
                    {config.icon}
                  </span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">{config.label}</h3>
                      <Badge className={config.color}>{items.length} items</Badge>
                    </div>
                    {phaseData && (
                      <p className="text-sm text-muted-foreground">
                        Weeks {phaseData.start_week}-
                        {phaseData.start_week + phaseData.duration_weeks}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-lg font-semibold">
                      ${(phaseData?.total_cost_usd || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-semibold text-lg">#{index + 1}</span>
                            <h4 className="text-lg font-semibold">{item.title}</h4>
                            <Badge
                              variant={
                                item.priority === 'critical'
                                  ? 'destructive'
                                  : item.priority === 'high'
                                    ? 'default'
                                    : item.priority === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                              }
                              aria-label={`Priority: ${item.priority}`}
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-sm">{item.estimated_weeks} weeks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="text-sm">
                            ${(item.estimated_cost_usd || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-sm">
                            {item.required_resources?.length || 0} resources
                          </span>
                        </div>
                      </div>

                      {item.success_metrics && item.success_metrics.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Success Metrics:</p>
                          <ul className="space-y-1">
                            {item.success_metrics.map((metric, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2
                                  className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <span>{metric}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Milestones */}
      {roadmapMilestones.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Key Milestones</h3>
          <div className="space-y-3">
            {roadmapMilestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{milestone.milestone_name}</h4>
                  <p className="text-sm text-muted-foreground">Week {milestone.target_week}</p>
                  {milestone.deliverables && milestone.deliverables.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {milestone.deliverables.map((deliverable, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2
                            className="h-3 w-3 text-primary flex-shrink-0 mt-1"
                            aria-hidden="true"
                          />
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
