import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Image,
  Search,
  Tag,
  Bold,
  Italic,
  List,
  Link2,
  Code,
  Quote,
  Hash,
  ImageIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { logger } from '@/utils/logger';
interface BlogPost {
  id: string;
  title?: string;
  [key: string]: unknown;
}

interface Category {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface Tag {
  id: string;
  name: string;
}

interface BlogPostEditorProps {
  post?: BlogPost;
  onClose: () => void;
}

function BlogPostEditor({ post, onClose }: BlogPostEditorProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    featured_image: '',
    status: 'draft',
    is_featured: false,
    is_sticky: false,
    allow_comments: true,
    meta_title: '',
    meta_description: '',
    seo_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    scheduled_for: '',
    reading_time: 0,
  });
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (post) {
      loadPost();
    }
  }, [post]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    setCategories(data || []);
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('blog_tags').select('*').order('name');
    setTags(data || []);
  };

  const loadPost = async () => {
    if (!post) return;

    const { data: postData } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_post_tags(tag_id)
      `
      )
      .eq('id', post.id)
      .single();

    if (postData) {
      setFormData({
        ...formData,
        ...postData,
        scheduled_for: postData.scheduled_for || '',
      });

      const tagIds = postData.blog_post_tags?.map((pt: { tag_id: string }) => pt.tag_id) || [];
      setSelectedTags(tagIds);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleSave = async (publishNow = false) => {
    try {
      setLoading(true);

      const saveData = {
        ...formData,
        status: publishNow ? 'published' : formData.status,
        published_at: publishNow && !post?.published_at ? new Date().toISOString() : undefined,
        reading_time: calculateReadingTime(formData.content),
        last_modified_by: (await supabase.auth.getUser()).data.user?.id,
      };

      let result;
      if (post) {
        // Update existing post
        result = await supabase
          .from('blog_posts')
          .update(saveData)
          .eq('id', post.id)
          .select()
          .single();
      } else {
        // Create new post
        result = await supabase
          .from('blog_posts')
          .insert({
            ...saveData,
            author_id: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Update tags
      if (result.data) {
        // Remove existing tags
        await supabase.from('blog_post_tags').delete().eq('post_id', result.data.id);

        // Add new tags
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map(tagId => ({
            post_id: result.data.id,
            tag_id: tagId,
          }));

          await supabase.from('blog_post_tags').insert(tagInserts);
        }
      }

      toast({
        title: 'Success',
        description: `Post ${post ? 'updated' : 'created'} successfully`,
      });

      onClose();
    } catch (error) {
      logger.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const insertMarkdown = (before: string, after = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const replacement = `${before}${selectedText}${after}`;

    const newContent =
      formData.content.substring(0, start) + replacement + formData.content.substring(end);

    setFormData({ ...formData, content: newContent });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">{post ? 'Edit Post' : 'Create New Post'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            <Eye className="mr-2 h-4 w-4" />
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button className="btn-hero" onClick={() => handleSave(true)} disabled={loading}>
            Publish Now
          </Button>
        </div>
      </div>

      {preview ? (
        // Preview Mode
        <Card>
          <CardContent className="p-8">
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <h1>{formData.title || 'Untitled Post'}</h1>
              {formData.excerpt && (
                <p className="text-xl text-muted-foreground">{formData.excerpt}</p>
              )}
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt={formData.title}
                  className="w-full rounded-lg"
                />
              )}
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(formData.content) }} />
            </article>
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter post title..."
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="post-url-slug"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFormData({ ...formData, slug: generateSlug(formData.title) })
                      }
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description of the post..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Content</Label>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('**', '**')}>
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('*', '*')}>
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('\n## ', '')}>
                        <Hash className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('\n- ', '')}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => insertMarkdown('[', '](url)')}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('`', '`')}>
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => insertMarkdown('\n> ', '')}>
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => insertMarkdown('![alt text](', ')')}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="content-editor"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your content in Markdown..."
                    rows={20}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Markdown formatting • {calculateReadingTime(formData.content)} min read
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="SEO title (max 60 characters)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_title.length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="SEO description (max 160 characters)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_description.length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="seo_keywords">SEO Keywords</Label>
                  <Input
                    id="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={e => setFormData({ ...formData, seo_keywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div>
                  <Label htmlFor="canonical_url">Canonical URL</Label>
                  <Input
                    id="canonical_url"
                    value={formData.canonical_url}
                    onChange={e => setFormData({ ...formData, canonical_url: e.target.value })}
                    placeholder="https://example.com/original-post"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Publish Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduled_for">Schedule For</Label>
                    <Input
                      id="scheduled_for"
                      type="datetime-local"
                      value={formData.scheduled_for}
                      onChange={e => setFormData({ ...formData, scheduled_for: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={value => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">Featured Post</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={checked => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_sticky">Pin to Top</Label>
                  <Switch
                    id="is_sticky"
                    checked={formData.is_sticky}
                    onCheckedChange={checked => setFormData({ ...formData, is_sticky: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_comments">Allow Comments</Label>
                  <Switch
                    id="allow_comments"
                    checked={formData.allow_comments}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, allow_comments: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.featured_image && (
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full rounded-lg"
                    />
                  )}
                  <Input
                    value={formData.featured_image}
                    onChange={e => setFormData({ ...formData, featured_image: e.target.value })}
                    placeholder="Image URL"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <Badge variant="outline">{tag.name}</Badge>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown parser for preview
function parseMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default BlogPostEditor;
