/**
 * PersonalizedSection Component
 * Display a section of personalized recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationCard } from './RecommendationCard';
import { Sparkles, RefreshCw, Settings, Info } from 'lucide-react';
import type { Recommendation } from '@/services/ai/RecommendationEngineService';
import { cn } from '@/lib/utils';

export interface PersonalizedSectionProps {
  title: string;
  description?: string;
  recommendations: Recommendation[] | undefined;
  isLoading?: boolean;
  error?: Error | null;
  onEnroll?: (recommendationId: string, contentId: string) => void;
  onFeedback?: (recommendationId: string, isHelpful: boolean) => void;
  onDismiss?: (recommendationId: string) => void;
  onClick?: (recommendationId: string, contentId: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  showExplanations?: boolean;
  compact?: boolean;
  layout?: 'grid' | 'list';
  maxItems?: number;
  className?: string;
}

/**
 * PersonalizedSection Component
 */
export function PersonalizedSection({
  title,
  description,
  recommendations,
  isLoading = false,
  error = null,
  onEnroll,
  onFeedback,
  onDismiss,
  onClick,
  onRefresh,
  onSettings,
  showExplanations = true,
  compact = false,
  layout = 'grid',
  maxItems,
  className,
}: PersonalizedSectionProps) {
  const displayRecommendations = maxItems
    ? recommendations?.slice(0, maxItems)
    : recommendations;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {title}
                  {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                {description && <CardDescription className="mt-1">{description}</CardDescription>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                  Refresh
                </Button>
              )}
              {onSettings && (
                <Button variant="outline" size="icon" onClick={onSettings}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div
          className={cn(
            layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          )}
        >
          {[...Array(maxItems || 3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
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
            Failed to load recommendations: {error.message}
            {onRefresh && (
              <Button variant="link" size="sm" onClick={onRefresh} className="ml-2 h-auto p-0">
                Try again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!recommendations || recommendations.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              We're learning about your preferences. Start exploring courses to get personalized
              recommendations!
            </p>
            {onSettings && (
              <Button variant="outline" onClick={onSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Set Learning Preferences
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid/List */}
      {!isLoading && displayRecommendations && displayRecommendations.length > 0 && (
        <div
          className={cn(
            layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
            layout === 'list' && 'space-y-4'
          )}
        >
          {displayRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onEnroll={onEnroll}
              onFeedback={onFeedback}
              onDismiss={onDismiss}
              onClick={onClick}
              showExplanation={showExplanations}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Show More */}
      {!isLoading &&
        recommendations &&
        maxItems &&
        recommendations.length > maxItems && (
          <div className="flex justify-center">
            <Button variant="outline">
              View All {recommendations.length} Recommendations
            </Button>
          </div>
        )}
    </div>
  );
}
