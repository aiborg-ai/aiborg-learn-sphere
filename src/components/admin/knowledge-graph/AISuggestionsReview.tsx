/**
 * AI Suggestions Review
 *
 * Interface for reviewing and approving AI-generated concept suggestions
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Info,
  BookOpen,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  ConceptSuggestionService,
  type SuggestionBatch,
  type ConceptSuggestion,
  type RelationshipSuggestion,
} from '@/services/knowledge-graph/ConceptSuggestionService';

interface Course {
  id: number;
  title: string;
  category: string;
  keywords: string[];
}

export function AISuggestionsReview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batch, setBatch] = useState<SuggestionBatch | null>(null);

  // Form state
  const [sourceType, setSourceType] = useState<'course' | 'concept'>('course');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [conceptName, setConceptName] = useState('');
  const [context, setContext] = useState('');
  const [aiProvider, setAiProvider] = useState<'ollama' | 'openai'>('ollama');

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, category, keywords')
        .order('title');

      if (error) throw error;

      setCourses((data as Course[]) || []);
    } catch (_error) {
      logger.error('Error loading courses:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (sourceType === 'course' && !selectedCourseId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    if (sourceType === 'concept' && !conceptName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a concept name',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setBatch(null);

    try {
      let newBatch: SuggestionBatch;

      if (sourceType === 'course') {
        newBatch = await ConceptSuggestionService.suggestFromCourse(
          parseInt(selectedCourseId),
          context || undefined,
          aiProvider
        );
      } else {
        newBatch = await ConceptSuggestionService.suggestRelatedConcepts(
          conceptName.trim(),
          context || undefined,
          aiProvider
        );
      }

      setBatch(newBatch);

      toast({
        title: 'Success',
        description: `Generated ${newBatch.concepts.length} concept suggestions`,
      });
    } catch (_error) {
      logger.error('Error generating suggestions:', _error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate suggestions',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveConcept = (concept: ConceptSuggestion) => {
    if (!batch) return;

    const updatedBatch = { ...batch };
    const conceptIndex = updatedBatch.concepts.findIndex(c => c.id === concept.id);
    if (conceptIndex !== -1) {
      updatedBatch.concepts[conceptIndex].status = 'approved';
      setBatch(updatedBatch);
    }
  };

  const handleRejectConcept = (concept: ConceptSuggestion) => {
    if (!batch) return;

    const updatedBatch = { ...batch };
    const conceptIndex = updatedBatch.concepts.findIndex(c => c.id === concept.id);
    if (conceptIndex !== -1) {
      updatedBatch.concepts[conceptIndex].status = 'rejected';
      setBatch(updatedBatch);
    }
  };

  const handleApproveRelationship = (relationship: RelationshipSuggestion) => {
    if (!batch) return;

    const updatedBatch = { ...batch };
    const relIndex = updatedBatch.relationships.findIndex(r => r.id === relationship.id);
    if (relIndex !== -1) {
      updatedBatch.relationships[relIndex].status = 'approved';
      setBatch(updatedBatch);
    }
  };

  const handleRejectRelationship = (relationship: RelationshipSuggestion) => {
    if (!batch) return;

    const updatedBatch = { ...batch };
    const relIndex = updatedBatch.relationships.findIndex(r => r.id === relationship.id);
    if (relIndex !== -1) {
      updatedBatch.relationships[relIndex].status = 'rejected';
      setBatch(updatedBatch);
    }
  };

  const handleApproveAll = async () => {
    if (!batch) return;

    setApproving(true);

    try {
      const result = await ConceptSuggestionService.approveBatch(batch);

      toast({
        title: 'Batch Approved',
        description: `Created ${result.concepts_created} concepts, ${result.relationships_created} relationships, ${result.mappings_created} course mappings`,
      });

      // Refresh the batch to show updated statuses
      setBatch({ ...batch });
    } catch (_error) {
      logger.error('Error approving batch:', _error);
      toast({
        title: 'Error',
        description: 'Failed to approve batch',
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectAll = () => {
    if (!batch) return;

    ConceptSuggestionService.rejectBatch(batch);
    setBatch({ ...batch });

    toast({
      title: 'Batch Rejected',
      description: 'All suggestions marked as rejected',
    });
  };

  const getConceptTypeBadgeColor = (type: string) => {
    const colors = {
      skill: 'bg-blue-100 text-blue-800',
      topic: 'bg-purple-100 text-purple-800',
      technology: 'bg-green-100 text-green-800',
      technique: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyBadgeColor = (level: string) => {
    const colors = {
      beginner: 'bg-emerald-100 text-emerald-800',
      intermediate: 'bg-amber-100 text-amber-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRelationshipBadgeColor = (type: string) => {
    const colors = {
      prerequisite: 'bg-red-100 text-red-800',
      related_to: 'bg-blue-100 text-blue-800',
      part_of: 'bg-purple-100 text-purple-800',
      builds_on: 'bg-green-100 text-green-800',
      alternative_to: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const pendingConcepts = batch?.concepts.filter(c => c.status === 'pending').length || 0;
  const pendingRelationships = batch?.relationships.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use AI to automatically extract learning concepts from courses or suggest related concepts
          for knowledge graph expansion.
        </AlertDescription>
      </Alert>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Suggestions</CardTitle>
          <CardDescription>
            Select a source and let AI suggest concepts, relationships, and course mappings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Type */}
          <div className="space-y-2">
            <Label>Source Type</Label>
            <Select
              value={sourceType}
              onValueChange={(value: 'course' | 'concept') => setSourceType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course (extract concepts from course)</SelectItem>
                <SelectItem value="concept">Concept (suggest related concepts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          {sourceType === 'course' && (
            <div className="space-y-2">
              <Label htmlFor="course-select">Course *</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="course-select">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title} ({course.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Concept Name */}
          {sourceType === 'concept' && (
            <div className="space-y-2">
              <Label htmlFor="concept-name">Concept Name *</Label>
              <Input
                id="concept-name"
                placeholder="e.g., Python Programming, Machine Learning"
                value={conceptName}
                onChange={e => setConceptName(e.target.value)}
              />
            </div>
          )}

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Input
              id="context"
              placeholder="e.g., Focus on beginner-level concepts, Include advanced topics"
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>

          {/* AI Provider */}
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select
              value={aiProvider}
              onValueChange={(value: 'ollama' | 'openai') => setAiProvider(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama (Free, Local)</SelectItem>
                <SelectItem value="openai">OpenAI (Requires API Key)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {batch && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Suggestion Batch</CardTitle>
              <CardDescription>
                {batch.source_type === 'course'
                  ? `From: ${batch.source_data?.title || 'Course'}`
                  : `Related to: ${batch.source_id}`}{' '}
                • Generated with {batch.ai_provider} in {batch.generation_time_ms}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {batch.concepts.length} Concepts ({pendingConcepts} pending)
                </Badge>
                <Badge variant="secondary">
                  {batch.relationships.length} Relationships ({pendingRelationships} pending)
                </Badge>
                {batch.course_mappings && (
                  <Badge variant="secondary">{batch.course_mappings.length} Course Mappings</Badge>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleApproveAll}
                  disabled={approving || (pendingConcepts === 0 && pendingRelationships === 0)}
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All Pending
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  disabled={pendingConcepts === 0 && pendingRelationships === 0}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject All
                </Button>
                <Button variant="ghost" onClick={() => setBatch(null)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Concepts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Concepts</CardTitle>
              <CardDescription>Review and approve/reject individual concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.concepts.map(concept => (
                    <TableRow key={concept.id}>
                      <TableCell>{getStatusIcon(concept.status)}</TableCell>
                      <TableCell className="font-medium">{concept.name}</TableCell>
                      <TableCell>
                        <Badge className={getConceptTypeBadgeColor(concept.type)}>
                          {concept.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyBadgeColor(concept.difficulty_level)}>
                          {concept.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{concept.description}</TableCell>
                      <TableCell>
                        {concept.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveConcept(concept)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectConcept(concept)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Relationships Table */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Relationships</CardTitle>
              <CardDescription>Review and approve/reject concept relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.relationships.map(rel => (
                    <TableRow key={rel.id}>
                      <TableCell>{getStatusIcon(rel.status)}</TableCell>
                      <TableCell className="font-medium">{rel.source_concept}</TableCell>
                      <TableCell>
                        <Badge className={getRelationshipBadgeColor(rel.relationship_type)}>
                          {rel.relationship_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{rel.target_concept}</TableCell>
                      <TableCell>{(rel.strength * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        {rel.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveRelationship(rel)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectRelationship(rel)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Course Mappings Table (if applicable) */}
          {batch.course_mappings && batch.course_mappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Course Mappings</CardTitle>
                <CardDescription>How these concepts will be linked to the course</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concept</TableHead>
                      <TableHead>Coverage Level</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.course_mappings.map(mapping => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-medium">{mapping.concept_name}</TableCell>
                        <TableCell>
                          <Badge>{mapping.coverage_level}</Badge>
                        </TableCell>
                        <TableCell>
                          {mapping.is_primary ? <Badge variant="secondary">Primary</Badge> : '-'}
                        </TableCell>
                        <TableCell>{(mapping.weight * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!batch && !generating && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No suggestions generated yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Select a course or concept above and click "Generate Suggestions" to begin
          </p>
        </div>
      )}
    </div>
  );
}
