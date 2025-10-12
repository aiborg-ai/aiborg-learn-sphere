import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAttendanceTicketManagement } from '@/hooks/useAttendanceTicketManagement';
import { IssueTicketDialog } from './IssueTicketDialog';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Trash2,
  Calendar,
  Loader2,
  Users,
  Award,
} from 'lucide-react';
import { logger } from '@/utils/logger';

export function AttendanceTicketManagement() {
  const { toast } = useToast();
  const { tickets, loading, bulkIssueTickets, verifyTicket, revokeTicket } =
    useAttendanceTicketManagement();

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'course_session'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.session_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || ticket.ticket_type === typeFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && ticket.is_verified) ||
      (statusFilter === 'pending' && !ticket.is_verified);

    return matchesSearch && matchesType && matchesStatus;
  });

  const statistics = {
    total: tickets.length,
    events: tickets.filter(t => t.ticket_type === 'event').length,
    sessions: tickets.filter(t => t.ticket_type === 'course_session').length,
    verified: tickets.filter(t => t.is_verified).length,
    uniqueUsers: new Set(tickets.map(t => t.user_id)).size,
  };

  const handleVerifyTicket = async (ticketId: string) => {
    try {
      await verifyTicket(ticketId);
      toast({
        title: 'Ticket Verified',
        description: 'The attendance ticket has been verified',
      });
    } catch (error) {
      logger.error('Error verifying ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify ticket',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;

    try {
      await revokeTicket(ticketToDelete);
      toast({
        title: 'Ticket Revoked',
        description: 'The attendance ticket has been deleted',
      });
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      logger.error('Error revoking ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke ticket',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Attendance Ticket Management
              </CardTitle>
              <CardDescription>
                Issue and manage attendance tickets for events and course sessions
              </CardDescription>
            </div>
            <Button onClick={() => setIssueDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Tickets
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Total Tickets</p>
                  <p className="text-xl font-bold text-blue-600">{statistics.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Events</p>
                  <p className="text-xl font-bold text-purple-600">{statistics.events}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Sessions</p>
                  <p className="text-xl font-bold text-green-600">{statistics.sessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600">Verified</p>
                  <p className="text-xl font-bold text-yellow-600">{statistics.verified}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Users</p>
                  <p className="text-xl font-bold text-orange-600">{statistics.uniqueUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
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
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event">Events Only</SelectItem>
                <SelectItem value="course_session">Sessions Only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as 'all' | 'verified' | 'pending')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map(ticket => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {ticket.profiles?.display_name || 'No Name'}
                          </p>
                          <p className="text-sm text-gray-500">{ticket.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{ticket.session_title}</p>
                          {ticket.location && (
                            <p className="text-sm text-gray-500 line-clamp-1">{ticket.location}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.ticket_type === 'event' ? 'destructive' : 'default'}>
                          {ticket.ticket_type === 'event' ? 'Event' : 'Session'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(ticket.session_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {ticket.is_verified ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!ticket.is_verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyTicket(ticket.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setTicketToDelete(ticket.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTickets.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredTickets.length} of {tickets.length} ticket
              {tickets.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Ticket Dialog */}
      <IssueTicketDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        onIssueTickets={bulkIssueTickets}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Attendance Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this attendance ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
