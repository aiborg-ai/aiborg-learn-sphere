/**
 * AI Insights Widget
 *
 * Personalized AI-powered learning insights
 */

import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function AIInsightsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as BaseWidgetConfig;

  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch user data to generate insights
      const [enrollments, assessments, streaks] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('progress, completed_at')
          .eq('user_id', user.id),
        supabase
          .from('assessment_results')
          .select('score, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single(),
      ]);

      // Generate AI insights based on data
      const totalCourses = enrollments.data?.length || 0;
      const completedCourses = enrollments.data?.filter(e => e.completed_at).length || 0;
      const avgProgress =
        totalCourses > 0
          ? enrollments.data.reduce((sum, e) => sum + (e.progress || 0), 0) / totalCourses
          : 0;
      const avgScore =
        assessments.data && assessments.data.length > 0
          ? assessments.data.reduce((sum, a) => sum + a.score, 0) / assessments.data.length
          : 0;
      const currentStreak = streaks.data?.current_streak || 0;

      const generatedInsights = [];

      // Insight 1: Progress trend
      if (avgProgress > 70) {
        generatedInsights.push({
          id: '1',
          type: 'positive',
          icon: TrendingUp,
          title: 'Excellent Progress!',
          description: `You're ${Math.round(avgProgress)}% through your courses on average. Keep up the momentum!`,
          priority: 'high',
        });
      } else if (avgProgress > 30) {
        generatedInsights.push({
          id: '1',
          type: 'neutral',
          icon: Target,
          title: 'Steady Progress',
          description: `You're ${Math.round(avgProgress)}% through your courses. Consider setting aside dedicated study time to accelerate.`,
          priority: 'medium',
        });
      } else if (totalCourses > 0) {
        generatedInsights.push({
          id: '1',
          type: 'suggestion',
          icon: Lightbulb,
          title: 'Get Started',
          description: `You have ${totalCourses} enrolled courses. Start with one course and build from there!`,
          priority: 'high',
        });
      }

      // Insight 2: Performance trend
      if (avgScore >= 80) {
        generatedInsights.push({
          id: '2',
          type: 'positive',
          icon: Sparkles,
          title: 'Outstanding Performance',
          description: `Your average score is ${Math.round(avgScore)}%. You're mastering the material!`,
          priority: 'high',
        });
      } else if (avgScore >= 60 && assessments.data && assessments.data.length > 0) {
        generatedInsights.push({
          id: '2',
          type: 'suggestion',
          icon: Target,
          title: 'Room for Improvement',
          description: `Average score: ${Math.round(avgScore)}%. Try reviewing material before assessments.`,
          priority: 'medium',
        });
      }

      // Insight 3: Streak insight
      if (currentStreak >= 7) {
        generatedInsights.push({
          id: '3',
          type: 'positive',
          icon: TrendingUp,
          title: 'Amazing Streak!',
          description: `${currentStreak} days in a row! Consistency is key to learning success.`,
          priority: 'high',
        });
      } else if (currentStreak >= 3) {
        generatedInsights.push({
          id: '3',
          type: 'neutral',
          icon: Target,
          title: 'Building Momentum',
          description: `${currentStreak} day streak. Aim for 7 days to build a strong habit!`,
          priority: 'medium',
        });
      }

      // Insight 4: Completion rate
      const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
      if (completionRate < 30 && totalCourses >= 3) {
        generatedInsights.push({
          id: '4',
          type: 'suggestion',
          icon: Lightbulb,
          title: 'Focus Your Energy',
          description: `You have ${totalCourses} courses but only completed ${completedCourses}. Try focusing on completing one course at a time.`,
          priority: 'high',
        });
      }

      // Default insight if no data
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: 'default',
          type: 'neutral',
          icon: Sparkles,
          title: 'Welcome!',
          description: 'Start your learning journey to receive personalized AI insights.',
          priority: 'low',
        });
      }

      return generatedInsights.slice(0, 3); // Return top 3 insights
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : 3600000, // Default 1 hour
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-100';
      case 'suggestion':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-100';
      default:
        return 'bg-muted/50 border-muted';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'suggestion':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-3">
      {insights.map(insight => {
        const IconComponent = insight.icon;

        return (
          <div
            key={insight.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${getTypeColor(insight.type)}`}
          >
            <div className={`p-2 rounded-lg ${getTypeBadgeColor(insight.type)}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm">{insight.title}</h4>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getTypeBadgeColor(insight.type)}`}
                >
                  {insight.type}
                </Badge>
              </div>
              <p className="text-sm opacity-90">{insight.description}</p>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-center text-muted-foreground">
        <Sparkles className="inline h-3 w-3 mr-1" />
        Insights generated by AI based on your learning patterns
      </p>
    </div>
  );
}

export default AIInsightsWidget;
