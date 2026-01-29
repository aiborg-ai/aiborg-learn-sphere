/**
 * External Course Card Component
 * Displays an external course with rich information and actions
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Star,
  Clock,
  Users,
  Award,
  ExternalLink,
  Heart,
  Share2,
  Bell,
  BookOpen,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderBadge } from './ProviderBadge';
import { CompactPrice } from './PriceDisplay';
import type { ExternalCourseWithProvider } from '@/types/marketplace';
import { LEVEL_LABELS, MODE_LABELS } from '@/types/marketplace';

interface ExternalCourseCardProps {
  course: ExternalCourseWithProvider;
  onFavoriteToggle?: (courseId: string) => void;
  onCompareToggle?: (course: ExternalCourseWithProvider) => void;
  onShare?: (course: ExternalCourseWithProvider) => void;
  onPriceAlert?: (course: ExternalCourseWithProvider) => void;
  isComparing?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ExternalCourseCard({
  course,
  onFavoriteToggle,
  onCompareToggle,
  onShare,
  onPriceAlert,
  isComparing = false,
  isLoading = false,
  className,
}: ExternalCourseCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(course.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(course);
  };

  const handleAlertClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPriceAlert?.(course);
  };

  const handleCompareChange = () => {
    onCompareToggle?.(course);
  };

  const formatEnrollment = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        isComparing && 'ring-2 ring-primary',
        className
      )}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Provider Badge Overlay */}
        <div className="absolute left-2 top-2">
          <ProviderBadge
            provider={course.provider_slug}
            logoUrl={course.provider_logo_url}
            size="sm"
          />
        </div>

        {/* Featured Badge */}
        {course.is_featured && (
          <Badge className="absolute right-2 top-2 bg-amber-500 text-white">Featured</Badge>
        )}

        {/* Compare Checkbox */}
        {onCompareToggle && (
          <div className="absolute bottom-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded bg-background/90 px-2 py-1">
              <Checkbox
                id={`compare-${course.id}`}
                checked={isComparing}
                onCheckedChange={handleCompareChange}
              />
              <label
                htmlFor={`compare-${course.id}`}
                className="text-xs font-medium cursor-pointer"
              >
                Compare
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onFavoriteToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                  onClick={handleFavoriteClick}
                  disabled={isLoading}
                >
                  <Heart
                    className={cn('h-4 w-4', course.is_favorite && 'fill-red-500 text-red-500')}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {course.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              </TooltipContent>
            </Tooltip>
          )}

          {onShare && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/90 backdrop-blur-sm"
                  onClick={handleShareClick}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share course</TooltipContent>
            </Tooltip>
          )}

          {onPriceAlert && course.price_type === 'paid' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    'h-8 w-8 bg-background/90 backdrop-blur-sm',
                    course.price_alert_id && 'text-amber-500'
                  )}
                  onClick={handleAlertClick}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {course.price_alert_id ? 'Manage price alert' : 'Set price alert'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="flex-1 space-y-2 pb-2">
        {/* Level & Mode Badges */}
        <div className="flex flex-wrap gap-1.5">
          {course.level && (
            <Badge variant="outline" className="text-xs">
              {LEVEL_LABELS[course.level]}
            </Badge>
          )}
          {course.mode && (
            <Badge variant="outline" className="text-xs">
              {MODE_LABELS[course.mode]}
            </Badge>
          )}
          {course.certificate_available && (
            <Badge variant="outline" className="text-xs">
              <Award className="mr-1 h-3 w-3" />
              Certificate
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor_name && (
          <p className="text-sm text-muted-foreground truncate">by {course.instructor_name}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Rating */}
        {course.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{course.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({course.review_count.toLocaleString()} reviews)
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {course.duration_text && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duration_text}</span>
            </div>
          )}
          {course.enrollment_count > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{formatEnrollment(course.enrollment_count)} students</span>
            </div>
          )}
          {course.language && course.language !== 'en' && (
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>{course.language.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Skills Preview */}
        {course.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {course.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{course.skills.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex items-center justify-between border-t bg-muted/30 pt-3">
        {/* Price */}
        <CompactPrice
          priceType={course.price_type}
          amount={course.price_amount}
          currency={course.price_currency}
          className="text-lg"
        />

        {/* CTA Button */}
        <Button asChild size="sm">
          <a
            href={course.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            View Course
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Loading skeleton for course card
 */
export function ExternalCourseCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video animate-pulse bg-muted" />

      {/* Content Skeleton */}
      <CardHeader className="space-y-2 pb-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/30 pt-3">
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}

export default ExternalCourseCard;
