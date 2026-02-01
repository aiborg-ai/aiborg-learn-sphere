/**
 * Knowledgebase Entry Editor Component
 * Create and edit knowledgebase entries with topic-specific metadata
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Eye, X } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { KnowledgebaseEntry, KnowledgebaseTopicType } from '@/types/knowledgebase';
import { getTopicConfig } from '@/types/knowledgebase';

interface KnowledgebaseEntryEditorProps {
  entry?: KnowledgebaseEntry | null;
  topicType: KnowledgebaseTopicType;
  onClose: () => void;
}

function KnowledgebaseEntryEditor({ entry, topicType, onClose }: KnowledgebaseEntryEditorProps) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();

  const topicConfig = getTopicConfig(topicType);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    thumbnail_url: '',
    meta_title: '',
    meta_description: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
    featured_order: 0,
    tags: [] as string[],
  });

  // Topic-specific metadata
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        slug: entry.slug || '',
        excerpt: entry.excerpt || '',
        content: entry.content || '',
        featured_image: entry.featured_image || '',
        thumbnail_url: entry.thumbnail_url || '',
        meta_title: entry.meta_title || '',
        meta_description: entry.meta_description || '',
        status: entry.status || 'draft',
        is_featured: entry.is_featured || false,
        featured_order: entry.featured_order || 0,
        tags: entry.tags || [],
      });
      setMetadata((entry.metadata as Record<string, unknown>) || {});
    }
  }, [entry]);

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

  const handleMetadataChange = (field: string, value: unknown) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
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
    try {
      setLoading(true);

      const saveData = {
        ...formData,
        topic_type: topicType,
        status: publish ? 'published' : formData.status,
        published_at:
          publish && !entry?.published_at ? new Date().toISOString() : entry?.published_at,
        metadata,
      };

      let result;
      if (entry) {
        result = await supabase
          .from('knowledgebase_entries')
          .update(saveData)
          .eq('id', entry.id)
          .select()
          .single();
      } else {
        result = await supabase.from('knowledgebase_entries').insert(saveData).select().single();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Entry ${entry ? 'updated' : 'created'} successfully`,
      });

      onClose();
    } catch (err) {
      logger.error('Error saving entry:', err);
      toast({
        title: 'Error',
        description: 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render topic-specific metadata fields
  const renderMetadataFields = () => {
    switch (topicType) {
      case 'pioneers':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pioneer Details</CardTitle>
              <CardDescription>Information about this AI pioneer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input
                    value={(metadata.specialty as string) || ''}
                    onChange={e => handleMetadataChange('specialty', e.target.value)}
                    placeholder="e.g., Deep Learning, NLP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={(metadata.country as string) || ''}
                    onChange={e => handleMetadataChange('country', e.target.value)}
                    placeholder="e.g., USA, UK"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Birth Year</Label>
                <Input
                  type="number"
                  value={(metadata.birth_year as number) || ''}
                  onChange={e =>
                    handleMetadataChange(
                      'birth_year',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 1958"
                />
              </div>
              <div className="space-y-2">
                <Label>Affiliations (comma-separated)</Label>
                <Input
                  value={((metadata.affiliations as string[]) || []).join(', ')}
                  onChange={e =>
                    handleMetadataChange(
                      'affiliations',
                      e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., Google, Stanford, MIT"
                />
              </div>
              <div className="space-y-2">
                <Label>Awards (comma-separated)</Label>
                <Input
                  value={((metadata.awards as string[]) || []).join(', ')}
                  onChange={e =>
                    handleMetadataChange(
                      'awards',
                      e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., Turing Award 2018, Nobel Prize 2024"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'events':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
              <CardDescription>Information about this AI event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={(metadata.start_date as string) || ''}
                    onChange={e => handleMetadataChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={(metadata.end_date as string) || ''}
                    onChange={e => handleMetadataChange('end_date', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={(metadata.location as string) || ''}
                    onChange={e => handleMetadataChange('location', e.target.value)}
                    placeholder="e.g., San Francisco, USA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    value={(metadata.venue as string) || ''}
                    onChange={e => handleMetadataChange('venue', e.target.value)}
                    placeholder="e.g., Moscone Center"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={(metadata.website as string) || ''}
                  onChange={e => handleMetadataChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={(metadata.is_virtual as boolean) || false}
                  onCheckedChange={checked => handleMetadataChange('is_virtual', checked)}
                />
                <Label>Virtual Event</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'companies':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Details</CardTitle>
              <CardDescription>Information about this AI company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Founded Year</Label>
                  <Input
                    type="number"
                    value={(metadata.founded_year as number) || ''}
                    onChange={e =>
                      handleMetadataChange(
                        'founded_year',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 2015"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Headquarters</Label>
                  <Input
                    value={(metadata.headquarters as string) || ''}
                    onChange={e => handleMetadataChange('headquarters', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employees</Label>
                  <Input
                    value={(metadata.employees as string) || ''}
                    onChange={e => handleMetadataChange('employees', e.target.value)}
                    placeholder="e.g., 1000+"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funding</Label>
                  <Input
                    value={(metadata.funding as string) || ''}
                    onChange={e => handleMetadataChange('funding', e.target.value)}
                    placeholder="e.g., $10B"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CEO</Label>
                <Input
                  value={(metadata.ceo as string) || ''}
                  onChange={e => handleMetadataChange('ceo', e.target.value)}
                  placeholder="CEO Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={(metadata.website as string) || ''}
                  onChange={e => handleMetadataChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Products (comma-separated)</Label>
                <Input
                  value={((metadata.products as string[]) || []).join(', ')}
                  onChange={e =>
                    handleMetadataChange(
                      'products',
                      e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., ChatGPT, DALL-E, GPT-4"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'research':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Research Paper Details</CardTitle>
              <CardDescription>Information about this research paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Authors (comma-separated)</Label>
                <Input
                  value={((metadata.authors as string[]) || []).join(', ')}
                  onChange={e =>
                    handleMetadataChange(
                      'authors',
                      e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="e.g., Vaswani, Shazeer, Parmar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Publication Date</Label>
                  <Input
                    type="date"
                    value={(metadata.publication_date as string) || ''}
                    onChange={e => handleMetadataChange('publication_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Journal/Conference</Label>
                  <Input
                    value={(metadata.journal as string) || ''}
                    onChange={e => handleMetadataChange('journal', e.target.value)}
                    placeholder="e.g., NeurIPS 2017"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>DOI</Label>
                  <Input
                    value={(metadata.doi as string) || ''}
                    onChange={e => handleMetadataChange('doi', e.target.value)}
                    placeholder="10.xxxx/xxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Citations</Label>
                  <Input
                    type="number"
                    value={(metadata.citations as number) || ''}
                    onChange={e =>
                      handleMetadataChange(
                        'citations',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>PDF URL</Label>
                <Input
                  type="url"
                  value={(metadata.pdf_url as string) || ''}
                  onChange={e => handleMetadataChange('pdf_url', e.target.value)}
                  placeholder="https://arxiv.org/pdf/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Abstract</Label>
                <Textarea
                  value={(metadata.abstract as string) || ''}
                  onChange={e => handleMetadataChange('abstract', e.target.value)}
                  placeholder="Paper abstract..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {topicConfig?.label}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={loading} className="btn-hero">
            <Eye className="mr-2 h-4 w-4" />
            {entry?.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  placeholder="Entry title"
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
                <Label>Excerpt</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={e => handleFieldChange('excerpt', e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={e => handleFieldChange('content', e.target.value)}
                  placeholder="Full content (Markdown supported)..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Topic-specific metadata */}
          {renderMetadataFields()}

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={e => handleFieldChange('meta_title', e.target.value)}
                  placeholder="SEO title (defaults to entry title)"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={e => handleFieldChange('meta_description', e.target.value)}
                  placeholder="SEO description (defaults to excerpt)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                  onValueChange={val =>
                    handleFieldChange('status', val as 'draft' | 'published' | 'archived')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Featured Image URL</Label>
                <Input
                  type="url"
                  value={formData.featured_image}
                  onChange={e => handleFieldChange('featured_image', e.target.value)}
                  placeholder="https://..."
                />
                {formData.featured_image && (
                  <img
                    src={formData.featured_image}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded-md mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={e => handleFieldChange('thumbnail_url', e.target.value)}
                  placeholder="https://..."
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
      </div>
    </div>
  );
}

export default KnowledgebaseEntryEditor;
