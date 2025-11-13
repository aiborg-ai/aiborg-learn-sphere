/**
 * Agenda View Component
 *
 * Chronological timeline view of calendar events with:
 * - Grouped by date
 * - Beautiful event cards
 * - Timeline connectors
 * - Infinite scroll support
 * - Mobile-optimized
 */

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  MapPin,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import type { CalendarEvent, EventGroup } from '@/types/calendar';
import { EVENT_TYPE_COLORS, getEventTypeLabel } from '@/services/calendar/CalendarEventService';
import { format, isToday, isPast, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgendaViewProps {
  /** Calendar events to display */
  events: CalendarEvent[];

  /** Callback when event is clicked */
  onEventClick?: (event: CalendarEvent) => void;

  /** Show empty state */
  showEmptyState?: boolean;

  /** Maximum height (for scrolling) */
  maxHeight?: string;
}

export function AgendaView({
  events,
  onEventClick,
  showEmptyState = true,
  maxHeight = '600px',
}: AgendaViewProps) {
  const [_expandedGroups, _setExpandedGroups] = useState<Set<string>>(new Set());

  // Group events by date
  const eventGroups = useMemo((): EventGroup[] => {
    const groups = new Map<string, CalendarEvent[]>();

    events.forEach(event => {
      const dateKey = format(startOfDay(event.startDate), 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return Array.from(groups.entries())
      .map(([dateStr, groupEvents]) => {
        const date = new Date(dateStr);
        return {
          date,
          dateLabel: format(date, 'EEEE, MMMM d, yyyy'),
          events: groupEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
          isToday: isToday(date),
          isPast: isPast(date) && !isToday(date),
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const getStatusIcon = (event: CalendarEvent) => {
    switch (event.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'ongoing':
        return <PlayCircle className="h-4 w-4 text-green-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (event: CalendarEvent) => {
    const statusConfig = {
      upcoming: { label: 'Upcoming', variant: 'default' as const },
      ongoing: { label: 'Live Now', variant: 'destructive' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
      overdue: { label: 'Overdue', variant: 'destructive' as const },
      cancelled: { label: 'Cancelled', variant: 'outline' as const },
    };

    const config = statusConfig[event.status];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (events.length === 0 && showEmptyState) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            There are no events matching your current filters. Try adjusting your filters or check
            back later for new events.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className="pr-4">
      <div className="space-y-8">
        {eventGroups.map(group => {
          const dateKey = format(group.date, 'yyyy-MM-dd');
          const _isExpanded = _expandedGroups.has(dateKey);

          return (
            <div key={dateKey} className="relative">
              {/* Date Header */}
              <div
                className={cn(
                  'sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3',
                  group.isToday && 'pt-1'
                )}
              >
                {group.isToday && (
                  <Badge
                    variant="default"
                    className="mb-2 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Today
                  </Badge>
                )}
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      'text-lg font-semibold',
                      group.isToday && 'text-primary',
                      group.isPast && 'text-muted-foreground'
                    )}
                  >
                    {group.dateLabel}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                  </Badge>
                </div>
              </div>

              {/* Events Timeline */}
              <div className="space-y-3 relative pl-6 border-l-2 border-muted ml-3">
                {group.events.map((event, _index) => {
                  const typeConfig = EVENT_TYPE_COLORS[event.type];

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline Dot */}
                      <div
                        className={cn(
                          'absolute -left-[29px] top-4 w-4 h-4 rounded-full border-2 border-background',
                          typeConfig.bg
                        )}
                      />

                      {/* Event Card */}
                      <Card
                        className={cn(
                          'group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
                          event.status === 'ongoing' && 'ring-2 ring-green-500 ring-offset-2',
                          event.status === 'overdue' && 'ring-2 ring-red-500 ring-offset-2'
                        )}
                        onClick={() => onEventClick?.(event)}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Time Column */}
                            <div className="flex flex-col items-center min-w-[80px] pt-1">
                              <div className="text-lg font-bold">
                                {format(event.startDate, 'h:mm')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(event.startDate, 'a')}
                              </div>
                              {event.endDate && (
                                <>
                                  <div className="text-xs text-muted-foreground my-1">—</div>
                                  <div className="text-sm">{format(event.endDate, 'h:mm a')}</div>
                                </>
                              )}
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 space-y-2">
                              {/* Title Row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                      {event.title}
                                    </h4>
                                    {getStatusIcon(event)}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn('text-xs', typeConfig.bg)}>
                                      {getEventTypeLabel(event.type)}
                                    </Badge>
                                    {getStatusBadge(event)}
                                    {event.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs">
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>

                              {/* Description */}
                              {event.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Metadata Row */}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {event.courseTitle && (
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    <span>{event.courseTitle}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.participantCount !== null && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>
                                      {event.participantCount}
                                      {event.maxCapacity && ` / ${event.maxCapacity}`}
                                    </span>
                                    {event.isFull && (
                                      <Badge variant="secondary" className="text-xs ml-1">
                                        Full
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {event.instructorName && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">Instructor:</span>
                                    <span className="font-medium">{event.instructorName}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Indicators */}
                              <div className="flex items-center gap-2 pt-1">
                                {event.isCompleted && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                                {event.userRelationship !== 'none' && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.userRelationship === 'assigned' && 'Assigned to you'}
                                    {event.userRelationship === 'enrolled' && "You're enrolled"}
                                    {event.userRelationship === 'registered' && 'Registered'}
                                    {event.userRelationship === 'instructor' && "You're teaching"}
                                    {event.userRelationship === 'facilitator' &&
                                      "You're facilitating"}
                                    {event.userRelationship === 'participant' &&
                                      "You're participating"}
                                  </Badge>
                                )}
                                {event.canJoin && (
                                  <Badge variant="default" className="text-xs">
                                    Can Join
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
