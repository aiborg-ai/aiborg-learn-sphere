/**
 * PostTree Component
 * Recursive component for displaying nested forum posts
 */

import { PostCard } from './PostCard';
import type { ForumPostWithDetails } from '@/types/forum';

interface PostTreeProps {
  posts: ForumPostWithDetails[];
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onReply?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onMarkBestAnswer?: (postId: string) => void;
  maxDepth?: number;
  currentDepth?: number;
}

export function PostTree({
  posts,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  maxDepth = 10,
  currentDepth = 0,
}: PostTreeProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div key={post.id}>
          <PostCard
            post={post}
            onVote={onVote}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkBestAnswer={onMarkBestAnswer}
            isNested={currentDepth > 0}
          />

          {/* Recursive rendering of replies */}
          {post.replies && post.replies.length > 0 && currentDepth < maxDepth && (
            <div className="mt-4">
              <PostTree
                posts={post.replies}
                onVote={onVote}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkBestAnswer={onMarkBestAnswer}
                maxDepth={maxDepth}
                currentDepth={currentDepth + 1}
              />
            </div>
          )}

          {/* Show "Load more replies" if max depth reached */}
          {post.replies && post.replies.length > 0 && currentDepth >= maxDepth && (
            <div className="ml-12 mt-2">
              <button className="text-sm text-blue-600 hover:underline">
                Continue this thread ({post.replies.length} more{' '}
                {post.replies.length === 1 ? 'reply' : 'replies'})
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
