/**
 * SuccessDialog Component
 * Success message after publishing with action options
 */

import React from 'react';
import { CheckCircle, Plus, Eye, LayoutDashboard } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AssetType, WizardMode } from '@/types/studio.types';

interface SuccessDialogProps {
  isOpen: boolean;
  assetType: AssetType;
  assetId: string;
  mode: WizardMode;
  onCreateAnother: () => void;
  onViewAsset: () => void;
  onGoToDashboard: () => void;
}

const ASSET_LABELS: Record<AssetType, string> = {
  course: 'Course',
  event: 'Event',
  blog: 'Blog Post',
  announcement: 'Announcement',
};

const ASSET_ICONS: Record<AssetType, string> = {
  course: '📚',
  event: '🎪',
  blog: '📝',
  announcement: '📢',
};

export function SuccessDialog({
  isOpen,
  assetType,
  assetId,
  mode,
  onCreateAnother,
  onViewAsset,
  onGoToDashboard,
}: SuccessDialogProps) {
  const assetLabel = ASSET_LABELS[assetType];
  const assetIcon = ASSET_ICONS[assetType];

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {mode === 'create' ? 'Published!' : 'Updated!'}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {assetIcon} Your {assetLabel.toLowerCase()} has been{' '}
            {mode === 'create' ? 'published' : 'updated'} successfully.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            What would you like to do next?
          </p>

          {/* Create Another Button */}
          <Button
            onClick={onCreateAnother}
            className="w-full h-auto py-3 flex flex-col items-center gap-2"
            variant="default"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create Another {assetLabel}</span>
            <span className="text-xs opacity-80">
              Start a new {assetLabel.toLowerCase()} from scratch
            </span>
          </Button>

          {/* View Asset Button */}
          <Button
            onClick={onViewAsset}
            className="w-full h-auto py-3 flex flex-col items-center gap-2"
            variant="outline"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">View {assetLabel}</span>
            <span className="text-xs opacity-70">See how it looks to your audience</span>
          </Button>

          {/* Go to Dashboard Button */}
          <Button
            onClick={onGoToDashboard}
            className="w-full h-auto py-3 flex flex-col items-center gap-2"
            variant="secondary"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-semibold">Go to Admin Dashboard</span>
            <span className="text-xs opacity-70">Manage all your content</span>
          </Button>
        </div>

        {/* Asset ID for reference */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ID: <code className="bg-muted px-1 py-0.5 rounded">{assetId}</code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
