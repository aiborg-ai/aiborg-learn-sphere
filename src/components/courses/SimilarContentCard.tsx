/**
 * Similar Content Card Component
 * Displays "Students also viewed" recommendations on course detail pages
 * Uses vector similarity search for semantic matching
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSimilarContent, useRecommendationInteraction } from '@/hooks/useRecommendations';
import { Clock, Users, Star, TrendingUp, ArrowRight } from '@/components/ui/icons';

interface SimilarContentCardProps {
  contentId: string;
  contentType?: 'course' | 'learning_path';
  limit?: number;
  title?: string;
  description?: string;
  showRatings?: boolean;
}

export function SimilarContentCard({
  contentId,
  contentType = 'course',
  limit = 4,
  title = 'Similar Courses',
  description = 'Other students also viewed these courses',
  showRatings = true,
}: SimilarContentCardProps) {
  const navigate = useNavigate();
  const { data: similarContent, isLoading, error } = useSimilarContent(contentId, contentType, limit);
  const { trackClick } = useRecommendationInteraction();

  const handleContentClick = (id: string, recommendationId?: string) => {
    if (recommendationId) {
      trackClick(recommendationId);
    }

    if (contentType === 'course') {
      navigate(`/courses/${id}`);
    } else {
      navigate(`/learning-paths/${id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-green-600 bg-green-50 border-green-200',
      intermediate: 'text-blue-600 bg-blue-50 border-blue-200',
      advanced: 'text-purple-600 bg-purple-50 border-purple-200',
      expert: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[difficulty?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (error) {
    return null; // Fail silently - this is a supplementary feature
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!similarContent || similarContent.length === 0) {
    return null; // Don't show if no similar content
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {similarContent.map((content: any, index) => (
          <div
            key={content.content_id || content.id || index}
            className="group p-4 border rounded-lg hover:border-primary hover:bg-secondary/30 transition-all cursor-pointer"
            onClick={() => handleContentClick(content.content_id || content.id, content.recommendation_id)}
          >
            <div className="space-y-2">
              {/* Title and Badge */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors flex-1">
                  {content.content_title || content.title}
                </h4>
                {content.score && content.score > 0.8 && (
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    <Star className="h-3 w-3 mr-1" />
                    Match
                  </Badge>
                )}
              </div>

              {/* Description */}
              {content.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {content.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {content.difficulty_level && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${getDifficultyColor(content.difficulty_level)}`}
                  >
                    {content.difficulty_level}
                  </Badge>
                )}

                {content.metadata?.estimated_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {content.metadata.estimated_hours}h
                  </span>
                )}

                {showRatings && content.metadata?.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {content.metadata.average_rating.toFixed(1)}
                  </span>
                )}

                {content.metadata?.enrollment_count && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {content.metadata.enrollment_count > 1000
                      ? `${(content.metadata.enrollment_count / 1000).toFixed(1)}k`
                      : content.metadata.enrollment_count}
                  </span>
                )}
              </div>

              {/* Similarity Reason (if provided) */}
              {content.metadata?.similarity_reason && (
                <p className="text-xs text-primary bg-primary/5 px-2 py-1 rounded">
                  {content.metadata.similarity_reason}
                </p>
              )}

              {/* View Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentClick(content.content_id || content.id, content.recommendation_id);
                }}
              >
                <span>View {contentType === 'course' ? 'Course' : 'Learning Path'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* View All Link */}
        {similarContent.length >= limit && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate(`/${contentType}s?similar_to=${contentId}`)}
          >
            View All Similar {contentType === 'course' ? 'Courses' : 'Learning Paths'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebars
 */
export function SimilarContentSidebar({
  contentId,
  contentType = 'course',
  limit = 3,
}: Omit<SimilarContentCardProps, 'title' | 'description' | 'showRatings'>) {
  return (
    <SimilarContentCard
      contentId={contentId}
      contentType={contentType}
      limit={limit}
      title="You might also like"
      description="Based on this content"
      showRatings={false}
    />
  );
}
