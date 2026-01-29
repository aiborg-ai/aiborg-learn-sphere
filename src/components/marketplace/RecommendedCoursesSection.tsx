/**
 * Recommended Courses Section
 * AI-powered personalized course recommendations
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Star,
  ArrowRight,
  TrendingUp,
  Target,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderBadge } from './ProviderBadge';
import { CompactPrice } from './PriceDisplay';
import type { CourseRecommendation } from '@/types/marketplace';

interface RecommendedCoursesSectionProps {
  recommendations: CourseRecommendation[];
  isLoading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export function RecommendedCoursesSection({
  recommendations,
  isLoading = false,
  onViewAll,
  className,
}: RecommendedCoursesSectionProps) {
  if (!isLoading && recommendations.length === 0) {
    return null;
  }

  const getMatchIcon = (type: string) => {
    switch (type) {
      case 'skill_level':
        return <Target className="h-3 w-3" />;
      case 'learning_goal':
        return <TrendingUp className="h-3 w-3" />;
      case 'topic':
        return <BookOpen className="h-3 w-3" />;
      case 'popularity':
        return <Star className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Recommended for You</h2>
        </div>
        {onViewAll && recommendations.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Recommendations Scroll */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full pb-4">
          <div className="flex gap-4">
            {recommendations.map((course, index) => (
              <RecommendationCard key={course.id} course={course} rank={index + 1} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  );
}

/**
 * Individual Recommendation Card
 */
interface RecommendationCardProps {
  course: CourseRecommendation;
  rank: number;
}

function RecommendationCard({ course, rank }: RecommendationCardProps) {
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-muted-foreground bg-muted';
  };

  const primaryReason = course.matchReasons[0];

  return (
    <Card className="min-w-[300px] max-w-[300px] flex-shrink-0 overflow-hidden transition-all hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}

        {/* Rank Badge */}
        {rank <= 3 && (
          <Badge
            className={cn(
              'absolute left-2 top-2',
              rank === 1 && 'bg-amber-500 text-white',
              rank === 2 && 'bg-slate-400 text-white',
              rank === 3 && 'bg-amber-700 text-white'
            )}
          >
            #{rank} Pick
          </Badge>
        )}

        {/* Match Score */}
        <Badge
          className={cn('absolute right-2 top-2 font-bold', getMatchScoreColor(course.matchScore))}
        >
          {course.matchScore}% Match
        </Badge>
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Provider */}
        <ProviderBadge
          provider={course.provider_slug}
          logoUrl={course.provider_logo_url}
          size="sm"
        />

        {/* Title */}
        <h3 className="line-clamp-2 font-semibold leading-snug">{course.title}</h3>

        {/* Match Reason */}
        {primaryReason && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="line-clamp-1">{primaryReason.description}</span>
          </div>
        )}

        {/* Rating & Duration */}
        <div className="flex items-center justify-between text-sm">
          {course.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.duration_text && (
            <span className="text-muted-foreground">{course.duration_text}</span>
          )}
        </div>

        {/* Skills to Learn */}
        {course.skillGapsFilled.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.skillGapsFilled.slice(0, 2).map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {course.skillGapsFilled.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{course.skillGapsFilled.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-2">
          <CompactPrice
            priceType={course.price_type}
            amount={course.price_amount}
            currency={course.price_currency}
          />
          <Button asChild size="sm">
            <a href={course.external_url} target="_blank" rel="noopener noreferrer">
              View
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for recommendation card
 */
function RecommendationCardSkeleton() {
  return (
    <Card className="min-w-[300px] max-w-[300px] flex-shrink-0 overflow-hidden">
      <div className="aspect-video animate-pulse bg-muted" />
      <CardContent className="space-y-3 p-4">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex gap-1">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default RecommendedCoursesSection;
