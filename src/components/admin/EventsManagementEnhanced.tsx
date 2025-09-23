import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Edit, Plus, Trash2, MapPin, Clock, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
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

interface Event {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
  location: string;
  max_capacity: number;
  registration_count?: number;
  display: boolean;
  is_active: boolean;
  event_type: string;
  created_at?: string;
  updated_at?: string;
}

export function EventsManagementEnhanced() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Event>({
    defaultValues: {
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '10:00',
      location: 'Online',
      max_capacity: 50,
      display: true,
      is_active: true,
      event_type: 'workshop',
    }
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setFetchingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      logger.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setFetchingEvents(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    reset({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '10:00',
      location: 'Online',
      max_capacity: 50,
      display: true,
      is_active: true,
      event_type: 'workshop',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    reset({
      ...event,
      event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setDeletingEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: Event) => {
    setIsLoading(true);
    try {
      if (editingEvent?.id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: data.title,
            description: data.description,
            event_date: data.event_date,
            event_time: data.event_time,
            location: data.location,
            max_capacity: data.max_capacity,
            display: data.display,
            is_active: data.is_active,
            event_type: data.event_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert({
            title: data.title,
            description: data.description,
            event_date: data.event_date,
            event_time: data.event_time,
            location: data.location,
            max_capacity: data.max_capacity,
            registration_count: 0,
            display: data.display,
            is_active: data.is_active,
            event_type: data.event_type,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }

      fetchEvents();
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      logger.error('Error saving event:', error);
      toast({
        title: "Error",
        description: editingEvent ? "Failed to update event" : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deletingEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchEvents();
      setIsDeleteDialogOpen(false);
      setDeletingEvent(null);
    } catch (error) {
      logger.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventStatus = async (event: Event, field: 'is_active' | 'display') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ [field]: !event[field] })
        .eq('id', event.id);

      if (error) throw error;

      setEvents(events.map(e =>
        e.id === event.id ? { ...e, [field]: !e[field] } : e
      ));

      toast({
        title: "Success",
        description: `Event ${field === 'is_active' ? 'status' : 'visibility'} updated`,
      });
    } catch (error) {
      logger.error(`Error toggling event ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to update event ${field === 'is_active' ? 'status' : 'visibility'}`,
        variant: "destructive",
      });
    }
  };

  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-blue-100 text-blue-800',
      seminar: 'bg-green-100 text-green-800',
      bootcamp: 'bg-purple-100 text-purple-800',
      webinar: 'bg-yellow-100 text-yellow-800',
      conference: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (fetchingEvents) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Management
              </CardTitle>
              <CardDescription>
                Manage workshops, seminars, and other events
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No events found. Create your first event to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        <Badge className={getEventTypeBadge(event.event_type)}>
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                          {event.event_time && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {event.event_time}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.registration_count || 0}/{event.max_capacity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={event.is_active}
                          onCheckedChange={() => toggleEventStatus(event, 'is_active')}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={event.display}
                          onCheckedChange={() => toggleEventStatus(event, 'display')}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="AI Workshop 2024"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Join us for an intensive workshop on AI fundamentals..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  {...register('event_type')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="bootcamp">Bootcamp</option>
                  <option value="webinar">Webinar</option>
                  <option value="conference">Conference</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location', { required: 'Location is required' })}
                  placeholder="Online / Tech Hub / Virtual"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  {...register('event_date', { required: 'Date is required' })}
                />
                {errors.event_date && (
                  <p className="text-sm text-red-500">{errors.event_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time">Event Time</Label>
                <Input
                  id="event_time"
                  type="time"
                  {...register('event_time')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity">Max Capacity *</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  {...register('max_capacity', {
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' }
                  })}
                  placeholder="50"
                />
                {errors.max_capacity && (
                  <p className="text-sm text-red-500">{errors.max_capacity.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  {...register('is_active')}
                  defaultChecked={watch('is_active')}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="display"
                  {...register('display')}
                  defaultChecked={watch('display')}
                />
                <Label htmlFor="display">Visible on Website</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{deletingEvent?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}