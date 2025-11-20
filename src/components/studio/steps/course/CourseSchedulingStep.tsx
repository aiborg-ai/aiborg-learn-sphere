/**
 * CourseSchedulingStep Component
 * Step 3: Course scheduling - start date, duration, active period
 */

import React from 'react';
import { Calendar } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AdvancedScheduler } from '@/components/studio/shared/AdvancedScheduler';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData, ScheduleConfig } from '@/types/studio.types';

export function CourseSchedulingStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
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
            Set when the course starts and when it's visible to students
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Define when your course begins and optionally set up recurring sessions or visibility
          windows.
        </AlertDescription>
      </Alert>

      {/* Start Date (Simple) */}
      <div className="space-y-2">
        <Label htmlFor="start-date">Course Start Date (Optional)</Label>
        <Input
          id="start-date"
          type="date"
          value={data.start_date || ''}
          onChange={e => onUpdate({ start_date: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          When does the course officially begin? Leave empty if self-paced.
        </p>
      </div>

      {/* Advanced Scheduling */}
      <div className="space-y-2">
        <div className="text-base font-medium">Advanced Scheduling (Optional)</div>
        <p className="text-sm text-muted-foreground">
          Set up visibility windows, recurring sessions, or time-based access control
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
