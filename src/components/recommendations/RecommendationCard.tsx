/**
 * RecommendationCard Component
 * Display a single AI recommendation with explanation
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  X,
  BookOpen,
  MapPin,
  FileText,
  CheckCircle2,
} from '@/components/ui/icons';
import type { Recommendation } from '@/services/ai/RecommendationEngineService';
import { cn } from '@/lib/utils';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onEnroll?: (recommendationId: string, contentId: string) => void;
  onFeedback?: (recommendationId: string, isHelpful: boolean) => void;
  onDismiss?: (recommendationId: string) => void;
  onClick?: (recommendationId: string, contentId: string) => void;
  showExplanation?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Get icon for content type
 */
function getContentIcon(contentType: string) {
  switch (contentType) {
    case 'course':
      return BookOpen;
    case 'learning_path':
      return MapPin;
    case 'blog_post':
      return FileText;
    default:
      return BookOpen;
  }
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
 * RecommendationCard Component
 */
export function RecommendationCard({
  recommendation,
  onEnroll,
  onFeedback,
  onDismiss,
  onClick,
  showExplanation = true,
  compact = false,
  className,
}: RecommendationCardProps) {
  const Icon = getContentIcon(recommendation.contentType);
  const confidencePercent = Math.round(recommendation.confidenceScore * 100);

  const handleCardClick = () => {
    if (onClick) {
      onClick(recommendation.id, recommendation.contentId);
    }
  };

  return (
    <Card
      className={cn(
        'relative hover:shadow-md transition-shadow cursor-pointer',
        compact && 'p-4',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={e => {
            e.stopPropagation();
            onDismiss(recommendation.id);
          }}
          aria-label="Dismiss recommendation"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-start gap-3">
          {/* Content Icon */}
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Rank Badge */}
            {recommendation.rank <= 3 && (
              <Badge variant="secondary" className="mb-2">
                #{recommendation.rank} Recommended
              </Badge>
            )}

            {/* Title */}
            <CardTitle className="text-lg line-clamp-2">{recommendation.title}</CardTitle>

            {/* Primary Reason */}
            <div className="flex items-center gap-2 mt-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">
                {recommendation.reason.primary}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pb-2' : ''}>
        {/* Description */}
        {!compact && (
          <CardDescription className="line-clamp-2 mb-4">
            {recommendation.description}
          </CardDescription>
        )}

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.metadata?.difficulty && (
            <Badge variant="outline">{recommendation.metadata.difficulty}</Badge>
          )}
          {recommendation.metadata?.category && (
            <Badge variant="outline">{recommendation.metadata.category}</Badge>
          )}
          {recommendation.metadata?.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Confidence Score */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match Score</span>
            <span className={cn('font-medium', getConfidenceColor(recommendation.confidenceScore))}>
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-2" />
        </div>

        {/* Explanation */}
        {showExplanation && !compact && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground">{recommendation.reason.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEnroll && (
            <Button
              onClick={e => {
                e.stopPropagation();
                onEnroll(recommendation.id, recommendation.contentId);
              }}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enroll Now
            </Button>
          )}

          {onFeedback && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={e => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, true);
                }}
                title="This is helpful"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={e => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, false);
                }}
                title="Not relevant"
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
