/**
 * LingoLessonManager Component
 *
 * CRUD interface for managing AIBORGLingo lessons.
 * Supports drag-and-drop reordering.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/utils/iconLoader';
import { logger } from '@/utils/logger';
import { SortableList, DragHandle } from '@/components/admin/shared/SortableList';
import { LingoReorderService } from '@/services/lingo/LingoReorderService';

interface Lesson {
  id: string;
  lesson_id: string;
  title: string;
  skill: string;
  duration: string;
  xp_reward: number;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  question_count?: number;
}

const SKILLS = ['Foundations', 'LLMs', 'Vision', 'NLP', 'Safety', 'Advanced'];

const defaultLesson = {
  lesson_id: '',
  title: '',
  skill: 'Foundations',
  duration: '8 min',
  xp_reward: 40,
  description: '',
  sort_order: 0,
  is_active: true,
};

export function LingoLessonManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState(defaultLesson);
  const { toast } = useToast();

  // Check if filters are active (disable drag-drop when filtered)
  const isFiltered = searchTerm !== '' || skillFilter !== 'all';

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch lessons with question count
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lingo_lessons')
        .select('*')
        .order('sort_order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Get question counts per lesson
      const { data: questionCounts, error: countError } = await supabase
        .from('lingo_questions')
        .select('lesson_id');

      if (countError) throw countError;

      // Count questions per lesson
      const counts: Record<string, number> = {};
      (questionCounts || []).forEach(q => {
        counts[q.lesson_id] = (counts[q.lesson_id] || 0) + 1;
      });

      // Merge counts with lessons
      const lessonsWithCounts = (lessonsData || []).map(lesson => ({
        ...lesson,
        question_count: counts[lesson.id] || 0,
      }));

      setLessons(lessonsWithCounts);
    } catch (error) {
      logger.error('Failed to load lessons', error);
      toast({
        title: 'Error',
        description: 'Failed to load lessons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch lessons on mount
  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === 'all' || lesson.skill === skillFilter;
    return matchesSearch && matchesSkill;
  });

  // Open dialog for new lesson
  function handleNewLesson() {
    setEditingLesson(null);
    setFormData({
      ...defaultLesson,
      sort_order: lessons.length + 1,
      lesson_id: `ai-new-${Date.now()}`,
    });
    setIsDialogOpen(true);
  }

  // Open dialog for editing
  function handleEditLesson(lesson: Lesson) {
    setEditingLesson(lesson);
    setFormData({
      lesson_id: lesson.lesson_id,
      title: lesson.title,
      skill: lesson.skill,
      duration: lesson.duration,
      xp_reward: lesson.xp_reward,
      description: lesson.description,
      sort_order: lesson.sort_order,
      is_active: lesson.is_active,
    });
    setIsDialogOpen(true);
  }

  // Save lesson (create or update)
  async function handleSaveLesson() {
    try {
      if (editingLesson) {
        // Update existing
        const { error } = await supabase
          .from('lingo_lessons')
          .update({
            lesson_id: formData.lesson_id,
            title: formData.title,
            skill: formData.skill,
            duration: formData.duration,
            xp_reward: formData.xp_reward,
            description: formData.description,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson updated successfully' });
      } else {
        // Create new
        const { error } = await supabase.from('lingo_lessons').insert({
          lesson_id: formData.lesson_id,
          title: formData.title,
          skill: formData.skill,
          duration: formData.duration,
          xp_reward: formData.xp_reward,
          description: formData.description,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson created successfully' });
      }

      setIsDialogOpen(false);
      loadLessons();
    } catch (error) {
      logger.error('Failed to save lesson', error);
      toast({
        title: 'Error',
        description: 'Failed to save lesson. Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Toggle active status
  async function handleToggleActive(lesson: Lesson) {
    try {
      const { error } = await supabase
        .from('lingo_lessons')
        .update({ is_active: !lesson.is_active })
        .eq('id', lesson.id);

      if (error) throw error;

      setLessons(prev =>
        prev.map(l => (l.id === lesson.id ? { ...l, is_active: !l.is_active } : l))
      );

      toast({
        title: 'Success',
        description: `Lesson ${lesson.is_active ? 'deactivated' : 'activated'}`,
      });
    } catch (error) {
      logger.error('Failed to toggle lesson status', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson status',
        variant: 'destructive',
      });
    }
  }

  // Delete lesson
  async function handleDeleteLesson(lesson: Lesson) {
    if (
      !confirm(
        `Are you sure you want to delete "${lesson.title}"? This will also delete all its questions.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('lingo_lessons').delete().eq('id', lesson.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Lesson deleted successfully' });
      loadLessons();
    } catch (error) {
      logger.error('Failed to delete lesson', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lesson. Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Handle lesson reordering
  async function handleReorderLessons(reorderedLessons: Lesson[]) {
    setIsReordering(true);
    try {
      const reorderItems = reorderedLessons.map((lesson, index) => ({
        id: lesson.id,
        sort_order: index,
      }));

      await LingoReorderService.reorderLessons(reorderItems);

      // Update local state with new order
      setLessons(reorderedLessons);
      toast({ title: 'Success', description: 'Lessons reordered successfully' });
    } catch (error) {
      logger.error('Failed to reorder lessons', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder lessons. Please try again.',
        variant: 'destructive',
      });
      // Reload to restore original order
      loadLessons();
    } finally {
      setIsReordering(false);
    }
  }

  // Get skill badge color
  function getSkillColor(skill: string) {
    const colors: Record<string, string> = {
      Foundations: 'bg-blue-100 text-blue-800',
      LLMs: 'bg-purple-100 text-purple-800',
      Vision: 'bg-green-100 text-green-800',
      NLP: 'bg-orange-100 text-orange-800',
      Safety: 'bg-red-100 text-red-800',
      Advanced: 'bg-amber-100 text-amber-800',
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Lesson Management</CardTitle>
            <CardDescription>Create, edit, and manage AIBORGLingo lessons</CardDescription>
          </div>
          <Button onClick={handleNewLesson}>
            <Icon name="Plus" className="h-4 w-4 mr-2" />
            New Lesson
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {SKILLS.map(skill => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reorder hint */}
        {!isFiltered && lessons.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="GripVertical" className="h-4 w-4" />
            <span>Drag rows to reorder lessons</span>
            {isReordering && <Icon name="Loader2" className="h-4 w-4 animate-spin ml-2" />}
          </div>
        )}

        {isFiltered && lessons.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Clear filters to enable drag-and-drop reordering
          </div>
        )}

        {/* Lessons Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {lessons.length === 0 ? (
              <p>No lessons yet. Create your first lesson to get started.</p>
            ) : (
              <p>No lessons match your search criteria.</p>
            )}
          </div>
        ) : isFiltered ? (
          /* Regular table when filtered (no drag-drop) */
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">XP</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson, index) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {lesson.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSkillColor(lesson.skill)} variant="secondary">
                        {lesson.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{lesson.duration}</TableCell>
                    <TableCell className="text-center">{lesson.xp_reward}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{lesson.question_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={lesson.is_active}
                        onCheckedChange={() => handleToggleActive(lesson)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreHorizontal" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                            <Icon name="Pencil" className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteLesson(lesson)}
                            className="text-destructive"
                          >
                            <Icon name="Trash2" className="h-4 w-4 mr-2" />
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
        ) : (
          /* Sortable table when not filtered */
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">XP</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableList
                  items={lessons}
                  onReorder={handleReorderLessons}
                  isReordering={isReordering}
                  renderItem={(lesson, index, dragHandleProps) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="w-10">
                        <DragHandle dragHandleProps={dragHandleProps}>
                          <Icon name="GripVertical" className="h-4 w-4 text-muted-foreground" />
                        </DragHandle>
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {lesson.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSkillColor(lesson.skill)} variant="secondary">
                          {lesson.skill}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{lesson.duration}</TableCell>
                      <TableCell className="text-center">{lesson.xp_reward}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{lesson.question_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={lesson.is_active}
                          onCheckedChange={() => handleToggleActive(lesson)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Icon name="MoreHorizontal" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                              <Icon name="Pencil" className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteLesson(lesson)}
                              className="text-destructive"
                            >
                              <Icon name="Trash2" className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
              <DialogDescription>
                {editingLesson
                  ? 'Update lesson details below.'
                  : 'Fill in the details for your new lesson.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Neural Networks Basics"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lesson_id">Lesson ID</Label>
                <Input
                  id="lesson_id"
                  value={formData.lesson_id}
                  onChange={e => setFormData(prev => ({ ...prev, lesson_id: e.target.value }))}
                  placeholder="e.g., ai-neural-01"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the lesson content..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="skill">Skill Category</Label>
                  <Select
                    value={formData.skill}
                    onValueChange={value => setFormData(prev => ({ ...prev, skill: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILLS.map(skill => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 8 min"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="xp_reward">XP Reward</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    value={formData.xp_reward}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active (visible to users)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLesson} disabled={!formData.title || !formData.lesson_id}>
                {editingLesson ? 'Save Changes' : 'Create Lesson'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
