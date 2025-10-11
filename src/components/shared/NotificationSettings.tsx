import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bell, BellOff, Mail, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NotificationPreferences {
  course_enrollment: boolean;
  assignment_due: boolean;
  assignment_graded: boolean;
  course_update: boolean;
  new_announcement: boolean;
  deadline_reminder: boolean;
  certificate_ready: boolean;
  discussion_reply: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    course_enrollment: true,
    assignment_due: true,
    assignment_graded: true,
    course_update: true,
    new_announcement: true,
    deadline_reminder: true,
    certificate_ready: true,
    discussion_reply: true,
  });

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_notifications, notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setEmailEnabled(data.email_notifications ?? true);
        setPreferences(data.notification_preferences || preferences);
      }
    } catch (error) {
      logger.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, preferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailEnabled,
          notification_preferences: preferences,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Notification preferences updated successfully',
      });
    } catch (error) {
      logger.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const notificationTypes = [
    {
      key: 'course_enrollment' as keyof NotificationPreferences,
      label: 'Course Enrollment',
      description: 'Get notified when you enroll in a new course',
      icon: '🎓',
    },
    {
      key: 'assignment_due' as keyof NotificationPreferences,
      label: 'Assignment Reminders',
      description: 'Receive reminders about upcoming assignment deadlines',
      icon: '📝',
    },
    {
      key: 'assignment_graded' as keyof NotificationPreferences,
      label: 'Assignment Graded',
      description: 'Get notified when your assignments are graded',
      icon: '✅',
    },
    {
      key: 'course_update' as keyof NotificationPreferences,
      label: 'Course Updates',
      description: 'Stay informed about changes to your courses',
      icon: '📢',
    },
    {
      key: 'new_announcement' as keyof NotificationPreferences,
      label: 'Announcements',
      description: 'Receive instructor announcements and important notices',
      icon: '📣',
    },
    {
      key: 'deadline_reminder' as keyof NotificationPreferences,
      label: 'Deadline Alerts',
      description: 'Get urgent reminders for approaching deadlines',
      icon: '⏰',
    },
    {
      key: 'certificate_ready' as keyof NotificationPreferences,
      label: 'Certificate Ready',
      description: 'Be notified when your course certificates are available',
      icon: '🏆',
    },
    {
      key: 'discussion_reply' as keyof NotificationPreferences,
      label: 'Discussion Replies',
      description: 'Get notified when someone replies to your posts',
      icon: '💬',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Manage how you receive email notifications for important updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {emailEnabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="email-enabled" className="text-base font-semibold">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                {emailEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <Switch id="email-enabled" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>

        <Separator />

        {/* Individual Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Notification Types
          </h4>

          {notificationTypes.map(type => (
            <div
              key={type.key}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                emailEnabled ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <Label
                    htmlFor={type.key}
                    className={`text-sm font-medium ${
                      !emailEnabled ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {type.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </div>
              </div>
              <Switch
                id={type.key}
                checked={preferences[type.key]}
                onCheckedChange={() => togglePreference(type.key)}
                disabled={!emailEnabled}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Changes are saved automatically</p>
          <Button onClick={savePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
