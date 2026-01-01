/**
 * WebhookStats Component
 * Displays statistics cards for webhook overview
 */

import { Card, CardContent } from '@/components/ui/card';
import { Webhook, CheckCircle2, AlertCircle, History } from 'lucide-react';
import type { WebhookEndpoint } from '../types';

interface WebhookStatsProps {
  webhooks: WebhookEndpoint[];
}

export function WebhookStats({ webhooks }: WebhookStatsProps) {
  const activeCount = webhooks.filter(w => w.status === 'active').length;
  const failingCount = webhooks.filter(w => w.status === 'failing').length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.successCount + w.failureCount, 0);

  return (
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
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
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
              <p className="text-2xl font-bold text-red-600">{failingCount}</p>
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
              <p className="text-2xl font-bold">{totalDeliveries.toLocaleString()}</p>
            </div>
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
