/**
 * Grading Rubrics Tab
 *
 * Manages AI grading rubrics with criteria, weights, and scoring levels
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
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, Search, Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AIContentService,
  type GradingRubric,
  type RubricCriterion,
} from '@/services/ai/AIContentService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const SUBJECT_AREAS = [
  'general',
  'ai_ml',
  'programming',
  'mathematics',
  'science',
  'language',
  'business',
];

export default function GradingRubricsTab() {
  const [rubrics, setRubrics] = useState<GradingRubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<GradingRubric | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    pass_score: 0.65,
    strictness: 0.5,
    is_default: false,
    subject_area: 'general',
    criteria: [] as RubricCriterion[],
  });
  const { toast } = useToast();

  // Load rubrics
  const loadRubrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grading_rubrics')
        .select('*')
        .eq('is_active', true)
        .order('subject_area', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setRubrics(data || []);
    } catch (_error) {
      logger.error('Error loading rubrics:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load grading rubrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter rubrics
  const filteredRubrics = rubrics.filter(rubric => {
    const matchesSearch =
      rubric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rubric.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || rubric.subject_area === filterSubject;
    return matchesSearch && matchesSubject;
  });

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      pass_score: 0.65,
      strictness: 0.5,
      is_default: false,
      subject_area: 'general',
      criteria: [
        { name: 'Accuracy', description: 'Correctness of information', weight: 0.4 },
        { name: 'Completeness', description: 'Coverage of key points', weight: 0.3 },
        { name: 'Clarity', description: 'Clear and well-organized', weight: 0.2 },
        { name: 'Understanding', description: 'Demonstrates understanding', weight: 0.1 },
      ],
    });
    setSelectedRubric(null);
    setEditDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (rubric: GradingRubric) => {
    setFormData({
      key: rubric.key,
      name: rubric.name,
      description: rubric.description || '',
      pass_score: rubric.pass_score,
      strictness: rubric.strictness,
      is_default: rubric.is_default,
      subject_area: rubric.subject_area || 'general',
      criteria: rubric.criteria,
    });
    setSelectedRubric(rubric);
    setEditDialogOpen(true);
  };

  // Add criterion
  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: '', description: '', weight: 0.1 }],
    });
  };

  // Remove criterion
  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  // Update criterion
  const updateCriterion = (index: number, field: keyof RubricCriterion, value: any) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  // Normalize weights
  const normalizeWeights = () => {
    const total = formData.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (total === 0) return;

    const normalized = formData.criteria.map(c => ({
      ...c,
      weight: parseFloat((c.weight / total).toFixed(2)),
    }));

    setFormData({ ...formData, criteria: normalized });
  };

  // Save rubric
  const saveRubric = async () => {
    try {
      // Validate
      if (!formData.name || !formData.key) {
        toast({
          title: 'Validation Error',
          description: 'Name and key are required',
          variant: 'destructive',
        });
        return;
      }

      if (formData.criteria.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one criterion is required',
          variant: 'destructive',
        });
        return;
      }

      const rubricData = {
        key: formData.key,
        name: formData.name,
        description: formData.description || null,
        criteria: formData.criteria,
        pass_score: formData.pass_score,
        strictness: formData.strictness,
        is_default: formData.is_default,
        subject_area: formData.subject_area,
        is_active: true,
      };

      if (selectedRubric) {
        // Update existing
        const updated = await AIContentService.updateGradingRubric(selectedRubric.id, rubricData);
        if (!updated) throw new Error('Failed to update rubric');

        toast({
          title: 'Success',
          description: 'Grading rubric updated successfully',
        });
      } else {
        // Create new
        const created = await AIContentService.createGradingRubric(rubricData);
        if (!created) throw new Error('Failed to create rubric');

        toast({
          title: 'Success',
          description: 'Grading rubric created successfully',
        });
      }

      setEditDialogOpen(false);
      loadRubrics();
    } catch (_error) {
      logger.error('Error saving rubric:', _error);
      toast({
        title: 'Error',
        description: 'Failed to save grading rubric',
        variant: 'destructive',
      });
    }
  };

  // Delete rubric
  const deleteRubric = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rubric? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grading_rubrics')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Grading rubric deleted successfully',
      });
      AIContentService.clearCache();
      loadRubrics();
    } catch (_error) {
      logger.error('Error deleting rubric:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete grading rubric',
        variant: 'destructive',
      });
    }
  };

  // Preview rubric
  const openPreview = (rubric: GradingRubric) => {
    setSelectedRubric(rubric);
    setPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rubrics..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECT_AREAS.map(subj => (
              <SelectItem key={subj} value={subj}>
                {subj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Rubric
        </Button>
      </div>

      {/* Rubrics Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading rubrics...</div>
      ) : filteredRubrics.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No rubrics found. Create your first grading rubric.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Pass Score</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRubrics.map(rubric => (
                <TableRow key={rubric.id}>
                  <TableCell className="font-medium">{rubric.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{rubric.key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rubric.subject_area || 'general'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rubric.criteria.length} criteria</Badge>
                  </TableCell>
                  <TableCell>{Math.round(rubric.pass_score * 100)}%</TableCell>
                  <TableCell>
                    {rubric.is_default && <Star className="h-4 w-4 text-yellow-500" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(rubric)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(rubric)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteRubric(rubric.id)}>
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
              {selectedRubric ? 'Edit Grading Rubric' : 'Create Grading Rubric'}
            </DialogTitle>
            <DialogDescription>
              Define criteria with weights (must sum to 1.0). Higher weights have more impact on
              final score.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key (unique identifier)</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., ai_ml_rubric"
                  disabled={!!selectedRubric}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AI/ML Assessment Rubric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this rubric"
                rows={2}
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject_area">Subject Area</Label>
                <Select
                  value={formData.subject_area}
                  onValueChange={value => setFormData({ ...formData, subject_area: value })}
                >
                  <SelectTrigger id="subject_area">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_AREAS.map(subj => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass_score">Pass Score (0-1)</Label>
                <Input
                  id="pass_score"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.pass_score}
                  onChange={e =>
                    setFormData({ ...formData, pass_score: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(formData.pass_score * 100)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strictness">Strictness (0-1)</Label>
                <Input
                  id="strictness"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.strictness}
                  onChange={e =>
                    setFormData({ ...formData, strictness: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.strictness > 0.7
                    ? 'Strict'
                    : formData.strictness < 0.3
                      ? 'Lenient'
                      : 'Standard'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={checked => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as default rubric for this subject</Label>
            </div>

            {/* Criteria */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Grading Criteria ({formData.criteria.length})</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={normalizeWeights}>
                    Normalize Weights
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Criterion
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.criteria.map((criterion, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Name"
                        value={criterion.name}
                        onChange={e => updateCriterion(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={criterion.description}
                        onChange={e => updateCriterion(index, 'description', e.target.value)}
                        className="col-span-2"
                      />
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Weight:</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={criterion.weight}
                            onChange={e =>
                              updateCriterion(index, 'weight', parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(criterion.weight * 100)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Total weight: {formData.criteria.reduce((sum, c) => sum + c.weight, 0).toFixed(2)}
                {Math.abs(formData.criteria.reduce((sum, c) => sum + c.weight, 0) - 1) > 0.01 && (
                  <span className="text-yellow-600 ml-2">⚠ Should equal 1.0</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRubric}>{selectedRubric ? 'Update' : 'Create'} Rubric</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRubric?.name}</DialogTitle>
            <DialogDescription>{selectedRubric?.description}</DialogDescription>
          </DialogHeader>

          {selectedRubric && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Key:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{selectedRubric.key}</code>
                </div>
                <div>
                  <span className="font-semibold">Subject:</span>{' '}
                  <Badge variant="outline">{selectedRubric.subject_area || 'general'}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Pass Score:</span>{' '}
                  {Math.round(selectedRubric.pass_score * 100)}%
                </div>
                <div>
                  <span className="font-semibold">Strictness:</span> {selectedRubric.strictness}
                  {selectedRubric.is_default && (
                    <Badge variant="secondary" className="ml-2">
                      Default
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grading Criteria ({selectedRubric.criteria.length})</Label>
                <div className="space-y-2">
                  {selectedRubric.criteria.map((criterion, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{criterion.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {criterion.description}
                          </div>
                        </div>
                        <Badge variant="secondary">{Math.round(criterion.weight * 100)}%</Badge>
                      </div>
                    </div>
                  ))}
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
                if (selectedRubric) openEditDialog(selectedRubric);
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
