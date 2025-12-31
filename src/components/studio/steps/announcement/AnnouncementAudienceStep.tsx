/**
 * AnnouncementAudienceStep Component
 * Step 2: Target audience and priority settings
 */

import React from 'react';
import { Users } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { StepComponentProps, AnnouncementWizardData } from '@/types/studio.types';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', description: 'Everyone on the platform' },
  { value: 'students', label: 'Students', description: 'Only enrolled students' },
  { value: 'instructors', label: 'Instructors', description: 'Only course instructors' },
  { value: 'admins', label: 'Administrators', description: 'Admin and staff only' },
  { value: 'custom', label: 'Custom Group', description: 'Specific user group or segment' },
];

const PRIORITY_LABELS = [
  { value: 1, label: 'Low', color: 'bg-gray-500', description: 'Informational only' },
  { value: 2, label: 'Normal', color: 'bg-blue-500', description: 'Standard announcement' },
  { value: 3, label: 'High', color: 'bg-yellow-500', description: 'Important notice' },
  { value: 4, label: 'Urgent', color: 'bg-orange-500', description: 'Requires attention' },
  { value: 5, label: 'Critical', color: 'bg-red-500', description: 'Immediate action needed' },
];

export function AnnouncementAudienceStep({
  data,
  onUpdate,
}: StepComponentProps<AnnouncementWizardData>) {
  const currentPriority =
    PRIORITY_LABELS.find(p => p.value === data.priority) || PRIORITY_LABELS[1];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Audience & Priority</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose who should see this announcement and how important it is
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Target your announcement to the right audience and set the priority level to ensure proper
          visibility.
        </AlertDescription>
      </Alert>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="target-audience">
          Target Audience
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={data.target_audience || 'all'}
          onValueChange={target_audience => onUpdate({ target_audience })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            {AUDIENCE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {AUDIENCE_OPTIONS.find(opt => opt.value === (data.target_audience || 'all'))
            ?.description || 'Select who should receive this announcement'}
        </p>
      </div>

      {/* Priority Slider */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="priority-slider">
            Priority Level
            <span className="text-destructive ml-1">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <Badge className={`${currentPriority.color} text-white`}>{currentPriority.label}</Badge>
            <span className="text-sm text-muted-foreground">{currentPriority.description}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Slider
            id="priority-slider"
            min={1}
            max={5}
            step={1}
            value={[data.priority]}
            onValueChange={([priority]) => onUpdate({ priority })}
            className="w-full"
          />

          {/* Priority Labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {PRIORITY_LABELS.map(({ value, label }) => (
              <div
                key={value}
                className={`flex flex-col items-center ${data.priority === value ? 'font-semibold text-primary' : ''}`}
              >
                <span>{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Priority Guidelines:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <strong>Low (1):</strong> General information, tips, or non-urgent updates
              </li>
              <li>
                <strong>Normal (2):</strong> Standard announcements like new features or content
              </li>
              <li>
                <strong>High (3):</strong> Important notices that users should be aware of
              </li>
              <li>
                <strong>Urgent (4):</strong> Time-sensitive information requiring timely attention
              </li>
              <li>
                <strong>Critical (5):</strong> Emergency alerts or critical system notifications
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
