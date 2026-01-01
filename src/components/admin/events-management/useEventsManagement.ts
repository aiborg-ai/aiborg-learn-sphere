import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Event } from './types';

const defaultEventValues: Partial<Event> = {
  title: '',
  description: '',
  event_date: new Date().toISOString().split('T')[0],
  event_time: '10:00',
  location: 'Online',
  max_capacity: 50,
  is_visible: true,
  is_active: true,
  is_past: false,
  event_type: 'workshop',
};

export function useEventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [photoUploadEvent, setPhotoUploadEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const form = useForm<Event>({
    defaultValues: defaultEventValues,
  });

  const fetchEvents = useCallback(async () => {
    setFetchingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (_error) {
      logger.error('Error fetching events:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        variant: 'destructive',
      });
    } finally {
      setFetchingEvents(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openCreateDialog = () => {
    setEditingEvent(null);
    form.reset(defaultEventValues);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    form.reset({
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
        const { error } = await supabase
          .from('events')
          .update({
            title: data.title,
            description: data.description,
            event_date: data.event_date,
            event_time: data.event_time,
            location: data.location,
            max_capacity: data.max_capacity,
            is_visible: data.is_visible,
            is_active: data.is_active,
            is_past: data.is_past,
            event_type: data.event_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        const { error } = await supabase.from('events').insert({
          title: data.title,
          description: data.description,
          event_date: data.event_date,
          event_time: data.event_time,
          location: data.location,
          max_capacity: data.max_capacity,
          registration_count: 0,
          is_visible: data.is_visible,
          is_active: data.is_active,
          is_past: data.is_past,
          event_type: data.event_type,
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }

      fetchEvents();
      setIsDialogOpen(false);
      form.reset();
    } catch (_error) {
      logger.error('Error saving event:', _error);
      toast({
        title: 'Error',
        description: editingEvent ? 'Failed to update event' : 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', deletingEvent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });

      fetchEvents();
      setIsDeleteDialogOpen(false);
      setDeletingEvent(null);
    } catch (_error) {
      logger.error('Error deleting event:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventStatus = async (event: Event, field: 'is_active' | 'is_visible') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ [field]: !event[field] })
        .eq('id', event.id);

      if (error) throw error;

      setEvents(events.map(e => (e.id === event.id ? { ...e, [field]: !e[field] } : e)));

      toast({
        title: 'Success',
        description: `Event ${field === 'is_active' ? 'status' : 'visibility'} updated`,
      });
    } catch (_error) {
      logger.error(`Error toggling event ${field}:`, _error);
      toast({
        title: 'Error',
        description: `Failed to update event ${field === 'is_active' ? 'status' : 'visibility'}`,
        variant: 'destructive',
      });
    }
  };

  const moveToPastEvents = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          is_past: true,
          is_active: false,
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event moved to past events. You can now upload photos.',
      });

      fetchEvents();
      setPhotoUploadEvent(event);
    } catch (_error) {
      logger.error('Error moving event to past:', _error);
      toast({
        title: 'Error',
        description: 'Failed to move event to past events',
        variant: 'destructive',
      });
    }
  };

  const openPhotoUpload = (event: Event) => {
    setPhotoUploadEvent(event);
  };

  return {
    events,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    editingEvent,
    deletingEvent,
    isLoading,
    fetchingEvents,
    photoUploadEvent,
    setPhotoUploadEvent,
    form,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    onSubmit,
    handleDelete,
    toggleEventStatus,
    moveToPastEvents,
    openPhotoUpload,
  };
}
