import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, List, Link2, Code, Quote, Hash, ImageIcon } from '@/components/ui/icons';

interface ContentEditorProps {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  readingTime: number;
  onChange: (field: string, value: string) => void;
  onGenerateSlug: () => void;
  onInsertMarkdown: (before: string, after?: string) => void;
}

export function ContentEditor({
  title,
  slug,
  excerpt,
  content,
  readingTime,
  onChange,
  onGenerateSlug,
  onInsertMarkdown,
}: ContentEditorProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={e => onChange('title', e.target.value)}
            placeholder="Enter post title..."
            className="text-lg"
          />
        </div>

        {/* Slug */}
        <div>
          <Label htmlFor="slug">Slug</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              value={slug}
              onChange={e => onChange('slug', e.target.value)}
              placeholder="post-url-slug"
            />
            <Button variant="outline" onClick={onGenerateSlug}>
              Generate
            </Button>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={e => onChange('excerpt', e.target.value)}
            placeholder="Brief description of the post..."
            rows={3}
          />
        </div>

        {/* Content with Markdown Toolbar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="content">Content</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('**', '**')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('*', '*')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('\n## ', '')}>
                <Hash className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('\n- ', '')}>
                <List className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('[', '](url)')}>
                <Link2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('`', '`')}>
                <Code className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onInsertMarkdown('\n> ', '')}>
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onInsertMarkdown('![alt text](', ')')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            id="content-editor"
            value={content}
            onChange={e => onChange('content', e.target.value)}
            placeholder="Write your content in Markdown..."
            rows={20}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supports Markdown formatting • {readingTime} min read
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
