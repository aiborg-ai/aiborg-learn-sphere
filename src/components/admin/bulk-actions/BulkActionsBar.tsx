import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { BulkAction } from './types';

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onActionClick: (action: BulkAction) => void;
  isProcessing: boolean;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onActionClick,
  isProcessing,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-wrap gap-2">
          {actions.map(action => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant || 'outline'}
              onClick={() => onActionClick(action)}
              disabled={isProcessing}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
