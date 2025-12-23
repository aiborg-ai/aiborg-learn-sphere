/**
 * SortableList Component
 *
 * A reusable drag-and-drop list component using @dnd-kit.
 * Supports vertical and horizontal sorting with optimistic updates.
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import { SortableItem } from './SortableItem';
import type { SortableListProps, SortableItemData, DragHandleProps } from './types';

export function SortableList<T extends SortableItemData>({
  items,
  onReorder,
  renderItem,
  keyExtractor = item => item.id,
  disabled = false,
  direction = 'vertical',
  className,
  isReordering = false,
}: SortableListProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [localItems, setLocalItems] = useState<T[]>(items);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync local items when props change
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Configure sensors for pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get strategy and modifier based on direction
  const strategy =
    direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy;

  const modifiers =
    direction === 'vertical' ? [restrictToVerticalAxis] : [restrictToHorizontalAxis];

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = localItems.find(i => keyExtractor(i) === event.active.id);
      setActiveItem(item || null);
    },
    [localItems, keyExtractor]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = localItems.findIndex(item => keyExtractor(item) === active.id);
      const newIndex = localItems.findIndex(item => keyExtractor(item) === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Optimistic update
      const reorderedItems = arrayMove(localItems, oldIndex, newIndex);

      // Update sort_order values
      const itemsWithNewOrder = reorderedItems.map((item, index) => ({
        ...item,
        sort_order: index,
      }));

      setLocalItems(itemsWithNewOrder);
      setIsProcessing(true);

      try {
        await onReorder(itemsWithNewOrder);
      } catch {
        // Rollback on error
        setLocalItems(items);
      } finally {
        setIsProcessing(false);
      }
    },
    [localItems, items, keyExtractor, onReorder]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
  }, []);

  const isDisabled = disabled || isReordering || isProcessing;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={modifiers}
    >
      <SortableContext
        items={localItems.map(keyExtractor)}
        strategy={strategy}
        disabled={isDisabled}
      >
        <div
          className={cn(
            direction === 'vertical' ? 'space-y-0' : 'flex gap-2',
            isDisabled && 'opacity-60 pointer-events-none',
            className
          )}
        >
          {localItems.map((item, index) => (
            <SortableItem key={keyExtractor(item)} id={keyExtractor(item)} disabled={isDisabled}>
              {(dragHandleProps: DragHandleProps) => renderItem(item, index, dragHandleProps)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeItem ? (
          <div className="shadow-lg rounded-md bg-background border">
            {renderItem(
              activeItem,
              localItems.findIndex(i => keyExtractor(i) === keyExtractor(activeItem)),
              {
                attributes: {} as Record<string, unknown>,
                listeners: undefined,
                isDragging: true,
              }
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
