/**
 * Template Manager Component
 * Create and manage reusable templates for common blog topics
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BlogTemplateService } from '@/services/blog/BlogTemplateService';
import type { BlogTemplate, CreateTemplateData } from '@/types/blog-scheduler';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreVertical, Edit, Copy, Trash2, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  topic_template: z.string().min(1, 'Topic template is required'),
  audience: z.enum(['primary', 'secondary', 'professional', 'business']),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']),
  length: z.enum(['short', 'medium', 'long']),
  keywords: z.string().optional(),
  category_id: z.string().optional(),
  default_tags: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export function TemplateManager() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BlogTemplate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BlogTemplate | null>(null);
  const [templateUsage, setTemplateUsage] = useState<Record<string, number>>({});

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      audience: 'professional',
      tone: 'professional',
      length: 'medium',
    },
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await BlogTemplateService.getTemplates();
      setTemplates(data);

      // Load usage counts
      const usageCounts: Record<string, number> = {};
      for (const template of data) {
        const count = await BlogTemplateService.getTemplateUsageCount(template.id);
        usageCounts[template.id] = count;
      }
      setTemplateUsage(usageCounts);
    } catch (_error) {
      logger.error('Error loading templates:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase.from('blog_categories').select('*').order('name');
      setCategories(data || []);
    } catch (_error) {
      logger.error('Error loading categories:', _error);
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    try {
      setIsSubmitting(true);

      const templateData: CreateTemplateData = {
        name: data.name,
        description: data.description,
        topic_template: data.topic_template,
        audience: data.audience,
        tone: data.tone,
        length: data.length,
        keywords: data.keywords,
        category_id: data.category_id,
        default_tags: data.default_tags
          ? data.default_tags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
      };

      if (editingTemplate) {
        await BlogTemplateService.updateTemplate(editingTemplate.id, templateData);
        toast({
          title: '✅ Template updated',
          description: `${data.name} has been updated`,
        });
      } else {
        await BlogTemplateService.createTemplate(templateData);
        toast({
          title: '✅ Template created',
          description: `${data.name} has been created`,
        });
      }

      setShowCreateDialog(false);
      setEditingTemplate(null);
      form.reset();
      loadTemplates();
    } catch (_error) {
      logger.error('Error saving template:', _error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: BlogTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || '',
      topic_template: template.topic_template,
      audience: template.audience,
      tone: template.tone,
      length: template.length,
      keywords: template.keywords || '',
      category_id: template.category_id || undefined,
      default_tags: template.default_tags?.join(', ') || '',
    });
    setShowCreateDialog(true);
  };

  const handleDuplicate = async (template: BlogTemplate) => {
    try {
      const newName = `${template.name} (Copy)`;
      await BlogTemplateService.duplicateTemplate(template.id, newName);
      toast({
        title: '✅ Template duplicated',
        description: `Created ${newName}`,
      });
      loadTemplates();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (template: BlogTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await BlogTemplateService.deleteTemplate(template.id);
      toast({
        title: '🗑️ Template deleted',
        description: `${template.name} has been deleted`,
      });
      loadTemplates();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    form.reset({
      audience: 'professional',
      tone: 'professional',
      length: 'medium',
    });
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Templates</CardTitle>
              <CardDescription>
                Create reusable templates for common blog topics to save time
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
                  <DialogDescription>
                    Define a reusable template for batch blog generation
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., AI Fundamentals Series" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Brief description of this template"
                              rows={2}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topic_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic Template *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Use {topic} as a placeholder, e.g., 'Understanding {topic} in AI'"
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Use {'{topic}'} as a placeholder for the actual topic
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="audience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audience</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="primary">Primary (5-11)</SelectItem>
                                <SelectItem value="secondary">Secondary (12-18)</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Short</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Keywords</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="AI, tutorial, guide" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="default_tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tags</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tutorial, Beginner, AI" />
                          </FormControl>
                          <FormDescription>Comma-separated list of tags</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : editingTemplate ? (
                          'Update Template'
                        ) : (
                          'Create Template'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No templates yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first template to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Topic Pattern</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {template.topic_template}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.audience}</Badge>
                      </TableCell>
                      <TableCell>{templateUsage[template.id] || 0}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(template)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
