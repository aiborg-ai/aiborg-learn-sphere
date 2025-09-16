import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog/BlogService';
import { BlogComment } from '@/types/blog';
import { RequireAuth } from './RequireAuth';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await BlogService.getPostComments(postId);
      // Count all comments including nested replies
      const countAllComments = (comments: BlogComment[]): number => {
        let total = 0;
        comments.forEach(comment => {
          total += 1;
          if (comment.replies && comment.replies.length > 0) {
            total += countAllComments(comment.replies);
          }
        });
        return total;
      };

      setComments(data);
      const totalCount = countAllComments(data);
      setCommentCount(totalCount);

      // Notify parent component of count change
      if (onCommentCountChange) {
        onCommentCountChange(totalCount);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time comments
  useEffect(() => {
    loadComments();

    // Set up real-time subscription
    const channel = supabase
      .channel(`blog_comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('Comment change:', payload);
          // Reload comments when there's a change
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const handleAddComment = async (content: string) => {
    try {
      const newComment = await BlogService.createComment(postId, content);

      // Optimistically add to UI
      setComments([...comments, { ...newComment, replies: [] }]);
      const newCount = commentCount + 1;
      setCommentCount(newCount);

      // Notify parent component
      if (onCommentCountChange) {
        onCommentCountChange(newCount);
      }

      toast({
        title: "Success",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
      // Reload to sync state
      loadComments();
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      await BlogService.createComment(postId, content, parentId);

      toast({
        title: "Success",
        description: "Your reply has been posted.",
      });

      // Reload comments to show the new reply
      loadComments();
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await BlogService.updateComment(commentId, content);

      toast({
        title: "Success",
        description: "Your comment has been updated.",
      });

      // Reload comments to show the update
      loadComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await BlogService.deleteComment(commentId);

      toast({
        title: "Success",
        description: "Your comment has been deleted.",
      });

      // Remove from UI optimistically
      const removeComment = (comments: BlogComment[]): BlogComment[] => {
        return comments
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeComment(c.replies) : []
          }));
      };

      setComments(removeComment(comments));
      const newCount = Math.max(0, commentCount - 1);
      setCommentCount(newCount);

      // Notify parent component
      if (onCommentCountChange) {
        onCommentCountChange(newCount);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
      // Reload to sync state
      loadComments();
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // This would need to be implemented in BlogService
    console.log('Like comment:', commentId);
    toast({
      title: "Info",
      description: "Comment likes coming soon!",
    });
  };

  if (loading) {
    return (
      <section id="comments" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <MessageCircle className="h-6 w-6 mr-2" />
          Comments
        </h2>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </section>
    );
  }

  return (
    <section id="comments" className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <MessageCircle className="h-6 w-6 mr-2" />
          Comments ({commentCount})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadComments}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <RequireAuth fallbackMessage="Sign in to join the discussion">
          <CommentForm onSubmit={handleAddComment} />
        </RequireAuth>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="bg-secondary/10 rounded-lg p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">No comments yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}