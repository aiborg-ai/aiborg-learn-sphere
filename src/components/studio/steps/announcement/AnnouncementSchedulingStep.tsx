/**
 * AnnouncementSchedulingStep Component
 * Step 3: Schedule when the announcement should be displayed
 */

import React from 'react';
import { Calendar } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdvancedScheduler } from '@/components/studio/shared/AdvancedScheduler';
import type {
  StepComponentProps,
  AnnouncementWizardData,
  ScheduleConfig,
} from '@/types/studio.types';

export function AnnouncementSchedulingStep({
  data,
  onUpdate,
}: StepComponentProps<AnnouncementWizardData>) {
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
            Control when your announcement is visible to users
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Schedule your announcement to appear at the right time. Set start and end dates to control
          visibility, or leave them empty for immediate and permanent display.
        </AlertDescription>
      </Alert>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="is-active" className="text-base font-medium">
            Active Status
          </Label>
          <p className="text-sm text-muted-foreground">
            {data.is_active
              ? 'Announcement is visible to targeted users'
              : 'Announcement is hidden from all users'}
          </p>
        </div>
        <Switch
          id="is-active"
          checked={data.is_active}
          onCheckedChange={is_active => onUpdate({ is_active })}
        />
      </div>

      {/* Advanced Scheduling */}
      <div className="space-y-2">
        <div className="text-base font-medium">Visibility Schedule (Optional)</div>
        <p className="text-sm text-muted-foreground">
          Set specific dates and times when this announcement should be displayed
        </p>
        <div className="mt-4">
          <AdvancedScheduler
            value={data.schedule || { timezone: 'UTC' }}
            onChange={handleScheduleChange}
            showTimeRange={false}
            showRecurring={false}
          />
        </div>
      </div>

      {/* Scheduling Tips */}
      <Alert>
        <AlertDescription>
          <strong>Scheduling Tips:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>Start Date:</strong> Announcement becomes visible from this date forward
            </li>
            <li>
              <strong>End Date:</strong> Announcement automatically hides after this date (leave
              empty for permanent display)
            </li>
            <li>
              <strong>Timezone:</strong> All dates and times are based on the selected timezone
            </li>
            <li>
              <strong>Active Toggle:</strong> Use this to manually show/hide the announcement
              regardless of schedule
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
