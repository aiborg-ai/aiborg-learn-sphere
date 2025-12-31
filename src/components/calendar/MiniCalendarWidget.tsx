import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarDays, ArrowRight, Clock, AlertCircle } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  date: Date;
  type: string;
  status?: string;
  course_name?: string;
}

export function MiniCalendarWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadEvents is stable
  }, [user]);

  const loadEvents = async () => {
    try {
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const { data: assignments } = await supabase
        .from('assignments')
        .select(
          `
          id,
          title,
          due_date,
          courses (title)
        `
        )
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString())
        .order('due_date', { ascending: true });

      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('user_id', user?.id);

      const submittedIds = new Set(submissions?.map(s => s.assignment_id) || []);

      const assignmentEvents: Event[] = (assignments || []).map(assignment => {
        const dueDate = parseISO(assignment.due_date);
        const isSubmitted = submittedIds.has(assignment.id);
        const isOverdue = !isSubmitted && dueDate < new Date();

        return {
          id: assignment.id,
          title: assignment.title,
          date: dueDate,
          type: 'assignment',
          status: isSubmitted ? 'completed' : isOverdue ? 'overdue' : 'pending',
          course_name: assignment.courses?.title,
        };
      });

      setEvents(assignmentEvents);
    } catch (_error) {
      logger._error('Error loading events:', _error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const upcomingEvents = events
    .filter(e => e.date >= new Date() && e.status !== 'completed')
    .slice(0, 3);

  const getDatesWithEvents = () => {
    return events.map(event => event.date);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendar
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/calendar')}
            className="text-xs"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={date => date && setSelectedDate(date)}
            className="rounded-md border scale-90 -mx-4"
            modifiers={{
              hasEvents: getDatesWithEvents(),
            }}
            modifiersStyles={{
              hasEvents: {
                fontWeight: 'bold',
                color: '#667eea',
              },
            }}
          />
        </div>

        {/* Events for Selected Date */}
        {getEventsForDate(selectedDate).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{format(selectedDate, 'MMM d')}</h4>
            {getEventsForDate(selectedDate).map(event => (
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Card component with button role, has proper keyboard support and ARIA
              <div
                key={event.id}
                className="p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate(`/assignment/${event.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/assignment/${event.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {event.course_name && (
                      <p className="text-xs text-muted-foreground truncate">{event.course_name}</p>
                    )}
                  </div>
                  {event.status === 'overdue' && (
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold">Upcoming</h4>
            {upcomingEvents.map(event => (
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Card component with button role, has proper keyboard support and ARIA
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/assignment/${event.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/assignment/${event.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(event.date, 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                {event.status === 'overdue' && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {upcomingEvents.length === 0 && getEventsForDate(selectedDate).length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
