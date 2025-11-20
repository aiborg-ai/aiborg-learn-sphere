/**
 * Widget Editor
 *
 * Configuration panel for editing widget settings
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, X, Save } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import type { DashboardWidget, BaseWidgetConfig } from '@/types/dashboard';
import { WidgetRegistry } from '@/services/dashboard/WidgetRegistry';

interface WidgetEditorProps {
  widget: DashboardWidget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetId: string, updates: Partial<DashboardWidget>) => void;
}

export function WidgetEditor({ widget, isOpen, onClose, onSave }: WidgetEditorProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: widget?.config || {},
  });

  if (!widget) {
    return null;
  }

  const widgetDef = WidgetRegistry.get(widget.type);
  if (!widgetDef) {
    return null;
  }

  const config = widget.config as BaseWidgetConfig;

  const onSubmit = (data: any) => {
    onSave(widget.id, {
      config: {
        ...widget.config,
        ...data,
      },
    });
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Discard them?');
      if (!confirm) return;
    }
    reset();
    setHasChanges(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleCancel}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Widget
          </SheetTitle>
          <SheetDescription>
            Customize the settings for <span className="font-medium">{widgetDef.name}</span>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollArea className="flex-1 -mx-6 px-6 my-6">
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Basic Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Widget Title</Label>
                  <Input
                    id="title"
                    placeholder={widgetDef.name}
                    {...register('title')}
                    onChange={e => {
                      register('title').onChange(e);
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use default title</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showTitle">Show Title</Label>
                    <p className="text-xs text-muted-foreground">Display the widget title</p>
                  </div>
                  <Switch
                    id="showTitle"
                    checked={watch('showTitle') ?? true}
                    onCheckedChange={checked => {
                      setValue('showTitle', checked);
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Refresh Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Data Refresh</h3>

                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">Auto-refresh Interval (seconds)</Label>
                  <Input
                    id="refreshInterval"
                    type="number"
                    min="0"
                    placeholder="0 (disabled)"
                    {...register('refreshInterval', { valueAsNumber: true })}
                    onChange={e => {
                      register('refreshInterval').onChange(e);
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 to disable auto-refresh</p>
                </div>
              </div>

              <Separator />

              {/* Widget-specific Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Widget Settings</h3>

                {/* Limit setting (for list/feed widgets) */}
                {(widget.type === 'notifications' ||
                  widget.type === 'assignments' ||
                  widget.type === 'upcoming-events' ||
                  widget.type === 'recent-activity' ||
                  widget.type === 'study-recommendations') && (
                  <div className="space-y-2">
                    <Label htmlFor="limit">Number of Items</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="5"
                      {...register('limit', { valueAsNumber: true })}
                      onChange={e => {
                        register('limit').onChange(e);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                )}

                {/* Show timestamps */}
                {(widget.type === 'notifications' ||
                  widget.type === 'assignments' ||
                  widget.type === 'recent-activity') && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showTimestamps">Show Timestamps</Label>
                      <p className="text-xs text-muted-foreground">Display time information</p>
                    </div>
                    <Switch
                      id="showTimestamps"
                      checked={watch('showTimestamps') ?? true}
                      onCheckedChange={checked => {
                        setValue('showTimestamps', checked);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                )}

                {/* Group by date */}
                {widget.type === 'recent-activity' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="groupByDate">Group by Date</Label>
                      <p className="text-xs text-muted-foreground">Group activities by day</p>
                    </div>
                    <Switch
                      id="groupByDate"
                      checked={watch('groupByDate') ?? true}
                      onCheckedChange={checked => {
                        setValue('groupByDate', checked);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                )}

                {/* Sort by */}
                {(widget.type === 'achievements' ||
                  widget.type === 'certificates' ||
                  widget.type === 'course-progress') && (
                  <div className="space-y-2">
                    <Label htmlFor="sortBy">Sort By</Label>
                    <Select
                      value={watch('sortBy') || 'date'}
                      onValueChange={value => {
                        setValue('sortBy', value);
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger id="sortBy">
                        <SelectValue placeholder="Select sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        {widget.type === 'course-progress' && (
                          <SelectItem value="progress">Progress</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show percentage */}
                {(widget.type === 'course-progress' ||
                  widget.type === 'learning-path-progress' ||
                  widget.type === 'progress-summary') && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showPercentage">Show Percentage</Label>
                      <p className="text-xs text-muted-foreground">
                        Display progress as percentage
                      </p>
                    </div>
                    <Switch
                      id="showPercentage"
                      checked={watch('showPercentage') ?? true}
                      onCheckedChange={checked => {
                        setValue('showPercentage', checked);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                )}

                {/* Chart type */}
                {widget.type === 'performance-chart' && (
                  <div className="space-y-2">
                    <Label htmlFor="chartType">Chart Type</Label>
                    <Select
                      value={watch('chartType') || 'line'}
                      onValueChange={value => {
                        setValue('chartType', value);
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger id="chartType">
                        <SelectValue placeholder="Select chart type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show events/deadlines for calendar */}
                {widget.type === 'calendar' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showEvents">Show Events</Label>
                        <p className="text-xs text-muted-foreground">Display event indicators</p>
                      </div>
                      <Switch
                        id="showEvents"
                        checked={watch('showEvents') ?? true}
                        onCheckedChange={checked => {
                          setValue('showEvents', checked);
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showDeadlines">Show Deadlines</Label>
                        <p className="text-xs text-muted-foreground">Display deadline indicators</p>
                      </div>
                      <Switch
                        id="showDeadlines"
                        checked={watch('showDeadlines') ?? true}
                        onCheckedChange={checked => {
                          setValue('showDeadlines', checked);
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Size Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Size & Position</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input type="number" value={widget.size.width} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input type="number" value={widget.size.height} disabled />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Resize on canvas: Min {widgetDef.minSize.width}×{widgetDef.minSize.height}, Max{' '}
                  {widgetDef.maxSize.width}×{widgetDef.maxSize.height}
                </p>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default WidgetEditor;
