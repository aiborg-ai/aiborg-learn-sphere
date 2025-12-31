/**
 * BlogSeoStep Component
 * Step 3: SEO optimization - meta_title, meta_description, focus_keywords
 */

import React, { useState } from 'react';
import { Search, Plus, X } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { StepComponentProps, BlogWizardData } from '@/types/studio.types';

export function BlogSeoStep({ data, onUpdate }: StepComponentProps<BlogWizardData>) {
  const [newKeyword, setNewKeyword] = useState('');

  // Add keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !data.focus_keywords?.includes(newKeyword.trim())) {
      onUpdate({ focus_keywords: [...(data.focus_keywords || []), newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    onUpdate({
      focus_keywords: data.focus_keywords?.filter(k => k !== keyword) || [],
    });
  };

  // Use blog title as default meta title if not set
  const metaTitle = data.meta_title || data.title;
  const metaDescription = data.meta_description || data.excerpt;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">SEO Optimization</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize your blog post for search engines and social media
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Good SEO helps your content get discovered. If you leave these fields empty, we'll use
          your title and excerpt as defaults.
        </AlertDescription>
      </Alert>

      {/* Meta Title */}
      <div className="space-y-2">
        <Label htmlFor="meta-title">Meta Title (Optional)</Label>
        <Input
          id="meta-title"
          value={data.meta_title || ''}
          onChange={e => onUpdate({ meta_title: e.target.value })}
          placeholder={data.title || 'e.g., 10 Tips for Effective AI Leadership | AI Borg'}
          maxLength={60}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Title that appears in search results (defaults to blog title)
          </p>
          <span
            className={`text-xs ${
              (data.meta_title || data.title).length > 60
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {(data.meta_title || data.title).length}/60
          </span>
        </div>
        {(data.meta_title || data.title).length > 60 && (
          <p className="text-xs text-destructive">
            Warning: Meta titles longer than 60 characters may be truncated in search results
          </p>
        )}
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <Label htmlFor="meta-description">Meta Description (Optional)</Label>
        <Textarea
          id="meta-description"
          value={data.meta_description || ''}
          onChange={e => onUpdate({ meta_description: e.target.value })}
          placeholder={
            data.excerpt ||
            'Write a compelling description that will appear in search results and social media shares...'
          }
          rows={3}
          maxLength={160}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Description shown in search results (defaults to excerpt)
          </p>
          <span
            className={`text-xs ${
              (data.meta_description || data.excerpt).length > 160
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {(data.meta_description || data.excerpt).length}/160
          </span>
        </div>
        {(data.meta_description || data.excerpt).length > 160 && (
          <p className="text-xs text-destructive">
            Warning: Meta descriptions longer than 160 characters may be truncated in search results
          </p>
        )}
      </div>

      {/* Focus Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Focus Keywords</CardTitle>
          <CardDescription>
            Add keywords that describe your blog post's main topics (helps with SEO and
            discoverability)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Keyword Input */}
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              placeholder="e.g., artificial intelligence, leadership, machine learning"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Keywords Display */}
          {data.focus_keywords && data.focus_keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.focus_keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                    aria-label={`Remove ${keyword}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No keywords added yet. Add keywords to improve SEO.
            </p>
          )}

          <div className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Add 3-5 relevant keywords that readers might search for
          </div>
        </CardContent>
      </Card>

      {/* SEO Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Engine Preview</CardTitle>
          <CardDescription>How your blog post will appear in search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-blue-600 mb-1">/blog/{data.slug || 'your-post-slug'}</div>
            <div className="text-lg text-blue-800 font-medium mb-1 hover:underline cursor-pointer">
              {metaTitle || 'Your Blog Post Title'}
            </div>
            <div className="text-sm text-gray-600">
              {metaDescription || 'Your blog post description will appear here...'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This is a preview of how your post might appear in Google search results
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
