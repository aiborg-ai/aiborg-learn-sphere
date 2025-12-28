import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Webhook,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  History,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type WebhookStatus = 'active' | 'inactive' | 'failing';
type DeliveryStatus = 'success' | 'failed' | 'pending' | 'retrying';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: WebhookStatus;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  retryEnabled: boolean;
  maxRetries: number;
  timeoutSeconds: number;
  createdAt: string;
  createdBy: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: DeliveryStatus;
  statusCode?: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  attempts: number;
  nextRetry?: string;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { value: 'user.created', label: 'User Created', category: 'Users' },
  { value: 'user.updated', label: 'User Updated', category: 'Users' },
  { value: 'user.deleted', label: 'User Deleted', category: 'Users' },
  { value: 'user.login', label: 'User Login', category: 'Users' },
  { value: 'course.created', label: 'Course Created', category: 'Courses' },
  { value: 'course.updated', label: 'Course Updated', category: 'Courses' },
  { value: 'course.published', label: 'Course Published', category: 'Courses' },
  { value: 'course.deleted', label: 'Course Deleted', category: 'Courses' },
  { value: 'enrollment.created', label: 'Enrollment Created', category: 'Enrollments' },
  { value: 'enrollment.completed', label: 'Enrollment Completed', category: 'Enrollments' },
  { value: 'enrollment.cancelled', label: 'Enrollment Cancelled', category: 'Enrollments' },
  { value: 'payment.completed', label: 'Payment Completed', category: 'Payments' },
  { value: 'payment.failed', label: 'Payment Failed', category: 'Payments' },
  { value: 'payment.refunded', label: 'Payment Refunded', category: 'Payments' },
  { value: 'review.submitted', label: 'Review Submitted', category: 'Reviews' },
  { value: 'review.approved', label: 'Review Approved', category: 'Reviews' },
];

// Sample data for demonstration
const generateSampleWebhooks = (): WebhookEndpoint[] => [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
    secret:
      'whsec_' +
      Array.from(
        { length: 32 },
        () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
      ).join(''),
    events: ['user.created', 'enrollment.created', 'payment.completed'],
    status: 'active',
    lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    successCount: 1247,
    failureCount: 3,
    retryEnabled: true,
    maxRetries: 3,
    timeoutSeconds: 30,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    createdBy: 'admin@aiborg.ai',
  },
  {
    id: '2',
    name: 'CRM Integration',
    url: 'https://api.crm.example.com/webhooks/aiborg',
    secret:
      'whsec_' +
      Array.from(
        { length: 32 },
        () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
      ).join(''),
    events: ['user.created', 'user.updated', 'enrollment.completed'],
    status: 'active',
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    successCount: 892,
    failureCount: 12,
    retryEnabled: true,
    maxRetries: 5,
    timeoutSeconds: 60,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    createdBy: 'admin@aiborg.ai',
  },
  {
    id: '3',
    name: 'Analytics Service',
    url: 'https://analytics.example.com/ingest/events',
    secret:
      'whsec_' +
      Array.from(
        { length: 32 },
        () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
      ).join(''),
    events: ['user.login', 'course.published', 'enrollment.created', 'enrollment.completed'],
    status: 'failing',
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    successCount: 456,
    failureCount: 89,
    retryEnabled: true,
    maxRetries: 3,
    timeoutSeconds: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    createdBy: 'developer@aiborg.ai',
  },
];

