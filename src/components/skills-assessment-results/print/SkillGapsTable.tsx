/**
 * SkillGapsTable Component
 * Displays critical skill gaps for career readiness
 * Columns: Skill, Required Level, Current Level, Importance, Gap Size
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle } from '@/components/ui/icons';
import type { SkillGap } from '@/types/skillsAssessment';

interface SkillGapsTableProps {
  gaps: SkillGap[];
  targetRole?: string;
}

export function SkillGapsTable({ gaps, targetRole }: SkillGapsTableProps) {
  if (gaps.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Career Skill Gaps</h2>
          {targetRole && (
            <p className="text-muted-foreground">Skills needed to reach: {targetRole}</p>
          )}
        </div>
        <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">
            Excellent! You have no critical skill gaps for this role.
          </p>
        </div>
      </div>
    );
  }

  // Sort gaps by importance: critical → high → medium → low
  const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedGaps = [...gaps].sort((a, b) => {
    const orderA = importanceOrder[a.importance as keyof typeof importanceOrder] ?? 4;
    const orderB = importanceOrder[b.importance as keyof typeof importanceOrder] ?? 4;
    return orderA - orderB;
  });

  // Get importance badge variant
  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical':
        return { variant: 'destructive' as const, text: 'Critical' };
      case 'high':
        return { variant: 'default' as const, text: 'High' };
      case 'medium':
        return { variant: 'secondary' as const, text: 'Medium' };
      case 'low':
        return { variant: 'outline' as const, text: 'Low' };
      default:
        return { variant: 'outline' as const, text: importance };
    }
  };

  // Get gap size color
  const getGapColor = (gapSize: number) => {
    if (gapSize >= 40) return 'text-red-600';
    if (gapSize >= 20) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-4 print:break-inside-avoid">
      <div>
        <h2 className="text-2xl font-bold mb-2 print:text-xl">Career Skill Gaps</h2>
        <p className="text-muted-foreground print:text-black print:text-sm">
          {targetRole
            ? `Skills needed to reach: ${targetRole} (${gaps.length} gaps identified)`
            : `${gaps.length} skill gaps identified`}
        </p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-border print:border-black print:text-sm">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="border border-border px-4 py-2 text-left font-semibold print:border-black print:px-3 print:py-1.5">
                Skill
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Current
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Required
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Gap
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Importance
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGaps.map((gap, index) => {
              const gapSize = gap.required_proficiency - (gap.current_proficiency || 0);
              const importanceBadge = getImportanceBadge(gap.importance);

              return (
                <tr
                  key={gap.skill_id}
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30 print:bg-gray-50'}
                >
                  <td className="border border-border px-4 py-2 font-medium print:border-black print:px-3 print:py-1.5 print:text-sm">
                    <div className="flex items-center gap-2">
                      {gap.importance === 'critical' && (
                        <AlertCircle className="h-4 w-4 text-red-600 print:text-black" />
                      )}
                      {gap.skill_name}
                    </div>
                  </td>
                  <td className="border border-border px-4 py-2 text-center print:border-black print:px-3 print:py-1.5">
                    <span className="text-muted-foreground print:text-black">
                      {gap.current_proficiency || 0}%
                    </span>
                  </td>
                  <td className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                    {gap.required_proficiency}%
                  </td>
                  <td className="border border-border px-4 py-2 text-center print:border-black print:px-3 print:py-1.5">
                    <span className={`font-bold ${getGapColor(gapSize)} print:text-black`}>
                      -{gapSize}%
                    </span>
                  </td>
                  <td className="border border-border px-4 py-2 text-center print:border-black print:px-3 print:py-1.5">
                    <Badge
                      variant={importanceBadge.variant}
                      className="print:border-black print:bg-white print:text-black print:text-xs"
                    >
                      {importanceBadge.text}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Gap Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg print:bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {sortedGaps.filter(g => g.importance === 'critical').length}
          </div>
          <div className="text-sm text-muted-foreground">Critical Gaps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {sortedGaps.filter(g => g.importance === 'high').length}
          </div>
          <div className="text-sm text-muted-foreground">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {Math.round(
              sortedGaps.reduce(
                (sum, g) => sum + (g.required_proficiency - (g.current_proficiency || 0)),
                0
              ) / sortedGaps.length
            )}
            %
          </div>
          <div className="text-sm text-muted-foreground">Avg Gap Size</div>
        </div>
      </div>
    </div>
  );
}
