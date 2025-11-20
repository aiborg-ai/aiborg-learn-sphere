/**
 * CourseCompletionHeatmap Component
 *
 * Displays a calendar-style heatmap showing course completion activity
 * Similar to GitHub's contribution graph
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays } from '@/components/ui/icons';

interface CompletionData {
  date: string; // YYYY-MM-DD
  count: number;
  details?: {
    courseTitle: string;
    userId: string;
    userName: string;
  }[];
}

interface CourseCompletionHeatmapProps {
  data: CompletionData[];
  isLoading?: boolean;
  weeks?: number;
  title?: string;
  description?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-muted';

  const intensity = count / maxCount;

  if (intensity <= 0.25) return 'bg-primary/20';
  if (intensity <= 0.5) return 'bg-primary/40';
  if (intensity <= 0.75) return 'bg-primary/60';
  return 'bg-primary/90';
}

export function CourseCompletionHeatmap({
  data,
  isLoading = false,
  weeks = 12,
  title = 'Course Completion Activity',
  description = 'Lesson and course completions over time',
}: CourseCompletionHeatmapProps) {
  // Build the heatmap grid
  const { grid, maxCount, totalCompletions, monthLabels } = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - weeks * 7 + 1);

    // Adjust start to Sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Create a map of date -> count
    const dataMap = new Map<string, CompletionData>();
    data.forEach(d => dataMap.set(d.date, d));

    // Build grid
    const grid: (CompletionData | null)[][] = [];
    const currentDate = new Date(startDate);
    let weekIndex = 0;
    let maxCount = 0;
    let totalCompletions = 0;
    const monthLabels: { week: number; month: string }[] = [];
    let lastMonth = -1;

    while (currentDate <= endDate) {
      if (grid[weekIndex] === undefined) {
        grid[weekIndex] = [];
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || { date: dateStr, count: 0 };

      grid[weekIndex].push(dayData);
      maxCount = Math.max(maxCount, dayData.count);
      totalCompletions += dayData.count;

      // Track month labels
      const month = currentDate.getMonth();
      if (month !== lastMonth && currentDate.getDate() <= 7) {
        monthLabels.push({ week: weekIndex, month: MONTHS[month] });
        lastMonth = month;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

      // New week
      if (currentDate.getDay() === 0) {
        weekIndex++;
      }
    }

    return { grid, maxCount: maxCount || 1, totalCompletions, monthLabels };
  }, [data, weeks]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalCompletions}</div>
            <div className="text-xs text-muted-foreground">Total completions</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{
                  marginLeft:
                    i === 0
                      ? `${label.week * 14}px`
                      : `${(label.week - (monthLabels[i - 1]?.week || 0)) * 14 - 24}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className="text-xs text-muted-foreground h-[12px] flex items-center"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <TooltipProvider>
              <div className="flex gap-[3px]">
                {grid.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-[12px] h-[12px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-primary ${
                              day ? getIntensityColor(day.count, maxCount) : 'bg-muted'
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {day ? (
                            <>
                              <div className="font-medium">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                {day.count} completion{day.count !== 1 ? 's' : ''}
                              </div>
                              {day.details && day.details.length > 0 && (
                                <div className="mt-1 pt-1 border-t border-border">
                                  {day.details.slice(0, 3).map((d, i) => (
                                    <div key={i} className="truncate max-w-[200px]">
                                      {d.userName}: {d.courseTitle}
                                    </div>
                                  ))}
                                  {day.details.length > 3 && (
                                    <div className="text-muted-foreground">
                                      +{day.details.length - 3} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            'No data'
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[12px] h-[12px] rounded-sm bg-muted" />
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/20" />
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/40" />
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/60" />
              <div className="w-[12px] h-[12px] rounded-sm bg-primary/90" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
