/**
 * AdvancedScheduler Component
 * Complex scheduling UI with date ranges, time ranges, and recurring patterns
 */

import React, { useState } from 'react';
import { Calendar, Clock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ScheduleConfig, RecurringPattern } from '@/types/studio.types';

interface AdvancedSchedulerProps {
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  showTimeRange?: boolean;
  showRecurring?: boolean;
  className?: string;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function AdvancedScheduler({
  value,
  onChange,
  showTimeRange = true,
  showRecurring = true,
  className,
}: AdvancedSchedulerProps) {
  const [isRecurring, setIsRecurring] = useState(!!value.recurring);

  // Handle date range change
  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    onChange({
      ...value,
      [field]: date,
    });
  };

  // Handle time change
  const handleTimeChange = (field: 'timeStart' | 'timeEnd', time: string) => {
    onChange({
      ...value,
      [field]: time,
    });
  };

  // Handle timezone change
  const handleTimezoneChange = (timezone: string) => {
    onChange({
      ...value,
      timezone,
    });
  };

  // Handle recurring pattern change
  const handleRecurringChange = (updates: Partial<RecurringPattern>) => {
    const newRecurring: RecurringPattern = {
      type: value.recurring?.type || 'weekly',
      interval: value.recurring?.interval || 1,
      ...value.recurring,
      ...updates,
    };

    onChange({
      ...value,
      recurring: isRecurring ? newRecurring : undefined,
    });
  };

  // Toggle recurring
  const toggleRecurring = (enabled: boolean) => {
    setIsRecurring(enabled);
    if (!enabled) {
      onChange({
        ...value,
        recurring: undefined,
      });
    } else {
      onChange({
        ...value,
        recurring: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1], // Monday
        },
      });
    }
  };

  // Generate preview text
  const getPreviewText = () => {
    const parts: string[] = [];

    if (value.startDate) {
      parts.push(`Starts: ${format(value.startDate, 'MMM d, yyyy')}`);
    }

    if (value.endDate) {
      parts.push(`Ends: ${format(value.endDate, 'MMM d, yyyy')}`);
    } else if (value.startDate) {
      parts.push('(No end date)');
    }

    if (value.timeStart && value.timeEnd) {
      parts.push(`${value.timeStart} - ${value.timeEnd}`);
    }

    if (value.recurring) {
      const { type, interval, daysOfWeek } = value.recurring;
      if (type === 'weekly' && daysOfWeek) {
        const dayNames = daysOfWeek
          .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label)
          .filter(Boolean)
          .join(', ');
        parts.push(`Every ${interval > 1 ? `${interval} weeks on` : ''} ${dayNames}`);
      } else if (type === 'daily') {
        parts.push(`Every ${interval > 1 ? `${interval} days` : 'day'}`);
      } else if (type === 'monthly') {
        parts.push(`Every ${interval > 1 ? `${interval} months` : 'month'}`);
      }
    }

    return parts.length > 0 ? parts.join(' • ') : 'No schedule configured';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Schedule Preview */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{getPreviewText()}</span>
            {value.timezone !== 'UTC' && (
              <Badge variant="outline" className="ml-auto">
                <Globe className="w-3 h-3 mr-1" />
                {value.timezone}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Start Date</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="w-4 h-4 mr-2" />
                {value.startDate ? format(value.startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarUI
                mode="single"
                selected={value.startDate}
                onSelect={date => handleDateChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">End Date (Optional)</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="w-4 h-4 mr-2" />
                {value.endDate ? format(value.endDate, 'PPP') : 'No end date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarUI
                mode="single"
                selected={value.endDate || undefined}
                onSelect={date => handleDateChange('endDate', date || undefined)}
                disabled={date => (value.startDate ? date < value.startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Time Range */}
      {showTimeRange && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="time-start">Time Start (Optional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                id="time-start"
                type="time"
                value={value.timeStart || ''}
                onChange={e => handleTimeChange('timeStart', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-end">Time End (Optional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                id="time-end"
                type="time"
                value={value.timeEnd || ''}
                onChange={e => handleTimeChange('timeEnd', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timezone */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Timezone</div>
        <Select value={value.timezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recurring Pattern */}
      {showRecurring && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recurring Schedule</CardTitle>
                <CardDescription>Set up repeating patterns</CardDescription>
              </div>
              <Switch checked={isRecurring} onCheckedChange={toggleRecurring} />
            </div>
          </CardHeader>

          {isRecurring && (
            <CardContent className="space-y-4">
              {/* Recurrence Type */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Repeat</div>
                <Select
                  value={value.recurring?.type || 'weekly'}
                  onValueChange={(type: RecurringPattern['type']) =>
                    handleRecurringChange({ type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interval */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Every</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={value.recurring?.interval || 1}
                    onChange={e =>
                      handleRecurringChange({ interval: parseInt(e.target.value) || 1 })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {value.recurring?.type === 'daily' && 'day(s)'}
                    {value.recurring?.type === 'weekly' && 'week(s)'}
                    {value.recurring?.type === 'monthly' && 'month(s)'}
                  </span>
                </div>
              </div>

              {/* Days of Week (for weekly) */}
              {value.recurring?.type === 'weekly' && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">On Days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = value.recurring?.daysOfWeek?.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const current = value.recurring?.daysOfWeek || [];
                            const newDays = isSelected
                              ? current.filter(d => d !== day.value)
                              : [...current, day.value].sort();
                            handleRecurringChange({ daysOfWeek: newDays });
                          }}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
