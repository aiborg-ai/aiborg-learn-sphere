/**
 * Assessment Scores Widget
 *
 * View recent assessment scores with bar chart
 */

import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { WidgetComponentProps, ChartWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function AssessmentScoresWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ChartWidgetConfig;
  const limit = config.limit || 10;
  const showGrid = config.showGrid !== false;

  const { data: scores, isLoading } = useQuery({
    queryKey: ['assessment-scores', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assessment_results')
        .select(
          `
          id,
          score,
          passed,
          completed_at,
          assessment:assessments(
            title
          )
        `
        )
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(result => ({
        name: (result.assessment as any)?.title?.substring(0, 20) || 'Assessment',
        score: result.score,
        passed: result.passed,
        date: new Date(result.completed_at).toLocaleDateString(),
      }));
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No assessment scores yet</p>
        <p className="text-xs mt-1">Complete assessments to see scores!</p>
      </div>
    );
  }

  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
  const passRate = Math.round((scores.filter(s => s.passed).length / scores.length) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold">{avgScore}%</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-600">{passRate}%</p>
          <p className="text-xs text-muted-foreground">Pass Rate</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={scores.slice(0, 8)}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {scores.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.passed ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AssessmentScoresWidget;
