import React, { useState, useMemo } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useToast } from '@/hooks/use-toast';
import type { BookmarkType, CreateBookmarkInput } from '@/types/content-access';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ActionButton, ActionButtonConfig } from '@/components/shared/ActionButton';

interface BookmarkButtonProps {
  type: BookmarkType;
  contentId: string;
  title: string;
  courseId?: number;
  metadata?: Record<string, unknown>;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function BookmarkButton({
  type,
  contentId,
  title: defaultTitle,
  courseId,
  metadata = {},
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
}: BookmarkButtonProps) {
  const { toast } = useToast();
  const { createBookmark, deleteBookmark, isBookmarked, getBookmark } = useBookmarks();

  const [showDialog, setShowDialog] = useState(false);
  const [customTitle, setCustomTitle] = useState(defaultTitle);
  const [note, setNote] = useState('');
  const [folder, setFolder] = useState('default');
  const [tags, setTags] = useState('');

  const bookmarked = isBookmarked(contentId, type);
  const existingBookmark = getBookmark(contentId, type);

  // Define button configuration
  const config: ActionButtonConfig = useMemo(
    () => ({
      defaultIcon: Bookmark,
      activeIcon: BookmarkCheck,
      defaultLabel: 'Bookmark',
      activeLabel: 'Bookmarked',
      defaultTitle: 'Add bookmark',
      activeTitle: 'Remove bookmark',
      activeColorClass: 'text-yellow-500 hover:text-yellow-600',
    }),
    []
  );

  const handleQuickBookmark = async () => {
    if (bookmarked && existingBookmark) {
      // Remove bookmark
      try {
        await deleteBookmark(existingBookmark.id);
        toast({
          title: 'Bookmark Removed',
          description: 'This item has been removed from your bookmarks',
        });
      } catch (_error) {
        toast({
          title: 'Error',
          description: 'Failed to remove bookmark',
          variant: 'destructive',
        });
      }
    } else {
      // Show dialog to add bookmark with details
      setShowDialog(true);
    }
  };

  const handleSaveBookmark = async () => {
    try {
      const input: CreateBookmarkInput = {
        bookmark_type: type,
        title: customTitle,
        note: note || undefined,
        folder: folder || 'default',
        tags: tags
          ? tags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
        metadata,
      };

      // Set the appropriate content ID based on type
      switch (type) {
        case 'course':
          input.course_id = parseInt(contentId);
          break;
        case 'material':
        case 'video_timestamp':
        case 'pdf_page':
          input.material_id = contentId;
          break;
        case 'assignment':
          input.assignment_id = contentId;
          break;
      }

      await createBookmark(input);

      toast({
        title: 'Bookmark Added',
        description: 'This item has been added to your bookmarks',
      });

      setShowDialog(false);
      resetForm();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to add bookmark',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setCustomTitle(defaultTitle);
    setNote('');
    setFolder('default');
    setTags('');
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    resetForm();
  };

  return (
    <>
      <ActionButton
        config={config}
        isActive={bookmarked}
        onClick={handleQuickBookmark}
        variant={variant}
        size={size}
        className={className}
        showLabel={showLabel}
      />

      {/* Add Bookmark Dialog */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
            <DialogDescription>
              Save this {type} to your bookmarks for quick access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Bookmark title"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note about why you bookmarked this..."
                rows={3}
              />
            </div>

            {/* Folder */}
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Input
                id="folder"
                value={folder}
                onChange={e => setFolder(e.target.value)}
                placeholder="default"
              />
              <p className="text-xs text-muted-foreground">Organize bookmarks into folders</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="important, review, exam-prep"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tags for easy filtering
              </p>
            </div>

            {/* Metadata Preview */}
            {Object.keys(metadata).length > 0 && (
              <div className="space-y-2">
                <Label>Additional Info</Label>
                <div className="flex flex-wrap gap-2">
                  {metadata.timestamp && (
                    <Badge variant="secondary" className="text-xs">
                      Timestamp: {Math.floor((metadata.timestamp as number) / 60)}:
                      {String(Math.floor((metadata.timestamp as number) % 60)).padStart(2, '0')}
                    </Badge>
                  )}
                  {metadata.page && (
                    <Badge variant="secondary" className="text-xs">
                      Page {metadata.page}
                    </Badge>
                  )}
                  {courseId && (
                    <Badge variant="secondary" className="text-xs">
                      Course ID: {courseId}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveBookmark} disabled={!customTitle.trim()}>
              <Bookmark className="h-4 w-4 mr-2" />
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
