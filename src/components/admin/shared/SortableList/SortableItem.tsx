/**
 * SortableItem Component
 *
 * Wrapper component for individual sortable items using @dnd-kit.
 * Provides drag handle props and visual feedback during drag.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { SortableItemProps, DragHandleProps } from './types';

interface SortableItemInternalProps extends Omit<SortableItemProps, 'children'> {
  children: (dragHandleProps: DragHandleProps) => React.ReactNode;
}

export function SortableItem({
  id,
  isOverlay = false,
  disabled = false,
  children,
  className,
}: SortableItemInternalProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const dragHandleProps: DragHandleProps = {
    attributes,
    listeners,
    isDragging,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && !isOverlay && 'z-10',
        isOverlay && 'shadow-lg rounded-md',
        className
      )}
    >
      {children(dragHandleProps)}
    </div>
  );
}

/**
 * DragHandle Component
 *
 * A simple drag handle button that can be used within sortable items.
 * Apply the attributes and listeners from dragHandleProps to enable dragging.
 */
interface DragHandleComponentProps {
  dragHandleProps: DragHandleProps;
  className?: string;
  children?: React.ReactNode;
}

export function DragHandle({ dragHandleProps, className, children }: DragHandleComponentProps) {
  const { attributes, listeners, isDragging } = dragHandleProps;

  return (
    <div
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'cursor-grabbing',
        className
      )}
    >
      {children}
    </div>
  );
}
