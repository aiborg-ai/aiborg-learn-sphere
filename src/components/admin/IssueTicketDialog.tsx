import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Search, UserCheck, Loader2 } from '@/components/ui/icons';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
}

interface Event {
  id: number;
  title: string;
  event_date: string;
  location: string;
}

interface Course {
  id: number;
  title: string;
}

interface IssueTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueTickets: (
    userIds: string[],
    data: {
      ticket_type: 'event' | 'course_session';
      event_id?: number;
      course_id?: number;
      session_title: string;
      session_date: string;
      session_time?: string;
      location?: string;
      badge_color?: 'gold' | 'silver' | 'bronze' | 'blue' | 'green';
      notes?: string;
    }
  ) => Promise<void>;
}

export function IssueTicketDialog({ open, onOpenChange, onIssueTickets }: IssueTicketDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);

  // Form state
  const [ticketType, setTicketType] = useState<'event' | 'course_session'>('event');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [location, setLocation] = useState('');
  const [badgeColor, setBadgeColor] = useState<'gold' | 'silver' | 'bronze' | 'blue' | 'green'>(
    'silver'
  );
  const [notes, setNotes] = useState('');

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Events and Courses
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchEvents();
      fetchCourses();
    } else {
      // Reset state
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUsers, fetchEvents, fetchCourses, resetForm are stable
  }, [open]);

  const resetForm = () => {
    setTicketType('event');
    setSelectedEvent('');
    setSelectedCourse('');
    setSessionTitle('');
    setSessionDate('');
    setSessionTime('');
    setLocation('');
    setBadgeColor('silver');
    setNotes('');
    setSelectedUsers(new Set());
    setSearchTerm('');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, email')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, location')
        .eq('is_active', true)
        .order('event_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      logger.error('Error fetching events:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title', { ascending: true })
        .limit(100);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      logger.error('Error fetching courses:', error);
    }
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEvent(eventId);
    const event = events.find(e => e.id.toString() === eventId);
    if (event) {
      setSessionTitle(event.title);
      setSessionDate(event.event_date);
      setLocation(event.location);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const handleIssue = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No Users Selected',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    if (!sessionTitle || !sessionDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in session title and date',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIssuing(true);

      await onIssueTickets(Array.from(selectedUsers), {
        ticket_type: ticketType,
        event_id: ticketType === 'event' && selectedEvent ? parseInt(selectedEvent) : undefined,
        course_id:
          ticketType === 'course_session' && selectedCourse ? parseInt(selectedCourse) : undefined,
        session_title: sessionTitle,
        session_date: sessionDate,
        session_time: sessionTime || undefined,
        location: location || undefined,
        badge_color: badgeColor,
        notes: notes || undefined,
      });

      toast({
        title: 'Tickets Issued',
        description: `Successfully issued ${selectedUsers.size} attendance ticket(s)`,
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Error issuing tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to issue tickets',
        variant: 'destructive',
      });
    } finally {
      setIssuing(false);
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Attendance Tickets</DialogTitle>
          <DialogDescription>
            Create attendance tickets for users who attended an event or course session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Type */}
          <div className="space-y-2">
            <Label htmlFor="ticket-type">Ticket Type</Label>
            <Select
              value={ticketType}
              onValueChange={(value: 'event' | 'course_session') => setTicketType(value)}
            >
              <SelectTrigger id="ticket-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="course_session">Course Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event/Course Selection */}
          {ticketType === 'event' ? (
            <div className="space-y-2">
              <Label htmlFor="select-event">Select Event</Label>
              <Select value={selectedEvent} onValueChange={handleEventChange}>
                <SelectTrigger id="select-event">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title} - {new Date(event.event_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="select-course">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="select-course">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="session_title">Session Title *</Label>
              <Input
                id="session_title"
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                placeholder="e.g., AI Fundamentals Workshop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_date">Date *</Label>
              <Input
                id="session_date"
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_time">Time</Label>
              <Input
                id="session_time"
                type="time"
                value={sessionTime}
                onChange={e => setSessionTime(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g., Online (Zoom) or Physical Address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge-color">Badge Color</Label>
              <Select
                value={badgeColor}
                onValueChange={v =>
                  setBadgeColor(v as 'gold' | 'silver' | 'bronze' | 'blue' | 'green')
                }
              >
                <SelectTrigger id="badge-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">🥇 Gold</SelectItem>
                  <SelectItem value="silver">🥈 Silver</SelectItem>
                  <SelectItem value="bronze">🥉 Bronze</SelectItem>
                  <SelectItem value="blue">🔵 Blue</SelectItem>
                  <SelectItem value="green">🟢 Green</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes about this attendance..."
              rows={2}
            />
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Select Users</div>
              <Button variant="outline" onClick={handleSelectAll} size="sm">
                {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <UserCheck className="h-4 w-4" />
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </div>
            )}

            <div className="border rounded-lg">
              <ScrollArea className="h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map(user => (
                      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Interactive list item with button role, has proper keyboard support and ARIA
                      <div
                        key={user.user_id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleToggleUser(user.user_id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleUser(user.user_id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <Checkbox
                          checked={selectedUsers.has(user.user_id)}
                          onCheckedChange={() => handleToggleUser(user.user_id)}
                        />
                        <div>
                          <p className="font-medium">{user.display_name || 'No Name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={issuing}>
            Cancel
          </Button>
          <Button onClick={handleIssue} disabled={issuing || selectedUsers.size === 0}>
            {issuing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Issuing...
              </>
            ) : (
              `Issue ${selectedUsers.size} Ticket${selectedUsers.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
