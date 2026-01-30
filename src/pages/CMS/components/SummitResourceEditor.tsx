/**
 * Summit Resource Editor Component
 * Create and edit Summit resources
 */

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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Eye, X, ExternalLink } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type {
  SummitResource,
  SummitTheme,
  SummitResourceType,
  SummitResourceStatus,
} from '@/types/summit';
import { RESOURCE_TYPE_CONFIGS, getThemeColors } from '@/types/summit';

interface SummitResourceEditorProps {
  resource?: SummitResource | null;
  themes: SummitTheme[];
  onClose: () => void;
}

function SummitResourceEditor({ resource, themes, onClose }: SummitResourceEditorProps) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    url: '',
    theme_id: '',
    resource_type: 'article' as SummitResourceType,
    source: '',
    status: 'draft' as SummitResourceStatus,
    is_featured: false,
    featured_order: 0,
    tags: [] as string[],
    metadata: {} as Record<string, unknown>,
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        slug: resource.slug || '',
        description: resource.description || '',
        url: resource.url || '',
        theme_id: resource.theme_id || '',
        resource_type: resource.resource_type || 'article',
        source: resource.source || '',
        status: resource.status || 'draft',
        is_featured: resource.is_featured || false,
        featured_order: resource.featured_order || 0,
        tags: resource.tags || [],
        metadata: (resource.metadata as Record<string, unknown>) || {},
      });
    } else if (themes.length > 0) {
      // Default to first theme for new resources
      setFormData(prev => ({ ...prev, theme_id: themes[0].id }));
    }
  }, [resource, themes]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleFieldChange = (field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      handleFieldChange('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleFieldChange(
      'tags',
      formData.tags.filter(t => t !== tagToRemove)
    );
  };

  const handleSave = async (publish = false) => {
    // Validation
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!formData.url.trim()) {
      toast({ title: 'Error', description: 'URL is required', variant: 'destructive' });
      return;
    }
    if (!formData.theme_id) {
      toast({ title: 'Error', description: 'Theme is required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      const slug = formData.slug || generateSlug(formData.title);
      const saveData = {
        title: formData.title,
        slug,
        description: formData.description || null,
        url: formData.url,
        theme_id: formData.theme_id,
        resource_type: formData.resource_type,
        source: formData.source || null,
        status: publish ? 'published' : formData.status,
        is_featured: formData.is_featured,
        featured_order: formData.featured_order,
        tags: formData.tags,
        metadata: formData.metadata,
      };

      let result;
      if (resource) {
        result = await supabase
          .from('summit_resources')
          .update(saveData)
          .eq('id', resource.id)
          .select()
          .single();
      } else {
        result = await supabase.from('summit_resources').insert(saveData).select().single();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Resource ${resource ? 'updated' : 'created'} successfully`,
      });

      onClose();
    } catch (err) {
      logger.error('Error saving resource:', err);
      toast({
        title: 'Error',
        description: 'Failed to save resource',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTheme = themes.find(t => t.id === formData.theme_id);
  const themeColors = selectedTheme ? getThemeColors(selectedTheme.slug) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Resources
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={loading} className="btn-hero">
            <Eye className="mr-2 h-4 w-4" />
            {resource?.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  placeholder="Resource title"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Slug *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange('slug', generateSlug(formData.title))}
                  >
                    Generate from title
                  </Button>
                </div>
                <Input
                  value={formData.slug}
                  onChange={e => handleFieldChange('slug', e.target.value)}
                  placeholder="url-friendly-slug"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Brief description of the resource..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>URL *</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={e => handleFieldChange('url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  {formData.url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={formData.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={formData.source}
                  onChange={e => handleFieldChange('source', e.target.value)}
                  placeholder="e.g., Government of India, NITI Aayog, World Bank"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Theme & Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme (Chakra) *</Label>
                <Select
                  value={formData.theme_id}
                  onValueChange={val => handleFieldChange('theme_id', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => {
                      const colors = getThemeColors(theme.slug);
                      return (
                        <SelectItem key={theme.id} value={theme.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors.bgColor}`}></div>
                            {theme.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedTheme && (
                  <div
                    className={`p-3 rounded-md ${themeColors.bgColor} ${themeColors.borderColor} border`}
                  >
                    <p className={`text-sm font-medium ${themeColors.textColor}`}>
                      {selectedTheme.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {selectedTheme.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Resource Type *</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={val =>
                    handleFieldChange('resource_type', val as SummitResourceType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPE_CONFIGS.map(config => (
                      <SelectItem key={config.type} value={config.type}>
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => handleFieldChange('status', val as SummitResourceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={checked => handleFieldChange('is_featured', checked)}
                />
              </div>

              {formData.is_featured && (
                <div className="space-y-2">
                  <Label>Featured Order</Label>
                  <Input
                    type="number"
                    value={formData.featured_order}
                    onChange={e =>
                      handleFieldChange('featured_order', parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          {resource && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span>{resource.view_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(resource.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SummitResourceEditor;
