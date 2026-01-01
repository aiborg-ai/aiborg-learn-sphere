/**
 * DeliveryHistory Component
 * Displays webhook delivery history and logs
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { WebhookDelivery } from '../types';

interface DeliveryHistoryProps {
  deliveries: WebhookDelivery[];
  onViewDetails: (delivery: WebhookDelivery) => void;
  onRetry: (delivery: WebhookDelivery) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function DeliveryHistory({
  deliveries,
  onViewDetails,
  onRetry,
  getStatusBadge,
}: DeliveryHistoryProps) {
  return (
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
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(delivery)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(delivery.status === 'failed' || delivery.status === 'retrying') && (
                      <Button variant="ghost" size="sm" onClick={() => onRetry(delivery)}>
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
  );
}
