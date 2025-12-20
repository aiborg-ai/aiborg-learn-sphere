/**
 * Draggable Widget
 *
 * Widget wrapper with drag-drop and resize capabilities
 */

import { useState, useRef, useCallback, Suspense } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { GripVertical, Settings, X, Lock, Unlock, Eye, EyeOff } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardWidget, WidgetDefinition } from '@/types/dashboard';

interface DraggableWidgetProps {
  widget: DashboardWidget;
  widgetDef: WidgetDefinition;
  isEditing: boolean;
  isDragging: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onResize: (newSize: { width: number; height: number }) => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<DashboardWidget>) => void;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function DraggableWidget({
  widget,
  widgetDef,
  isEditing,
  isDragging,
  position,
  size,
  onResize,
  onRemove,
  onUpdate,
}: DraggableWidgetProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: widget.id,
    disabled: !isEditing || widget.locked || isResizing,
  });

  const WidgetComponent = widgetDef.component;

  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      if (!isEditing || widget.locked) return;

      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = { ...size };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startPosRef.current.x;
        const deltaY = moveEvent.clientY - startPosRef.current.y;

        let newWidth = startSizeRef.current.width;
        let newHeight = startSizeRef.current.height;

        // Calculate new size based on handle
        if (handle.includes('e')) {
          newWidth = startSizeRef.current.width + deltaX;
        } else if (handle.includes('w')) {
          newWidth = startSizeRef.current.width - deltaX;
        }

        if (handle.includes('s')) {
          newHeight = startSizeRef.current.height + deltaY;
        } else if (handle.includes('n')) {
          newHeight = startSizeRef.current.height - deltaY;
        }

        onResize({ width: Math.max(100, newWidth), height: Math.max(80, newHeight) });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeHandle(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isEditing, widget.locked, size, onResize]
  );

  const toggleLock = useCallback(() => {
    onUpdate({ locked: !widget.locked });
  }, [widget.locked, onUpdate]);

  const toggleVisibility = useCallback(() => {
    onUpdate({ hidden: !widget.hidden });
  }, [widget.hidden, onUpdate]);

  const style = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
    zIndex: isDragging || isResizing ? 1000 : widget.locked ? 1 : 10,
  };

  const resizeHandles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  const getHandleStyle = (handle: ResizeHandle) => {
    const base = 'absolute bg-primary hover:bg-primary/80 transition-colors';
    const size = 'w-2 h-2';

    switch (handle) {
      case 'n':
        return cn(base, 'h-1 w-16 left-1/2 -translate-x-1/2 top-0 cursor-n-resize');
      case 's':
        return cn(base, 'h-1 w-16 left-1/2 -translate-x-1/2 bottom-0 cursor-s-resize');
      case 'e':
        return cn(base, 'w-1 h-16 top-1/2 -translate-y-1/2 right-0 cursor-e-resize');
      case 'w':
        return cn(base, 'w-1 h-16 top-1/2 -translate-y-1/2 left-0 cursor-w-resize');
      case 'ne':
        return cn(base, size, 'top-0 right-0 cursor-ne-resize rounded-bl');
      case 'nw':
        return cn(base, size, 'top-0 left-0 cursor-nw-resize rounded-br');
      case 'se':
        return cn(base, size, 'bottom-0 right-0 cursor-se-resize rounded-tl');
      case 'sw':
        return cn(base, size, 'bottom-0 left-0 cursor-sw-resize rounded-tr');
      default:
        return '';
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      whileHover={!widget.locked && isEditing ? { scale: 1.02 } : {}}
    >
      <Card
        ref={containerRef}
        className={cn(
          'h-full overflow-hidden transition-all',
          isEditing && 'ring-2 ring-offset-2',
          isDragging && 'opacity-50',
          isResizing && 'ring-primary',
          widget.locked ? 'ring-muted' : 'ring-primary/20 hover:ring-primary/50'
        )}
      >
        {/* Header - only visible in edit mode */}
        {isEditing && (
          <div
            className={cn(
              'flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 border-b cursor-move',
              widget.locked && 'cursor-not-allowed opacity-50'
            )}
            {...attributes}
            {...listeners}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{widgetDef.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={toggleLock}
                title={widget.locked ? 'Unlock widget' : 'Lock widget'}
              >
                {widget.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={toggleVisibility}
                title={widget.hidden ? 'Show widget' : 'Hide widget'}
              >
                {widget.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure widget"
              >
                <Settings className="h-3 w-3" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={onRemove}
                title="Remove widget"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Widget content */}
        <div className={cn('p-4 h-full', isEditing && 'pt-2')}>
          <Suspense
            fallback={
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            }
          >
            <WidgetComponent widget={widget} isEditing={isEditing} />
          </Suspense>
        </div>

        {/* Resize handles - only in edit mode and not locked */}
        {isEditing && !widget.locked && (
          <>
            {resizeHandles.map(handle => (
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Resize handle requires absolute positioning and custom styling that button elements don't support well
              <div
                key={handle}
                role="button"
                tabIndex={0}
                aria-label={`Resize widget ${handle}`}
                className={cn(
                  getHandleStyle(handle),
                  'opacity-0 group-hover:opacity-100',
                  isResizing && resizeHandle === handle && 'opacity-100'
                )}
                onMouseDown={e => handleResizeStart(handle, e)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResizeStart(handle, e as unknown as React.MouseEvent);
                  }
                }}
              />
            ))}
          </>
        )}
      </Card>
    </motion.div>
  );
}

export default DraggableWidget;
