/**
 * Topic Mastery Heatmap Component
 *
 * Displays topic mastery levels as a heatmap grid.
 * Shows mastery progression over time across different topics.
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid3x3, LayoutGrid, TrendingUp, Filter, Info } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface TopicMastery {
  topicId: string;
  topicName: string;
  categoryName?: string;
  currentMastery: number; // 0-1
  masteryHistory: {
    date: string;
    mastery: number;
  }[];
  questionsAttempted: number;
  lastStudied?: string;
}

interface TopicMasteryHeatmapProps {
  data: TopicMastery[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  sortBy?: 'mastery' | 'recent' | 'name';
  className?: string;
  onTopicClick?: (topicId: string) => void;
}

export function TopicMasteryHeatmap({
  data,
  isLoading = false,
  viewMode: initialViewMode = 'grid',
  sortBy: initialSortBy = 'mastery',
  className,
  onTopicClick,
}: TopicMasteryHeatmapProps) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(t => {
      if (t.categoryName) cats.add(t.categoryName);
    });
    return Array.from(cats).sort();
  }, [data]);

  // Sort and filter topics
  const sortedTopics = useMemo(() => {
    let filtered = data;

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(t => t.categoryName === filterCategory);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'mastery':
          return b.currentMastery - a.currentMastery;
        case 'recent':
          if (!a.lastStudied) return 1;
          if (!b.lastStudied) return -1;
          return new Date(b.lastStudied).getTime() - new Date(a.lastStudied).getTime();
        case 'name':
          return a.topicName.localeCompare(b.topicName);
        default:
          return 0;
      }
    });
  }, [data, sortBy, filterCategory]);

  // Calculate mastery color
  const getMasteryColor = (mastery: number): string => {
    if (mastery >= 0.9) return 'bg-green-600';
    if (mastery >= 0.7) return 'bg-green-500';
    if (mastery >= 0.5) return 'bg-yellow-500';
    if (mastery >= 0.3) return 'bg-orange-500';
    if (mastery > 0) return 'bg-red-500';
    return 'bg-gray-200 dark:bg-gray-800';
  };

  const getMasteryLabel = (mastery: number): string => {
    if (mastery >= 0.9) return 'Mastered';
    if (mastery >= 0.7) return 'Proficient';
    if (mastery >= 0.5) return 'Intermediate';
    if (mastery >= 0.3) return 'Beginner';
    if (mastery > 0) return 'Learning';
    return 'Not Started';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Topic Mastery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Topic Mastery
          </CardTitle>
          <CardDescription>Track your mastery across different topics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No topic data available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Complete assessments to see your topic mastery
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall stats
  const avgMastery =
    sortedTopics.reduce((sum, t) => sum + t.currentMastery, 0) / sortedTopics.length;
  const masteredCount = sortedTopics.filter(t => t.currentMastery >= 0.7).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Topic Mastery
            </CardTitle>
            <CardDescription>
              {sortedTopics.length} topics • {masteredCount} mastered
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            {categories.length > 0 && (
              <Select
                value={filterCategory || 'all'}
                onValueChange={v => setFilterCategory(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort By */}
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mastery">By Mastery</SelectItem>
                <SelectItem value="recent">By Recent</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{(avgMastery * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Average Mastery</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-muted-foreground">Topics Mastered</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {sortedTopics.filter(t => t.currentMastery < 0.5 && t.currentMastery > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Need Practice</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mb-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800" />
            <span className="text-muted-foreground">Not Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Learning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">Intermediate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Proficient</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-600" />
            <span className="text-muted-foreground">Mastered</span>
          </div>
        </div>

        {/* Heatmap */}
        <TooltipProvider>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {sortedTopics.map(topic => (
                <Tooltip key={topic.topicId}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all hover:ring-2 hover:ring-primary/50',
                        getMasteryColor(topic.currentMastery)
                      )}
                      onClick={() => onTopicClick?.(topic.topicId)}
                    >
                      <span className="text-white text-xs font-medium text-center line-clamp-2">
                        {topic.topicName.length > 15
                          ? topic.topicName.slice(0, 15) + '...'
                          : topic.topicName}
                      </span>
                      <span className="text-white/80 text-[10px] mt-1">
                        {(topic.currentMastery * 100).toFixed(0)}%
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="p-3">
                    <div className="space-y-1.5">
                      <p className="font-medium">{topic.topicName}</p>
                      {topic.categoryName && (
                        <p className="text-xs text-muted-foreground">{topic.categoryName}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getMasteryLabel(topic.currentMastery)}
                        </Badge>
                        <span className="text-xs font-medium">
                          {(topic.currentMastery * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {topic.questionsAttempted} questions attempted
                      </p>
                      {topic.lastStudied && (
                        <p className="text-xs text-muted-foreground">
                          Last studied: {new Date(topic.lastStudied).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTopics.map(topic => (
                <div
                  key={topic.topicId}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => onTopicClick?.(topic.topicId)}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm',
                      getMasteryColor(topic.currentMastery)
                    )}
                  >
                    {(topic.currentMastery * 100).toFixed(0)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{topic.topicName}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.categoryName || 'Uncategorized'} • {topic.questionsAttempted} questions
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getMasteryLabel(topic.currentMastery)}
                  </Badge>
                  {topic.masteryHistory.length > 1 && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </TooltipProvider>

        {/* Info */}
        <div className="mt-6 pt-4 border-t flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Mastery is calculated based on your assessment performance, question difficulty, and
            retention over time. A topic is considered mastered when you consistently score above
            90% on related questions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TopicMasteryHeatmap;
