import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Award,
} from 'lucide-react';
import type { AttendanceTicket, TicketStatistics } from '@/hooks/useAttendanceTickets';

interface AttendanceTicketsSectionProps {
  tickets: AttendanceTicket[];
  statistics: TicketStatistics;
  loading: boolean;
}

export function AttendanceTicketsSection({
  tickets,
  statistics,
  loading,
}: AttendanceTicketsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'course_session'>('all');

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticket_type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ticket =>
          ticket.session_title.toLowerCase().includes(term) ||
          ticket.ticket_number.toLowerCase().includes(term) ||
          ticket.location?.toLowerCase().includes(term) ||
          ticket.events?.title?.toLowerCase().includes(term) ||
          ticket.courses?.title?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [tickets, typeFilter, searchTerm]);

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case 'gold':
        return 'border-yellow-400 bg-yellow-50 text-yellow-700';
      case 'silver':
        return 'border-gray-400 bg-gray-50 text-gray-700';
      case 'bronze':
        return 'border-orange-400 bg-orange-50 text-orange-700';
      case 'blue':
        return 'border-blue-400 bg-blue-50 text-blue-700';
      case 'green':
        return 'border-green-400 bg-green-50 text-green-700';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-600';
    }
  };

  const getTicketTypeBadge = (type: string) => {
    switch (type) {
      case 'event':
        return { label: 'Event', variant: 'destructive' as const };
      case 'course_session':
        return { label: 'Course Session', variant: 'default' as const };
      default:
        return { label: type, variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading attendance tickets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Attendance Tickets
        </CardTitle>
        <CardDescription>
          Your digital record of attended events and course sessions
        </CardDescription>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total Tickets</p>
                <p className="text-xl font-bold text-blue-600">{statistics.total_tickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Events</p>
                <p className="text-xl font-bold text-purple-600">{statistics.event_tickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Sessions</p>
                <p className="text-xl font-bold text-green-600">
                  {statistics.course_session_tickets}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">Verified</p>
                <p className="text-xl font-bold text-yellow-600">{statistics.verified_tickets}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={value => setTypeFilter(value as 'all' | 'event' | 'course_session')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Events Only</SelectItem>
              <SelectItem value="course_session">Sessions Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                {searchTerm || typeFilter !== 'all'
                  ? 'No tickets match your filters'
                  : 'No attendance tickets yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Tickets will appear here when you attend events or course sessions'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map(ticket => {
                const typeBadge = getTicketTypeBadge(ticket.ticket_type);

                return (
                  <div
                    key={ticket.id}
                    className={`border-2 rounded-lg p-4 ${getBadgeColorClass(ticket.badge_color)} hover:shadow-md transition-shadow`}
                  >
                    {/* Ticket Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        <span className="font-mono text-sm font-bold">{ticket.ticket_number}</span>
                      </div>
                      {ticket.is_verified ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>

                    {/* Session Title */}
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">
                      {ticket.session_title}
                    </h3>

                    {/* Related Event/Course */}
                    {ticket.ticket_type === 'event' && ticket.events && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Event: {ticket.events.title}
                      </p>
                    )}
                    {ticket.ticket_type === 'course_session' && ticket.courses && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Course: {ticket.courses.title}
                      </p>
                    )}

                    {/* Session Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.session_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>

                      {ticket.session_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3" />
                          {ticket.session_time}
                        </div>
                      )}

                      {ticket.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{ticket.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={typeBadge.variant} className="text-xs">
                        {typeBadge.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {ticket.badge_color}
                      </Badge>
                    </div>

                    {/* Admin Notes */}
                    {ticket.notes && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs italic text-muted-foreground line-clamp-2">
                          "{ticket.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {filteredTickets.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredTickets.length} of {tickets.length} ticket
            {tickets.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
