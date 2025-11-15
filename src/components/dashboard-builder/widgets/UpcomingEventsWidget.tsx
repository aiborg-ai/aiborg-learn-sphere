/**
 * Upcoming Events Widget
 *
 * View upcoming events and sessions
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WidgetComponentProps, ActivityWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function UpcomingEventsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ActivityWidgetConfig;
  const limit = config.limit || 5;
  const showTimestamps = config.showTimestamps !== false;

  const { data: events, isLoading } = useQuery({
    queryKey: ['upcoming-events', widget.id, limit],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No upcoming events</p>
        <p className="text-xs mt-1">Check back later for new events!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map(event => {
        const eventDate = new Date(event.event_date);
        const isToday = eventDate.toDateString() === new Date().toDateString();

        return (
          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-1">{event.title}</h4>

              {showTimestamps && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {eventDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' at '}
                      {eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  {event.max_attendees && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{event.max_attendees} spots</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isToday && (
              <Badge variant="default" className="text-xs shrink-0">
                Today
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UpcomingEventsWidget;
