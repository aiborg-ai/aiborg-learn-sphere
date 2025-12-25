/**
 * RecommendationsSection Component
 *
 * Print-optimized learning recommendations in three tiers
 * Critical Path → Accelerators → Bonus Skills
 */

import { Badge } from '@/components/ui/badge';
import { Clock, Target, Zap, Star } from '@/components/ui/icons';

interface SkillRecommendation {
  skill_id: string;
  skill_name: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_hours: number;
  business_impact?: string;
}

interface RecommendationsSectionProps {
  recommendations?: SkillRecommendation[];
}

const priorityTiers = {
  critical: {
    title: 'Critical Path',
    description: 'Essential skills to reach your career goal',
    icon: Target,
    color: 'text-red-600 print:text-black',
    bgColor: 'bg-red-50 print:bg-white',
    borderColor: 'border-red-200 print:border-red-800',
  },
  high: {
    title: 'Accelerators',
    description: 'High-impact skills to fast-track your progress',
    icon: Zap,
    color: 'text-orange-600 print:text-black',
    bgColor: 'bg-orange-50 print:bg-white',
    borderColor: 'border-orange-200 print:border-orange-800',
  },
  medium: {
    title: 'Bonus Skills',
    description: 'Valuable additions to strengthen your profile',
    icon: Star,
    color: 'text-blue-600 print:text-black',
    bgColor: 'bg-blue-50 print:bg-white',
    borderColor: 'border-blue-200 print:border-blue-800',
  },
};

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="print:block">
        <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
          Learning Recommendations
        </h2>
        <p className="text-muted-foreground print:text-gray-700">
          No recommendations available yet. Set a career goal to receive personalized learning
          recommendations.
        </p>
      </div>
    );
  }

  // Group recommendations by priority tier
  const criticalPath = recommendations.filter(r => r.priority === 'critical');
  const accelerators = recommendations.filter(r => r.priority === 'high');
  const bonusSkills = recommendations.filter(r => r.priority === 'medium' || r.priority === 'low');

  const totalEstimatedHours = recommendations.reduce((sum, r) => sum + r.estimated_hours, 0);

  function renderTier(
    tier: keyof typeof priorityTiers,
    items: SkillRecommendation[],
    showIfEmpty = false
  ) {
    if (items.length === 0 && !showIfEmpty) return null;

    const tierConfig = priorityTiers[tier];
    const TierIcon = tierConfig.icon;

    return (
      <div className="mb-8 print:mb-10 print:break-inside-avoid">
        <div
          className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${tierConfig.borderColor} print:border-black`}
        >
          <TierIcon className={`h-6 w-6 ${tierConfig.color}`} />
          <div>
            <h3 className="text-xl font-bold print:text-black">{tierConfig.title}</h3>
            <p className="text-sm text-muted-foreground print:text-gray-700">
              {tierConfig.description}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground italic print:text-gray-700">
            No recommendations in this tier
          </p>
        ) : (
          <div className="space-y-4 print:space-y-5">
            {items.map((rec, index) => (
              <div
                key={rec.skill_id}
                className={`p-4 rounded-lg border-2 ${tierConfig.bgColor} ${tierConfig.borderColor} print:border-black print:break-inside-avoid`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold print:text-black">
                        {index + 1}. {rec.skill_name}
                      </span>
                      {rec.estimated_hours > 0 && (
                        <Badge
                          variant="secondary"
                          className="gap-1 print:bg-white print:border print:border-black"
                        >
                          <Clock className="h-3 w-3" />
                          {rec.estimated_hours}h
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground print:text-gray-700">
                      {rec.reason}
                    </p>
                  </div>
                </div>
                {rec.business_impact && (
                  <div className="mt-2 pt-2 border-t border-gray-200 print:border-black">
                    <p className="text-xs text-muted-foreground print:text-gray-700">
                      <strong className="print:text-black">Impact:</strong> {rec.business_impact}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="print:block">
      <h2 className="text-2xl font-bold mb-6 print:text-black print:border-b-2 print:border-black print:pb-2">
        Learning Recommendations
      </h2>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-8 print:bg-white print:border-black print:mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-purple-900 print:text-black">
              {recommendations.length} Skills Recommended
            </p>
            <p className="text-sm text-purple-700 print:text-gray-700">
              Estimated total learning time: {totalEstimatedHours} hours (
              {(totalEstimatedHours / 40).toFixed(1)} weeks at 40h/week)
            </p>
          </div>
        </div>
      </div>

      {renderTier('critical', criticalPath, true)}
      {renderTier('high', accelerators, true)}
      {renderTier('medium', bonusSkills, true)}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg print:bg-white print:border-2 print:border-black print:mt-10">
        <p className="text-sm text-muted-foreground print:text-gray-700">
          <strong className="print:text-black">Pro Tip:</strong> Focus on completing Critical Path
          skills first for maximum impact on your career readiness. Consider taking courses in
          priority order to build a strong foundation before advancing to accelerators.
        </p>
      </div>
    </div>
  );
}
