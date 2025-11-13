import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { blogSchemas } from '@/lib/validation-schemas';
import { logger } from '@/utils/logger';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

type CommentFormData = {
  content: string;
};

export function CommentForm({ onSubmit, placeholder = 'Write a comment...' }: CommentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(blogSchemas.createComment),
  });

  const onSubmitForm = async (data: CommentFormData) => {
    try {
      await onSubmit(data.content);
      reset();
    } catch (error) {
      logger.error('Failed to post comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <Textarea
          {...register('content')}
          placeholder={placeholder}
          className="min-h-[100px] resize-none"
          disabled={isSubmitting}
        />
        {errors.content && (
          <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
