/**
 * BlogReviewStep Component
 * Step 6: Review and preview entire blog post before publishing
 */

import React from 'react';
import { CheckCircle, Eye, AlertTriangle } from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'isomorphic-dompurify';
import type { StepComponentProps, BlogWizardData } from '@/types/studio.types';

export function BlogReviewStep({ data, mode }: StepComponentProps<BlogWizardData>) {
  // Validate completeness
  const isComplete = {
    basicInfo: !!(data.title && data.slug && data.excerpt),
    content: !!data.content,
    seo: true, // SEO fields are optional
    scheduling: true, // Status defaults to draft
    tags: true, // Tags are optional
  };

  const allComplete = Object.values(isComplete).every(Boolean);

  // Simple markdown-to-HTML converter with XSS protection
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-muted-foreground">No content</p>';

    const html = text
      .split('\n\n')
      .map(paragraph => {
        let converted = paragraph;

        // Headers
        converted = converted.replace(
          /^### (.+)$/gm,
          '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
        );
        converted = converted.replace(
          /^## (.+)$/gm,
          '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>'
        );
        converted = converted.replace(
          /^# (.+)$/gm,
          '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>'
        );

        // Bold and italic
        converted = converted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        converted = converted.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        converted = converted.replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" class="text-primary underline">$1</a>'
        );

        // Code
        converted = converted.replace(
          /`(.+?)`/g,
          '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
        );

        // Lists
        if (converted.startsWith('- ')) {
          converted =
            '<ul class="list-disc list-inside my-2">' +
            converted.replace(/^- (.+)$/gm, '<li>$1</li>') +
            '</ul>';
        } else if (converted.match(/^\d+\. /)) {
          converted =
            '<ol class="list-decimal list-inside my-2">' +
            converted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>') +
            '</ol>';
        } else {
          converted = `<p class="my-2">${converted}</p>`;
        }

        return converted;
      })
      .join('');

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'code', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:https?:)/i,
    });
  };

  // Calculate reading time
  const wordCount = data.content.trim() ? data.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Eye className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review & Publish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your blog post before {mode === 'create' ? 'publishing' : 'updating'}
          </p>
        </div>
      </div>

      {/* Completeness Alert */}
      {!allComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Some required fields are missing. Please complete all sections before publishing.
          </AlertDescription>
        </Alert>
      )}

      {allComplete && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            All required fields are complete! Review the details below and click{' '}
            {mode === 'create' ? 'Publish' : 'Update'} when ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Blog Post Preview */}
      <Card className="border-2">
        {/* Featured Image */}
        {data.featured_image && (
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
          <img
            src={data.featured_image}
            alt={data.title || 'Blog post'}
            className="w-full h-64 object-cover rounded-t-lg"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        <CardHeader className="bg-muted/50">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={data.status === 'published' ? 'default' : 'secondary'}>
              {data.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            {data.is_featured && <Badge variant="destructive">Featured</Badge>}
            {data.category_id && <Badge variant="outline">{data.category_id}</Badge>}
            <span className="text-xs text-muted-foreground ml-auto">{readingTime} min read</span>
          </div>
          <CardTitle className="text-3xl">{data.title || 'Untitled Blog Post'}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {data.excerpt || 'No excerpt provided'}
          </CardDescription>
          {data.slug && <div className="mt-2 text-sm text-blue-600">/blog/{data.slug}</div>}
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Blog Content */}
          {data.content ? (
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(data.content) }} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No content written yet</p>
          )}

          <Separator />

          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {data.publish_date && (
              <div>
                <p className="text-muted-foreground">Publish Date</p>
                <p className="font-medium">
                  {new Date(data.publish_date).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            )}
            {data.expiry_date && (
              <div>
                <p className="text-muted-foreground">Expiry Date</p>
                <p className="font-medium">
                  {new Date(data.expiry_date).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Comments</p>
              <p className="font-medium">{data.allow_comments ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Word Count</p>
              <p className="font-medium">{wordCount} words</p>
            </div>
          </div>

          {/* Tags */}
          {data.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SEO Preview */}
          {(data.meta_title || data.meta_description || data.focus_keywords) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">SEO Information</h3>
                {data.meta_title && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">Meta Title</p>
                    <p className="text-sm">{data.meta_title}</p>
                  </div>
                )}
                {data.meta_description && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">Meta Description</p>
                    <p className="text-sm">{data.meta_description}</p>
                  </div>
                )}
                {data.focus_keywords && data.focus_keywords.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Focus Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {data.focus_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Summaries */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Basic Information
              {isComplete.basicInfo ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Title, slug, excerpt, featured image
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Content
              {isComplete.content ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {wordCount > 0 ? `${wordCount} words, ${readingTime} min read` : 'No content written'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              SEO
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.focus_keywords && data.focus_keywords.length > 0
              ? `${data.focus_keywords.length} keywords`
              : 'Using defaults'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Scheduling
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.status === 'published' ? 'Ready to publish' : 'Saved as draft'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Tags & Categories
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.tags.length > 0 ? `${data.tags.length} tags selected` : 'No tags selected'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Settings
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.is_featured ? 'Featured, ' : ''}
            {data.allow_comments ? 'Comments enabled' : 'Comments disabled'}
          </CardContent>
        </Card>
      </div>

      {/* Final Instructions */}
      <Alert>
        <AlertDescription>
          {mode === 'create'
            ? data.status === 'published'
              ? 'Once published, readers will be able to see this blog post. You can edit it later from the admin panel.'
              : 'This post will be saved as a draft. You can publish it later from the admin panel.'
            : 'Your changes will be saved immediately.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
