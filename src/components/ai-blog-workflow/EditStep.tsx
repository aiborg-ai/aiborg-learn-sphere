/**
 * Edit Step (Step 3)
 *
 * Review and edit AI-generated content
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editStepSchema, type EditStepData } from '@/schemas/aiBlogWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Bold, Italic, List, Link2, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EditStepProps {
  generatedContent: any;
  selectedImage: any;
  initialData?: Partial<EditStepData>;
  onNext: (data: EditStepData) => void;
  onBack: () => void;
}

export function EditStep({
  generatedContent,
  selectedImage,
  initialData,
  onNext,
  onBack,
}: EditStepProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags || generatedContent.suggestedTags || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditStepData>({
    resolver: zodResolver(editStepSchema),
    defaultValues: initialData || {
      title: generatedContent.title,
      slug: '',
      excerpt: generatedContent.excerpt,
      content: generatedContent.content,
      categoryId: generatedContent.suggestedCategory || '',
      tags: generatedContent.suggestedTags || [],
      metaTitle: generatedContent.metaTitle,
      metaDescription: generatedContent.metaDescription,
      featuredImage: selectedImage.url,
    },
  });

  const content = watch('content');
  const categoryId = watch('categoryId');

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    const { data: categoriesData } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    const { data: tagsData } = await supabase.from('blog_tags').select('*').order('name');

    setCategories(categoriesData || []);
    setAllTags(tagsData || []);
  };

  const insertMarkdown = (before: string, after = '') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) + before + selectedText + after + content.substring(end);

    setValue('content', newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = (data: EditStepData) => {
    onNext(data);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Post Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                className="text-lg font-semibold"
                placeholder="Enter blog post title..."
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                className="min-h-[80px]"
                placeholder="Brief summary of the blog post..."
              />
              {errors.excerpt && (
                <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Content with Markdown Toolbar */}
            <div>
              <Label htmlFor="content">Content *</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('\n- ')}
                  title="List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('[', '](url)')}
                  title="Link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('`', '`')}
                  title="Code"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('\n## ')}
                  title="Heading"
                >
                  H2
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMarkdown('\n### ')}
                  title="Heading"
                >
                  H3
                </Button>
              </div>
              <Textarea
                id="content"
                {...register('content')}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Blog post content in Markdown format..."
              />
              {errors.content && (
                <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Use Markdown syntax for formatting. ~{Math.ceil(content.split(/\s+/).length / 200)}{' '}
                min read
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category & Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={categoryId} onValueChange={value => setValue('categoryId', value)}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>Tags * (Select 1-10)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              {errors.tags && (
                <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTags.length} tag(s) selected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Featured Image */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meta Title */}
            <div>
              <Label htmlFor="metaTitle">Meta Title (Optional)</Label>
              <Input
                id="metaTitle"
                {...register('metaTitle')}
                placeholder="SEO title for search engines..."
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">Max 160 characters</p>
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="metaDescription">Meta Description (Optional)</Label>
              <Textarea
                id="metaDescription"
                {...register('metaDescription')}
                className="min-h-[80px]"
                placeholder="SEO description for search engines..."
                maxLength={320}
              />
              <p className="text-xs text-muted-foreground mt-1">Max 320 characters</p>
            </div>

            {/* Featured Image */}
            <div>
              <Label htmlFor="featuredImage">Featured Image URL *</Label>
              <Input id="featuredImage" {...register('featuredImage')} placeholder="https://..." />
              {errors.featuredImage && (
                <p className="text-sm text-destructive mt-1">{errors.featuredImage.message}</p>
              )}
              {watch('featuredImage') && (
                <div className="mt-2">
                  <img
                    src={watch('featuredImage')}
                    alt="Featured"
                    className="w-full max-w-md rounded-lg border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" className="group">
            Continue to Review
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </form>
    </div>
  );
}
