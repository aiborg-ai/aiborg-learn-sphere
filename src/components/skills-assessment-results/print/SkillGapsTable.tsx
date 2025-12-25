/**
 * SkillGapsTable Component
 *
 * Print-optimized table showing critical skill gaps for career goal
 * Shows: Skill, Required Level, Current Level, Importance, Gap Size
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle } from '@/components/ui/icons';

interface SkillGap {
  skill_name: string;
  required_level: string;
  current_level?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  gap_percentage: number;
}

interface SkillGapsTableProps {
  gaps: SkillGap[];
  targetRole?: string;
}

const importanceColors: Record<string, string> = {
  critical: 'bg-red-200 text-red-900 border-red-900',
  high: 'bg-orange-200 text-orange-900 border-orange-900',
  medium: 'bg-yellow-200 text-yellow-900 border-yellow-900',
  low: 'bg-blue-200 text-blue-900 border-blue-900',
};

const importanceLabels: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function SkillGapsTable({ gaps, targetRole }: SkillGapsTableProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="print:block">
        <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
          Skill Gaps Analysis
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 print:bg-white print:border-2 print:border-green-800">
          <p className="text-green-900 print:text-black font-medium">
            Excellent! No critical skill gaps identified.
          </p>
          <p className="text-green-700 print:text-gray-700 text-sm mt-2">
            Your current skills align well with {targetRole || 'your career goals'}.
          </p>
        </div>
      </div>
    );
  }

  // Sort by importance (critical first), then by gap percentage
  const sortedGaps = [...gaps].sort((a, b) => {
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const orderA = importanceOrder[a.importance] ?? 999;
    const orderB = importanceOrder[b.importance] ?? 999;

    if (orderA !== orderB) return orderA - orderB;
    return b.gap_percentage - a.gap_percentage;
  });

  const criticalCount = gaps.filter(g => g.importance === 'critical').length;
  const highCount = gaps.filter(g => g.importance === 'high').length;

  return (
    <div className="print:block">
      <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
        Skill Gaps Analysis
      </h2>
      {targetRole && (
        <p className="text-sm text-muted-foreground mb-4 print:text-gray-700 print:mb-6">
          Skills needed to reach <strong className="print:text-black">{targetRole}</strong>
        </p>
      )}

      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3 print:bg-white print:border-2 print:border-red-800 print:mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 print:text-black flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 print:text-black">
              {criticalCount} Critical Gap{criticalCount !== 1 ? 's' : ''} Identified
            </p>
            <p className="text-sm text-red-700 print:text-gray-700 mt-1">
              Focus on these skills first to accelerate your career progress.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse print:border-2 print:border-black">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                #
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Skill
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Required Level
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Current Level
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Importance
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Gap Size
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGaps.map((gap, index) => (
              <tr
                key={`${gap.skill_name}-${index}`}
                className="hover:bg-muted/50 print:hover:bg-transparent"
              >
                <td className="p-3 border print:border-black print:text-black">{index + 1}</td>
                <td className="p-3 border print:border-black print:text-black font-medium">
                  {gap.skill_name}
                </td>
                <td className="p-3 border print:border-black print:text-black capitalize">
                  {gap.required_level}
                </td>
                <td className="p-3 border print:border-black print:text-black capitalize">
                  {gap.current_level || 'Not assessed'}
                </td>
                <td className="p-3 border print:border-black text-center">
                  <Badge
                    className={`print:border ${
                      importanceColors[gap.importance] || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {importanceLabels[gap.importance] || gap.importance}
                  </Badge>
                </td>
                <td className="p-3 border print:border-black text-center print:text-black font-semibold">
                  {gap.gap_percentage.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:mt-6">
        <div className="text-center p-3 bg-red-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-red-600 print:text-black">{criticalCount}</div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Critical</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-orange-600 print:text-black">{highCount}</div>
          <div className="text-xs text-muted-foreground print:text-gray-700">High</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-blue-600 print:text-black">{gaps.length}</div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Total Gaps</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-purple-600 print:text-black">
            {(gaps.reduce((sum, g) => sum + g.gap_percentage, 0) / gaps.length).toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Avg Gap</div>
        </div>
      </div>
    </div>
  );
}
