/**
 * DeliveryDetails Component
 * Shows detailed information about a webhook delivery
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { WebhookDelivery } from '../types';

interface DeliveryDetailsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: WebhookDelivery | null;
}

export function DeliveryDetails({ isOpen, onOpenChange, delivery }: DeliveryDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogDescription>
            {delivery?.event} - {delivery?.status}
          </DialogDescription>
        </DialogHeader>
        {delivery && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Request Headers</Label>
              <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(delivery.requestHeaders, null, 2)}
              </pre>
            </div>
            <div>
              <Label className="text-sm font-medium">Request Body</Label>
              <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                {delivery.requestBody}
              </pre>
            </div>
            {delivery.responseBody && (
              <div>
                <Label className="text-sm font-medium">Response Body</Label>
                <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-x-auto">
                  {delivery.responseBody}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
