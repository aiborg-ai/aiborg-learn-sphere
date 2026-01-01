/**
 * Content Templates Tab
 *
 * Manages personalized content templates for different audiences
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIContentService, type ContentTemplate } from '@/services/ai/AIContentService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const CATEGORIES = ['welcome', 'notification', 'email', 'help', 'onboarding'];
const CONTENT_TYPES = ['text', 'html', 'markdown'];
const AUDIENCES = ['primary', 'secondary', 'professional', 'business', 'default'];

export default function ContentTemplatesTab() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    content_type: 'text' as 'text' | 'html' | 'markdown',
    category: 'welcome',
    templates: {
      primary: '',
      secondary: '',
      professional: '',
      business: '',
      default: '',
    },
  });
  const { toast } = useToast();

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (_error) {
      logger.error('Error loading templates:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load content templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      content_type: 'text',
      category: 'welcome',
      templates: {
        primary: '',
        secondary: '',
        professional: '',
        business: '',
        default: '',
      },
    });
    setSelectedTemplate(null);
    setEditDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (template: ContentTemplate) => {
    setFormData({
      key: template.key,
      name: template.name,
      description: template.description || '',
      content_type: template.content_type,
      category: template.category,
      templates: {
        primary: template.templates.primary || '',
        secondary: template.templates.secondary || '',
        professional: template.templates.professional || '',
        business: template.templates.business || '',
        default: template.templates.default || '',
      },
    });
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  // Save template
  const saveTemplate = async () => {
    try {
      // Extract variables from all templates
      const allText = Object.values(formData.templates).join(' ');
      const variableMatches = allText.match(/\{\{([^}]+)\}\}/g);
      const extractedVars = variableMatches
        ? Array.from(new Set(variableMatches.map(v => v.replace(/[{}]/g, '').trim())))
        : [];

      const templateData = {
        key: formData.key,
        name: formData.name,
        description: formData.description || null,
        content_type: formData.content_type,
        category: formData.category,
        templates: formData.templates,
        variables: extractedVars,
        is_active: true,
      };

      if (selectedTemplate) {
        // Update existing
        const updated = await AIContentService.updateContentTemplate(
          selectedTemplate.id,
          templateData
        );
        if (!updated) throw new Error('Failed to update template');

        toast({
          title: 'Success',
          description: 'Content template updated successfully',
        });
      } else {
        // Create new
        const created = await AIContentService.createContentTemplate(templateData);
        if (!created) throw new Error('Failed to create template');

        toast({
          title: 'Success',
          description: 'Content template created successfully',
        });
      }

      setEditDialogOpen(false);
      loadTemplates();
    } catch (_error) {
      logger.error('Error saving template:', _error);
      toast({
        title: 'Error',
        description: 'Failed to save content template',
        variant: 'destructive',
      });
    }
  };

  // Delete template
  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content template deleted successfully',
      });
      AIContentService.clearCache();
      loadTemplates();
    } catch (_error) {
      logger.error('Error deleting template:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete content template',
        variant: 'destructive',
      });
    }
  };

  // Preview template
  const openPreview = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No templates found. Create your first content template.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audiences</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{template.key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.content_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(template.templates)
                        .slice(0, 3)
                        .map((aud, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {aud}
                          </Badge>
                        ))}
                      {Object.keys(template.templates).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(template.templates).length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Content Template' : 'Create Content Template'}
            </DialogTitle>
            <DialogDescription>
              Create personalized content for different audiences. Use {'{{variable}}'} for dynamic
              content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key (unique identifier)</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., chatbot_welcome"
                  disabled={!!selectedTemplate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chatbot Welcome Message"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger id="content_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Audience-Specific Content</Label>
              <Tabs defaultValue="primary" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {AUDIENCES.map(aud => (
                    <TabsTrigger key={aud} value={aud} className="text-xs">
                      {aud}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {AUDIENCES.map(aud => (
                  <TabsContent key={aud} value={aud} className="space-y-2">
                    <Textarea
                      value={formData.templates[aud as keyof typeof formData.templates]}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          templates: {
                            ...formData.templates,
                            [aud]: e.target.value,
                          },
                        })
                      }
                      placeholder={`Content for ${aud} audience...`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              {selectedTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Key:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{selectedTemplate.key}</code>
                </div>
                <div>
                  <span className="font-semibold">Category:</span>{' '}
                  <Badge variant="outline">{selectedTemplate.category}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Type:</span>{' '}
                  <Badge variant="secondary">{selectedTemplate.content_type}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content by Audience</Label>
                <Tabs defaultValue="primary" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {Object.keys(selectedTemplate.templates).map(aud => (
                      <TabsTrigger key={aud} value={aud} className="text-xs">
                        {aud}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(selectedTemplate.templates).map(([aud, content]) => (
                    <TabsContent key={aud} value={aud}>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                          {content || (
                            <span className="text-muted-foreground italic">
                              No content for this audience
                            </span>
                          )}
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Variables ({selectedTemplate.variables.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v, i) => (
                    <Badge key={i} variant="outline">
                      {v}
                    </Badge>
                  ))}
                  {selectedTemplate.variables.length === 0 && (
                    <span className="text-sm text-muted-foreground">No variables</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                if (selectedTemplate) openEditDialog(selectedTemplate);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
