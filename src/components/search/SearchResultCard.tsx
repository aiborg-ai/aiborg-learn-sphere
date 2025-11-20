/**
 * SearchResultCard Component
 * Rich display card for search results
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  MapPin,
  FileText,
  FileQuestion,
  Video,
  Sparkles,
  ArrowRight,
  Star,
} from '@/components/ui/icons';
import type { SearchResult, ContentType } from '@/services/search/SearchService';
import { cn } from '@/lib/utils';

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  course: <BookOpen className="h-5 w-5" />,
  learning_path: <MapPin className="h-5 w-5" />,
  blog_post: <FileText className="h-5 w-5" />,
  assignment: <FileQuestion className="h-5 w-5" />,
  material: <Video className="h-5 w-5" />,
};

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  course: 'text-blue-600 bg-blue-50',
  learning_path: 'text-green-600 bg-green-50',
  blog_post: 'text-purple-600 bg-purple-50',
  assignment: 'text-orange-600 bg-orange-50',
  material: 'text-pink-600 bg-pink-50',
};

function getRelevanceColor(score: number): string {
  if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function getMatchTypeLabel(matchType: 'keyword' | 'semantic' | 'hybrid'): {
  label: string;
  color: string;
} {
  switch (matchType) {
    case 'hybrid':
      return { label: 'Perfect Match', color: 'bg-gradient-to-r from-blue-500 to-purple-500' };
    case 'semantic':
      return { label: 'AI Match', color: 'bg-purple-500' };
    case 'keyword':
      return { label: 'Exact Match', color: 'bg-blue-500' };
  }
}

export interface SearchResultCardProps {
  result: SearchResult;
  onClick?: (result: SearchResult) => void;
  showFullDescription?: boolean;
}

export function SearchResultCard({
  result,
  onClick,
  showFullDescription = false,
}: SearchResultCardProps) {
  const relevancePercent = Math.round(result.relevanceScore * 100);
  const matchTypeInfo = getMatchTypeLabel(result.matchType);

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onClick?.(result)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg', CONTENT_TYPE_COLORS[result.type])}>
            {CONTENT_TYPE_ICONS[result.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {result.title}
              </CardTitle>

              {/* Relevance Score */}
              <Badge className={cn('shrink-0', getRelevanceColor(result.relevanceScore))}>
                <Star className="h-3 w-3 mr-1" />
                {relevancePercent}%
              </Badge>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Content Type */}
              <Badge variant="outline" className="capitalize">
                {result.type.replace('_', ' ')}
              </Badge>

              {/* Match Type */}
              {result.matchType !== 'keyword' && (
                <Badge className={cn('text-white gap-1', matchTypeInfo.color)}>
                  <Sparkles className="h-3 w-3" />
                  {matchTypeInfo.label}
                </Badge>
              )}

              {/* Metadata Badges */}
              {result.metadata?.difficulty && (
                <Badge variant="secondary">{result.metadata.difficulty}</Badge>
              )}
              {result.metadata?.category && (
                <Badge variant="secondary">{result.metadata.category}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {result.description && (
        <CardContent className="pt-0">
          <CardDescription className={cn('text-sm', showFullDescription ? '' : 'line-clamp-2')}>
            {result.description}
          </CardDescription>

          {/* Tags */}
          {result.metadata?.tags && result.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {result.metadata.tags.slice(0, 5).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.metadata.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{result.metadata.tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* View Button */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full group-hover:bg-primary/10 transition-colors"
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
