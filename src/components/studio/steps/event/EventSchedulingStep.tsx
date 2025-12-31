/**
 * EventSchedulingStep Component
 * Step 3: Event scheduling - date, time, duration, timezone
 */

import React from 'react';
import { Calendar } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AdvancedScheduler } from '@/components/studio/shared/AdvancedScheduler';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData, ScheduleConfig } from '@/types/studio.types';

export function EventSchedulingStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  const handleScheduleChange = (schedule: ScheduleConfig) => {
    onUpdate({ schedule });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Scheduling</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set when the event takes place and how long it will run
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Provide the date, time, and duration of your event. You can also set up recurring events
          if needed.
        </AlertDescription>
      </Alert>

      {/* Event Date */}
      <div className="space-y-2">
        <Label htmlFor="event-date">
          Event Date
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="event-date"
          type="date"
          value={data.event_date || ''}
          onChange={e => onUpdate({ event_date: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">When will the event take place?</p>
      </div>

      {/* Event Time */}
      <div className="space-y-2">
        <Label htmlFor="event-time">
          Event Time
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="event-time"
          type="time"
          value={data.event_time || ''}
          onChange={e => onUpdate({ event_time: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">What time does the event start?</p>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">Duration (Optional)</Label>
        <Input
          id="duration"
          value={data.duration || ''}
          onChange={e => onUpdate({ duration: e.target.value })}
          placeholder="e.g., 2 hours, 3 hours 30 minutes, Full day, 9:00 AM - 5:00 PM"
        />
        <p className="text-xs text-muted-foreground">
          How long will the event last? Be as specific as possible to help attendees plan their
          schedule.
        </p>
      </div>

      {/* Advanced Scheduling */}
      <div className="space-y-2">
        <div className="text-base font-medium">Advanced Scheduling (Optional)</div>
        <p className="text-sm text-muted-foreground">
          Set up timezone, recurring patterns, or time-based visibility control
        </p>
        <div className="mt-4">
          <AdvancedScheduler
            value={data.schedule || { timezone: 'UTC' }}
            onChange={handleScheduleChange}
            showTimeRange
            showRecurring
          />
        </div>
      </div>
    </div>
  );
}
