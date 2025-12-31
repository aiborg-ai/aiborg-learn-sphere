/**
 * BlogSchedulingStep Component
 * Step 4: Blog scheduling - publish_date, expiry_date, status, timezone
 */

import React from 'react';
import { Calendar } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AdvancedScheduler } from '@/components/studio/shared/AdvancedScheduler';
import type { StepComponentProps, BlogWizardData, ScheduleConfig } from '@/types/studio.types';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

export function BlogSchedulingStep({ data, onUpdate }: StepComponentProps<BlogWizardData>) {
  const handleScheduleChange = (schedule: ScheduleConfig) => {
    onUpdate({ schedule });
  };

  // Get current timezone from schedule or default to UTC
  const currentTimezone = data.schedule?.timezone || 'UTC';

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
            Control when your blog post is published and visible to readers
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Schedule your blog post for future publication or keep it as a draft. You can also set an
          expiry date for time-sensitive content.
        </AlertDescription>
      </Alert>

      {/* Publishing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publishing Status</CardTitle>
          <CardDescription>Choose how you want to publish this blog post</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.status}
            onValueChange={(status: BlogWizardData['status']) => onUpdate({ status })}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="draft" id="draft" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="draft" className="font-medium cursor-pointer">
                  Draft
                </Label>
                <p className="text-sm text-muted-foreground">
                  Save as draft - only visible to you and editors
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="published" id="published" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="published" className="font-medium cursor-pointer">
                  Published
                </Label>
                <p className="text-sm text-muted-foreground">
                  Publish immediately - visible to all readers
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Timezone Selection */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={currentTimezone}
          onValueChange={timezone =>
            onUpdate({ schedule: { ...data.schedule, timezone } as ScheduleConfig })
          }
        >
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All dates and times will be displayed in this timezone
        </p>
      </div>

      {/* Publish Date */}
      <div className="space-y-2">
        <Label htmlFor="publish-date">Publish Date (Optional)</Label>
        <Input
          id="publish-date"
          type="datetime-local"
          value={data.publish_date || ''}
          onChange={e => onUpdate({ publish_date: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Schedule when this post should be published. Leave empty to publish immediately when
          status is "Published".
        </p>
      </div>

      {/* Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
        <Input
          id="expiry-date"
          type="datetime-local"
          value={data.expiry_date || ''}
          onChange={e => onUpdate({ expiry_date: e.target.value })}
          min={data.publish_date || undefined}
        />
        <p className="text-xs text-muted-foreground">
          Optionally set when this post should be archived or removed from public view. Useful for
          time-sensitive announcements or promotions.
        </p>
      </div>

      {/* Advanced Scheduling */}
      <div className="space-y-2">
        <div className="text-base font-medium">Advanced Scheduling (Optional)</div>
        <p className="text-sm text-muted-foreground">
          Set up visibility windows or recurring publication patterns
        </p>
        <div className="mt-4">
          <AdvancedScheduler
            value={data.schedule || { timezone: currentTimezone }}
            onChange={handleScheduleChange}
            showTimeRange
            showRecurring={false}
          />
        </div>
      </div>

      {/* Scheduling Summary */}
      {(data.publish_date || data.expiry_date) && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Scheduling Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {data.publish_date && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Publish on:</span>
                <span className="font-medium">
                  {new Date(data.publish_date).toLocaleString('en-US', {
                    timeZone: currentTimezone,
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
            {data.expiry_date && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Expire on:</span>
                <span className="font-medium">
                  {new Date(data.expiry_date).toLocaleString('en-US', {
                    timeZone: currentTimezone,
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Timezone:</span>
              <span className="font-medium">
                {TIMEZONES.find(tz => tz.value === currentTimezone)?.label || currentTimezone}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
