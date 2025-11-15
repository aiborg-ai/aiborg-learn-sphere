/**
 * Calendar Widget
 *
 * Mini calendar with events and deadlines
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface CalendarConfig extends BaseWidgetConfig {
  showEvents?: boolean;
  showDeadlines?: boolean;
}

export function CalendarWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as CalendarConfig;
  const showEvents = config.showEvents !== false;
  const showDeadlines = config.showDeadlines !== false;

  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', widget.id, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Fetch events and deadlines for the month
      const [events, deadlines] = await Promise.all([
        showEvents
          ? supabase
              .from('events')
              .select('event_date')
              .gte('event_date', firstDay.toISOString())
              .lte('event_date', lastDay.toISOString())
          : Promise.resolve({ data: [] }),
        showDeadlines
          ? supabase
              .from('assignments')
              .select('due_date')
              .gte('due_date', firstDay.toISOString())
              .lte('due_date', lastDay.toISOString())
          : Promise.resolve({ data: [] }),
      ]);

      const eventDates = new Set(
        events.data?.map(e => new Date(e.event_date).toDateString()) || []
      );
      const deadlineDates = new Set(
        deadlines.data?.map(d => new Date(d.due_date).toDateString()) || []
      );

      return { eventDates, deadlineDates };
    },
    enabled: !isEditing,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date().toDateString();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const hasEvent = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return calendarData?.eventDates.has(date.toDateString());
  };

  const hasDeadline = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return calendarData?.deadlineDates.has(date.toDateString());
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-sm font-semibold">{monthName}</h4>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const hasEventDot = hasEvent(day);
          const hasDeadlineDot = hasDeadline(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'aspect-square flex items-center justify-center text-sm relative rounded',
                day === null && 'invisible',
                isTodayDate && 'bg-primary text-primary-foreground font-bold',
                !isTodayDate && 'hover:bg-muted'
              )}
            >
              {day}
              {(hasEventDot || hasDeadlineDot) && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasEventDot && (
                    <div className="h-1 w-1 rounded-full bg-blue-500" title="Event" />
                  )}
                  {hasDeadlineDot && (
                    <div className="h-1 w-1 rounded-full bg-red-500" title="Deadline" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {showEvents && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Events</span>
          </div>
        )}
        {showDeadlines && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Deadlines</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarWidget;
