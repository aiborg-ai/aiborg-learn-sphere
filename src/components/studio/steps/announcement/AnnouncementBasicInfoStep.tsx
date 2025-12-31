/**
 * AnnouncementBasicInfoStep Component
 * Step 1: Basic announcement information - title and content
 */

import React from 'react';
import { Info } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/studio/shared/RichTextEditor';
import type { StepComponentProps, AnnouncementWizardData } from '@/types/studio.types';

export function AnnouncementBasicInfoStep({
  data,
  onUpdate,
}: StepComponentProps<AnnouncementWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create your announcement with a clear title and detailed message
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Announcements are displayed to users on their dashboard. Make your message clear and
          actionable!
        </AlertDescription>
      </Alert>

      {/* Announcement Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Announcement Title
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="e.g., New Course: AI Leadership Masterclass"
          className="text-lg"
          required
        />
        <p className="text-xs text-muted-foreground">
          Keep it concise and attention-grabbing (recommended: under 80 characters)
        </p>
      </div>

      {/* Announcement Content */}
      <RichTextEditor
        label="Announcement Content"
        value={data.content}
        onChange={content => onUpdate({ content })}
        placeholder="Write your announcement message here. You can use markdown formatting to make it more engaging..."
        minHeight={300}
        showPreview
        required
      />
    </div>
  );
}
