/**
 * SkillsInventoryTable Component
 *
 * Print-optimized table displaying all user skills
 * Shows: Skill Name, Category, Proficiency, Score, Verified Status
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from '@/components/ui/icons';

interface UserSkill {
  skill_id: string;
  user_id: string;
  proficiency_level: string;
  assessment_score: number;
  verified: boolean;
  skill?: {
    id: string;
    name: string;
    category: string;
  };
}

interface SkillsInventoryTableProps {
  skills: UserSkill[];
}

const proficiencyColors: Record<string, string> = {
  beginner: 'bg-gray-200 text-gray-800',
  intermediate: 'bg-blue-200 text-blue-800',
  advanced: 'bg-green-200 text-green-800',
  expert: 'bg-purple-200 text-purple-800',
};

const proficiencyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function SkillsInventoryTable({ skills }: SkillsInventoryTableProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="print:block">
        <h2 className="text-2xl font-bold mb-4 print:text-black">Skills Inventory</h2>
        <p className="text-muted-foreground print:text-gray-700">
          No skills recorded yet. Complete assessments to build your skills inventory.
        </p>
      </div>
    );
  }

  // Sort skills: verified first, then by score
  const sortedSkills = [...skills].sort((a, b) => {
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return b.assessment_score - a.assessment_score;
  });

  return (
    <div className="print:block">
      <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
        Skills Inventory
      </h2>
      <p className="text-sm text-muted-foreground mb-4 print:text-gray-700 print:mb-6">
        Comprehensive overview of {skills.length} assessed skill{skills.length !== 1 ? 's' : ''}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse print:border-2 print:border-black">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                #
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Skill Name
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Category
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Proficiency
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Score
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Verified
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSkills.map((skill, index) => (
              <tr key={skill.skill_id} className="hover:bg-muted/50 print:hover:bg-transparent">
                <td className="p-3 border print:border-black print:text-black">{index + 1}</td>
                <td className="p-3 border print:border-black print:text-black font-medium">
                  {skill.skill?.name || 'Unknown Skill'}
                </td>
                <td className="p-3 border print:border-black print:text-black">
                  {skill.skill?.category || 'Uncategorized'}
                </td>
                <td className="p-3 border print:border-black">
                  <Badge
                    className={`print:border print:border-black ${
                      proficiencyColors[skill.proficiency_level] || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {proficiencyLabels[skill.proficiency_level] || skill.proficiency_level}
                  </Badge>
                </td>
                <td className="p-3 border print:border-black text-center print:text-black font-semibold">
                  {skill.assessment_score.toFixed(0)}%
                </td>
                <td className="p-3 border print:border-black text-center">
                  {skill.verified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 print:text-black mx-auto" />
                  ) : (
                    <span className="text-muted-foreground print:text-gray-500 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground print:text-gray-700 print:mt-6">
        <p>
          <strong className="print:text-black">{skills.filter(s => s.verified).length}</strong> of{' '}
          <strong className="print:text-black">{skills.length}</strong> skills verified
        </p>
      </div>
    </div>
  );
}
