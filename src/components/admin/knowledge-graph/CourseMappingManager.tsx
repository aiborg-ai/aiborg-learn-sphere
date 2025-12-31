/**
 * Course Mapping Manager
 *
 * Link concepts to courses with coverage levels
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
import { Plus, Search, Trash2, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { KnowledgeGraphService } from '@/services/knowledge-graph';
import { supabase } from '@/integrations/supabase/client';
import type { Concept, CourseConcept, CoverageLevel } from '@/types/knowledge-graph';
import { logger } from '@/utils/logger';

interface Course {
  id: number;
  title: string;
}

export function CourseMappingManager() {
  const { toast } = useToast();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseConcepts, setCourseConcepts] = useState<CourseConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_id: 0,
    concept_id: '',
    coverage_level: 'covers' as CoverageLevel,
    order_index: 0,
    is_primary: false,
    weight: 0.5,
  });

  // Load data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourseId !== 'all') {
      loadCourseConcepts(parseInt(selectedCourseId));
    } else {
      setCourseConcepts([]);
    }
  }, [selectedCourseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conceptsData, coursesData] = await Promise.all([
        KnowledgeGraphService.getConcepts({ is_active: true }),
        loadCourses(),
      ]);
      setConcepts(conceptsData);
      setCourses(coursesData);
    } catch (_error) {
      logger._error('Error loading data:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase.from('courses').select('id, title').order('title');

    if (error) {
      logger.error('Error loading courses:', error);
      return [];
    }

    return data as Course[];
  };

  const loadCourseConcepts = async (courseId: number) => {
    try {
      const data = await KnowledgeGraphService.getCourseConcepts(courseId);
      setCourseConcepts(data);
    } catch (_error) {
      logger._error('Error loading course concepts:', _error);
    }
  };

  // Add mapping
  const handleAdd = async () => {
    if (!formData.course_id || !formData.concept_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select both course and concept',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await KnowledgeGraphService.linkConceptToCourse(
        formData.course_id,
        formData.concept_id,
        formData.coverage_level,
        {
          order_index: formData.order_index,
          is_primary: formData.is_primary,
          weight: formData.weight,
        }
      );

      if (result) {
        toast({
          title: 'Success',
          description: 'Concept linked to course successfully',
        });
        setAddDialogOpen(false);
        resetForm();
        if (selectedCourseId !== 'all') {
          loadCourseConcepts(parseInt(selectedCourseId));
        }
      } else {
        throw new Error('Failed to link concept');
      }
    } catch (_error) {
      logger._error('Error linking concept:', _error);
      toast({
        title: 'Error',
        description: 'Failed to link concept. May already exist.',
        variant: 'destructive',
      });
    }
  };

  // Remove mapping
  const handleRemove = async (mapping: CourseConcept) => {
    const conceptName = mapping.concept?.name || 'Unknown';
    const courseName = courses.find(c => c.id === mapping.course_id)?.title || 'Unknown';

    if (!confirm(`Are you sure you want to unlink "${conceptName}" from "${courseName}"?`)) {
      return;
    }

    try {
      const success = await KnowledgeGraphService.unlinkConceptFromCourse(
        mapping.course_id,
        mapping.concept_id
      );

      if (success) {
        toast({
          title: 'Success',
          description: 'Concept unlinked from course',
        });
        if (selectedCourseId !== 'all') {
          loadCourseConcepts(parseInt(selectedCourseId));
        }
      } else {
        throw new Error('Failed to unlink concept');
      }
    } catch (_error) {
      logger._error('Error unlinking concept:', _error);
      toast({
        title: 'Error',
        description: 'Failed to unlink concept',
        variant: 'destructive',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      course_id: selectedCourseId !== 'all' ? parseInt(selectedCourseId) : 0,
      concept_id: '',
      coverage_level: 'covers',
      order_index: courseConcepts.length,
      is_primary: false,
      weight: 0.5,
    });
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  // Coverage badge colors
  const getCoverageBadgeColor = (coverage: CoverageLevel) => {
    const colors = {
      introduces: 'bg-blue-100 text-blue-800',
      covers: 'bg-green-100 text-green-800',
      masters: 'bg-purple-100 text-purple-800',
    };
    return colors[coverage] || 'bg-gray-100 text-gray-800';
  };

  // Filter mappings
  const filteredMappings = courseConcepts.filter(mapping => {
    const conceptName = mapping.concept?.name || '';
    return searchQuery === '' || conceptName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Map concepts to courses to track which skills students learn. Coverage levels indicate how
          thoroughly a course teaches each concept.
        </AlertDescription>
      </Alert>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Course Filter */}
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select a course...</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        {selectedCourseId !== 'all' && (
          <>
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

            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Concept
            </Button>
          </>
        )}
      </div>

      {/* Mappings Table */}
      {selectedCourseId !== 'all' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concept</TableHead>
                <TableHead>Coverage Level</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? 'No concepts match your search'
                          : 'No concepts linked to this course yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMappings.map(mapping => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.concept?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCoverageBadgeColor(mapping.coverage_level)}>
                        {mapping.coverage_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.order_index}</TableCell>
                    <TableCell>
                      {mapping.is_primary ? <Badge variant="secondary">Primary</Badge> : '-'}
                    </TableCell>
                    <TableCell>{(mapping.weight * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(mapping)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCourseId === 'all' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Select a course to manage its concepts</p>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a course from the dropdown above to view and edit its concept mappings
          </p>
        </div>
      )}

      {/* Summary */}
      {selectedCourseId !== 'all' && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredMappings.length} of {courseConcepts.length} concepts for this course
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Link Concept to Course</DialogTitle>
            <DialogDescription>
              Add a concept to track what students learn in this course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Course */}
            <div className="space-y-2">
              <Label htmlFor="add-course">Course</Label>
              <Select
                value={formData.course_id.toString()}
                onValueChange={value => setFormData({ ...formData, course_id: parseInt(value) })}
              >
                <SelectTrigger id="add-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concept */}
            <div className="space-y-2">
              <Label htmlFor="add-concept">Concept *</Label>
              <Select
                value={formData.concept_id}
                onValueChange={value => setFormData({ ...formData, concept_id: value })}
              >
                <SelectTrigger id="add-concept">
                  <SelectValue placeholder="Select concept" />
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

            {/* Coverage Level */}
            <div className="space-y-2">
              <Label htmlFor="add-coverage">Coverage Level *</Label>
              <Select
                value={formData.coverage_level}
                onValueChange={(value: CoverageLevel) =>
                  setFormData({ ...formData, coverage_level: value })
                }
              >
                <SelectTrigger id="add-coverage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduces">
                    Introduces - Briefly introduces the concept
                  </SelectItem>
                  <SelectItem value="covers">Covers - Teaches the concept thoroughly</SelectItem>
                  <SelectItem value="masters">Masters - Deep dive to mastery level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Primary Flag */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-primary"
                checked={formData.is_primary}
                onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="add-primary">
                Primary concept (one of the main topics of this course)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Link Concept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
