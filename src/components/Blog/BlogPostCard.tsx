import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, Eye, Heart, MessageCircle } from '@/components/ui/icons';
import type { BlogPost } from '@/types/blog';
import { CardImage } from '@/components/shared/OptimizedImage';

interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
}

/**
 * BlogPostCard - Displays blog post summary with metadata
 *
 * Memoized for performance when rendering lists of blog posts
 */
export const BlogPostCard = memo(function BlogPostCard({
  post,
  variant = 'default',
}: BlogPostCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
        <Link to={`/blog/${post.slug}`}>
          {post.featured_image && (
            <div className="aspect-[16/9] overflow-hidden">
              <CardImage
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </Link>
        <CardHeader className="space-y-4">
          {post.category_name && (
            <Badge
              variant="secondary"
              style={{ backgroundColor: post.category_color + '20', color: post.category_color }}
            >
              {post.category_name}
            </Badge>
          )}
          <Link to={`/blog/${post.slug}`}>
            <h2 className="text-2xl font-bold hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h2>
          </Link>
          {post.excerpt && <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_avatar || undefined} />
              <AvatarFallback>{post.author_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.author_name}</p>
              <p className="text-sm text-muted-foreground">
                {post.published_at ? formatDate(post.published_at) : 'Draft'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.view_count || 0} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.like_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comment_count || 0}
            </span>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <Link to={`/blog/${post.slug}`} className="flex gap-4 p-4">
          {post.featured_image && (
            <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md">
              <CardImage
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {post.published_at ? formatDate(post.published_at) : 'Draft'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time} min
              </span>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link to={`/blog/${post.slug}`}>
        {post.featured_image && (
          <div className="aspect-video overflow-hidden">
            <CardImage
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </Link>
      <CardHeader className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {post.category_name && (
            <Badge
              variant="outline"
              style={{ borderColor: post.category_color, color: post.category_color }}
            >
              {post.category_name}
            </Badge>
          )}
          {post.is_featured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && <p className="text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>}
      </CardHeader>
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author_avatar || undefined} />
              <AvatarFallback>{post.author_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{post.author_name}</p>
              <p className="text-muted-foreground">
                {post.published_at ? formatDate(post.published_at) : 'Draft'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time}m
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.view_count || 0}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});
