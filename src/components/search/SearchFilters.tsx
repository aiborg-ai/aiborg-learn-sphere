/**
 * SearchFilters Component
 * Advanced filtering options for search results
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from '@/components/ui/icons';
import type { ContentType } from '@/services/search/SearchService';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  course: 'Courses',
  learning_path: 'Learning Paths',
  blog_post: 'Blog Posts',
  assignment: 'Assignments',
  material: 'Materials',
};

export interface SearchFiltersProps {
  contentTypes: ContentType[];
  minRelevance: number;
  onContentTypesChange: (types: ContentType[]) => void;
  onMinRelevanceChange: (value: number) => void;
  onReset: () => void;
  hasFilters: boolean;
}

export function SearchFilters({
  contentTypes,
  minRelevance,
  onContentTypesChange,
  onMinRelevanceChange,
  onReset,
  hasFilters,
}: SearchFiltersProps) {
  const handleToggleContentType = (type: ContentType) => {
    if (contentTypes.includes(type)) {
      // Don't allow removing all types
      if (contentTypes.length === 1) return;
      onContentTypesChange(contentTypes.filter(t => t !== type));
    } else {
      onContentTypesChange([...contentTypes, type]);
    }
  };

  const allContentTypes: ContentType[] = [
    'course',
    'learning_path',
    'blog_post',
    'assignment',
    'material',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription>Refine your search results</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Content Types */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Content Types</div>
          <div className="space-y-2">
            {allContentTypes.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${type}`}
                  checked={contentTypes.includes(type)}
                  onCheckedChange={() => handleToggleContentType(type)}
                  disabled={contentTypes.length === 1 && contentTypes.includes(type)}
                />
                <Label htmlFor={`filter-${type}`} className="text-sm font-normal cursor-pointer">
                  {CONTENT_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Minimum Relevance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Minimum Relevance</div>
            <Badge variant="secondary">{Math.round(minRelevance * 100)}%</Badge>
          </div>
          <Slider
            value={[minRelevance * 100]}
            onValueChange={value => onMinRelevanceChange(value[0] / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Show only results with {Math.round(minRelevance * 100)}% or higher match score
          </p>
        </div>

        {/* Active Filters Summary */}
        {hasFilters && (
          <div className="pt-4 border-t">
            <p className="text-xs font-medium mb-2">Active Filters</p>
            <div className="flex flex-wrap gap-2">
              {contentTypes.length < 5 && (
                <Badge variant="outline" className="text-xs">
                  {contentTypes.length} content type{contentTypes.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {minRelevance !== 0.3 && (
                <Badge variant="outline" className="text-xs">
                  Min {Math.round(minRelevance * 100)}% relevance
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
