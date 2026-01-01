/**
 * Concepts Manager
 *
 * CRUD interface for managing learning concepts (nodes in the knowledge graph)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Pencil, Trash2, Network } from 'lucide-react';
import { KnowledgeGraphService } from '@/services/knowledge-graph';
import type { Concept, ConceptType, DifficultyLevel, InsertConcept } from '@/types/knowledge-graph';
import { logger } from '@/utils/logger';

export function ConceptsManager() {
  const { toast } = useToast();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  // Form state
  const [formData, setFormData] = useState<InsertConcept>({
    name: '',
    slug: '',
    description: '',
    type: 'skill',
    difficulty_level: 'beginner',
    estimated_hours: 5,
    metadata: {},
    is_active: true,
  });

  // Load concepts
  useEffect(() => {
    loadConcepts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const data = await KnowledgeGraphService.getConcepts({ is_active: true });
      setConcepts(data);
    } catch (_error) {
      logger.error('Error loading concepts:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load concepts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter concepts
  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch =
      searchQuery === '' ||
      concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType = typeFilter === 'all' || concept.type === typeFilter;
    const matchesDifficulty =
      difficultyFilter === 'all' || concept.difficulty_level === difficultyFilter;

    return matchesSearch && matchesType && matchesDifficulty;
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData({ ...formData, name, slug });
  };

  // Create concept
  const handleCreate = async () => {
    try {
      const newConcept = await KnowledgeGraphService.createConcept(formData);

      if (newConcept) {
        toast({
          title: 'Success',
          description: `Concept "${formData.name}" created successfully`,
        });
        setCreateDialogOpen(false);
        resetForm();
        loadConcepts();
      } else {
        throw new Error('Failed to create concept');
      }
    } catch (_error) {
      logger.error('Error creating concept:', _error);
      toast({
        title: 'Error',
        description: 'Failed to create concept. Slug may already exist.',
        variant: 'destructive',
      });
    }
  };

  // Update concept
  const handleUpdate = async () => {
    if (!selectedConcept) return;

    try {
      const updated = await KnowledgeGraphService.updateConcept(selectedConcept.id, formData);

      if (updated) {
        toast({
          title: 'Success',
          description: `Concept "${formData.name}" updated successfully`,
        });
        setEditDialogOpen(false);
        setSelectedConcept(null);
        resetForm();
        loadConcepts();
      } else {
        throw new Error('Failed to update concept');
      }
    } catch (_error) {
      logger.error('Error updating concept:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update concept',
        variant: 'destructive',
      });
    }
  };

  // Delete concept
  const handleDelete = async (concept: Concept) => {
    if (
      !confirm(
        `Are you sure you want to delete "${concept.name}"? This will also delete all its relationships.`
      )
    ) {
      return;
    }

    try {
      const success = await KnowledgeGraphService.deleteConcept(concept.id);

      if (success) {
        toast({
          title: 'Success',
          description: `Concept "${concept.name}" deleted successfully`,
        });
        loadConcepts();
      } else {
        throw new Error('Failed to delete concept');
      }
    } catch (_error) {
      logger.error('Error deleting concept:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete concept',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (concept: Concept) => {
    setSelectedConcept(concept);
    setFormData({
      name: concept.name,
      slug: concept.slug,
      description: concept.description || '',
      type: concept.type,
      difficulty_level: concept.difficulty_level,
      estimated_hours: concept.estimated_hours || 5,
      metadata: concept.metadata,
      is_active: concept.is_active,
    });
    setEditDialogOpen(true);
  };

  // Open preview dialog
  const openPreviewDialog = (concept: Concept) => {
    setSelectedConcept(concept);
    setPreviewDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'skill',
      difficulty_level: 'beginner',
      estimated_hours: 5,
      metadata: {},
      is_active: true,
    });
  };

  // Type badge colors
  const getTypeBadgeColor = (type: ConceptType) => {
    const colors = {
      skill: 'bg-blue-100 text-blue-800',
      topic: 'bg-purple-100 text-purple-800',
      technology: 'bg-green-100 text-green-800',
      technique: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Difficulty badge colors
  const getDifficultyBadgeColor = (difficulty: DifficultyLevel) => {
    const colors = {
      beginner: 'bg-emerald-100 text-emerald-800',
      intermediate: 'bg-amber-100 text-amber-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="skill">Skill</SelectItem>
            <SelectItem value="topic">Topic</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="technique">Technique</SelectItem>
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        {/* New Concept Button */}
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Concept
        </Button>
      </div>

      {/* Concepts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Est. Hours</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading concepts...
                </TableCell>
              </TableRow>
            ) : filteredConcepts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Network className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== 'all' || difficultyFilter !== 'all'
                        ? 'No concepts match your filters'
                        : 'No concepts yet. Create your first concept!'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredConcepts.map(concept => (
                <TableRow key={concept.id}>
                  <TableCell className="font-medium">{concept.name}</TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(concept.type)}>{concept.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyBadgeColor(concept.difficulty_level)}>
                      {concept.difficulty_level}
                    </Badge>
                  </TableCell>
                  <TableCell>{concept.estimated_hours || '-'}h</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{concept.slug}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreviewDialog(concept)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(concept)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(concept)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredConcepts.length} of {concepts.length} concepts
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Concept</DialogTitle>
            <DialogDescription>Add a new learning concept to the knowledge graph</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g., Variables, Functions, Machine Learning"
              />
            </div>

            {/* Slug (auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug (URL-friendly) *</Label>
              <Input
                id="create-slug"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., variables, functions, machine-learning"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Must be unique.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this concept covers..."
                rows={3}
              />
            </div>

            {/* Type and Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ConceptType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value: DifficultyLevel) =>
                    setFormData({ ...formData, difficulty_level: value })
                  }
                >
                  <SelectTrigger id="create-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label htmlFor="create-hours">Estimated Hours</Label>
              <Input
                id="create-hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours || 5}
                onChange={e =>
                  setFormData({
                    ...formData,
                    estimated_hours: parseFloat(e.target.value) || 5,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How long it typically takes to learn this concept
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Concept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (same structure as Create) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Concept</DialogTitle>
            <DialogDescription>Update concept details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Same form fields as Create Dialog */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                disabled
              />
              <p className="text-xs text-muted-foreground">Slug cannot be changed after creation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ConceptType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value: DifficultyLevel) =>
                    setFormData({ ...formData, difficulty_level: value })
                  }
                >
                  <SelectTrigger id="edit-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-hours">Estimated Hours</Label>
              <Input
                id="edit-hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours || 5}
                onChange={e =>
                  setFormData({
                    ...formData,
                    estimated_hours: parseFloat(e.target.value) || 5,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Concept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Concept Details</DialogTitle>
          </DialogHeader>

          {selectedConcept && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedConcept.name}</h3>
                <p className="text-sm text-muted-foreground">Slug: {selectedConcept.slug}</p>
              </div>

              {selectedConcept.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm mt-1">{selectedConcept.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <div className="mt-1">
                    <Badge className={getTypeBadgeColor(selectedConcept.type)}>
                      {selectedConcept.type}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <div className="mt-1">
                    <Badge className={getDifficultyBadgeColor(selectedConcept.difficulty_level)}>
                      {selectedConcept.difficulty_level}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label>Estimated Learning Time</Label>
                <p className="text-sm mt-1">{selectedConcept.estimated_hours || '-'} hours</p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(selectedConcept.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(selectedConcept.updated_at).toLocaleString()}</p>
                <p>ID: {selectedConcept.id}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
