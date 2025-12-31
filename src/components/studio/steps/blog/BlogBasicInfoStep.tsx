/**
 * BlogBasicInfoStep Component
 * Step 1: Basic blog information - title, slug, excerpt, featured_image
 */

import React, { useEffect } from 'react';
import { Info } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, BlogWizardData } from '@/types/studio.types';

// Utility to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

export function BlogBasicInfoStep({ data, onUpdate }: StepComponentProps<BlogWizardData>) {
  // Auto-generate slug when title changes (only if slug is empty or matches previous title's slug)
  useEffect(() => {
    if (data.title && !data.slug) {
      onUpdate({ slug: generateSlug(data.title) });
    }
  }, [data.title, data.slug, onUpdate]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start by providing the essential details about your blog post
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          This information will be visible to readers and used for SEO. Make it clear and engaging!
        </AlertDescription>
      </Alert>

      {/* Blog Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Blog Title
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="e.g., 10 Tips for Effective AI Leadership"
          className="text-lg"
          required
        />
        <p className="text-xs text-muted-foreground">
          Choose a clear, compelling title that captures what readers will learn
        </p>
      </div>

      {/* Slug (URL) */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          URL Slug
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/blog/</span>
          <Input
            id="slug"
            value={data.slug}
            onChange={e => onUpdate({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="10-tips-effective-ai-leadership"
            className="flex-1"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-generated from title. This will be the URL path for your blog post.
        </p>
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">
          Excerpt
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="excerpt"
          value={data.excerpt}
          onChange={e => onUpdate({ excerpt: e.target.value })}
          placeholder="Write a brief summary of your blog post (2-3 sentences). This will appear in blog listings and search results."
          rows={4}
          required
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Keep it concise and compelling - this is what draws readers in
          </p>
          <span className="text-xs text-muted-foreground">{data.excerpt.length} characters</span>
        </div>
      </div>

      {/* Featured Image URL */}
      <div className="space-y-2">
        <Label htmlFor="featured-image">Featured Image URL (Optional)</Label>
        <Input
          id="featured-image"
          type="url"
          value={data.featured_image || ''}
          onChange={e => onUpdate({ featured_image: e.target.value })}
          placeholder="https://example.com/blog-image.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Provide a URL to an image that represents your blog post. Recommended size: 1200x630px
        </p>
        {data.featured_image && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
              src={data.featured_image}
              alt="Blog post preview"
              className="w-full h-48 object-cover"
              onError={e => {
                e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=Invalid+Image+URL';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
