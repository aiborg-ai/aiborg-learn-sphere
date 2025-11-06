import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Calendar, Loader2, AlertCircle, Repeat } from 'lucide-react';
import { useEventSessionTickets, useUpcomingEventTickets } from '@/hooks/useEventSessionTickets';
import { EventSessionTicketCard } from '@/components/EventSessionTicketCard';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { isBefore, parseISO } from 'date-fns';

export default function MyEventTicketsPage() {
  const { user } = useAuth();
  const { data: allTickets, isLoading: loadingAll } = useEventSessionTickets();
  const { data: upcomingTickets, isLoading: loadingUpcoming } = useUpcomingEventTickets();

  // Group tickets by event series
  const ticketsByEvent = useMemo(() => {
    if (!allTickets) return {};

    const grouped: Record<string, typeof allTickets> = {};

    allTickets.forEach(ticket => {
      const seriesName = ticket.events?.series_name || 'Other Events';
      if (!grouped[seriesName]) {
        grouped[seriesName] = [];
      }
      grouped[seriesName].push(ticket);
    });

    // Sort tickets within each group by session date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const dateA = a.event_sessions?.session_date || '';
        const dateB = b.event_sessions?.session_date || '';
        return dateA.localeCompare(dateB);
      });
    });

    return grouped;
  }, [allTickets]);

  // Filter upcoming and past tickets
  const upcomingTicketsList = useMemo(() => {
    if (!allTickets) return [];
    const now = new Date();
    return allTickets.filter(ticket => {
      if (!ticket.event_sessions?.session_date) return false;
      const sessionDate = parseISO(ticket.event_sessions.session_date);
      return !isBefore(sessionDate, now);
    });
  }, [allTickets]);

  const pastTicketsList = useMemo(() => {
    if (!allTickets) return [];
    const now = new Date();
    return allTickets.filter(ticket => {
      if (!ticket.event_sessions?.session_date) return true;
      const sessionDate = parseISO(ticket.event_sessions.session_date);
      return isBefore(sessionDate, now);
    });
  }, [allTickets]);

  const stats = useMemo(() => {
    if (!allTickets) return { total: 0, upcoming: 0, attended: 0, active: 0 };

    return {
      total: allTickets.length,
      upcoming: upcomingTicketsList.length,
      attended: allTickets.filter(t => t.status === 'attended').length,
      active: allTickets.filter(t => t.status === 'active').length,
    };
  }, [allTickets, upcomingTicketsList]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Authentication Required
            </CardTitle>
            <CardDescription>Please log in to view your event tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingAll || loadingUpcoming) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">My Event Tickets</h1>
          </div>
          <p className="text-white/80">Manage your event session tickets and check-ins</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Ticket className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attended</p>
                  <p className="text-2xl font-bold text-green-600">{stats.attended}</p>
                </div>
                <Badge className="bg-green-500 h-8 w-8 rounded-full flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
                </div>
                <Badge className="bg-orange-500 h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Display */}
        {stats.total === 0 ? (
          <Card className="bg-white/95">
            <CardContent className="py-12 text-center">
              <Ticket className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Event Tickets Yet</h3>
              <p className="text-gray-600 mb-6">Register for an event series to get your tickets</p>
              <Link to="/events">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Browse Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-white/20 backdrop-blur">
              <TabsTrigger
                value="upcoming"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Upcoming ({upcomingTicketsList.length})
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Past ({pastTicketsList.length})
              </TabsTrigger>
              <TabsTrigger
                value="by-series"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                By Series
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Tickets */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTicketsList.length === 0 ? (
                <Card className="bg-white/95">
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No upcoming sessions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTicketsList.map(ticket => (
                    <EventSessionTicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past Tickets */}
            <TabsContent value="past" className="space-y-4">
              {pastTicketsList.length === 0 ? (
                <Card className="bg-white/95">
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No past sessions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastTicketsList.map(ticket => (
                    <EventSessionTicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tickets by Series */}
            <TabsContent value="by-series" className="space-y-6">
              {Object.entries(ticketsByEvent).map(([seriesName, tickets]) => (
                <Card key={seriesName} className="bg-white/95 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-purple-600" />
                      <CardTitle>{seriesName}</CardTitle>
                      <Badge variant="secondary">{tickets.length} tickets</Badge>
                    </div>
                    {tickets[0]?.events?.title && (
                      <CardDescription>{tickets[0].events.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tickets.map(ticket => (
                        <EventSessionTicketCard key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
