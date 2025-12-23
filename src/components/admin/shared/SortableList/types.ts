/**
 * Type definitions for the SortableList component
 */

import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

/**
 * Base interface for sortable items - must have id and sort_order
 */
export interface SortableItemData {
  id: string;
  sort_order: number;
}

/**
 * Props passed to the drag handle in render function
 */
export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
}

/**
 * Props for the SortableList component
 */
export interface SortableListProps<T extends SortableItemData> {
  /** Array of items to render in sortable list */
  items: T[];
  /** Callback when items are reordered - receives new order with updated sort_order values */
  onReorder: (items: T[]) => Promise<void>;
  /** Render function for each item - receives item, index, and drag handle props */
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  /** Optional function to extract unique key from item (defaults to item.id) */
  keyExtractor?: (item: T) => string;
  /** Disable drag-drop functionality */
  disabled?: boolean;
  /** Sort direction - vertical (default) or horizontal */
  direction?: 'vertical' | 'horizontal';
  /** Additional class name for the container */
  className?: string;
  /** Show loading state during reorder */
  isReordering?: boolean;
}

/**
 * Props for the SortableItem wrapper component
 */
export interface SortableItemProps {
  /** Unique identifier for the item */
  id: string;
  /** Whether this item is being rendered as drag overlay */
  isOverlay?: boolean;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Content to render */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Payload for batch reorder operations
 */
export interface ReorderPayload {
  id: string;
  sort_order: number;
}
