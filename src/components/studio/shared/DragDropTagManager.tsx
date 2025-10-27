/**
 * DragDropTagManager Component
 * Drag and drop interface for managing tags/keywords
 */

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/studio.types';

interface DragDropTagManagerProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  maxTags?: number;
  allowCustomTags?: boolean;
  placeholder?: string;
  className?: string;
}

// Sortable Tag Item Component
function SortableTagItem({
  tag,
  onRemove,
  isOverlay,
}: {
  tag: Tag;
  onRemove?: () => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 bg-background border rounded-md group',
        !isOverlay && 'hover:border-primary/50 transition-colors',
        isOverlay && 'shadow-lg'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <Badge variant="secondary" className="flex-1">
        <TagIcon className="w-3 h-3 mr-1" />
        {tag.name}
      </Badge>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// Available Tag Item (not sortable, just draggable)
function AvailableTagItem({ tag, onClick }: { tag: Tag; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="justify-start h-auto py-2">
      <TagIcon className="w-3 h-3 mr-2" />
      {tag.name}
    </Button>
  );
}

export function DragDropTagManager({
  availableTags,
  selectedTags,
  onChange,
  maxTags,
  allowCustomTags = true,
  placeholder = 'Search or create tags...',
  className,
}: DragDropTagManagerProps) {
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter available tags (exclude already selected)
  const filteredAvailableTags = availableTags.filter(
    tag =>
      !selectedTags.find(t => t.id === tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const tag = selectedTags.find(t => t.id === event.active.id);
    setActiveTag(tag || null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedTags.findIndex(tag => tag.id === active.id);
      const newIndex = selectedTags.findIndex(tag => tag.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(selectedTags, oldIndex, newIndex));
      }
    }

    setActiveTag(null);
  };

  // Add tag from available list
  const handleAddTag = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return;
    }
    if (!selectedTags.find(t => t.id === tag.id)) {
      onChange([...selectedTags, tag]);
    }
  };

  // Remove tag from selected
  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId));
  };

  // Create new custom tag
  const handleCreateTag = () => {
    if (!newTagName.trim() || !allowCustomTags) return;

    const newTag: Tag = {
      id: `custom-${Date.now()}`,
      name: newTagName.trim(),
      category: 'custom',
    };

    handleAddTag(newTag);
    setNewTagName('');
    setSearchQuery('');
  };

  const canAddMore = !maxTags || selectedTags.length < maxTags;

  return (
    <div className={cn('space-y-4', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Available Tags Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Tags</CardTitle>
              <CardDescription>Click to add or search for tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search Input */}
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full"
              />

              {/* Create Custom Tag */}
              {allowCustomTags && searchQuery && (
                <div className="flex gap-2">
                  <Input
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <Button onClick={handleCreateTag} size="sm" disabled={!newTagName.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Available Tags List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAvailableTags.length > 0 ? (
                  filteredAvailableTags.map(tag => (
                    <AvailableTagItem key={tag.id} tag={tag} onClick={() => handleAddTag(tag)} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? 'No tags found' : 'No available tags'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Tags Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Selected Tags</CardTitle>
                  <CardDescription>Drag to reorder, click X to remove</CardDescription>
                </div>
                {maxTags && (
                  <Badge variant={selectedTags.length >= maxTags ? 'destructive' : 'secondary'}>
                    {selectedTags.length}/{maxTags}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedTags.length > 0 ? (
                <SortableContext
                  items={selectedTags.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedTags.map(tag => (
                      <SortableTagItem
                        key={tag.id}
                        tag={tag}
                        onRemove={() => handleRemoveTag(tag.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TagIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tags selected</p>
                  <p className="text-xs">Click tags from the left to add them</p>
                </div>
              )}

              {!canAddMore && <p className="text-xs text-destructive mt-2">Maximum tags reached</p>}
            </CardContent>
          </Card>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTag ? <SortableTagItem tag={activeTag} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        <strong>Tip:</strong> Drag selected tags to reorder them. The order will be preserved when
        published.
      </div>
    </div>
  );
}
