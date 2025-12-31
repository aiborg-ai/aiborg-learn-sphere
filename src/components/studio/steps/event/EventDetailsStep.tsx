/**
 * EventDetailsStep Component
 * Step 2: Event details - format, special requirements
 */

import React from 'react';
import { Settings } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData } from '@/types/studio.types';

const EVENT_FORMATS = [
  { value: 'in-person', label: 'In-Person', description: 'Physical venue attendance' },
  { value: 'online', label: 'Online', description: 'Virtual event via video conference' },
  { value: 'hybrid', label: 'Hybrid', description: 'Both in-person and online options' },
];

export function EventDetailsStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Event Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define the format and any special requirements for your event
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Specify whether your event is in-person, online, or hybrid, and note any special
          requirements attendees should be aware of.
        </AlertDescription>
      </Alert>

      {/* Event Format */}
      <div className="space-y-2">
        <Label htmlFor="format">
          Event Format
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={data.format}
          onValueChange={format => onUpdate({ format: format as EventWizardData['format'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event format" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_FORMATS.map(format => (
              <SelectItem key={format.value} value={format.value}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose how attendees will participate in your event
        </p>
      </div>

      {/* Format-specific Info */}
      {data.format === 'online' && (
        <Alert>
          <AlertDescription>
            For online events, you'll provide meeting link details in the Location step.
          </AlertDescription>
        </Alert>
      )}

      {data.format === 'hybrid' && (
        <Alert>
          <AlertDescription>
            For hybrid events, you'll provide both venue and online meeting details in the Location
            step.
          </AlertDescription>
        </Alert>
      )}

      {/* Special Requirements */}
      <div className="space-y-2">
        <Label htmlFor="special-requirements">Special Requirements (Optional)</Label>
        <Textarea
          id="special-requirements"
          value={data.special_requirements || ''}
          onChange={e => onUpdate({ special_requirements: e.target.value })}
          placeholder="e.g., Laptop required, Bring your own device, Prior knowledge of Python recommended, Business attire, Accessibility accommodations available..."
          rows={6}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          List any prerequisites, items to bring, dress code, accessibility information, or other
          important requirements for attendees
        </p>
      </div>
    </div>
  );
}
