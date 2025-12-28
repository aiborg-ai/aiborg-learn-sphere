import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

interface EmailSettings {
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpFrom: string;
  emailFooter: string;
}

interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: string;
  passwordMinLength: string;
  maxLoginAttempts: string;
  ipWhitelist: string;
  auditLogRetention: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  slackIntegration: boolean;
  slackWebhook: string;
  notifyOnNewUser: boolean;
  notifyOnPayment: boolean;
  notifyOnError: boolean;
}

interface FeatureFlags {
  enableBlog: boolean;
  enableForum: boolean;
  enableChatbot: boolean;
  enableGamification: boolean;
  enableFamilyPass: boolean;
  enableAssessments: boolean;
  enableLingo: boolean;
  enableWorkshops: boolean;
}

const SettingRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-4">
    <div className="space-y-0.5">
      <Label className="text-base">{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </div>
);

export function AdminSettingsPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Settings state
  const [general, setGeneral] = useState<GeneralSettings>({
    siteName: 'AiBorg Learn Sphere',
    siteDescription: 'AI-Powered Learning Management System',
    supportEmail: 'support@aiborg.ai',
    timezone: 'Europe/London',
    language: 'en',
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const [email, setEmail] = useState<EmailSettings>({
    smtpEnabled: true,
    smtpHost: 'smtp.resend.com',
    smtpPort: '587',
    smtpUser: 'resend',
    smtpFrom: 'noreply@aiborg.ai',
    emailFooter: 'AiBorg Ltd. | AI Education Platform',
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorRequired: false,
    sessionTimeout: '24',
    passwordMinLength: '8',
    maxLoginAttempts: '5',
    ipWhitelist: '',
    auditLogRetention: '90',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    slackIntegration: false,
    slackWebhook: '',
    notifyOnNewUser: true,
    notifyOnPayment: true,
    notifyOnError: true,
  });

  const [features, setFeatures] = useState<FeatureFlags>({
    enableBlog: true,
    enableForum: true,
    enableChatbot: true,
    enableGamification: true,
    enableFamilyPass: true,
    enableAssessments: true,
    enableLingo: true,
    enableWorkshops: true,
  });

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value, category');

      if (error) throw error;

      if (data && data.length > 0) {
        // Parse and apply settings from database
        const settingsMap = new Map(
          data.map(s => [s.setting_key, JSON.parse(JSON.stringify(s.setting_value))])
        );

        // Update general settings
        setGeneral(prev => ({
          ...prev,
          siteName: settingsMap.get('site_name') || prev.siteName,
          siteDescription: settingsMap.get('site_description') || prev.siteDescription,
          supportEmail: settingsMap.get('support_email') || prev.supportEmail,
          timezone: settingsMap.get('timezone') || prev.timezone,
          language: settingsMap.get('language') || prev.language,
          maintenanceMode: settingsMap.get('maintenance_mode') === true,
          registrationEnabled: settingsMap.get('registration_enabled') !== false,
        }));

        // Update security settings
        setSecurity(prev => ({
          ...prev,
          sessionTimeout: String(settingsMap.get('session_timeout') || prev.sessionTimeout),
          passwordMinLength: String(
            settingsMap.get('password_min_length') || prev.passwordMinLength
          ),
          maxLoginAttempts: String(settingsMap.get('max_login_attempts') || prev.maxLoginAttempts),
          auditLogRetention: String(
            settingsMap.get('audit_log_retention') || prev.auditLogRetention
          ),
        }));

        // Update feature flags
        setFeatures(prev => ({
          ...prev,
          enableBlog: settingsMap.get('enable_blog') !== false,
          enableForum: settingsMap.get('enable_forum') !== false,
          enableChatbot: settingsMap.get('enable_chatbot') !== false,
          enableGamification: settingsMap.get('enable_gamification') !== false,
          enableFamilyPass: settingsMap.get('enable_family_pass') !== false,
          enableAssessments: settingsMap.get('enable_assessments') !== false,
          enableLingo: settingsMap.get('enable_lingo') !== false,
          enableWorkshops: settingsMap.get('enable_workshops') !== false,
        }));
      }
    } catch (err) {
      logger.error('Failed to fetch settings:', err);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings to database
  const handleSave = async () => {
    setSaving(true);

    try {
      // Prepare settings to upsert
      const settingsToSave = [
        // General settings
        { setting_key: 'site_name', setting_value: general.siteName, category: 'general' },
        {
          setting_key: 'site_description',
          setting_value: general.siteDescription,
          category: 'general',
        },
        { setting_key: 'support_email', setting_value: general.supportEmail, category: 'general' },
        { setting_key: 'timezone', setting_value: general.timezone, category: 'general' },
        { setting_key: 'language', setting_value: general.language, category: 'general' },
        {
          setting_key: 'maintenance_mode',
          setting_value: general.maintenanceMode,
          category: 'general',
        },
        {
          setting_key: 'registration_enabled',
          setting_value: general.registrationEnabled,
          category: 'general',
        },
        // Security settings
        {
          setting_key: 'session_timeout',
          setting_value: parseInt(security.sessionTimeout),
          category: 'security',
        },
        {
          setting_key: 'password_min_length',
          setting_value: parseInt(security.passwordMinLength),
          category: 'security',
        },
        {
          setting_key: 'max_login_attempts',
          setting_value: parseInt(security.maxLoginAttempts),
          category: 'security',
        },
        {
          setting_key: 'audit_log_retention',
          setting_value: parseInt(security.auditLogRetention),
          category: 'security',
        },
        // Feature flags
        { setting_key: 'enable_blog', setting_value: features.enableBlog, category: 'features' },
        { setting_key: 'enable_forum', setting_value: features.enableForum, category: 'features' },
        {
          setting_key: 'enable_chatbot',
          setting_value: features.enableChatbot,
          category: 'features',
        },
        {
          setting_key: 'enable_gamification',
          setting_value: features.enableGamification,
          category: 'features',
        },
        {
          setting_key: 'enable_family_pass',
          setting_value: features.enableFamilyPass,
          category: 'features',
        },
        {
          setting_key: 'enable_assessments',
          setting_value: features.enableAssessments,
          category: 'features',
        },
        { setting_key: 'enable_lingo', setting_value: features.enableLingo, category: 'features' },
        {
          setting_key: 'enable_workshops',
          setting_value: features.enableWorkshops,
          category: 'features',
        },
      ];

      // Upsert each setting
      for (const setting of settingsToSave) {
        const { error } = await supabase.from('admin_settings').upsert(
          {
            setting_key: setting.setting_key,
            setting_value: JSON.stringify(setting.setting_value),
            category: setting.category,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

        if (error) throw error;
      }

      toast({
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (err) {
      logger.error('Failed to save settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-slate-100">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Admin Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure system-wide settings and preferences
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Maintenance Mode Warning */}
      {general.maintenanceMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Maintenance Mode Active</p>
                <p className="text-sm text-yellow-700">
                  The site is currently in maintenance mode. Only admins can access the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic configuration for your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={general.siteName}
                    onChange={e => setGeneral(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={general.siteDescription}
                    onChange={e =>
                      setGeneral(prev => ({ ...prev, siteDescription: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={general.supportEmail}
                    onChange={e => setGeneral(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={general.timezone}
                      onValueChange={v => setGeneral(prev => ({ ...prev, timezone: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          America/Los Angeles (PST)
                        </SelectItem>
                        <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select
                      value={general.language}
                      onValueChange={v => setGeneral(prev => ({ ...prev, language: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <SettingRow
                label="Maintenance Mode"
                description="Enable to temporarily disable access for non-admin users"
              >
                <Switch
                  checked={general.maintenanceMode}
                  onCheckedChange={checked =>
                    setGeneral(prev => ({ ...prev, maintenanceMode: checked }))
                  }
                />
              </SettingRow>

              <SettingRow
                label="User Registration"
                description="Allow new users to register on the platform"
              >
                <Switch
                  checked={general.registrationEnabled}
                  onCheckedChange={checked =>
                    setGeneral(prev => ({ ...prev, registrationEnabled: checked }))
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP and email delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                label="Enable SMTP"
                description="Use custom SMTP server for sending emails"
              >
                <Switch
                  checked={email.smtpEnabled}
                  onCheckedChange={checked => setEmail(prev => ({ ...prev, smtpEnabled: checked }))}
                />
              </SettingRow>

              {email.smtpEnabled && (
                <div className="grid gap-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={email.smtpHost}
                        onChange={e => setEmail(prev => ({ ...prev, smtpHost: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        value={email.smtpPort}
                        onChange={e => setEmail(prev => ({ ...prev, smtpPort: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={email.smtpUser}
                      onChange={e => setEmail(prev => ({ ...prev, smtpUser: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpFrom">From Email Address</Label>
                    <Input
                      id="smtpFrom"
                      type="email"
                      value={email.smtpFrom}
                      onChange={e => setEmail(prev => ({ ...prev, smtpFrom: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailFooter">Email Footer</Label>
                    <Textarea
                      id="emailFooter"
                      value={email.emailFooter}
                      onChange={e => setEmail(prev => ({ ...prev, emailFooter: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and access control configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                label="Require Two-Factor Authentication"
                description="Force all users to enable 2FA"
              >
                <Switch
                  checked={security.twoFactorRequired}
                  onCheckedChange={checked =>
                    setSecurity(prev => ({ ...prev, twoFactorRequired: checked }))
                  }
                />
              </SettingRow>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={e =>
                      setSecurity(prev => ({ ...prev, sessionTimeout: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passwordMinLength">Min Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={security.passwordMinLength}
                    onChange={e =>
                      setSecurity(prev => ({ ...prev, passwordMinLength: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={security.maxLoginAttempts}
                    onChange={e =>
                      setSecurity(prev => ({ ...prev, maxLoginAttempts: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
                  <Input
                    id="auditLogRetention"
                    type="number"
                    value={security.auditLogRetention}
                    onChange={e =>
                      setSecurity(prev => ({ ...prev, auditLogRetention: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ipWhitelist">IP Whitelist (comma separated)</Label>
                <Textarea
                  id="ipWhitelist"
                  placeholder="e.g., 192.168.1.1, 10.0.0.0/8"
                  value={security.ipWhitelist}
                  onChange={e => setSecurity(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how admins receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow label="Email Notifications" description="Receive notifications via email">
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </SettingRow>

              <SettingRow
                label="Push Notifications"
                description="Receive browser push notifications"
              >
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </SettingRow>

              <Separator />

              <SettingRow
                label="Slack Integration"
                description="Send notifications to Slack channel"
              >
                <Switch
                  checked={notifications.slackIntegration}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, slackIntegration: checked }))
                  }
                />
              </SettingRow>

              {notifications.slackIntegration && (
                <div className="grid gap-2">
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={notifications.slackWebhook}
                    onChange={e =>
                      setNotifications(prev => ({ ...prev, slackWebhook: e.target.value }))
                    }
                  />
                </div>
              )}

              <Separator />

              <h4 className="font-medium">Notification Triggers</h4>

              <SettingRow
                label="New User Registration"
                description="Notify when a new user signs up"
              >
                <Switch
                  checked={notifications.notifyOnNewUser}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, notifyOnNewUser: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="Payment Received" description="Notify when a payment is processed">
                <Switch
                  checked={notifications.notifyOnPayment}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, notifyOnPayment: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="System Errors" description="Notify when critical errors occur">
                <Switch
                  checked={notifications.notifyOnError}
                  onCheckedChange={checked =>
                    setNotifications(prev => ({ ...prev, notifyOnError: checked }))
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow label="Blog" description="Enable the blog section">
                <Switch
                  checked={features.enableBlog}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableBlog: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="Forum" description="Enable community forums">
                <Switch
                  checked={features.enableForum}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableForum: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="AI Chatbot" description="Enable the AI assistant chatbot">
                <Switch
                  checked={features.enableChatbot}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableChatbot: checked }))
                  }
                />
              </SettingRow>

              <SettingRow
                label="Gamification"
                description="Enable badges, points, and leaderboards"
              >
                <Switch
                  checked={features.enableGamification}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableGamification: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="Family Pass" description="Enable family membership subscriptions">
                <Switch
                  checked={features.enableFamilyPass}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableFamilyPass: checked }))
                  }
                />
              </SettingRow>

              <SettingRow
                label="Assessments"
                description="Enable AI assessments (Readiness, Fluency, Awareness)"
              >
                <Switch
                  checked={features.enableAssessments}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableAssessments: checked }))
                  }
                />
              </SettingRow>

              <SettingRow
                label="AIBORGLingo"
                description="Enable the language learning microlearning platform"
              >
                <Switch
                  checked={features.enableLingo}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableLingo: checked }))
                  }
                />
              </SettingRow>

              <SettingRow label="Workshops" description="Enable interactive workshop sessions">
                <Switch
                  checked={features.enableWorkshops}
                  onCheckedChange={checked =>
                    setFeatures(prev => ({ ...prev, enableWorkshops: checked }))
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
