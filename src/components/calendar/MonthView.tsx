/**
 * Month View Component
 *
 * Traditional month calendar view with:
 * - Full month grid display
 * - Multi-event indicators
 * - Event type color coding
 * - Click to view day details
 */

import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { EVENT_TYPE_COLORS, getEventTypeLabel } from '@/services/calendar/CalendarEventService';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from '@/components/ui/icons';

interface MonthViewProps {
  /** Calendar events to display */
  events: CalendarEvent[];

  /** Selected date */
  selectedDate: Date;

  /** Current month */
  currentMonth: Date;

  /** Callback when date is selected */
  onDateSelect?: (date: Date) => void;

  /** Callback when month changes */
  onMonthChange?: (date: Date) => void;

  /** Callback when event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
}

export function MonthView({
  events,
  selectedDate,
  currentMonth,
  onDateSelect,
  onMonthChange,
  onEventClick,
}: MonthViewProps) {
  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter(event => isSameDay(event.startDate, selectedDate))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, selectedDate]);

  // Get dates that have events
  const datesWithEvents = useMemo(() => {
    return events.map(event => event.startDate);
  }, [events]);

  // Get event count per date
  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, { count: number; types: Set<string> }>();
    events.forEach(event => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd');
      if (!counts.has(dateKey)) {
        counts.set(dateKey, { count: 0, types: new Set() });
      }
      const entry = counts.get(dateKey)!;
      entry.count++;
      entry.types.add(event.type);
    });
    return counts;
  }, [events]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={date => date && onDateSelect?.(date)}
            month={currentMonth}
            onMonthChange={onMonthChange}
            className="rounded-md border w-full"
            modifiers={{
              hasEvents: datesWithEvents,
            }}
            modifiersStyles={{
              hasEvents: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: '#667eea',
                textDecorationThickness: '2px',
              },
            }}
            components={{
              DayContent: ({ date }) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const eventInfo = eventCountByDate.get(dateKey);

                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div>{format(date, 'd')}</div>
                    {eventInfo && eventInfo.count > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from(eventInfo.types)
                          .slice(0, 3)
                          .map((type, index) => {
                            const config = EVENT_TYPE_COLORS[type as CalendarEventType];
                            return (
                              <div
                                key={index}
                                className={cn('w-1.5 h-1.5 rounded-full', config?.bg)}
                              />
                            );
                          })}
                        {eventInfo.count > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {Object.entries(EVENT_TYPE_COLORS).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', config.bg)}></div>
                <span>{getEventTypeLabel(type as any)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{format(selectedDate, 'EEEE, MMMM d')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
            </p>
          </div>

          <ScrollArea className="h-[400px]">
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3 pr-4">
                {selectedDateEvents.map(event => {
                  const typeConfig = EVENT_TYPE_COLORS[event.type];
                  return (
                    <Card
                      key={event.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onEventClick?.(event)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div
                            className={cn('w-1 h-full rounded min-h-[60px]', typeConfig.bg)}
                          ></div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                              {event.isCompleted && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Done
                                </Badge>
                              )}
                            </div>

                            {event.courseTitle && (
                              <p className="text-xs text-muted-foreground">{event.courseTitle}</p>
                            )}

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {event.isAllDay
                                ? 'All Day'
                                : `${format(event.startDate, 'h:mm a')}${event.endDate ? ` - ${format(event.endDate, 'h:mm a')}` : ''}`}
                            </div>

                            <Badge className={cn('text-xs', typeConfig.bg)}>
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No events on this day</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
