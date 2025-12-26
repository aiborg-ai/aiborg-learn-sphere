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