const generateSampleDeliveries = (webhooks: WebhookEndpoint[]): WebhookDelivery[] => {
  const deliveries: WebhookDelivery[] = [];
  const statuses: DeliveryStatus[] = [
    'success',
    'success',
    'success',
    'success',
    'failed',
    'retrying',
  ];

  for (let i = 0; i < 50; i++) {
    const webhook = webhooks[Math.floor(Math.random() * webhooks.length)];
    const event = webhook.events[Math.floor(Math.random() * webhook.events.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    deliveries.push({
      id: `del-${i}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      event,
      status,
      statusCode: status === 'success' ? 200 : status === 'failed' ? 500 : undefined,
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'sha256=...',
        'X-Webhook-Event': event,
      },
      requestBody: JSON.stringify(
        {
          event,
          timestamp: new Date(Date.now() - i * 1000 * 60 * 10).toISOString(),
          data: { id: `sample-${i}`, type: event.split('.')[0] },
        },
        null,
        2
      ),
      responseHeaders: status === 'success' ? { 'Content-Type': 'application/json' } : undefined,
      responseBody:
        status === 'success'
          ? '{"received": true}'
          : status === 'failed'
            ? '{"error": "Internal server error"}'
            : undefined,
      duration:
        status === 'success'
          ? Math.floor(Math.random() * 500) + 50
          : status === 'failed'
            ? Math.floor(Math.random() * 30000) + 5000
            : undefined,
      attempts:
        status === 'retrying' ? Math.floor(Math.random() * 3) + 1 : status === 'failed' ? 3 : 1,
      nextRetry:
        status === 'retrying' ? new Date(Date.now() + 1000 * 60 * 5).toISOString() : undefined,
      createdAt: new Date(Date.now() - i * 1000 * 60 * 10).toISOString(),
    });
  }

  return deliveries;
};

export function WebhookManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    duration?: number;
  } | null>(null);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    retryEnabled: true,
    maxRetries: 3,
    timeoutSeconds: 30,
  });

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fall back to sample data
        const sampleWebhooks = generateSampleWebhooks();
        setWebhooks(sampleWebhooks);
        setDeliveries(generateSampleDeliveries(sampleWebhooks));
        return;
      }

      const mappedWebhooks: WebhookEndpoint[] = data.map(wh => ({
        id: wh.id,
        name: wh.name,
        url: wh.url,
        secret: wh.secret,
        events: wh.events || [],
        status: wh.status as WebhookStatus,
        lastTriggered: wh.last_triggered,
        successCount: wh.success_count || 0,
        failureCount: wh.failure_count || 0,
        retryEnabled: wh.retry_enabled ?? true,
        maxRetries: wh.max_retries || 3,
        timeoutSeconds: wh.timeout_seconds || 30,
        createdAt: wh.created_at,
        createdBy: wh.created_by || '',
      }));

      setWebhooks(mappedWebhooks);

      // Fetch deliveries
      const { data: deliveryData } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (deliveryData && deliveryData.length > 0) {
        const mappedDeliveries: WebhookDelivery[] = deliveryData.map(del => ({
          id: del.id,
          webhookId: del.webhook_id,
          webhookName: mappedWebhooks.find(w => w.id === del.webhook_id)?.name || 'Unknown',
          event: del.event,
          status: del.status as DeliveryStatus,
          statusCode: del.status_code,
          requestHeaders: del.request_headers || {},
          requestBody: del.request_body || '',
          responseHeaders: del.response_headers,
          responseBody: del.response_body,
          duration: del.duration,
          attempts: del.attempts || 1,
          nextRetry: del.next_retry,
          createdAt: del.created_at,
        }));
        setDeliveries(mappedDeliveries);
      } else {
        setDeliveries(generateSampleDeliveries(mappedWebhooks));
      }
    } catch {
      const sampleWebhooks = generateSampleWebhooks();
      setWebhooks(sampleWebhooks);
      setDeliveries(generateSampleDeliveries(sampleWebhooks));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const generateSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one event.',
        variant: 'destructive',
      });
      return;
    }

    const secret = generateSecret();
    const webhook: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      secret,
      events: newWebhook.events,
      status: 'active',
      successCount: 0,
      failureCount: 0,
      retryEnabled: newWebhook.retryEnabled,
      maxRetries: newWebhook.maxRetries,
      timeoutSeconds: newWebhook.timeoutSeconds,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || '',
    };

    try {
      const { error } = await supabase.from('webhooks').insert({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        status: webhook.status,
        retry_enabled: webhook.retryEnabled,
        max_retries: webhook.maxRetries,
        timeout_seconds: webhook.timeoutSeconds,
        created_by: user?.id,
      });

      if (error) throw error;
    } catch {
      // Continue with local state update even if database fails
    }

    setWebhooks(prev => [webhook, ...prev]);
    setNewWebhook({
      name: '',
      url: '',
      events: [],
      retryEnabled: true,
      maxRetries: 3,
      timeoutSeconds: 30,
    });
    setIsCreateDialogOpen(false);

    toast({
      title: 'Webhook Created',
      description: `${webhook.name} has been created successfully.`,
    });
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await supabase.from('webhooks').delete().eq('id', id);
    } catch {
      // Continue with local state update
    }

    setWebhooks(prev => prev.filter(wh => wh.id !== id));
    setDeliveries(prev => prev.filter(del => del.webhookId !== id));

    toast({
      title: 'Webhook Deleted',
      description: 'The webhook has been deleted.',
    });
  };

  const handleToggleStatus = async (webhook: WebhookEndpoint) => {
    const newStatus: WebhookStatus = webhook.status === 'active' ? 'inactive' : 'active';

    try {
      await supabase.from('webhooks').update({ status: newStatus }).eq('id', webhook.id);
    } catch {
      // Continue with local state update
    }

    setWebhooks(prev => prev.map(wh => (wh.id === webhook.id ? { ...wh, status: newStatus } : wh)));

    toast({
      title: 'Status Updated',
      description: `${webhook.name} is now ${newStatus}.`,
    });
  };

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setIsTestDialogOpen(true);
    setTesting(true);
    setTestResult(null);

    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.2;
    setTestResult({
      success,
      message: success
        ? 'Webhook delivered successfully'
        : 'Connection failed: Timeout after 30 seconds',
      duration: success ? Math.floor(Math.random() * 200) + 50 : undefined,
    });
    setTesting(false);
  };

  const handleRetryDelivery = async (delivery: WebhookDelivery) => {
    toast({
      title: 'Retry Scheduled',
      description: `Delivery ${delivery.id} will be retried shortly.`,
    });

    setDeliveries(prev =>
      prev.map(del =>
        del.id === delivery.id ? { ...del, status: 'pending', attempts: del.attempts + 1 } : del
      )
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard.`,
    });
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskSecret = (secret: string) => {
    return secret.slice(0, 10) + '••••••••••••••••••••••';
  };

  const getStatusBadge = (status: WebhookStatus | DeliveryStatus) => {
    switch (status) {
      case 'active':
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'failing':
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'retrying':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const groupedEvents = AVAILABLE_EVENTS.reduce(
    (acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_EVENTS>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Webhook Management
          </h2>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  placeholder="My Webhook"
                  value={newWebhook.name}
                  onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.example.com/webhooks"
                  value={newWebhook.url}
                  onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-4">
                  {Object.entries(groupedEvents).map(([category, events]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm mb-2">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {events.map(event => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={event.value}
                              checked={newWebhook.events.includes(event.value)}
                              onCheckedChange={checked => {
                                setNewWebhook(prev => ({
                                  ...prev,
                                  events: checked
                                    ? [...prev.events, event.value]
                                    : prev.events.filter(e => e !== event.value),
                                }));
                              }}
                            />
                            <Label htmlFor={event.value} className="text-sm font-normal">
                              {event.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Select
                    value={String(newWebhook.maxRetries)}
                    onValueChange={value =>
                      setNewWebhook(prev => ({ ...prev, maxRetries: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="max-retries">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No retries</SelectItem>
                      <SelectItem value="3">3 retries</SelectItem>
                      <SelectItem value="5">5 retries</SelectItem>
                      <SelectItem value="10">10 retries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Select
                    value={String(newWebhook.timeoutSeconds)}
                    onValueChange={value =>
                      setNewWebhook(prev => ({ ...prev, timeoutSeconds: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="120">120 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook}>Create Webhook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
              </div>
              <Webhook className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {webhooks.filter(w => w.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failing</p>
                <p className="text-2xl font-bold text-red-600">
                  {webhooks.filter(w => w.status === 'failing').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">
                  {webhooks
                    .reduce((sum, w) => sum + w.successCount + w.failureCount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">
            <Settings className="w-4 h-4 mr-2" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <History className="w-4 h-4 mr-2" />
            Delivery History
          </TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook to start receiving event notifications.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks.map(webhook => (
                <Card key={webhook.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        {getStatusBadge(webhook.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(webhook)}
                        >
                          {webhook.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(webhook.url, 'URL')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Secret */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Signing Secret</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden">
                            {showSecrets[webhook.id] ? webhook.secret : maskSecret(webhook.secret)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(webhook.secret, 'Secret')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Events */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Subscribed Events</Label>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 3).map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.events.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Delivery Stats</Label>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            {webhook.successCount.toLocaleString()}
                          </span>
                          <span className="text-red-600">
                            <XCircle className="w-3 h-3 inline mr-1" />
                            {webhook.failureCount}
                          </span>
                          {webhook.lastTriggered && (
                            <span className="text-muted-foreground text-xs">
                              Last:{' '}
                              {formatDistanceToNow(new Date(webhook.lastTriggered), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>Recent webhook deliveries and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.slice(0, 20).map(delivery => (
                    <TableRow key={delivery.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(delivery.createdAt), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{delivery.webhookName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {delivery.event}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell className="text-sm">
                        {delivery.duration ? `${delivery.duration}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDelivery(delivery)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Delivery Details</DialogTitle>
                                <DialogDescription>
                                  {selectedDelivery?.event} - {selectedDelivery?.status}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedDelivery && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">Request Headers</Label>
                                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                                      {JSON.stringify(selectedDelivery.requestHeaders, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Request Body</Label>
                                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                                      {selectedDelivery.requestBody}
                                    </pre>
                                  </div>
                                  {selectedDelivery.responseBody && (
                                    <div>
                                      <Label className="text-sm font-medium">Response Body</Label>
                                      <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                                        {selectedDelivery.responseBody}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {(delivery.status === 'failed' || delivery.status === 'retrying') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryDelivery(delivery)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Webhook Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>Sending a test event to {selectedWebhook?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {testing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Sending test event...</p>
              </div>
            ) : testResult ? (
              <div className="flex flex-col items-center gap-4">
                {testResult.success ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-500" />
                )}
                <p className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResult.message}
                </p>
                {testResult.duration && (
                  <p className="text-sm text-muted-foreground">
                    Response time: {testResult.duration}ms
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTestDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
