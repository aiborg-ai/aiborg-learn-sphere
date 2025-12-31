/**
 * EventTagsStep Component
 * Step 6: Tags for categorization and discoverability
 */

import React from 'react';
import { Tag } from '@/components/ui/icons';
import { DragDropTagManager } from '@/components/studio/shared/DragDropTagManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, EventWizardData, Tag as TagType } from '@/types/studio.types';

// Sample available tags (in real app, fetch from database)
const AVAILABLE_TAGS: TagType[] = [
  { id: '1', name: 'AI', category: 'technology' },
  { id: '2', name: 'Machine Learning', category: 'technology' },
  { id: '3', name: 'Leadership', category: 'skills' },
  { id: '4', name: 'Networking', category: 'event-type' },
  { id: '5', name: 'Professional Development', category: 'skills' },
  { id: '6', name: 'Technology', category: 'technology' },
  { id: '7', name: 'Business', category: 'business' },
  { id: '8', name: 'Innovation', category: 'business' },
  { id: '9', name: 'Workshop', category: 'event-type' },
  { id: '10', name: 'Webinar', category: 'event-type' },
  { id: '11', name: 'Training', category: 'event-type' },
  { id: '12', name: 'Digital Transformation', category: 'business' },
  { id: '13', name: 'Data Science', category: 'technology' },
  { id: '14', name: 'Cloud Computing', category: 'technology' },
  { id: '15', name: 'Team Building', category: 'skills' },
];

export function EventTagsStep({ data, onUpdate }: StepComponentProps<EventWizardData>) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Tags</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your event with tags to improve discoverability
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Tags help attendees find your event when browsing. Choose tags that best describe the
          topic, format, and target audience.
        </AlertDescription>
      </Alert>

      {/* Drag-Drop Tag Manager */}
      <div className="space-y-2">
        <div className="text-base font-medium">Event Tags</div>
        <p className="text-sm text-muted-foreground">
          Select and organize tags that best describe your event. Drag to reorder.
        </p>
        <DragDropTagManager
          availableTags={AVAILABLE_TAGS}
          selectedTags={data.tags}
          onChange={tags => onUpdate({ tags })}
          maxTags={10}
          allowCustomTags
          placeholder="Search tags or create custom ones..."
        />
      </div>

      {/* Tag Suggestions */}
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-sm mb-2">Tag Suggestions</h3>
        <p className="text-sm text-muted-foreground mb-3">Consider adding tags that describe:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Event topic and subject matter (e.g., AI, Leadership, Marketing)</li>
          <li>Target audience (e.g., Beginners, Managers, Developers)</li>
          <li>Event format (e.g., Workshop, Webinar, Conference)</li>
          <li>Industry or domain (e.g., Technology, Healthcare, Finance)</li>
          <li>Skills covered (e.g., Communication, Problem Solving, Coding)</li>
        </ul>
      </div>
    </div>
  );
}
