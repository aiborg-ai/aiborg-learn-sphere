/**
 * Relationships Manager
 *
 * Manage relationships between concepts (edges in the knowledge graph)
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
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Pencil, Trash2, GitBranch, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KnowledgeGraphService } from '@/services/knowledge-graph';
import { logger } from '@/utils/logger';
import type {
  Concept,
  ConceptRelationship,
  RelationshipType,
  InsertConceptRelationship,
} from '@/types/knowledge-graph';

export function RelationshipsManager() {
  const { toast } = useToast();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [relationships, setRelationships] = useState<ConceptRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<ConceptRelationship | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<InsertConceptRelationship>({
    source_concept_id: '',
    target_concept_id: '',
    relationship_type: 'prerequisite',
    strength: 0.5,
    description: '',
    is_active: true,
  });

  // Load data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conceptsData, relationshipsData] = await Promise.all([
        KnowledgeGraphService.getConcepts({ is_active: true }),
        loadAllRelationships(),
      ]);
      setConcepts(conceptsData);
      setRelationships(relationshipsData);
    } catch (_error) {
      logger.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllRelationships = async (): Promise<ConceptRelationship[]> => {
    // Get relationships for all concepts
    const conceptsData = await KnowledgeGraphService.getConcepts({ is_active: true });
    const allRelationships: ConceptRelationship[] = [];
    const seen = new Set<string>();

    for (const concept of conceptsData) {
      const rels = await KnowledgeGraphService.getRelationships(concept.id);
      for (const rel of rels) {
        if (!seen.has(rel.id)) {
          seen.add(rel.id);
          allRelationships.push(rel);
        }
      }
    }

    return allRelationships;
  };

  // Filter relationships
  const filteredRelationships = relationships.filter(rel => {
    const sourceName = rel.source_concept?.name || '';
    const targetName = rel.target_concept?.name || '';

    const matchesSearch =
      searchQuery === '' ||
      sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || rel.relationship_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Create relationship
  const handleCreate = async () => {
    // Validate
    if (!formData.source_concept_id || !formData.target_concept_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select both source and target concepts',
        variant: 'destructive',
      });
      return;
    }

    if (formData.source_concept_id === formData.target_concept_id) {
      toast({
        title: 'Validation Error',
        description: 'Source and target must be different concepts',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newRelationship = await KnowledgeGraphService.createRelationship(formData);

      if (newRelationship) {
        toast({
          title: 'Success',
          description: 'Relationship created successfully',
        });
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to create relationship - may create circular dependency');
      }
    } catch (_error) {
      logger.error('Error creating relationship:', error);
      toast({
        title: 'Error',
        description: 'Failed to create relationship. May create circular dependency or duplicate.',
        variant: 'destructive',
      });
    }
  };

  // Update relationship
  const handleUpdate = async () => {
    if (!selectedRelationship) return;

    try {
      const updated = await KnowledgeGraphService.updateRelationship(selectedRelationship.id, {
        strength: formData.strength,
        description: formData.description,
        is_active: formData.is_active,
      });

      if (updated) {
        toast({
          title: 'Success',
          description: 'Relationship updated successfully',
        });
        setEditDialogOpen(false);
        setSelectedRelationship(null);
        resetForm();
        loadData();
      } else {
        throw new Error('Failed to update relationship');
      }
    } catch (_error) {
      logger.error('Error updating relationship:', error);
      toast({
        title: 'Error',
        description: 'Failed to update relationship',
        variant: 'destructive',
      });
    }
  };

  // Delete relationship
  const handleDelete = async (relationship: ConceptRelationship) => {
    const sourceName = relationship.source_concept?.name || 'Unknown';
    const targetName = relationship.target_concept?.name || 'Unknown';

    if (
      !confirm(
        `Are you sure you want to delete the relationship: "${sourceName}" → "${targetName}"?`
      )
    ) {
      return;
    }

    try {
      const success = await KnowledgeGraphService.deleteRelationship(relationship.id);

      if (success) {
        toast({
          title: 'Success',
          description: 'Relationship deleted successfully',
        });
        loadData();
      } else {
        throw new Error('Failed to delete relationship');
      }
    } catch (_error) {
      logger.error('Error deleting relationship:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete relationship',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (relationship: ConceptRelationship) => {
    setSelectedRelationship(relationship);
    setFormData({
      source_concept_id: relationship.source_concept_id,
      target_concept_id: relationship.target_concept_id,
      relationship_type: relationship.relationship_type,
      strength: relationship.strength,
      description: relationship.description || '',
      is_active: relationship.is_active,
    });
    setEditDialogOpen(true);
  };

  // Open preview dialog
  const openPreviewDialog = (relationship: ConceptRelationship) => {
    setSelectedRelationship(relationship);
    setPreviewDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      source_concept_id: '',
      target_concept_id: '',
      relationship_type: 'prerequisite',
      strength: 0.5,
      description: '',
      is_active: true,
    });
  };

  // Relationship type badge colors
  const getTypeBadgeColor = (type: RelationshipType) => {
    const colors = {
      prerequisite: 'bg-red-100 text-red-800',
      related_to: 'bg-blue-100 text-blue-800',
      part_of: 'bg-purple-100 text-purple-800',
      builds_on: 'bg-green-100 text-green-800',
      alternative_to: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Relationship type descriptions
  const getTypeDescription = (type: RelationshipType) => {
    const descriptions = {
      prerequisite: 'Must learn source before target',
      related_to: 'Concepts are similar or complementary',
      part_of: 'Source is a component of target',
      builds_on: 'Target extends or enhances source',
      alternative_to: 'Different approaches to the same goal',
    };
    return descriptions[type] || '';
  };

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Relationships define how concepts connect in the knowledge graph. Prerequisite
          relationships are used to validate course enrollment and learning paths.
        </AlertDescription>
      </Alert>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search relationships..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="prerequisite">Prerequisite</SelectItem>
            <SelectItem value="related_to">Related To</SelectItem>
            <SelectItem value="part_of">Part Of</SelectItem>
            <SelectItem value="builds_on">Builds On</SelectItem>
            <SelectItem value="alternative_to">Alternative To</SelectItem>
          </SelectContent>
        </Select>

        {/* New Relationship Button */}
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Relationship
        </Button>
      </div>

      {/* Relationships Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">→</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading relationships...
                </TableCell>
              </TableRow>
            ) : filteredRelationships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <GitBranch className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== 'all'
                        ? 'No relationships match your filters'
                        : 'No relationships yet. Create your first relationship!'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRelationships.map(rel => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium">
                    {rel.source_concept?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">→</TableCell>
                  <TableCell className="font-medium">
                    {rel.target_concept?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(rel.relationship_type)}>
                      {rel.relationship_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${rel.strength * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(rel.strength * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreviewDialog(rel)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(rel)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rel)}>
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
        Showing {filteredRelationships.length} of {relationships.length} relationships
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Relationship</DialogTitle>
            <DialogDescription>Define a relationship between two concepts</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Concept */}
            <div className="space-y-2">
              <Label htmlFor="create-source">Source Concept *</Label>
              <Select
                value={formData.source_concept_id}
                onValueChange={value => setFormData({ ...formData, source_concept_id: value })}
              >
                <SelectTrigger id="create-source">
                  <SelectValue placeholder="Select source concept" />
                </SelectTrigger>
                <SelectContent>
                  {concepts.map(concept => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Relationship Type */}
            <div className="space-y-2">
              <Label htmlFor="create-type">Relationship Type *</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(value: RelationshipType) =>
                  setFormData({ ...formData, relationship_type: value })
                }
              >
                <SelectTrigger id="create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prerequisite">
                    Prerequisite - {getTypeDescription('prerequisite')}
                  </SelectItem>
                  <SelectItem value="related_to">
                    Related To - {getTypeDescription('related_to')}
                  </SelectItem>
                  <SelectItem value="part_of">Part Of - {getTypeDescription('part_of')}</SelectItem>
                  <SelectItem value="builds_on">
                    Builds On - {getTypeDescription('builds_on')}
                  </SelectItem>
                  <SelectItem value="alternative_to">
                    Alternative To - {getTypeDescription('alternative_to')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Concept */}
            <div className="space-y-2">
              <Label htmlFor="create-target">Target Concept *</Label>
              <Select
                value={formData.target_concept_id}
                onValueChange={value => setFormData({ ...formData, target_concept_id: value })}
              >
                <SelectTrigger id="create-target">
                  <SelectValue placeholder="Select target concept" />
                </SelectTrigger>
                <SelectContent>
                  {concepts.map(concept => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strength */}
            <div className="space-y-2">
              <Label>Strength: {(formData.strength * 100).toFixed(0)}%</Label>
              <Slider
                value={[formData.strength]}
                onValueChange={([value]) => setFormData({ ...formData, strength: value })}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How strong is this relationship? (0 = weak, 100 = very strong)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Why does this relationship exist?..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Relationship</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Relationship</DialogTitle>
            <DialogDescription>Update relationship properties</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source (disabled) */}
            <div className="space-y-2">
              <Label>Source Concept</Label>
              <Input
                value={concepts.find(c => c.id === formData.source_concept_id)?.name || ''}
                disabled
              />
            </div>

            {/* Type (disabled) */}
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Input value={formData.relationship_type.replace('_', ' ')} disabled />
            </div>

            {/* Target (disabled) */}
            <div className="space-y-2">
              <Label>Target Concept</Label>
              <Input
                value={concepts.find(c => c.id === formData.target_concept_id)?.name || ''}
                disabled
              />
            </div>

            {/* Strength */}
            <div className="space-y-2">
              <Label>Strength: {(formData.strength * 100).toFixed(0)}%</Label>
              <Slider
                value={[formData.strength]}
                onValueChange={([value]) => setFormData({ ...formData, strength: value })}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Relationship</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Relationship Details</DialogTitle>
          </DialogHeader>

          {selectedRelationship && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-semibold">{selectedRelationship.source_concept?.name}</p>
                    <p className="text-xs text-muted-foreground">Source</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center">
                    <p className="font-semibold">{selectedRelationship.target_concept?.name}</p>
                    <p className="text-xs text-muted-foreground">Target</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <div className="mt-1">
                  <Badge className={getTypeBadgeColor(selectedRelationship.relationship_type)}>
                    {selectedRelationship.relationship_type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getTypeDescription(selectedRelationship.relationship_type)}
                </p>
              </div>

              <div>
                <Label>Strength</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${selectedRelationship.strength * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {(selectedRelationship.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {selectedRelationship.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm mt-1">{selectedRelationship.description}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(selectedRelationship.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(selectedRelationship.updated_at).toLocaleString()}</p>
                <p>ID: {selectedRelationship.id}</p>
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
