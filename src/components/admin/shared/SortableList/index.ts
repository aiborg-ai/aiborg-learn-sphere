/**
 * SortableList - Reusable drag-and-drop list components
 *
 * Usage:
 * ```tsx
 * import { SortableList, DragHandle } from '@/components/admin/shared/SortableList';
 * import { GripVertical } from '@/components/ui/icons';
 *
 * <SortableList
 *   items={lessons}
 *   onReorder={handleReorder}
 *   renderItem={(item, index, dragHandleProps) => (
 *     <div className="flex items-center gap-2 p-2 border rounded">
 *       <DragHandle dragHandleProps={dragHandleProps}>
 *         <GripVertical className="w-4 h-4 text-muted-foreground" />
 *       </DragHandle>
 *       <span>{item.title}</span>
 *     </div>
 *   )}
 * />
 * ```
 */

export { SortableList } from './SortableList';
export { SortableItem, DragHandle } from './SortableItem';
export type {
  SortableItemData,
  SortableListProps,
  SortableItemProps,
  DragHandleProps,
  ReorderPayload,
} from './types';
