/**
 * Recommended Courses Widget
 * Dashboard widget displaying personalized course recommendations
 * Uses AI-powered recommendation engine with explanations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  Clock,
  ThumbsUp,
  ThumbsDown,
  X,
  ExternalLink,
  TrendingUp,
  Target,
} from '@/components/ui/icons';
import {
  usePersonalizedRecommendations,
  useRecommendationFeedback,
  useRecommendationInteraction,
} from '@/hooks/useRecommendations';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface RecommendationItem {
  recommendation_id: string;
  content_id: string;
  content_title?: string;
  title?: string;
  description?: string;
  difficulty_level?: string;
  score?: number;
  metadata?: {
    estimated_hours?: number;
    reason?: string;
    topics?: string[];
    prerequisites?: string[];
  };
}

interface RecommendedCoursesWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function RecommendedCoursesWidget({
  limit = 5,
  showHeader = true,
  compact = false,
}: RecommendedCoursesWidgetProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = usePersonalizedRecommendations('course', {
    limit,
  });

  const feedbackMutation = useRecommendationFeedback();
  const { trackClick, trackEnrollment: _trackEnrollment, dismiss } = useRecommendationInteraction();

  const handleCourseClick = (courseId: string, recommendationId: string) => {
    trackClick(recommendationId);
    navigate(`/courses/${courseId}`);
  };

  const handleFeedback = async (recommendationId: string, isHelpful: boolean) => {
    try {
      await feedbackMutation.mutateAsync({
        recommendationId,
        isHelpful,
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
    }
  };

  const handleDismiss = (recommendationId: string) => {
    dismiss(recommendationId);
    toast.success('Recommendation removed');
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-blue-500',
      advanced: 'bg-purple-500',
      expert: 'bg-red-500',
    };
    return colors[difficulty.toLowerCase()] || 'bg-gray-500';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-destructive mb-4">Failed to load recommendations</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Recommended for You</CardTitle>
            </div>
            <CardDescription>AI-powered course suggestions based on your progress</CardDescription>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {[...Array(compact ? 3 : limit)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Recommended for You</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Complete an assessment to get personalized course recommendations
          </p>
          <Button onClick={() => navigate('/assessments')} variant="outline">
            Take Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Recommended for You</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses?recommended=true')}>
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <CardDescription>
            AI-powered suggestions tailored to your learning goals and skill level
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-4 space-y-3' : 'space-y-4'}>
        {recommendations.map((rec: RecommendationItem, index) => (
          <button
            type="button"
            key={rec.recommendation_id || rec.content_id || index}
            className="group relative p-4 border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer bg-transparent text-left w-full"
            onClick={() => handleCourseClick(rec.content_id, rec.recommendation_id)}
          >
            {/* Dismiss Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                handleDismiss(rec.recommendation_id);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
              aria-label="Dismiss recommendation"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pr-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {rec.content_title || rec.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`${getDifficultyColor(rec.difficulty_level || 'intermediate')} text-white text-xs`}
                    >
                      {rec.difficulty_level || 'Intermediate'}
                    </Badge>
                    {rec.metadata?.estimated_hours && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {rec.metadata.estimated_hours}h
                      </span>
                    )}
                    {rec.score && rec.score > 0.8 && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Top Match
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {rec.description && !compact && (
                <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
              )}

              {/* Recommendation Reason */}
              {rec.metadata?.reason && (
                <div className="bg-primary/5 border-l-2 border-primary px-3 py-2 rounded">
                  <p className="text-xs text-primary font-medium">{rec.metadata.reason}</p>
                </div>
              )}

              {/* Expandable Details */}
              {!compact && expandedId === rec.recommendation_id && (
                <div className="space-y-2 pt-2 border-t">
                  {rec.metadata?.topics && rec.metadata.topics.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Topics Covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.metadata.topics.slice(0, 5).map((topic: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {rec.metadata?.prerequisites && rec.metadata.prerequisites.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Prerequisites:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {rec.metadata.prerequisites.slice(0, 3).map((prereq: string, i: number) => (
                          <li key={i}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {!compact && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleFeedback(rec.recommendation_id, true);
                      }}
                      className="h-7 px-2"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleFeedback(rec.recommendation_id, false);
                      }}
                      className="h-7 px-2"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedId(
                        expandedId === rec.recommendation_id ? null : rec.recommendation_id
                      );
                    }}
                    className="text-xs"
                  >
                    {expandedId === rec.recommendation_id ? 'Show Less' : 'Show More'}
                  </Button>
                </div>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
