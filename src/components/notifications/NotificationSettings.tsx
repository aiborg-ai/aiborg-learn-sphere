/**
 * NotificationSettings Component
 *
 * UI for managing push notification preferences
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  BookOpen,
  Trophy,
  Megaphone,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from '@/components/ui/icons';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import type { NotificationType } from '@/services/notifications/pushNotificationService';

interface NotificationOption {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const notificationOptions: NotificationOption[] = [
  {
    type: 'deadlines',
    label: 'Assignment Deadlines',
    description: 'Get reminded before assignments are due',
    icon: Calendar,
  },
  {
    type: 'courseUpdates',
    label: 'Course Updates',
    description: 'New content, announcements from instructors',
    icon: BookOpen,
  },
  {
    type: 'achievements',
    label: 'Achievements & Badges',
    description: 'Celebrate your learning milestones',
    icon: Trophy,
  },
  {
    type: 'announcements',
    label: 'Platform Announcements',
    description: 'Important updates and new features',
    icon: Megaphone,
  },
  {
    type: 'reminders',
    label: 'Study Reminders',
    description: 'Personalized reminders to stay on track',
    icon: Clock,
  },
];

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    requestPermission: _requestPermission,
    subscribe,
    unsubscribe,
    updatePreference,
    sendTestNotification,
  } = usePushNotifications();

  const { toast } = useToast();

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: 'Notifications Enabled',
        description: "You'll now receive push notifications for important updates.",
      });
    } else {
      toast({
        title: 'Failed to Enable',
        description: 'Could not enable push notifications. Please check your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast({
        title: 'Notifications Disabled',
        description: "You won't receive push notifications anymore.",
      });
    }
  };

  const handlePreferenceChange = async (type: NotificationType, enabled: boolean) => {
    try {
      await updatePreference(type, enabled);
      toast({
        title: 'Preference Updated',
        description: `${type} notifications ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Could not update notification preference.',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    toast({
      title: 'Test Notification Sent',
      description: 'Check your notifications!',
    });
  };

  // Not supported
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Push notifications are not supported in your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Try using a modern browser like Chrome, Firefox, or Edge.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications from Aiborg Learn Sphere
            </CardDescription>
          </div>
          {isSubscribed && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isSubscribed ? 'Notifications are enabled' : 'Enable push notifications'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "You'll receive notifications for important updates"
                  : 'Stay updated with deadlines, achievements, and more'}
              </p>
            </div>
          </div>
          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            variant={isSubscribed ? 'outline' : 'default'}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubscribed ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Permission denied warning */}
        {permission === 'denied' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Notifications are blocked. Please enable them in your browser settings.
            </span>
          </div>
        )}

        {/* Notification preferences */}
        {isSubscribed && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notification Types</h4>
              <div className="space-y-3">
                {notificationOptions.map(option => (
                  <div
                    key={option.type}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor={`notify-${option.type}`} className="font-medium">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={`notify-${option.type}`}
                      checked={preferences[option.type]}
                      onCheckedChange={checked => handlePreferenceChange(option.type, checked)}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Test notification button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                Send Test Notification
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
