/**
 * EventLocationStep Component
 * Step 4: Event location - physical venue or online meeting details
 */

import React from 'react';
import { MapPin } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData } from '@/types/studio.types';

export function EventLocationStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  const isInPerson = data.format === 'in-person' || data.format === 'hybrid';
  const isOnline = data.format === 'online' || data.format === 'hybrid';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Location</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Provide venue or online meeting details for attendees
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          {data.format === 'in-person' &&
            'Provide the physical venue address and any additional location details.'}
          {data.format === 'online' &&
            'Provide the online meeting link and any access instructions.'}
          {data.format === 'hybrid' &&
            'Provide both physical venue and online meeting details for your hybrid event.'}
        </AlertDescription>
      </Alert>

      {/* Physical Location (for in-person and hybrid) */}
      {isInPerson && (
        <>
          <div className="space-y-2">
            <Label htmlFor="location">
              Venue Address
              {data.format === 'in-person' && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id="location"
              value={data.location || ''}
              onChange={e => onUpdate({ location: e.target.value })}
              placeholder="e.g., 123 Main Street, Building A, Room 101, San Francisco, CA 94105"
              required={data.format === 'in-person'}
            />
            <p className="text-xs text-muted-foreground">
              Full address of the venue where the event will take place
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-details">Venue Details (Optional)</Label>
            <Textarea
              id="venue-details"
              value={data.venue_details || ''}
              onChange={e => onUpdate({ venue_details: e.target.value })}
              placeholder="Additional venue information such as parking instructions, building access codes, nearby landmarks, public transportation options, etc."
              rows={4}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Help attendees find and access the venue easily
            </p>
          </div>
        </>
      )}

      {/* Online Link (for online and hybrid) */}
      {isOnline && (
        <div className="space-y-2">
          <Label htmlFor="online-link">
            Online Meeting Link
            {data.format === 'online' && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id="online-link"
            type="url"
            value={data.online_link || ''}
            onChange={e => onUpdate({ online_link: e.target.value })}
            placeholder="e.g., https://zoom.us/j/123456789, https://meet.google.com/abc-defg-hij"
            required={data.format === 'online'}
          />
          <p className="text-xs text-muted-foreground">
            Provide the URL for the online meeting or webinar. This will be shared with registered
            attendees.
          </p>
          <Alert>
            <AlertDescription>
              For security, consider using a waiting room or password protection for your online
              event. Include access instructions in the registration confirmation email.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hybrid Event Note */}
      {data.format === 'hybrid' && (
        <Alert>
          <AlertDescription>
            Attendees will be able to choose whether to attend in-person or online during
            registration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
