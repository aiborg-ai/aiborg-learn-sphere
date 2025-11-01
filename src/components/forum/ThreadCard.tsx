/**
 * ThreadCard Component
 * Display a forum thread in list view
 */

import { Link } from 'react-router-dom';
import { MessageCircle, Eye, Pin, Lock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoteButtons } from './VoteButtons';
import { TrustLevelBadge } from './TrustLevelBadge';
import { useForumVoting } from '@/hooks/forum';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ThreadCardProps } from '@/types/forum';

export function ThreadCard({
  thread,
  onVote,
  onBookmark: _onBookmark,
  showCategory = true,
  compact = false,
}: ThreadCardProps) {
  const { upvote, downvote } = useForumVoting('thread', thread.id);

  const handleUpvote = () => {
    upvote();
    onVote?.(thread.id, 'upvote');
  };

  const handleDownvote = () => {
    downvote();
    onVote?.(thread.id, 'downvote');
  };

  return (
    <Card
      className={cn(
        'group hover:shadow-md transition-shadow',
        thread.is_pinned && 'border-l-4 border-l-yellow-500'
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Vote Buttons */}
          <div className="flex-shrink-0">
            <VoteButtons
              upvotes={thread.upvote_count}
              downvotes={thread.downvote_count}
              userVote={thread.user_vote}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              size={compact ? 'sm' : 'md'}
            />
          </div>

          {/* Thread Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
              {thread.is_pinned && <Pin className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-1" />}
              {thread.is_locked && <Lock className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />}
              <Link
                to={`/forum/${thread.category.slug}/${thread.slug || thread.id}`}
                className="flex-1"
              >
                <h3
                  className={cn(
                    'font-semibold text-gray-900 group-hover:text-blue-600 transition-colors',
                    compact ? 'text-base' : 'text-lg'
                  )}
                >
                  {thread.title}
                </h3>
              </Link>
              {thread.has_best_answer && (
                <Badge variant="success" className="flex-shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {showCategory && thread.category && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${thread.category.color}20`,
                    color: thread.category.color,
                  }}
                >
                  {thread.category.name}
                </Badge>
              )}

              <span className="flex items-center gap-1">
                <span className="font-medium">{thread.user?.email?.split('@')[0] || 'User'}</span>
                {thread.user_trust_level !== undefined && (
                  <TrustLevelBadge level={thread.user_trust_level} showLabel={false} size="sm" />
                )}
              </span>

              <span>•</span>

              <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>

              {!compact && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {thread.view_count}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {thread.reply_count}
                  </span>
                </>
              )}
            </div>

            {/* Preview (for non-compact) */}
            {!compact && thread.content && (
              <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                {thread.content.substring(0, 200)}
                {thread.content.length > 200 && '...'}
              </p>
            )}

            {/* Stats (compact mode) */}
            {compact && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {thread.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {thread.reply_count}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
