/**
 * Dashboard Canvas
 *
 * Main grid canvas for dashboard builder with drag-drop support
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import type { DashboardWidget, DashboardConfig } from '@/types/dashboard';
import { DraggableWidget } from './DraggableWidget';
import { WidgetRegistry } from '@/services/dashboard/WidgetRegistry';

interface DashboardCanvasProps {
  config: DashboardConfig;
  isEditing: boolean;
  onWidgetMove?: (widgetId: string, position: { x: number; y: number }) => void;
  onWidgetResize?: (widgetId: string, size: { width: number; height: number }) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  className?: string;
}

const GRID_COLUMNS = 12;
const GRID_GAP = 16; // pixels
const MIN_CELL_HEIGHT = 80; // pixels

export function DashboardCanvas({
  config,
  isEditing,
  onWidgetMove,
  onWidgetResize,
  onWidgetRemove,
  onWidgetUpdate,
  className,
}: DashboardCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Calculate grid cell size based on container width
  const cellWidth = useMemo(() => {
    if (!containerRef) return 0;
    const containerWidth = containerRef.clientWidth;
    const totalGapWidth = GRID_GAP * (GRID_COLUMNS - 1);
    return (containerWidth - totalGapWidth) / GRID_COLUMNS;
  }, [containerRef?.clientWidth]);

  // Convert grid units to pixels
  const gridToPixels = useCallback(
    (gridUnits: number, isWidth: boolean) => {
      if (isWidth) {
        return gridUnits * cellWidth + (gridUnits - 1) * GRID_GAP;
      }
      return gridUnits * MIN_CELL_HEIGHT + (gridUnits - 1) * GRID_GAP;
    },
    [cellWidth]
  );

  // Convert pixels to grid units
  const pixelsToGrid = useCallback(
    (pixels: number, isWidth: boolean) => {
      if (isWidth) {
        return Math.round((pixels + GRID_GAP) / (cellWidth + GRID_GAP));
      }
      return Math.round((pixels + GRID_GAP) / (MIN_CELL_HEIGHT + GRID_GAP));
    },
    [cellWidth]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!onWidgetMove) {
      setActiveId(null);
      return;
    }

    const widgetId = active.id as string;
    const widget = config.widgets.find(w => w.id === widgetId);

    if (!widget) {
      setActiveId(null);
      return;
    }

    // Calculate new position in grid units
    const deltaGridX = pixelsToGrid(delta.x, true);
    const deltaGridY = pixelsToGrid(delta.y, false);

    const newX = Math.max(0, Math.min(GRID_COLUMNS - widget.size.width, widget.position.x + deltaGridX));
    const newY = Math.max(0, widget.position.y + deltaGridY);

    // Check for collisions
    const hasCollision = config.widgets.some(w => {
      if (w.id === widgetId) return false;

      return !(
        newX >= w.position.x + w.size.width ||
        newX + widget.size.width <= w.position.x ||
        newY >= w.position.y + w.size.height ||
        newY + widget.size.height <= w.position.y
      );
    });

    if (!hasCollision) {
      onWidgetMove(widgetId, { x: newX, y: newY });
    }

    setActiveId(null);
  };

  const handleResize = (widgetId: string, newSize: { width: number; height: number }) => {
    if (!onWidgetResize) return;

    const widget = config.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const widgetDef = WidgetRegistry.get(widget.type);
    if (!widgetDef) return;

    // Clamp to min/max sizes
    const clampedWidth = Math.max(
      widgetDef.minSize.width,
      Math.min(widgetDef.maxSize.width, newSize.width, GRID_COLUMNS - widget.position.x)
    );
    const clampedHeight = Math.max(
      widgetDef.minSize.height,
      Math.min(widgetDef.maxSize.height, newSize.height)
    );

    // Check for collisions with new size
    const hasCollision = config.widgets.some(w => {
      if (w.id === widgetId) return false;

      return !(
        widget.position.x >= w.position.x + w.size.width ||
        widget.position.x + clampedWidth <= w.position.x ||
        widget.position.y >= w.position.y + w.size.height ||
        widget.position.y + clampedHeight <= w.position.y
      );
    });

    if (!hasCollision) {
      onWidgetResize(widgetId, { width: clampedWidth, height: clampedHeight });
    }
  };

  // Calculate canvas height based on widgets
  const canvasHeight = useMemo(() => {
    if (config.widgets.length === 0) return 600;

    const maxY = Math.max(
      ...config.widgets.map(w => w.position.y + w.size.height)
    );

    return gridToPixels(Math.max(maxY, 8), false) + GRID_GAP;
  }, [config.widgets, gridToPixels]);

  // Get active widget for drag overlay
  const activeWidget = useMemo(
    () => config.widgets.find(w => w.id === activeId),
    [activeId, config.widgets]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div
        ref={setContainerRef}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed transition-colors',
          isEditing ? 'border-primary/30 bg-muted/5' : 'border-transparent bg-background',
          className
        )}
        style={{
          minHeight: canvasHeight,
          backgroundImage: isEditing
            ? `
              linear-gradient(to right, hsl(var(--muted)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--muted)) 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: isEditing ? `${cellWidth + GRID_GAP}px ${MIN_CELL_HEIGHT + GRID_GAP}px` : 'auto',
        }}
      >
        {config.widgets.length === 0 && isEditing && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Your canvas is empty</p>
              <p className="text-sm mt-1">Drag widgets from the palette to get started</p>
            </div>
          </div>
        )}

        {config.widgets
          .filter(w => !w.hidden)
          .map(widget => {
            const widgetDef = WidgetRegistry.get(widget.type);
            if (!widgetDef) return null;

            return (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                widgetDef={widgetDef}
                isEditing={isEditing}
                isDragging={activeId === widget.id}
                position={{
                  x: gridToPixels(widget.position.x, true),
                  y: gridToPixels(widget.position.y, false),
                }}
                size={{
                  width: gridToPixels(widget.size.width, true),
                  height: gridToPixels(widget.size.height, false),
                }}
                onResize={(newSize) => handleResize(widget.id, {
                  width: pixelsToGrid(newSize.width, true),
                  height: pixelsToGrid(newSize.height, false),
                })}
                onRemove={() => onWidgetRemove?.(widget.id)}
                onUpdate={(updates) => onWidgetUpdate?.(widget.id, updates)}
              />
            );
          })}

        {/* Drag overlay */}
        <DragOverlay>
          {activeWidget && (
            <div
              className="opacity-50 bg-background border-2 border-primary rounded-lg"
              style={{
                width: gridToPixels(activeWidget.size.width, true),
                height: gridToPixels(activeWidget.size.height, false),
              }}
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default DashboardCanvas;
