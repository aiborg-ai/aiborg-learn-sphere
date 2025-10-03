import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { logger } from '@/utils/logger';
interface EditCommentFormProps {
  initialContent: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function EditCommentForm({ initialContent, onSubmit, onCancel }: EditCommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || content === initialContent) {
      onCancel();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content);
    } catch (error) {
      logger.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 my-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || content === initialContent || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}