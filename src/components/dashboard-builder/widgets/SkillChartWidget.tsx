/**
 * Skill Chart Widget
 *
 * Visualize skill development with radar chart
 */

import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetComponentProps, ChartWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function SkillChartWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ChartWidgetConfig;
  const showLegend = config.showLegend !== false;

  const { data: skillsData, isLoading } = useQuery({
    queryKey: ['skills-chart', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's course enrollments to calculate skill levels
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          progress,
          course:courses(
            keywords
          )
        `
        )
        .eq('user_id', user.id);

      if (error) throw error;

      // Aggregate skills from course keywords
      const skillMap: Record<string, number[]> = {};

      enrollments?.forEach(enrollment => {
        const keywords =
          ((enrollment.course as Record<string, unknown>)?.keywords as string[]) || [];
        const progress = enrollment.progress || 0;

        keywords.forEach((keyword: string) => {
          if (!skillMap[keyword]) {
            skillMap[keyword] = [];
          }
          skillMap[keyword].push(progress);
        });
      });

      // Calculate average progress per skill
      const skills = Object.entries(skillMap)
        .map(([skill, progressArray]) => ({
          skill,
          level: progressArray.reduce((a, b) => a + b, 0) / progressArray.length,
        }))
        .sort((a, b) => b.level - a.level)
        .slice(0, 6); // Top 6 skills

      return skills;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!skillsData || skillsData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No skills tracked yet</p>
        <p className="text-xs mt-1">Start courses to develop skills!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={skillsData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Skill Level"
            dataKey="level"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="space-y-2">
          {skillsData.map(skill => (
            <div key={skill.skill} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{skill.skill}</span>
              <span className="font-semibold">{Math.round(skill.level)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SkillChartWidget;
