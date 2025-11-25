import { logger } from '@/utils/logger';
/**
 * Integrations Dashboard Component
 *
 * Admin dashboard for managing enterprise integrations:
 * - SSO (SAML 2.0, OIDC, Azure AD, Okta, Google Workspace)
 * - HR Systems (Workday, BambooHR, etc.)
 * - Webhooks
 * - Notification Channels (Slack, Teams)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Key,
  Users,
  Webhook,
  Bell,
  Plus,
  RefreshCw,
  TestTube,
  Trash2,
  Building2,
  Shield,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import {
  IntegrationService,
  SSOConfiguration,
  HRIntegration,
  WebhookEndpoint,
  NotificationChannel,
  WEBHOOK_EVENTS,
} from '@/services/integrations';

interface IntegrationsDashboardProps {
  organizationId: string;
}

export function IntegrationsDashboard({ organizationId }: IntegrationsDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [summary, setSummary] = useState<{
    sso: { total: number; active: number; verified: number };
    hr: { total: number; connected: number; lastSync?: string };
    webhooks: { total: number; active: number; deliveries24h: number };
    channels: { total: number; active: number };
  } | null>(null);

  const [ssoConfigs, setSSOConfigs] = useState<SSOConfiguration[]>([]);
  const [hrIntegrations, setHRIntegrations] = useState<HRIntegration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);

  // Dialog states
  const [ssoDialogOpen, setSSODialogOpen] = useState(false);
  const [hrDialogOpen, setHRDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);

  // Form states
  const [newSSO, setNewSSO] = useState({
    provider_type: 'saml' as SSOConfiguration['provider_type'],
    display_name: '',
    saml_entity_id: '',
    saml_sso_url: '',
    saml_certificate: '',
  });

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const [newChannel, setNewChannel] = useState({
    channel_type: 'slack' as NotificationChannel['channel_type'],
    name: '',
    slack_webhook_url: '',
    subscribed_events: [] as string[],
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, ssoData, hrData, webhookData, channelData] = await Promise.all([
        IntegrationService.getIntegrationsSummary(organizationId),
        IntegrationService.getSSOConfigurations(organizationId),
        IntegrationService.getHRIntegrations(organizationId),
        IntegrationService.getWebhookEndpoints({ organizationId }),
        IntegrationService.getNotificationChannels(organizationId),
      ]);

      setSummary(summaryData);
      setSSOConfigs(ssoData);
      setHRIntegrations(hrData);
      setWebhooks(webhookData);
      setChannels(channelData);
    } catch (error) {
      logger.error('Error loading integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSSO = async () => {
    try {
      await IntegrationService.createSSOConfiguration({
        organization_id: organizationId,
        ...newSSO,
      });
      toast({
        title: 'SSO Configuration Created',
        description: `${newSSO.display_name} has been added`,
      });
      setSSODialogOpen(false);
      setNewSSO({
        provider_type: 'saml',
        display_name: '',
        saml_entity_id: '',
        saml_sso_url: '',
        saml_certificate: '',
      });
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create SSO configuration',
        variant: 'destructive',
      });
    }
  };

  const handleCreateWebhook = async () => {
    try {
      await IntegrationService.createWebhookEndpoint({
        organization_id: organizationId,
        ...newWebhook,
      });
      toast({
        title: 'Webhook Created',
        description: `${newWebhook.name} has been added`,
      });
      setWebhookDialogOpen(false);
      setNewWebhook({ name: '', url: '', events: [] });
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    }
  };

  const handleCreateChannel = async () => {
    try {
      await IntegrationService.createNotificationChannel({
        organization_id: organizationId,
        ...newChannel,
      });
      toast({
        title: 'Channel Created',
        description: `${newChannel.name} has been added`,
      });
      setChannelDialogOpen(false);
      setNewChannel({
        channel_type: 'slack',
        name: '',
        slack_webhook_url: '',
        subscribed_events: [],
      });
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create notification channel',
        variant: 'destructive',
      });
    }
  };

  const handleTestWebhook = async (id: string) => {
    const result = await IntegrationService.testWebhook(id);
    toast({
      title: result.success ? 'Test Successful' : 'Test Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleTestChannel = async (id: string) => {
    const result = await IntegrationService.testNotificationChannel(id);
    toast({
      title: result.success ? 'Test Successful' : 'Test Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleToggleSSO = async (id: string, isActive: boolean) => {
    await IntegrationService.toggleSSOConfiguration(id, isActive);
    await loadData();
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    await IntegrationService.toggleWebhookEndpoint(id, isActive);
    await loadData();
  };

  const handleToggleChannel = async (id: string, isActive: boolean) => {
    await IntegrationService.toggleNotificationChannel(id, isActive);
    await loadData();
  };

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      await IntegrationService.deleteWebhookEndpoint(id);
      toast({ title: 'Webhook Deleted' });
      await loadData();
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm('Are you sure you want to delete this channel?')) {
      await IntegrationService.deleteNotificationChannel(id);
      toast({ title: 'Channel Deleted' });
      await loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Manage SSO, HR systems, webhooks, and notification channels
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SSO Providers</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.sso.active}/{summary.sso.total}
              </div>
              <p className="text-xs text-muted-foreground">{summary.sso.verified} verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Integrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.hr.connected}/{summary.hr.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.hr.lastSync
                  ? `Last sync: ${new Date(summary.hr.lastSync).toLocaleDateString()}`
                  : 'No sync yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.webhooks.active}/{summary.webhooks.total}
              </div>
              <p className="text-xs text-muted-foreground">Active endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notification Channels</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.channels.active}/{summary.channels.total}
              </div>
              <p className="text-xs text-muted-foreground">Slack, Teams, etc.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="hr">HR Systems</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Setup</CardTitle>
                <CardDescription>Get started with integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSSODialogOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Configure SSO Provider
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setWebhookDialogOpen(true)}
                >
                  <Webhook className="h-4 w-4 mr-2" />
                  Add Webhook Endpoint
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setChannelDialogOpen(true)}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Connect Slack/Teams
                </Button>
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ssoConfigs.slice(0, 3).map(config => (
                    <div key={config.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{config.display_name}</span>
                      </div>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {webhooks.slice(0, 2).map(webhook => (
                    <div key={webhook.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{webhook.name}</span>
                      </div>
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {ssoConfigs.length === 0 && webhooks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No integrations configured yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SSO Tab */}
        <TabsContent value="sso" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Single Sign-On Providers</h3>
            <Dialog open={ssoDialogOpen} onOpenChange={setSSODialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add SSO Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Configure SSO Provider</DialogTitle>
                  <DialogDescription>Set up SAML 2.0 or OIDC authentication</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Provider Type</Label>
                    <Select
                      value={newSSO.provider_type}
                      onValueChange={value => setNewSSO({ ...newSSO, provider_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saml">SAML 2.0</SelectItem>
                        <SelectItem value="oidc">OpenID Connect</SelectItem>
                        <SelectItem value="azure_ad">Azure AD</SelectItem>
                        <SelectItem value="okta">Okta</SelectItem>
                        <SelectItem value="google_workspace">Google Workspace</SelectItem>
                        <SelectItem value="onelogin">OneLogin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Display Name</Label>
                    <Input
                      value={newSSO.display_name}
                      onChange={e => setNewSSO({ ...newSSO, display_name: e.target.value })}
                      placeholder="e.g., Corporate SSO"
                    />
                  </div>
                  {newSSO.provider_type === 'saml' && (
                    <>
                      <div className="grid gap-2">
                        <Label>Entity ID</Label>
                        <Input
                          value={newSSO.saml_entity_id}
                          onChange={e => setNewSSO({ ...newSSO, saml_entity_id: e.target.value })}
                          placeholder="https://idp.example.com/saml"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>SSO URL</Label>
                        <Input
                          value={newSSO.saml_sso_url}
                          onChange={e => setNewSSO({ ...newSSO, saml_sso_url: e.target.value })}
                          placeholder="https://idp.example.com/sso"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>X.509 Certificate</Label>
                        <Textarea
                          value={newSSO.saml_certificate}
                          onChange={e => setNewSSO({ ...newSSO, saml_certificate: e.target.value })}
                          placeholder="-----BEGIN CERTIFICATE-----"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSSODialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSSO} disabled={!newSSO.display_name}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {ssoConfigs.map(config => (
              <Card key={config.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Key className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{config.display_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {config.provider_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.is_verified ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={checked => handleToggleSSO(config.id, checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {ssoConfigs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No SSO providers configured</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* HR Systems Tab */}
        <TabsContent value="hr" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">HR System Integrations</h3>
            <Button onClick={() => setHRDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add HR Integration
            </Button>
          </div>

          <div className="grid gap-4">
            {hrIntegrations.map(integration => (
              <Card key={integration.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{integration.display_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {integration.provider.replace('_', ' ')}
                        </p>
                        {integration.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(integration.connection_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => IntegrationService.triggerHRSync(integration.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hrIntegrations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No HR integrations configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect Workday, BambooHR, or other HR systems
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Webhook Endpoints</h3>
            <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Webhook Endpoint</DialogTitle>
                  <DialogDescription>Receive real-time event notifications</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="e.g., Enrollment Notifications"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>URL</Label>
                    <Input
                      value={newWebhook.url}
                      onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://your-app.com/webhooks"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Events</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                      {WEBHOOK_EVENTS.map(event => (
                        <label key={event} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newWebhook.events.includes(event)}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event],
                                });
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter(ev => ev !== event),
                                });
                              }
                            }}
                          />
                          {event}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Webhook className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{webhook.name}</h4>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {webhook.url}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {webhook.events.slice(0, 3).map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event.split('.')[0]}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook.id)}
                      >
                        <TestTube className="h-3 w-3" />
                      </Button>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={checked => handleToggleWebhook(webhook.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {webhooks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No webhooks configured</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Notification Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Notification Channel</DialogTitle>
                  <DialogDescription>
                    Connect Slack, Microsoft Teams, or other services
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Channel Type</Label>
                    <Select
                      value={newChannel.channel_type}
                      onValueChange={value =>
                        setNewChannel({ ...newChannel, channel_type: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={newChannel.name}
                      onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                      placeholder="e.g., Training Notifications"
                    />
                  </div>
                  {newChannel.channel_type === 'slack' && (
                    <div className="grid gap-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={newChannel.slack_webhook_url}
                        onChange={e =>
                          setNewChannel({ ...newChannel, slack_webhook_url: e.target.value })
                        }
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChannel} disabled={!newChannel.name}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {channels.map(channel => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {channel.channel_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestChannel(channel.id)}
                      >
                        <TestTube className="h-3 w-3" />
                      </Button>
                      <Switch
                        checked={channel.is_active}
                        onCheckedChange={checked => handleToggleChannel(channel.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {channels.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notification channels configured</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntegrationsDashboard;
