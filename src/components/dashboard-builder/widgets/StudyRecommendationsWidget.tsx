/**
 * Study Recommendations Widget
 *
 * Personalized study recommendations based on AI analysis
 */

import { useQuery } from '@tanstack/react-query';
import { Lightbulb, BookOpen, ArrowRight } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface RecommendationConfig extends BaseWidgetConfig {
  limit?: number;
}

export function StudyRecommendationsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as RecommendationConfig;
  const limit = config.limit || 5;

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['study-recommendations', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch user preferences and enrollment data
      const [preferences, enrollments, allCourses] = await Promise.all([
        supabase.from('user_preferences_ai').select('*').eq('user_id', user.id).single(),
        supabase
          .from('course_enrollments')
          .select('course:courses(keywords, category)')
          .eq('user_id', user.id),
        supabase
          .from('courses')
          .select('id, title, category, level, keywords, difficulty_level')
          .eq('is_active', true)
          .limit(50),
      ]);

      const userPrefs = preferences.data;
      const enrolledCourseIds = new Set(
        enrollments.data?.map(
          (e: Record<string, unknown>) => (e.course as Record<string, unknown>)?.id as string
        ) || []
      );

      // Extract user's interests from enrolled courses
      const userKeywords = new Set<string>();
      const userCategories = new Set<string>();

      enrollments.data?.forEach((enrollment: Record<string, unknown>) => {
        const course = enrollment.course as Record<string, unknown>;
        (course?.keywords as string[])?.forEach((keyword: string) => userKeywords.add(keyword));
        if (course?.category) userCategories.add(course.category as string);
      });

      // Generate recommendations
      const recs = allCourses.data
        ?.filter(course => !enrolledCourseIds.has(course.id))
        .map(course => {
          let score = 0;

          // Match keywords
          const matchingKeywords =
            course.keywords?.filter((k: string) => userKeywords.has(k)).length || 0;
          score += matchingKeywords * 10;

          // Match category
          if (course.category && userCategories.has(course.category)) {
            score += 20;
          }

          // Match difficulty level preference
          if (userPrefs?.difficulty_preference) {
            if (course.difficulty_level === userPrefs.difficulty_preference) {
              score += 15;
            }
          }

          // Match learning style
          if (userPrefs?.learning_style_preference === 'visual' && course.level === 'beginner') {
            score += 10;
          }

          return {
            ...course,
            score,
            reason:
              matchingKeywords > 0
                ? `Matches your interest in ${course.keywords?.[0] || 'this topic'}`
                : course.category && userCategories.has(course.category)
                  ? `Related to your ${course.category} courses`
                  : 'Recommended for you',
          };
        })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recs || [];
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No recommendations yet</p>
        <p className="text-xs mt-1">Enroll in courses to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <div
          key={rec.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors border border-primary/10"
        >
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm line-clamp-1">{rec.title}</h4>
              {idx === 0 && (
                <Badge variant="default" className="text-xs shrink-0">
                  Top Pick
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
            <div className="flex items-center gap-2 mt-2">
              {rec.category && (
                <Badge variant="secondary" className="text-xs">
                  {rec.category}
                </Badge>
              )}
              {rec.level && (
                <Badge variant="outline" className="text-xs">
                  {rec.level}
                </Badge>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              // Navigate to course page
              window.location.href = `/courses/${rec.id}`;
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
        <BookOpen className="h-3 w-3" />
        <span>Recommendations based on your learning preferences</span>
      </div>
    </div>
  );
}

export default StudyRecommendationsWidget;
