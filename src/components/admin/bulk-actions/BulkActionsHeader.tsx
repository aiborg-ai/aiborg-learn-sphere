import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function BulkActionsHeader({ onRefresh, isLoading }: BulkActionsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold">Bulk Actions</h2>
        <p className="text-muted-foreground mt-1">
          Select multiple items to perform actions in bulk
        </p>
      </div>
      <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
