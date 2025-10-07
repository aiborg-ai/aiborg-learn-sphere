import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BulkActionsHeader } from './bulk-actions/BulkActionsHeader';
import { BulkActionsFilters } from './bulk-actions/BulkActionsFilters';
import { BulkActionsBar } from './bulk-actions/BulkActionsBar';
import { BulkActionsTable } from './bulk-actions/BulkActionsTable';
import { ConfirmationDialog } from './bulk-actions/ConfirmationDialog';
import { useBulkItems } from './bulk-actions/hooks/useBulkItems';
import { useBulkSelection } from './bulk-actions/hooks/useBulkSelection';
import { useBulkActions } from './bulk-actions/hooks/useBulkActions';
import { createBulkActions } from './bulk-actions/actions/bulkActionDefinitions';
import type { FilterType } from './bulk-actions/types';

export function BulkActions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Custom hooks
  const { items, isLoading, fetchItems } = useBulkItems({
    filterCategory,
    filterStatus,
    filterType,
  });

  const { selectedItems, handleSelectAll, handleSelectItem, clearSelection } = useBulkSelection();

  const {
    isProcessing,
    showConfirmDialog,
    pendingAction,
    handleBulkAction,
    handleConfirmAction,
    handleCancelAction,
  } = useBulkActions({ items, selectedItems, clearSelection });

  // Create bulk actions with dependencies
  const bulkActions = useMemo(() => createBulkActions(toast, fetchItems), [toast, fetchItems]);

  // Apply search filter
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchMatch =
        searchTerm === '' ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    });
  }, [items, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BulkActionsHeader onRefresh={fetchItems} isLoading={isLoading} />

      <BulkActionsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onTypeChange={setFilterType}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
      />

      <BulkActionsBar
        selectedCount={selectedItems.size}
        actions={bulkActions}
        onActionClick={handleBulkAction}
        isProcessing={isProcessing}
      />

      <BulkActionsTable
        items={filteredItems}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={checked => handleSelectAll(checked, filteredItems)}
      />

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        action={pendingAction}
        selectedCount={selectedItems.size}
        isProcessing={isProcessing}
      />
    </div>
  );
}
