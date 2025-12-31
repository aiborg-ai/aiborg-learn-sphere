/**
 * EventReviewStep Component
 * Step 7: Review and preview before publishing
 */

import React from 'react';
import { CheckCircle, Eye, AlertTriangle, MapPin, Calendar, Users } from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData } from '@/types/studio.types';

export function EventReviewStep({ data, mode }: StepComponentProps<EventWizardData>) {
  // Validate completeness
  const isComplete = {
    basicInfo: !!(data.title && data.description && data.event_type),
    details: !!data.format,
    scheduling: !!(data.event_date && data.event_time),
    location:
      (data.format === 'in-person' && data.location) ||
      (data.format === 'online' && data.online_link) ||
      (data.format === 'hybrid' && data.location && data.online_link) ||
      false,
  };

  const allComplete = Object.values(isComplete).every(Boolean);

  // Format date and time for display
  const eventDateTime =
    data.event_date && data.event_time
      ? new Date(`${data.event_date}T${data.event_time}`).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : 'Not set';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Eye className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review & Publish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your event details before {mode === 'create' ? 'publishing' : 'updating'}
          </p>
        </div>
      </div>

      {/* Completeness Alert */}
      {!allComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Some required fields are missing. Please complete all sections before publishing.
          </AlertDescription>
        </Alert>
      )}

      {allComplete && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            All required fields are complete! Review the details below and click{' '}
            {mode === 'create' ? 'Publish' : 'Update'} when ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Event Preview */}
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{data.event_type}</Badge>
                <Badge variant="secondary">{data.format}</Badge>
              </div>
              <CardTitle className="text-2xl">{data.title || 'Untitled Event'}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {data.description || 'No description provided'}
              </CardDescription>
            </div>
            {data.image_url && (
              /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
              <img
                src={data.image_url}
                alt="Event"
                className="w-32 h-20 object-cover rounded-md ml-4"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">When</p>
              <p className="text-sm text-muted-foreground">{eventDateTime}</p>
              {data.duration && (
                <p className="text-sm text-muted-foreground mt-1">Duration: {data.duration}</p>
              )}
              {data.schedule?.timezone && (
                <p className="text-xs text-muted-foreground mt-1">
                  Timezone: {data.schedule.timezone}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Location Details */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Where</p>
              {(data.format === 'in-person' || data.format === 'hybrid') && data.location && (
                <div className="mt-1">
                  <p className="text-sm font-medium">Venue:</p>
                  <p className="text-sm text-muted-foreground">{data.location}</p>
                  {data.venue_details && (
                    <p className="text-sm text-muted-foreground mt-1">{data.venue_details}</p>
                  )}
                </div>
              )}
              {(data.format === 'online' || data.format === 'hybrid') && data.online_link && (
                <div className="mt-1">
                  <p className="text-sm font-medium">Online Meeting:</p>
                  <p className="text-sm text-muted-foreground break-all">{data.online_link}</p>
                </div>
              )}
              {!data.location && !data.online_link && (
                <p className="text-sm text-muted-foreground">Not specified</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Capacity & Registration */}
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Capacity & Registration</p>
              <p className="text-sm text-muted-foreground">
                Maximum Capacity:{' '}
                {data.max_capacity && data.max_capacity > 0
                  ? `${data.max_capacity} attendees`
                  : 'Unlimited'}
              </p>
              <p className="text-sm text-muted-foreground">
                Waitlist: {data.allow_waitlist ? 'Enabled' : 'Disabled'}
              </p>
              {data.registration_deadline && (
                <p className="text-sm text-muted-foreground">
                  Registration Deadline:{' '}
                  {new Date(data.registration_deadline).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          {data.special_requirements && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Special Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {data.special_requirements}
                </p>
              </div>
            </>
          )}

          {/* Tags */}
          {data.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Summaries */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Basic Information
              {isComplete.basicInfo ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Title, description, event type, and image
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Event Details
              {isComplete.details ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Format and special requirements
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Scheduling
              {isComplete.scheduling ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Date, time, duration, and timezone
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Location
              {isComplete.location ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.format === 'in-person' && 'Venue address and details'}
            {data.format === 'online' && 'Online meeting link'}
            {data.format === 'hybrid' && 'Venue and online meeting details'}
          </CardContent>
        </Card>
      </div>

      {/* Final Instructions */}
      <Alert>
        <AlertDescription>
          {mode === 'create'
            ? 'Once published, attendees will be able to see and register for this event. You can edit it later from the admin panel.'
            : 'Your changes will be saved and visible to attendees immediately.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
