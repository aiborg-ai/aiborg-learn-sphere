import { useParams, Link } from 'react-router-dom';
import { useBlogPost } from '@/hooks/blog/useBlogPosts';
import { useBlogLike, useBlogBookmark, useBlogShare } from '@/hooks/blog/useBlogEngagement';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link as LinkIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { post, loading, error } = useBlogPost(slug || '');

  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useBlogLike(
    post?.id || '',
    post?.is_liked,
    post?.like_count || 0
  );

  const { isBookmarked, toggleBookmark, loading: bookmarkLoading } = useBlogBookmark(
    post?.id || '',
    post?.is_bookmarked
  );

  const postUrl = window.location.href;
  const { share } = useBlogShare(post?.id || '', post?.title || '', postUrl);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="aspect-video mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category_name && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: post.category_color + '20',
                  color: post.category_color,
                }}
              >
                {post.category_name}
              </Badge>
            )}
            {post.tags?.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}

          {/* Author and metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author_avatar || undefined} />
                <AvatarFallback>{post.author_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.author_name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {post.published_at ? formatDate(post.published_at) : 'Draft'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.reading_time} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.view_count || 0} views
                  </span>
                </div>
              </div>
            </div>

            {/* Engagement buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={toggleLike}
                disabled={likeLoading}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button
                variant={isBookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => share('twitter')}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => share('facebook')}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => share('linkedin')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => share('email')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => share('copy_link')}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <Separator className="mb-8" />

        {/* Featured Image */}
        {post.featured_image && (
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator className="mb-8" />

        {/* Author Bio */}
        {post.author_bio && (
          <div className="bg-secondary/20 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={post.author_avatar || undefined} />
                <AvatarFallback>{post.author_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg mb-2">About {post.author_name}</h3>
                <p className="text-muted-foreground">{post.author_bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div className="bg-card rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                onClick={toggleLike}
                disabled={likeLoading}
              >
                <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'} ({likeCount})
              </Button>
              <Button variant="outline" asChild>
                <a href="#comments">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments ({post.comment_count || 0})
                </a>
              </Button>
              <Button
                variant={isBookmarked ? 'default' : 'outline'}
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
              >
                <Bookmark className={`h-5 w-5 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => share('twitter')}>
                  <Twitter className="h-4 w-4 mr-2" />
                  Share on Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => share('facebook')}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => share('linkedin')}>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Share on LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => share('whatsapp')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => share('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => share('copy_link')}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comments Section - Placeholder */}
        <section id="comments" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Comments feature coming soon!</p>
            <p className="text-sm mt-2">
              Join the discussion once we launch our comment system.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}