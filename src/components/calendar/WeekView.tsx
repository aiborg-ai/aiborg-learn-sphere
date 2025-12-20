/**
 * Week View Component
 *
 * Week timeline view with hourly slots (simplified version)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/services/calendar/CalendarEventService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function WeekView({ events, selectedDate, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const eventsByDay = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      byDay.set(
        dayKey,
        events
          .filter(event => isSameDay(event.startDate, day))
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      );
    });
    return byDay;
  }, [weekDays, events]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dayKey) || [];

          return (
            <Card key={dayKey} className={cn(isToday(day) && 'ring-2 ring-primary')}>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm text-center">
                  <div className={cn('font-semibold', isToday(day) && 'text-primary')}>
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold mt-1',
                      isToday(day) &&
                        'bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {dayEvents.map(event => {
                      const typeConfig = EVENT_TYPE_COLORS[event.type];
                      return (
                        <button
                          type="button"
                          key={event.id}
                          className={cn(
                            'text-xs p-2 rounded cursor-pointer hover:shadow transition-all w-full text-left',
                            typeConfig.bg,
                            'text-white'
                          )}
                          onClick={() => onEventClick?.(event)}
                          aria-label={`View ${event.title} details`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-90 text-[10px] mt-0.5">
                            {format(event.startDate, 'h:mm a')}
                          </div>
                        </button>
                      );
                    })}
                    {dayEvents.length === 0 && (
                      <div className="text-center text-muted-foreground py-4 text-xs">
                        No events
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
