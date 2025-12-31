/**
 * EventBasicInfoStep Component
 * Step 1: Basic event information - title, description, image, event type
 */

import React from 'react';
import { Info } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/studio/shared/RichTextEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData } from '@/types/studio.types';

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'training', label: 'Training Session' },
  { value: 'networking', label: 'Networking Event' },
  { value: 'other', label: 'Other' },
];

export function EventBasicInfoStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start by providing the essential details about your event
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          This information will be visible to potential attendees browsing the event catalog. Make
          it clear and engaging!
        </AlertDescription>
      </Alert>

      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Event Title
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="e.g., AI Leadership Workshop 2025"
          className="text-lg"
          required
        />
        <p className="text-xs text-muted-foreground">
          Choose a clear, descriptive title that captures what attendees will experience
        </p>
      </div>

      {/* Event Description */}
      <RichTextEditor
        label="Event Description"
        value={data.description}
        onChange={description => onUpdate({ description })}
        placeholder="Provide a comprehensive description of the event, including objectives, agenda, key topics, and expected outcomes..."
        minHeight={250}
        showPreview
        required
      />

      {/* Event Type */}
      <div className="space-y-2">
        <Label htmlFor="event-type">
          Event Type
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select value={data.event_type} onValueChange={event_type => onUpdate({ event_type })}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This helps attendees understand the format and style of your event
        </p>
      </div>

      {/* Featured Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image-url">Featured Image URL (Optional)</Label>
        <Input
          id="image-url"
          type="url"
          value={data.image_url || ''}
          onChange={e => onUpdate({ image_url: e.target.value })}
          placeholder="https://example.com/event-image.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Provide a URL to an image that represents your event. Recommended size: 1200x630px
        </p>
        {data.image_url && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
              src={data.image_url}
              alt="Event preview"
              className="w-full h-48 object-cover"
              onError={e => {
                e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=Invalid+Image+URL';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
