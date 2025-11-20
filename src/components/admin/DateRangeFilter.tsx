/**
 * DateRangeFilter Component
 * Date range selection with presets and custom picker
 */

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDateRange } from '@/contexts/DateRangeContext';
import { PRESET_CONFIG, type PresetOption } from '@/contexts/DateRangeContext';
import { CalendarIcon, Check } from '@/components/ui/icons';
import { format } from 'date-fns';

export interface DateRangeFilterProps {
  onApply?: () => void;
  className?: string;
}

/**
 * DateRangeFilter component for analytics dashboard
 *
 * Features:
 * - Preset buttons for common date ranges
 * - Custom date picker for start and end dates
 * - Validation (end date >= start date)
 * - Apply button with loading state
 * - Responsive design
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   onApply={() => {
 *     console.log('Date range applied');
 *     refetchData();
 *   }}
 * />
 * ```
 */
export function DateRangeFilter({ onApply, className }: DateRangeFilterProps) {
  const { startDate, endDate, preset, setPreset, setDateRange, isDateRangeValid } = useDateRange();
  const [isApplying, setIsApplying] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Local state for custom date selection
  const [customStart, setCustomStart] = useState<Date | undefined>(startDate || undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endDate || undefined);

  /**
   * Handle preset selection
   */
  const handlePresetClick = (presetOption: PresetOption) => {
    setPreset(presetOption);

    // Update custom dates to match preset
    if (presetOption !== 'custom') {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  /**
   * Handle custom date range selection
   */
  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStart(start);
    setCustomEnd(end);

    if (start && end) {
      setDateRange(start, end);
    }
  };

  /**
   * Apply date range
   */
  const handleApply = async () => {
    if (!isDateRangeValid()) {
      return;
    }

    setIsApplying(true);

    try {
      if (onApply) {
        await onApply();
      }
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Check if validation passes
   */
  const isValid = () => {
    if (!startDate || !endDate) return false;
    if (startDate > endDate) return false;
    if (endDate > new Date()) return false;
    return true;
  };

  const validationError = () => {
    if (!startDate || !endDate) return 'Please select both start and end dates';
    if (startDate > endDate) return 'Start date must be before end date';
    if (endDate > new Date()) return 'End date cannot be in the future';
    return null;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div>
            <div className="text-sm font-medium mb-2 block">Quick Select</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {(Object.keys(PRESET_CONFIG) as PresetOption[])
                .filter(key => key !== 'custom')
                .map(presetKey => (
                  <Button
                    key={presetKey}
                    variant={preset === presetKey ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(presetKey)}
                    className="relative"
                  >
                    {preset === presetKey && <Check className="absolute left-2 h-3 w-3" />}
                    <span className={preset === presetKey ? 'ml-4' : ''}>
                      {PRESET_CONFIG[presetKey].label}
                    </span>
                  </Button>
                ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div>
            <div className="text-sm font-medium mb-2 block">Custom Range</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Start Date Picker */}
              <Popover open={showStartPicker} onOpenChange={setShowStartPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !customStart && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={date => {
                      setCustomStart(date);
                      handleCustomDateChange(date, customEnd);
                      setShowStartPicker(false);
                    }}
                    disabled={date => date > new Date() || (customEnd ? date > customEnd : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* End Date Picker */}
              <Popover open={showEndPicker} onOpenChange={setShowEndPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !customEnd && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={date => {
                      setCustomEnd(date);
                      handleCustomDateChange(customStart, date);
                      setShowEndPicker(false);
                    }}
                    disabled={date =>
                      date > new Date() || (customStart ? date < customStart : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Validation Error */}
          {validationError() && <div className="text-sm text-destructive">{validationError()}</div>}

          {/* Current Selection Display */}
          <div className="text-sm text-muted-foreground">
            {startDate && endDate && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Selected:</span>
                <span>
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </span>
                {preset && preset !== 'custom' && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {PRESET_CONFIG[preset].label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={!isValid() || isApplying}
              className="w-full sm:w-auto"
            >
              {isApplying ? (
                <>
                  <span className="mr-2">Applying...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                'Apply Filter'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
