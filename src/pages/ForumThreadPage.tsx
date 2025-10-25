/**
 * ForumThreadPage Component
 * Display a thread with nested posts and real-time updates
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, MessageCircle, Bookmark, Share2, Users, Pin, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VoteButtons, PostTree, TrustLevelBadge, ModeratorToolbar } from '@/components/forum';
import { useForumThread, useForumPosts, useForumVoting, useForumModeration } from '@/hooks/forum';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export default function ForumThreadPage() {
  const { categorySlug, threadSlug } = useParams<{ categorySlug: string; threadSlug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { thread, isLoading: isLoadingThread } = useForumThread(threadSlug || '');
  const { posts, onlineUsers, createPost, isCreating } = useForumPosts(thread?.id || '');
  const { upvote, downvote } = useForumVoting('thread', thread?.id || '');
  const { isModerator, togglePin, toggleLock, deleteThread } = useForumModeration();

  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'top'>('oldest');

  // Update page title
  useEffect(() => {
    if (thread) {
      document.title = `${thread.title} - Forum`;
    }
  }, [thread]);

  const handleReply = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to reply',
        variant: 'destructive',
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a reply',
        variant: 'destructive',
      });
      return;
    }

    if (thread?.is_locked) {
      toast({
        title: 'Thread Locked',
        description: 'This thread is locked and cannot accept new replies',
        variant: 'destructive',
      });
      return;
    }

    createPost({
      thread_id: thread!.id,
      content: replyContent,
    });

    setReplyContent('');
  };

  const handlePin = () => {
    if (thread) {
      togglePin(thread.id);
    }
  };

  const handleLock = () => {
    if (thread) {
      toggleLock(thread.id);
    }
  };

  const handleDelete = () => {
    if (thread) {
      deleteThread({ threadId: thread.id, reason: 'Moderator action' });
      navigate(`/forum/${categorySlug}`);
    }
  };

  if (isLoadingThread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Thread not found.{' '}
            <Link to="/forum" className="underline">
              Return to forum
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/forum" className="hover:text-blue-600">
              Forum
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/forum/${categorySlug}`} className="hover:text-blue-600">
              {thread.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium truncate">{thread.title}</span>
          </div>

          {/* Moderator Toolbar */}
          {isModerator && (
            <ModeratorToolbar
              threadId={thread.id}
              isPinned={thread.is_pinned}
              isLocked={thread.is_locked}
              onPin={handlePin}
              onLock={handleLock}
              onDelete={handleDelete}
            />
          )}

          {/* Thread Content */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Vote Buttons */}
                <div className="flex-shrink-0">
                  <VoteButtons
                    upvotes={thread.upvote_count}
                    downvotes={thread.downvote_count}
                    userVote={thread.user_vote}
                    onUpvote={() => upvote()}
                    onDownvote={() => downvote()}
                  />
                </div>

                {/* Thread Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {thread.is_pinned && <Pin className="h-5 w-5 text-yellow-600" />}
                        {thread.is_locked && <Lock className="h-5 w-5 text-gray-500" />}
                        <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${thread.category.color}20`,
                            color: thread.category.color,
                          }}
                        >
                          {thread.category.name}
                        </Badge>

                        <span className="flex items-center gap-1">
                          <span className="font-medium">
                            {thread.user?.email?.split('@')[0] || 'User'}
                          </span>
                          {thread.user_trust_level !== undefined && (
                            <TrustLevelBadge
                              level={thread.user_trust_level}
                              showLabel={false}
                              size="sm"
                            />
                          )}
                        </span>

                        <span>•</span>

                        <span>
                          {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                        </span>

                        <span>•</span>

                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {thread.view_count} views
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Content */}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{thread.content}</ReactMarkdown>
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {thread.reply_count} replies
                      </span>
                      {onlineUsers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {onlineUsers.length} viewing
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <div className="flex gap-1">
              {(['oldest', 'newest', 'top'] as const).map(sort => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-sm text-gray-500">{posts.length} replies</span>
          </div>

          {/* Posts/Replies */}
          {posts.length > 0 && (
            <PostTree
              posts={posts}
              onMarkBestAnswer={postId => logger.log('Mark best answer:', postId)}
            />
          )}

          {/* Reply Form */}
          {user ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add a Reply</h3>
                {thread.is_locked ? (
                  <Alert>
                    <AlertDescription>
                      This thread is locked and cannot accept new replies.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Textarea
                      placeholder="Write your reply here... (Markdown supported)"
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      className="min-h-[150px] mb-4"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">You can use Markdown for formatting</p>
                      <Button onClick={handleReply} disabled={isCreating}>
                        {isCreating ? 'Posting...' : 'Post Reply'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Please{' '}
                <Link to="/auth" className="underline font-medium">
                  sign in
                </Link>{' '}
                to reply to this thread.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
