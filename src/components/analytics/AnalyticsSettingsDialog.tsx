/**
 * Analytics Settings Dialog
 * User preferences for real-time updates and auto-refresh settings
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, RefreshCw, Bell, RotateCcw, Save, Loader2 } from '@/components/ui/icons';
import {
  useAnalyticsPreferences,
  useUpdateAnalyticsPreferences,
  useResetAnalyticsPreferences,
  useRefreshIntervalOptions,
} from '@/hooks/useAnalyticsPreferences';
import { useAuth } from '@/hooks/useAuth';
import type { AnalyticsPreferencesUpdate } from '@/types';

export interface AnalyticsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AnalyticsSettingsDialog({
  open,
  onOpenChange,
}: AnalyticsSettingsDialogProps) {
  const { user } = useAuth();
  const { data: preferences, isLoading } = useAnalyticsPreferences(user?.id || '');
  const { mutate: updatePreferences, isPending: isUpdating } = useUpdateAnalyticsPreferences(
    user?.id || ''
  );
  const { mutate: resetPreferences, isPending: isResetting } = useResetAnalyticsPreferences(
    user?.id || ''
  );
  const intervalOptions = useRefreshIntervalOptions();

  // Local form state
  const [formData, setFormData] = useState<AnalyticsPreferencesUpdate>({});

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        real_time_enabled: preferences.real_time_enabled,
        auto_refresh_interval: preferences.auto_refresh_interval,
        chatbot_analytics_refresh: preferences.chatbot_analytics_refresh,
        learner_analytics_refresh: preferences.learner_analytics_refresh,
        manager_dashboard_refresh: preferences.manager_dashboard_refresh,
        show_refresh_indicator: preferences.show_refresh_indicator,
        show_real_time_notifications: preferences.show_real_time_notifications,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(formData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleReset = () => {
    resetPreferences(undefined, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const getIntervalLabel = (ms: number): string => {
    const minutes = ms / 60000;
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  // Find closest interval option for slider
  const getIntervalSliderValue = (ms: number): number => {
    const index = intervalOptions.findIndex(opt => opt.value === ms);
    return index >= 0 ? index : 1; // Default to 3 minutes (index 1)
  };

  const setIntervalFromSlider = (index: number) => {
    const option = intervalOptions[index];
    if (option) {
      setFormData(prev => ({ ...prev, auto_refresh_interval: option.value }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Analytics Settings
          </DialogTitle>
          <DialogDescription>
            Customize how analytics data is refreshed and updated in real-time
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Real-time Updates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="real-time-enabled" className="text-base font-medium">
                      Real-time Updates
                    </Label>
                    <Badge variant="default" className="gap-1 bg-green-500">
                      <Zap className="h-3 w-3" />
                      Live
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable WebSocket connections for instant data updates
                  </p>
                </div>
                <Switch
                  id="real-time-enabled"
                  checked={formData.real_time_enabled ?? true}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, real_time_enabled: checked }))
                  }
                />
              </div>

              {formData.real_time_enabled && (
                <div className="ml-6 space-y-3 p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-notifications" className="text-sm">
                      Show toast notifications
                    </Label>
                    <Switch
                      id="show-notifications"
                      checked={formData.show_real_time_notifications ?? false}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, show_real_time_notifications: checked }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display notifications when real-time updates occur
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Auto-Refresh Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <div className="text-base font-medium">Auto-Refresh Interval</div>
              </div>
              <p className="text-sm text-muted-foreground">
                How often should analytics data automatically refresh?
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getIntervalLabel(formData.auto_refresh_interval ?? 180000)}
                    </span>
                    <Badge variant="secondary">
                      {
                        intervalOptions[
                          getIntervalSliderValue(formData.auto_refresh_interval ?? 180000)
                        ]?.label
                      }
                    </Badge>
                  </div>
                  <Slider
                    value={[getIntervalSliderValue(formData.auto_refresh_interval ?? 180000)]}
                    onValueChange={([value]) => setIntervalFromSlider(value)}
                    max={intervalOptions.length - 1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Faster</span>
                    <span>Slower</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Per-Page Settings */}
            <div className="space-y-4">
              <div>
                <div className="text-base font-medium">Page-Specific Settings</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable or disable auto-refresh for individual analytics pages
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <Label htmlFor="chatbot-refresh" className="font-medium">
                      Chatbot Analytics
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Session metrics, topics, and sentiment analysis
                    </p>
                  </div>
                  <Switch
                    id="chatbot-refresh"
                    checked={formData.chatbot_analytics_refresh ?? true}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, chatbot_analytics_refresh: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <Label htmlFor="learner-refresh" className="font-medium">
                      Learner Analytics
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Individual learner performance and progress
                    </p>
                  </div>
                  <Switch
                    id="learner-refresh"
                    checked={formData.learner_analytics_refresh ?? true}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, learner_analytics_refresh: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <Label htmlFor="manager-refresh" className="font-medium">
                      Manager Dashboard
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Team overview and direct reports
                    </p>
                  </div>
                  <Switch
                    id="manager-refresh"
                    checked={formData.manager_dashboard_refresh ?? true}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, manager_dashboard_refresh: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Display Settings */}
            <div className="space-y-4">
              <div>
                <div className="text-base font-medium">Display Settings</div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <Label htmlFor="show-indicator" className="font-medium">
                    Show Refresh Indicator
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Display refresh status and countdown timer
                  </p>
                </div>
                <Switch
                  id="show-indicator"
                  checked={formData.show_refresh_indicator ?? true}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, show_refresh_indicator: checked }))
                  }
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">Performance Tips</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Real-time updates use WebSockets for instant updates. Auto-refresh polls the
                  server at regular intervals. For best performance, enable real-time and set
                  auto-refresh to 3-5 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isUpdating}
            className="gap-2"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset to Defaults
          </Button>
          <div className="flex gap-2 flex-1 sm:flex-initial">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2 flex-1">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
