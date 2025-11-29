/**
 * SimilarCoursesSection Component
 * Display similar courses based on vector similarity
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, BookOpen, TrendingUp, ArrowRight, Info } from '@/components/ui/icons';
import { useSimilarContent } from '@/hooks/useRecommendations';
import type { Recommendation } from '@/services/ai/RecommendationEngineService';
import { cn } from '@/lib/utils';
import { prefetchCourseDetails, prefetchCourseReviews, createPrefetchOnHoverWithDelay } from '@/utils/prefetch';

export interface SimilarCoursesSectionProps {
  courseId: string;
  limit?: number;
  className?: string;
  onCourseClick?: (courseId: string) => void;
}

/**
 * Get confidence color
 */
function getConfidenceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * Compact course card for similar courses
 */
function SimilarCourseCard({
  recommendation,
  onClick,
}: {
  recommendation: Recommendation;
  onClick?: () => void;
}) {
  const confidencePercent = Math.round(recommendation.confidenceScore * 100);

  // Create prefetch handlers for this course card
  const prefetchHandlers = createPrefetchOnHoverWithDelay(async () => {
    await Promise.all([
      prefetchCourseDetails(recommendation.contentId),
      prefetchCourseReviews(recommendation.contentId),
    ]);
  }, 500); // 500ms delay for similar course cards

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
      onMouseEnter={prefetchHandlers.onMouseEnter}
      onMouseLeave={prefetchHandlers.onMouseLeave}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
              {recommendation.title}
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className={cn('shrink-0', getConfidenceColor(recommendation.confidenceScore))}
          >
            {confidencePercent}% match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <CardDescription className="line-clamp-2 text-sm">
          {recommendation.description}
        </CardDescription>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {recommendation.metadata?.difficulty && (
            <Badge variant="outline" className="text-xs">
              {recommendation.metadata.difficulty}
            </Badge>
          )}
          {recommendation.metadata?.category && (
            <Badge variant="outline" className="text-xs">
              {recommendation.metadata.category}
            </Badge>
          )}
        </div>

        {/* Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">{recommendation.reason.primary}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SimilarCoursesSection Component
 */
export function SimilarCoursesSection({
  courseId,
  limit = 5,
  className,
  onCourseClick,
}: SimilarCoursesSectionProps) {
  const { data: similarCourses, isLoading, error } = useSimilarContent(courseId, 'course', limit);

  const handleCourseClick = (recommendation: Recommendation) => {
    if (onCourseClick) {
      onCourseClick(recommendation.contentId);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Similar Courses
                {isLoading && (
                  <TrendingUp className="h-4 w-4 animate-pulse text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                AI-powered recommendations based on course content similarity
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Failed to load similar courses. This feature requires course embeddings to be generated.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!similarCourses || similarCourses.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Similar Courses Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              We're still building the course similarity index. Check back soon for personalized
              recommendations!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Similar Courses Grid */}
      {!isLoading && similarCourses && similarCourses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarCourses.map(recommendation => (
              <SimilarCourseCard
                key={recommendation.id}
                recommendation={recommendation}
                onClick={() => handleCourseClick(recommendation)}
              />
            ))}
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Recommendations powered by AI vector similarity • Updated daily
            </p>
          </div>
        </>
      )}
    </div>
  );
}
