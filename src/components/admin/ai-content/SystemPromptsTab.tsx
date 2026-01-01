/**
 * System Prompts Tab
 *
 * Manages AI system prompts with CRUD operations
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
import { Plus, Edit, Trash2, Eye, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIContentService, type AISystemPrompt } from '@/services/ai/AIContentService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const CATEGORIES = ['chatbot', 'grading', 'explanation', 'assessment', 'study_guide', 'quiz'];
const AUDIENCES = ['all', 'primary', 'secondary', 'professional', 'business'];

export default function SystemPromptsTab() {
  const [prompts, setPrompts] = useState<AISystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<AISystemPrompt | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    prompt_template: '',
    variables: [] as string[],
    audience: 'all',
    category: 'chatbot',
  });
  const { toast } = useToast();

  // Load prompts
  const loadPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (_error) {
      logger.error('Error loading prompts:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load system prompts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch =
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || prompt.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      prompt_template: '',
      variables: [],
      audience: 'all',
      category: 'chatbot',
    });
    setSelectedPrompt(null);
    setEditDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (prompt: AISystemPrompt) => {
    setFormData({
      key: prompt.key,
      name: prompt.name,
      description: prompt.description || '',
      prompt_template: prompt.prompt_template,
      variables: prompt.variables,
      audience: prompt.audience || 'all',
      category: prompt.category,
    });
    setSelectedPrompt(prompt);
    setEditDialogOpen(true);
  };

  // Save prompt (create or update)
  const savePrompt = async () => {
    try {
      // Extract variables from template
      const variableMatches = formData.prompt_template.match(/\{\{([^}]+)\}\}/g);
      const extractedVars = variableMatches
        ? Array.from(new Set(variableMatches.map(v => v.replace(/[{}]/g, '').trim())))
        : [];

      const promptData = {
        key: formData.key,
        name: formData.name,
        description: formData.description || null,
        prompt_template: formData.prompt_template,
        variables: extractedVars,
        audience: formData.audience,
        category: formData.category,
        is_active: true,
        version: 1,
      };

      if (selectedPrompt) {
        // Update existing
        const updated = await AIContentService.updateSystemPrompt(selectedPrompt.id, promptData);
        if (!updated) throw new Error('Failed to update prompt');

        toast({
          title: 'Success',
          description: 'System prompt updated successfully',
        });
      } else {
        // Create new
        const created = await AIContentService.createSystemPrompt(promptData);
        if (!created) throw new Error('Failed to create prompt');

        toast({
          title: 'Success',
          description: 'System prompt created successfully',
        });
      }

      setEditDialogOpen(false);
      loadPrompts();
    } catch (_error) {
      logger.error('Error saving prompt:', _error);
      toast({
        title: 'Error',
        description: 'Failed to save system prompt',
        variant: 'destructive',
      });
    }
  };

  // Delete prompt
  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await AIContentService.deleteSystemPrompt(id);
      if (!success) throw new Error('Failed to delete prompt');

      toast({
        title: 'Success',
        description: 'System prompt deleted successfully',
      });
      loadPrompts();
    } catch (_error) {
      logger.error('Error deleting prompt:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete system prompt',
        variant: 'destructive',
      });
    }
  };

  // Preview prompt
  const openPreview = (prompt: AISystemPrompt) => {
    setSelectedPrompt(prompt);
    setPreviewDialogOpen(true);
  };

  // Clear cache
  const clearCache = () => {
    AIContentService.clearCache();
    toast({
      title: 'Success',
      description: 'Cache cleared successfully',
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
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

        <Button onClick={clearCache} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Cache
        </Button>

        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      {/* Prompts Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading prompts...</div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No prompts found. Create your first system prompt.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.map(prompt => (
                <TableRow key={prompt.id}>
                  <TableCell className="font-medium">{prompt.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{prompt.key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{prompt.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{prompt.audience || 'all'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {prompt.variables.slice(0, 3).map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                      {prompt.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{prompt.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(prompt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(prompt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePrompt(prompt.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPrompt ? 'Edit System Prompt' : 'Create System Prompt'}
            </DialogTitle>
            <DialogDescription>
              Use {'{{variable_name}}'} syntax for dynamic content. Variables will be auto-detected.
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
                  placeholder="e.g., chatbot_main"
                  disabled={!!selectedPrompt}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chatbot Main Prompt"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this prompt's purpose"
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
                <Label htmlFor="audience">Audience</Label>
                <Select
                  value={formData.audience}
                  onValueChange={value => setFormData({ ...formData, audience: value })}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map(aud => (
                      <SelectItem key={aud} value={aud}>
                        {aud}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Prompt Template</Label>
              <Textarea
                id="template"
                value={formData.prompt_template}
                onChange={e => setFormData({ ...formData, prompt_template: e.target.value })}
                placeholder="You are an AI assistant. Use {{variable}} for dynamic content..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Detected variables:{' '}
                {formData.prompt_template.match(/\{\{([^}]+)\}\}/g)?.join(', ') || 'none'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePrompt}>{selectedPrompt ? 'Update' : 'Create'} Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPrompt?.name}</DialogTitle>
            <DialogDescription>{selectedPrompt?.description}</DialogDescription>
          </DialogHeader>

          {selectedPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Key:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{selectedPrompt.key}</code>
                </div>
                <div>
                  <span className="font-semibold">Category:</span>{' '}
                  <Badge variant="outline">{selectedPrompt.category}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Audience:</span>{' '}
                  <Badge variant="secondary">{selectedPrompt.audience || 'all'}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Version:</span> {selectedPrompt.version}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Variables ({selectedPrompt.variables.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPrompt.variables.map((v, i) => (
                    <Badge key={i} variant="outline">
                      {v}
                    </Badge>
                  ))}
                  {selectedPrompt.variables.length === 0 && (
                    <span className="text-sm text-muted-foreground">No variables</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prompt Template</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedPrompt.prompt_template}
                  </pre>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Created: {new Date(selectedPrompt.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(selectedPrompt.updated_at).toLocaleString()}</div>
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
                if (selectedPrompt) openEditDialog(selectedPrompt);
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
