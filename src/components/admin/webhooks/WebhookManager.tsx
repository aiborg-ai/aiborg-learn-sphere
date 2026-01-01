/**
 * WebhookManager Component
 * Main component for managing webhook endpoints and viewing delivery history
 * Refactored to use smaller, focused sub-components
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Webhook,
  Settings,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { WebhookEndpoint, WebhookDelivery, WebhookStatus, DeliveryStatus } from './types';
import { useWebhookData } from './hooks/useWebhookData';
import { WebhookStats } from './components/WebhookStats';
import { WebhookForm } from './components/WebhookForm';
import { WebhookList } from './components/WebhookList';
import { WebhookTestDialog } from './components/WebhookTestDialog';
import { DeliveryHistory } from './components/DeliveryHistory';
import { DeliveryDetails } from './components/DeliveryDetails';

export function WebhookManager() {
  const { toast } = useToast();
  const {
    webhooks,
    deliveries,
    loading,
    testing,
    testResult,
    createWebhook,
    deleteWebhook,
    toggleWebhookStatus,
    testWebhook,
    retryDelivery,
  } = useWebhookData();

  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeliveryDetailsOpen, setIsDeliveryDetailsOpen] = useState(false);

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setIsTestDialogOpen(true);
    await testWebhook(webhook);
  };

  const handleViewDeliveryDetails = (delivery: WebhookDelivery) => {
    setSelectedDelivery(delivery);
    setIsDeliveryDetailsOpen(true);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard.`,
    });
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
        <WebhookForm onSubmit={createWebhook} />
      </div>

      {/* Stats Cards */}
      <WebhookStats webhooks={webhooks} />

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
                <WebhookForm onSubmit={createWebhook} />
              </CardContent>
            </Card>
          ) : (
            <WebhookList
              webhooks={webhooks}
              onTest={handleTestWebhook}
              onToggleStatus={toggleWebhookStatus}
              onDelete={deleteWebhook}
              onCopyToClipboard={handleCopyToClipboard}
              getStatusBadge={getStatusBadge}
            />
          )}
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries">
          <DeliveryHistory
            deliveries={deliveries}
            onViewDetails={handleViewDeliveryDetails}
            onRetry={retryDelivery}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Test Webhook Dialog */}
      <WebhookTestDialog
        isOpen={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        webhook={selectedWebhook}
        testing={testing}
        testResult={testResult}
      />

      {/* Delivery Details Dialog */}
      <DeliveryDetails
        isOpen={isDeliveryDetailsOpen}
        onOpenChange={setIsDeliveryDetailsOpen}
        delivery={selectedDelivery}
      />
    </div>
  );
}
