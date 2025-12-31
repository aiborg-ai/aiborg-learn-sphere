/**
 * BlogTagsStep Component
 * Step 5: Tags & Categories - tags, category_id, is_featured, allow_comments
 */

import React from 'react';
import { Tag } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DragDropTagManager } from '@/components/studio/shared/DragDropTagManager';
import type { StepComponentProps, BlogWizardData, Tag as TagType } from '@/types/studio.types';

// Sample available tags for blogs (in real app, fetch from database)
const AVAILABLE_TAGS: TagType[] = [
  { id: '1', name: 'AI & Machine Learning', category: 'technology' },
  { id: '2', name: 'Leadership', category: 'business' },
  { id: '3', name: 'Technology Trends', category: 'technology' },
  { id: '4', name: 'Best Practices', category: 'guides' },
  { id: '5', name: 'Case Studies', category: 'content-type' },
  { id: '6', name: 'Tutorials', category: 'content-type' },
  { id: '7', name: 'Industry News', category: 'news' },
  { id: '8', name: 'Data Science', category: 'technology' },
  { id: '9', name: 'Innovation', category: 'business' },
  { id: '10', name: 'Digital Transformation', category: 'business' },
  { id: '11', name: 'Product Updates', category: 'news' },
  { id: '12', name: 'Team Culture', category: 'business' },
];

// Blog categories (in real app, fetch from database)
const BLOG_CATEGORIES = [
  { value: 'technology', label: 'Technology & AI' },
  { value: 'leadership', label: 'Leadership & Management' },
  { value: 'business', label: 'Business & Strategy' },
  { value: 'product', label: 'Product & Updates' },
  { value: 'industry', label: 'Industry Insights' },
  { value: 'tutorials', label: 'Tutorials & Guides' },
  { value: 'news', label: 'News & Announcements' },
  { value: 'culture', label: 'Culture & Team' },
  { value: 'other', label: 'Other' },
];

export function BlogTagsStep({ data, onUpdate }: StepComponentProps<BlogWizardData>) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Tags & Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your blog post and configure reader engagement options
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Tags and categories help readers discover related content. Use tags for specific topics
          and a category for the main theme.
        </AlertDescription>
      </Alert>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Blog Category
          <span className="text-muted-foreground ml-2 text-xs font-normal">(Optional)</span>
        </Label>
        <Select
          value={data.category_id || ''}
          onValueChange={category_id => onUpdate({ category_id })}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BLOG_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the primary category that best fits your blog post
        </p>
      </div>

      {/* Drag-Drop Tag Manager */}
      <div className="space-y-2">
        <div className="text-base font-medium">Blog Tags</div>
        <p className="text-sm text-muted-foreground">
          Select and organize tags that describe your content. Drag to reorder by priority.
        </p>
        <DragDropTagManager
          availableTags={AVAILABLE_TAGS}
          selectedTags={data.tags}
          onChange={tags => onUpdate({ tags })}
          maxTags={10}
          allowCustomTags
          placeholder="Search tags or create custom ones..."
        />
      </div>

      {/* Blog Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blog Post Settings</CardTitle>
          <CardDescription>Configure how readers interact with this post</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Featured Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-featured" className="text-base">
                Featured Post
              </Label>
              <p className="text-sm text-muted-foreground">
                Display this post prominently on the blog homepage and in featured sections
              </p>
            </div>
            <Switch
              id="is-featured"
              checked={data.is_featured}
              onCheckedChange={is_featured => onUpdate({ is_featured })}
            />
          </div>

          {/* Allow Comments Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-comments" className="text-base">
                Allow Comments
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable readers to leave comments and engage in discussions on this post
              </p>
            </div>
            <Switch
              id="allow-comments"
              checked={data.allow_comments}
              onCheckedChange={allow_comments => onUpdate({ allow_comments })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Organization Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">
              {data.category_id
                ? BLOG_CATEGORIES.find(cat => cat.value === data.category_id)?.label
                : 'Not selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Tags:</span>
            <span className="font-medium">
              {data.tags.length > 0 ? `${data.tags.length} selected` : 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Featured:</span>
            <span className="font-medium">{data.is_featured ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Comments:</span>
            <span className="font-medium">{data.allow_comments ? 'Enabled' : 'Disabled'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
