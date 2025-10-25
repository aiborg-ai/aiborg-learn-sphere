/**
 * PostCard Component
 * Display an individual forum post with actions
 */

import { useState } from 'react';
import { MessageSquare, Edit, Trash2, Flag, CheckCircle, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoteButtons } from './VoteButtons';
import { TrustLevelBadge } from './TrustLevelBadge';
import { useForumVoting } from '@/hooks/forum';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PostCardProps } from '@/types/forum';
import ReactMarkdown from 'react-markdown';

export function PostCard({
  post,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  showActions = true,
  isNested = false,
}: PostCardProps) {
  const { user } = useAuth();
  const { upvote, downvote } = useForumVoting('post', post.id);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isOwnPost = user?.id === post.user_id;

  const handleUpvote = () => {
    upvote();
    onVote?.(post.id, 'upvote');
  };

  const handleDownvote = () => {
    downvote();
    onVote?.(post.id, 'downvote');
  };

  return (
    <div className={cn('flex gap-3', isNested && 'ml-8 border-l-2 border-gray-200 pl-4')}>
      {/* Vote Buttons */}
      <div className="flex-shrink-0">
        <VoteButtons
          upvotes={post.upvote_count}
          downvotes={post.downvote_count}
          userVote={post.user_vote}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          size="sm"
        />
      </div>

      {/* Post Content */}
      <Card className="flex-1">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {post.user?.email?.split('@')[0] || 'User'}
              </span>
              {post.user_trust_level !== undefined && (
                <TrustLevelBadge level={post.user_trust_level} showLabel={false} size="sm" />
              )}
              {post.is_best_answer && (
                <Badge variant="success" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Best Answer
                </Badge>
              )}
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.is_edited && <span className="text-gray-400 text-xs">(edited)</span>}
            </div>

            {/* Actions Menu */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowReplyForm(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>

                  {isOwnPost && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(post.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}

                  {!isOwnPost && (
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}

                  {onMarkBestAnswer && !post.is_best_answer && (
                    <DropdownMenuItem onClick={() => onMarkBestAnswer(post.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Best Answer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Edit Reason */}
          {post.is_edited && post.edit_reason && (
            <p className="mt-2 text-xs text-gray-500 italic">Edit reason: {post.edit_reason}</p>
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600"
              onClick={() => {
                setShowReplyForm(!showReplyForm);
                onReply?.(post.id);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>

            {(post.replies?.length || 0) > 0 && (
              <span className="text-sm text-gray-500">
                {post.replies?.length} {post.replies?.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Reply Form (simple placeholder for now) */}
          {showReplyForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Reply form will appear here</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
