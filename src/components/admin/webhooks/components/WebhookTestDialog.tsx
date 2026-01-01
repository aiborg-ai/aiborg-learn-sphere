/**
 * WebhookTestDialog Component
 * Dialog for testing webhook endpoints
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { WebhookEndpoint } from '../types';

interface TestResult {
  success: boolean;
  message: string;
  duration?: number;
}

interface WebhookTestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: WebhookEndpoint | null;
  testing: boolean;
  testResult: TestResult | null;
}

export function WebhookTestDialog({
  isOpen,
  onOpenChange,
  webhook,
  testing,
  testResult,
}: WebhookTestDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>Sending a test event to {webhook?.name}</DialogDescription>
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
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
