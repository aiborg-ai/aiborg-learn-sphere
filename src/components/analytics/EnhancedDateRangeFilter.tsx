/**
 * Enhanced Date Range Filter Component
 * Provides intuitive date range selection with presets and custom ranges
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronDown } from '@/components/ui/icons';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: string; // ISO string
  end: string; // ISO string
}

export interface DatePreset {
  label: string;
  value: string;
  getRange: () => DateRange;
}

export interface EnhancedDateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Last 7 Days',
    value: 'last_7_days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 6)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: 'Last 2 Weeks',
    value: 'last_2_weeks',
    getRange: () => ({
      start: startOfDay(subWeeks(new Date(), 2)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: 'Last Month',
    value: 'last_month',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 1)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: 'Last 3 Months',
    value: 'last_3_months',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 3)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: 'Last 6 Months',
    value: 'last_6_months',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 6)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: 'Last Year',
    value: 'last_year',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 12)).toISOString(),
      end: endOfDay(new Date()).toISOString(),
    }),
  },
];

export function EnhancedDateRangeFilter({
  value,
  onChange,
  className,
}: EnhancedDateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('last_month');
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(new Date(value.start));
  const [customEnd, setCustomEnd] = useState<Date | undefined>(new Date(value.end));

  // Initialize with Last Month preset
  useEffect(() => {
    const defaultPreset = DATE_PRESETS.find(p => p.value === 'last_month');
    if (defaultPreset) {
      onChange(defaultPreset.getRange());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset.value);
    onChange(preset.getRange());
    setCustomRangeOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (customStart && customEnd) {
      setSelectedPreset('custom');
      onChange({
        start: startOfDay(customStart).toISOString(),
        end: endOfDay(customEnd).toISOString(),
      });
      setCustomRangeOpen(false);
    }
  };

  const formatDisplayDate = (isoString: string) => {
    return format(new Date(isoString), 'MMM d, yyyy');
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {DATE_PRESETS.map(preset => (
          <Button
            key={preset.value}
            variant={selectedPreset === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Range Picker */}
      <Popover open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
        <PopoverTrigger asChild>
          <Button variant={selectedPreset === 'custom' ? 'default' : 'outline'} size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {selectedPreset === 'custom'
              ? `${formatDisplayDate(value.start)} - ${formatDisplayDate(value.end)}`
              : 'Custom Range'}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Start Date</p>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={setCustomStart}
                initialFocus
                disabled={date => date > new Date()}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">End Date</p>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
                disabled={date => {
                  if (!customStart) return date > new Date();
                  return date < customStart || date > new Date();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomRangeOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCustomRangeApply}
                disabled={!customStart || !customEnd}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current Range Display (Mobile) */}
      <div className="w-full sm:hidden">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Showing:</span>
              <span className="font-medium">
                {formatDisplayDate(value.start)} - {formatDisplayDate(value.end)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
