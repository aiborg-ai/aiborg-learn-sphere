// Admin component to create event series and generate sessions
// This is a basic implementation - can be enhanced with full form UI later

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

interface EventSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EventSeriesDialog({ open, onOpenChange, onSuccess }: EventSeriesDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('5'); // Friday
  const [startTime, setStartTime] = useState('21:00');
  const [endTime, setEndTime] = useState('22:30');
  const [frequency, setFrequency] = useState('weekly');
  const [maxCapacity, setMaxCapacity] = useState('50');

  const handleGenerateSessions = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId || !startDate || !endDate) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-create-event-sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            eventId: parseInt(eventId),
            startDate,
            endDate,
            dayOfWeek: parseInt(dayOfWeek),
            startTime,
            endTime,
            frequency,
            maxCapacity: parseInt(maxCapacity),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate sessions');
      }

      toast({
        title: 'Sessions Created',
        description: `Successfully created ${result.sessionsCreated} sessions`,
      });

      // Reset form
      setEventId('');
      setStartDate('');
      setEndDate('');

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (_error) {
      logger._error('Error generating event sessions:', _error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Event Sessions</DialogTitle>
          <DialogDescription>Create recurring sessions for an event series</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerateSessions} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event ID *</Label>
            <Input
              id="eventId"
              type="number"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              placeholder="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week *</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger id="dayOfWeek">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max Capacity per Session *</Label>
            <Input
              id="maxCapacity"
              type="number"
              value={maxCapacity}
              onChange={e => setMaxCapacity(e.target.value)}
              placeholder="50"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Sessions'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
