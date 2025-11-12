/**
 * DateRangeSelector Component
 * Enhanced date range selection with comparison mode and preferences
 */

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDateRange } from '@/contexts/DateRangeContext';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { Calendar, TrendingUp, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface DateRangeSelectorProps {
  onApply?: () => void;
  showComparison?: boolean;
  className?: string;
  enablePreferences?: boolean;
}

/**
 * DateRangeSelector component for analytics pages
 *
 * Features:
 * - All DateRangeFilter functionality (presets, custom picker, validation)
 * - Comparison mode toggle with auto-calculated previous period
 * - URL parameter persistence (automatic sync)
 * - User preferences save/load (last-used date range)
 * - Visual comparison period display
 *
 * @example
 * ```tsx
 * <DateRangeSelector
 *   onApply={() => refetchAnalytics()}
 *   showComparison={true}
 *   enablePreferences={true}
 * />
 * ```
 */
export function DateRangeSelector({
  onApply,
  showComparison = true,
  className,
  enablePreferences = true,
}: DateRangeSelectorProps) {
  const {
    startDate,
    endDate,
    preset,
    getDateRangeString,
    comparisonEnabled,
    toggleComparison,
    getComparisonDateRangeString,
    saveToPreferences,
    isSavingPreferences,
  } = useDateRange();

  /**
   * Auto-save to preferences when date range changes
   */
  useEffect(() => {
    if (enablePreferences && startDate && endDate && preset) {
      // Debounce the save operation
      const timeoutId = setTimeout(() => {
        saveToPreferences().catch(error => {
          logger.error('Failed to auto-save preferences:', error);
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [startDate, endDate, preset, enablePreferences, saveToPreferences]);

  /**
   * Handle comparison toggle
   */
  const handleComparisonToggle = (checked: boolean) => {
    toggleComparison(checked);
    toast.success(checked ? 'Comparison mode enabled' : 'Comparison mode disabled');
  };

  /**
   * Manual save to preferences
   */
  const handleManualSave = async () => {
    try {
      await saveToPreferences();
      toast.success('Date range saved as default');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Current Date Range Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Current Period</p>
              <p className="text-sm text-muted-foreground">{getDateRangeString()}</p>
            </div>
          </div>
          {preset && preset !== 'custom' && (
            <Badge variant="secondary" className="ml-2">
              {preset}
            </Badge>
          )}
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter onApply={onApply} className="w-full" />

        <Separator />

        {/* Comparison Mode Toggle */}
        {showComparison && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="comparison-toggle" className="text-sm font-medium">
                    Compare with Previous Period
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Auto-calculates equivalent previous time period
                  </p>
                </div>
              </div>
              <Switch
                id="comparison-toggle"
                checked={comparisonEnabled}
                onCheckedChange={handleComparisonToggle}
              />
            </div>

            {/* Comparison Period Display */}
            {comparisonEnabled && (
              <div className="ml-7 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Comparison Period</p>
                <p className="text-sm">{getComparisonDateRangeString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Preferences Actions */}
        {enablePreferences && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isSavingPreferences ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Auto-saving...
                    </span>
                  ) : (
                    'Date range auto-saves to preferences'
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSavingPreferences || !startDate || !endDate}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save as Default
              </Button>
            </div>
          </>
        )}

        {/* URL Sync Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>Date range syncs to URL for shareable links</p>
        </div>
      </CardContent>
    </Card>
  );
}
