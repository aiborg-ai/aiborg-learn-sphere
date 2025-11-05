/**
 * Publish Success Modal
 *
 * Shown after successful blog post creation
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postSlug: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduledFor?: string;
}

export function PublishSuccessModal({
  isOpen,
  onClose,
  postId,
  postSlug,
  status,
  scheduledFor,
}: PublishSuccessModalProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'draft':
        return {
          title: 'Draft Saved Successfully!',
          description:
            'Your blog post has been saved as a draft. You can publish it anytime from the Blog Manager.',
        };
      case 'published':
        return {
          title: 'Blog Post Published!',
          description: 'Your blog post is now live and visible to readers.',
        };
      case 'scheduled':
        return {
          title: 'Blog Post Scheduled!',
          description: `Your blog post will be published on ${new Date(scheduledFor!).toLocaleString()}.`,
        };
      default:
        return {
          title: 'Success!',
          description: 'Your blog post has been created.',
        };
    }
  };

  const { title, description } = getStatusMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* Post Details */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Post ID</p>
            <p className="text-sm font-mono">{postId}</p>
            {postSlug && (
              <>
                <p className="text-sm font-medium text-muted-foreground mb-1 mt-2">Slug</p>
                <p className="text-sm font-mono">{postSlug}</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            {status === 'published' && (
              <Button asChild variant="default" className="w-full">
                <Link to={`/blog/${postSlug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Published Post
                </Link>
              </Button>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog Manager
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                window.location.reload();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Another Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
