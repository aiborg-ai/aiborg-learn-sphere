import { useState } from 'react';

export function useBulkSelection() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean, items: { id: string }[]) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  return {
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
  };
}
