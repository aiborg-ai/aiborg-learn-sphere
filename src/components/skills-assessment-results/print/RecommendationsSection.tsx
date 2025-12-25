/**
 * RecommendationsSection Component
 * Displays tiered learning path recommendations
 * Three tiers: Critical Path, Accelerators, Bonus Skills
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle, Rocket, Star, Clock } from '@/components/ui/icons';
import type { SkillRecommendation } from '@/types/skillsAssessment';

interface RecommendationsSectionProps {
  recommendations?: SkillRecommendation[];
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Learning Path Recommendations</h2>
          <p className="text-muted-foreground">
            Personalized recommendations to accelerate your career
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Complete a skills assessment to receive personalized learning recommendations.
          </p>
        </div>
      </div>
    );
  }

  // Organize recommendations by tier
  const criticalPath = recommendations.filter(r => r.tier === 'critical');
  const accelerators = recommendations.filter(r => r.tier === 'accelerator');
  const bonusSkills = recommendations.filter(r => r.tier === 'bonus');

  // Tier configuration
  const tierConfig = {
    critical: {
      title: 'Critical Path',
      description: 'Essential skills needed to reach your career goal',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      badgeVariant: 'destructive' as const,
      recommendations: criticalPath,
    },
    accelerator: {
      title: 'Career Accelerators',
      description: 'High-impact skills that will fast-track your progression',
      icon: Rocket,
      iconColor: 'text-blue-600',
      badgeVariant: 'default' as const,
      recommendations: accelerators,
    },
    bonus: {
      title: 'Bonus Skills',
      description: 'Nice-to-have skills that provide competitive advantage',
      icon: Star,
      iconColor: 'text-yellow-600',
      badgeVariant: 'secondary' as const,
      recommendations: bonusSkills,
    },
  };

  // Calculate total learning hours
  const totalHours = recommendations.reduce((sum, r) => sum + (r.estimated_hours || 0), 0);

  return (
    <div className="space-y-6 print:break-inside-avoid">
      <div>
        <h2 className="text-2xl font-bold mb-2 print:text-xl">Learning Path Recommendations</h2>
        <p className="text-muted-foreground print:text-black print:text-sm">
          Personalized learning path to accelerate your career ({recommendations.length}{' '}
          recommendations)
        </p>
      </div>

      {/* Tier Sections */}
      {Object.values(tierConfig).map(tier => {
        if (tier.recommendations.length === 0) return null;

        const TierIcon = tier.icon;

        return (
          <div key={tier.title} className="space-y-3 print:break-inside-avoid">
            {/* Tier Header */}
            <div className="flex items-center gap-3 pb-2 border-b print:border-black">
              <TierIcon
                className={`h-5 w-5 ${tier.iconColor} print:text-black print:h-4 print:w-4`}
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold print:text-lg">{tier.title}</h3>
                <p className="text-sm text-muted-foreground print:text-black print:text-xs">
                  {tier.description}
                </p>
              </div>
              <Badge
                variant={tier.badgeVariant}
                className="print:border-black print:bg-white print:text-black print:text-xs"
              >
                {tier.recommendations.length} Skills
              </Badge>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              {tier.recommendations.map((rec, index) => (
                <div
                  key={rec.skill_id}
                  className={`p-4 rounded-lg border print:border-black ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/30 print:bg-gray-50'
                  } print:p-3`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1 print:text-sm">
                        {rec.skill_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 print:text-black print:text-xs">
                        {rec.reason}
                      </p>
                      {rec.business_impact && (
                        <p className="text-sm text-primary print:text-black print:text-xs">
                          <span className="font-medium">Impact:</span> {rec.business_impact}
                        </p>
                      )}
                    </div>

                    {rec.estimated_hours && (
                      <div className="flex items-center gap-1 text-muted-foreground shrink-0 print:text-black">
                        <Clock className="h-4 w-4 print:h-3 print:w-3 print:text-black" />
                        <span className="text-sm font-medium print:text-xs">
                          {rec.estimated_hours}h
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority indicator for critical path */}
                  {rec.tier === 'critical' && rec.priority && (
                    <div className="mt-2 pt-2 border-t print:border-black">
                      <Badge
                        variant="outline"
                        className="text-xs print:border-black print:text-black"
                      >
                        Priority: {rec.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Learning Path Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-muted/50 rounded-lg print:bg-gray-100 print:border print:border-black">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 print:text-black print:text-xl">
            {criticalPath.length}
          </div>
          <div className="text-sm text-muted-foreground print:text-black print:text-xs">
            Critical Skills
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 print:text-black print:text-xl">
            {accelerators.length}
          </div>
          <div className="text-sm text-muted-foreground print:text-black print:text-xs">
            Accelerators
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary print:text-black print:text-xl">
            {totalHours}h
          </div>
          <div className="text-sm text-muted-foreground print:text-black print:text-xs">
            Total Learning Time
          </div>
        </div>
      </div>

      {/* Action Plan Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg print:bg-gray-100 print:border-black print:p-3">
        <p className="text-sm text-blue-900 print:text-black print:text-xs">
          <span className="font-semibold">Next Steps:</span> Start with the Critical Path skills to
          close the most important gaps first. Once you've made progress on critical skills, add
          Accelerators to fast-track your career growth.
        </p>
      </div>
    </div>
  );
}
