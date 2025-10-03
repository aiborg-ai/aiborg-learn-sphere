import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarDays, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'assignment' | 'exam' | 'lecture' | 'deadline' | 'event';
  course_name?: string;
  description?: string;
  status?: 'pending' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high';
  url?: string;
}

export function CalendarView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentMonth]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          course_id,
          courses (title)
        `)
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString());

      if (assignmentsError) throw assignmentsError;

      // Fetch user's submissions to determine status
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id, created_at')
        .eq('user_id', user?.id);

      const submissionMap = new Map(
        submissions?.map(s => [s.assignment_id, s.created_at]) || []
      );

      const assignmentEvents: CalendarEvent[] = (assignments || []).map(assignment => {
        const dueDate = parseISO(assignment.due_date);
        const isSubmitted = submissionMap.has(assignment.id);
        const isOverdue = !isSubmitted && dueDate < new Date();

        return {
          id: `assignment-${assignment.id}`,
          title: assignment.title,
          date: dueDate,
          type: 'assignment' as const,
          course_name: assignment.courses?.title,
          description: assignment.description,
          status: isSubmitted ? 'completed' : isOverdue ? 'overdue' : 'pending',
          priority: isOverdue ? 'high' : dueDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'low',
          url: `/assignment/${assignment.id}`,
        };
      });

      setEvents(assignmentEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventsForSelectedDate = () => {
    return getEventsForDate(selectedDate);
  };

  const getDatesWithEvents = () => {
    return events.map(event => event.date);
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'assignment': return 'bg-blue-500';
      case 'exam': return 'bg-red-500';
      case 'lecture': return 'bg-green-500';
      case 'deadline': return 'bg-orange-500';
      case 'event': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'overdue': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const upcomingEvents = events
    .filter(e => e.date >= new Date() && e.status !== 'completed')
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Academic Calendar
              </CardTitle>
              <CardDescription>
                Track your assignments, deadlines, and important dates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border"
              modifiers={{
                hasEvents: getDatesWithEvents(),
              }}
              modifiersStyles={{
                hasEvents: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: '#667eea',
                },
              }}
            />

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Assignment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Exam</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Lecture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Deadline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Sidebar */}
        <div className="space-y-4">
          {/* Selected Day Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {getEventsForSelectedDate().length > 0 ? (
                  <div className="space-y-3">
                    {getEventsForSelectedDate().map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => { if (event.url) window.location.href = event.url; }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-1 h-full rounded ${getEventTypeColor(event.type)}`}></div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              {event.status === 'completed' && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {event.status === 'overdue' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            {event.course_name && (
                              <p className="text-xs text-muted-foreground">{event.course_name}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{format(event.date, 'h:mm a')}</span>
                              {getPriorityBadge(event.priority)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No events on this day</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                        onClick={() => { if (event.url) window.location.href = event.url; }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{event.title}</span>
                          {getPriorityBadge(event.priority)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(event.date, 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No upcoming events
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {events.filter(e => e.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {events.filter(e => e.status === 'overdue').length}
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
