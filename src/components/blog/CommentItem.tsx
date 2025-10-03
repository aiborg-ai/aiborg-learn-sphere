import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import type { BlogComment } from '@/types/blog';
import { ReplyForm } from './ReplyForm';
import { EditCommentForm } from './EditCommentForm';

interface CommentItemProps {
  comment: BlogComment;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  depth?: number;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  depth = 0
}: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);

  const isAuthor = user?.id === comment.user_id;
  const maxDepth = 3; // Limit nesting depth

  const handleLike = async () => {
    if (!onLike || !user) return;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await onLike(comment.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
    }
  };

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDelete(comment.id);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-12 border-l-2 border-secondary/20 pl-4' : ''}`}>
      <div className="flex gap-3 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user_avatar || undefined} />
          <AvatarFallback>
            {comment.user_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{comment.user_name || 'Anonymous'}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {showEditForm ? (
            <EditCommentForm
              initialContent={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setShowEditForm(false)}
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none mb-2">
              <p className="text-foreground/90">{comment.content}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!user}
              className="h-8 px-2"
            >
              <Heart
                className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`}
              />
              {likeCount > 0 && likeCount}
            </Button>

            {user && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-8 px-2"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}

            {isAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="h-8 px-2"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-4">
              <ReplyForm
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}