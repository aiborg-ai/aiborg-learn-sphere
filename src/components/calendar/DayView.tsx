/**
 * Day View Component
 *
 * Detailed single day view with timeline (simplified version)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS, getEventTypeLabel } from '@/services/calendar/CalendarEventService';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, MapPin, BookOpen } from '@/components/ui/icons';

interface DayViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayView({ events, selectedDate, onEventClick }: DayViewProps) {
  const dayEvents = useMemo(() => {
    return events
      .filter(event => isSameDay(event.startDate, selectedDate))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, selectedDate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} scheduled
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {dayEvents.length > 0 ? (
          dayEvents.map(event => {
            const typeConfig = EVENT_TYPE_COLORS[event.type];
            return (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onEventClick?.(event)}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center min-w-[100px] pt-1">
                      <div className="text-xl font-bold">{format(event.startDate, 'h:mm')}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(event.startDate, 'a')}
                      </div>
                      {event.endDate && (
                        <>
                          <div className="text-sm text-muted-foreground my-1">—</div>
                          <div className="text-lg font-semibold">
                            {format(event.endDate, 'h:mm a')}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={cn('text-xs', typeConfig.bg)}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          {event.status === 'ongoing' && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              Live Now
                            </Badge>
                          )}
                          {event.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {event.courseTitle && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{event.courseTitle}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Today</h3>
              <p className="text-sm text-muted-foreground">You have a free day!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
