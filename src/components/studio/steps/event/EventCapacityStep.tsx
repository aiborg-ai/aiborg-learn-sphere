/**
 * EventCapacityStep Component
 * Step 5: Event capacity - attendee limits, waitlist, registration deadline
 */

import React from 'react';
import { Users } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData } from '@/types/studio.types';

export function EventCapacityStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Capacity & Registration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set attendee limits and registration policies for your event
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Define how many people can attend and when registration closes. You can also enable a
          waitlist for when the event fills up.
        </AlertDescription>
      </Alert>

      {/* Max Capacity */}
      <div className="space-y-2">
        <Label htmlFor="max-capacity">Maximum Capacity (Optional)</Label>
        <Input
          id="max-capacity"
          type="number"
          min="1"
          value={data.max_capacity || ''}
          onChange={e =>
            onUpdate({ max_capacity: e.target.value ? parseInt(e.target.value) : undefined })
          }
          placeholder="e.g., 50"
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of attendees allowed. Leave empty for unlimited capacity.
        </p>
        {data.max_capacity && data.max_capacity > 0 && (
          <p className="text-sm text-green-600">
            {data.max_capacity} attendee{data.max_capacity !== 1 ? 's' : ''} maximum
          </p>
        )}
      </div>

      {/* Allow Waitlist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <Label htmlFor="allow-waitlist" className="cursor-pointer">
              Enable Waitlist
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Allow people to join a waitlist when the event is full
            </p>
          </div>
          <Switch
            id="allow-waitlist"
            checked={data.allow_waitlist}
            onCheckedChange={allow_waitlist => onUpdate({ allow_waitlist })}
          />
        </div>
        {data.allow_waitlist && (
          <Alert>
            <AlertDescription>
              When enabled, attendees can join a waitlist if the event reaches capacity. You'll be
              notified when someone joins the waitlist.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Registration Deadline */}
      <div className="space-y-2">
        <Label htmlFor="registration-deadline">Registration Deadline (Optional)</Label>
        <Input
          id="registration-deadline"
          type="datetime-local"
          value={data.registration_deadline || ''}
          onChange={e => onUpdate({ registration_deadline: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Set a deadline for when registration closes. Leave empty to accept registrations until the
          event starts.
        </p>
        {data.registration_deadline && (
          <p className="text-sm text-amber-600">
            Registration closes on{' '}
            {new Date(data.registration_deadline).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        )}
      </div>

      {/* Capacity Summary */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <h3 className="font-semibold text-sm">Registration Summary</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>
            Capacity:{' '}
            {data.max_capacity && data.max_capacity > 0
              ? `${data.max_capacity} attendees`
              : 'Unlimited'}
          </li>
          <li>Waitlist: {data.allow_waitlist ? 'Enabled' : 'Disabled'}</li>
          <li>
            Registration Deadline:{' '}
            {data.registration_deadline
              ? new Date(data.registration_deadline).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'None (open until event starts)'}
          </li>
        </ul>
      </div>
    </div>
  );
}
