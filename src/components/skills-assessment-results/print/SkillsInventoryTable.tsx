/**
 * SkillsInventoryTable Component
 * Displays all user skills in tabular format for print
 * Columns: Skill, Category, Proficiency Level, Score, Verified
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from '@/components/ui/icons';
import type { UserSkill } from '@/services/skills/SkillExtractionService';

interface SkillsInventoryTableProps {
  skills: UserSkill[];
}

export function SkillsInventoryTable({ skills }: SkillsInventoryTableProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No skills assessed yet</p>
      </div>
    );
  }

  // Sort skills by proficiency score (descending)
  const sortedSkills = [...skills].sort((a, b) => b.proficiency_score - a.proficiency_score);

  return (
    <div className="space-y-4 print:break-inside-avoid">
      <div>
        <h2 className="text-2xl font-bold mb-2 print:text-xl">Skills Inventory</h2>
        <p className="text-muted-foreground print:text-black print:text-sm">
          Detailed breakdown of your assessed skills ({skills.length} total)
        </p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-border print:border-black print:text-sm">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="border border-border px-4 py-2 text-left font-semibold print:border-black print:px-3 print:py-1.5">
                Skill
              </th>
              <th className="border border-border px-4 py-2 text-left font-semibold print:border-black print:px-3 print:py-1.5">
                Category
              </th>
              <th className="border border-border px-4 py-2 text-left font-semibold print:border-black print:px-3 print:py-1.5">
                Proficiency
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Score
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Verified
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSkills.map((userSkill, index) => (
              <tr
                key={userSkill.id}
                className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30 print:bg-gray-50'}
              >
                <td className="border border-border px-4 py-2 font-medium print:border-black print:px-3 print:py-1.5 print:text-sm">
                  {userSkill.skill.name}
                </td>
                <td className="border border-border px-4 py-2 text-sm print:border-black print:px-3 print:py-1.5">
                  {userSkill.skill.category}
                </td>
                <td className="border border-border px-4 py-2 print:border-black print:px-3 print:py-1.5">
                  <Badge
                    variant={
                      userSkill.proficiency_score >= 80
                        ? 'default'
                        : userSkill.proficiency_score >= 60
                          ? 'secondary'
                          : 'outline'
                    }
                    className="print:border-black print:bg-white print:text-black print:text-xs"
                  >
                    {userSkill.proficiency_level}
                  </Badge>
                </td>
                <td className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                  {userSkill.proficiency_score}%
                </td>
                <td className="border border-border px-4 py-2 text-center print:border-black print:px-3 print:py-1.5">
                  {userSkill.verified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto print:text-black print:h-4 print:w-4" />
                  ) : (
                    <span className="text-muted-foreground text-sm print:text-black">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg print:bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold">{skills.length}</div>
          <div className="text-sm text-muted-foreground">Total Skills</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {skills.filter(s => s.verified).length}
          </div>
          <div className="text-sm text-muted-foreground">Verified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {Math.round(skills.reduce((sum, s) => sum + s.proficiency_score, 0) / skills.length)}%
          </div>
          <div className="text-sm text-muted-foreground">Avg Proficiency</div>
        </div>
      </div>
    </div>
  );
}
