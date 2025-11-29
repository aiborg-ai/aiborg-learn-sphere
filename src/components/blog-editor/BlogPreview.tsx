import { Card, CardContent } from '@/components/ui/card';
import { CardImage } from '@/components/shared/OptimizedImage';

interface BlogPreviewProps {
  title: string;
  excerpt: string;
  featuredImage: string;
  content: string;
  parseMarkdown: (content: string) => string;
}

export function BlogPreview({
  title,
  excerpt,
  featuredImage,
  content,
  parseMarkdown,
}: BlogPreviewProps) {
  return (
    <Card>
      <CardContent className="p-8">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1>{title || 'Untitled Post'}</h1>
          {excerpt && <p className="text-xl text-muted-foreground">{excerpt}</p>}
          {featuredImage && <CardImage src={featuredImage} alt={title} className="w-full rounded-lg" />}
          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
        </article>
      </CardContent>
    </Card>
  );
}
