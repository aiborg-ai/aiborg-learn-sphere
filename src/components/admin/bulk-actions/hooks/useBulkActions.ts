import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import type { BulkAction, BulkItem } from '../types';

interface UseBulkActionsProps {
  items: BulkItem[];
  selectedItems: Set<string>;
  clearSelection: () => void;
}

export function useBulkActions({ items, selectedItems, clearSelection }: UseBulkActionsProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const handleBulkAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      await executeBulkAction(action);
    }
  };

  const executeBulkAction = async (action: BulkAction) => {
    try {
      setIsProcessing(true);
      const selectedItemsArray = items.filter(item => selectedItems.has(item.id));
      await action.action(selectedItemsArray);
      clearSelection();
    } catch (_error) {
      logger.error('Bulk action _error:', _error);
      toast({
        title: 'Action Failed',
        description: 'Failed to complete bulk action',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      executeBulkAction(pendingAction);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  return {
    isProcessing,
    showConfirmDialog,
    pendingAction,
    handleBulkAction,
    handleConfirmAction,
    handleCancelAction,
  };
}
