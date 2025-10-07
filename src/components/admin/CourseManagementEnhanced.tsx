import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { BookOpen, Edit, Plus, Trash2, Save, X, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Course {
  id?: string;
  title: string;
  description: string;
  price: number;
  start_date: string;
  end_date?: string;
  max_capacity: number;
  enrollment_count?: number;
  category?: string;
  level?: string;
  is_active: boolean;
  display: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface CourseManagementProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onRefresh: () => void;
}

export function CourseManagementEnhanced({
  courses,
  setCourses,
  onRefresh,
}: CourseManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Course>({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      start_date: new Date().toISOString().split('T')[0],
      max_capacity: 30,
      category: 'general',
      level: 'beginner',
      is_active: true,
      display: true,
    },
  });

  const openCreateDialog = () => {
    setEditingCourse(null);
    reset({
      title: '',
      description: '',
      price: 0,
      start_date: new Date().toISOString().split('T')[0],
      max_capacity: 30,
      category: 'general',
      level: 'beginner',
      is_active: true,
      display: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    reset({
      ...course,
      start_date: course.start_date ? new Date(course.start_date).toISOString().split('T')[0] : '',
      end_date: course.end_date ? new Date(course.end_date).toISOString().split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setDeletingCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: Course) => {
    setIsLoading(true);
    try {
      if (editingCourse?.id) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            title: data.title,
            description: data.description,
            price: data.price,
            start_date: data.start_date,
            end_date: data.end_date || null,
            max_capacity: data.max_capacity,
            category: data.category,
            level: data.level,
            is_active: data.is_active,
            display: data.display,
            image_url: data.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCourse.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        // Create new course
        const { data: newCourse, error } = await supabase
          .from('courses')
          .insert({
            title: data.title,
            description: data.description,
            price: data.price,
            start_date: data.start_date,
            end_date: data.end_date || null,
            max_capacity: data.max_capacity,
            enrollment_count: 0,
            category: data.category,
            level: data.level,
            is_active: data.is_active,
            display: data.display,
            image_url: data.image_url,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
      }

      onRefresh();
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      logger.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: editingCourse ? 'Failed to update course' : 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', deletingCourse.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });

      onRefresh();
      setIsDeleteDialogOpen(false);
      setDeletingCourse(null);
    } catch (error) {
      logger.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourseStatus = async (course: Course, field: 'is_active' | 'display') => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ [field]: !course[field] })
        .eq('id', course.id);

      if (error) throw error;

      setCourses(courses.map(c => (c.id === course.id ? { ...c, [field]: !c[field] } : c)));

      toast({
        title: 'Success',
        description: `Course ${field === 'is_active' ? 'status' : 'visibility'} updated`,
      });
    } catch (error) {
      logger.error(`Error toggling course ${field}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update course ${field === 'is_active' ? 'status' : 'visibility'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Management
              </CardTitle>
              <CardDescription>Manage your courses, programs, and learning paths</CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No courses found. Create your first course to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.level || 'All Levels'}</Badge>
                      </TableCell>
                      <TableCell>${course.price}</TableCell>
                      <TableCell>
                        {course.start_date
                          ? new Date(course.start_date).toLocaleDateString()
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        {course.enrollment_count || 0}/{course.max_capacity}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={course.is_active}
                          onCheckedChange={() => toggleCourseStatus(course, 'is_active')}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={course.display}
                          onCheckedChange={() => toggleCourseStatus(course, 'display')}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Introduction to AI"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  {...register('price', {
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' },
                  })}
                  placeholder="299"
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Learn the fundamentals of artificial intelligence..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register('category')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="general">General</option>
                  <option value="ai">Artificial Intelligence</option>
                  <option value="ml">Machine Learning</option>
                  <option value="dl">Deep Learning</option>
                  <option value="nlp">Natural Language Processing</option>
                  <option value="cv">Computer Vision</option>
                  <option value="data-science">Data Science</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <select
                  id="level"
                  {...register('level')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All Levels</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: 'Start date is required' })}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" {...register('end_date')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity">Max Capacity *</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  {...register('max_capacity', {
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' },
                  })}
                  placeholder="30"
                />
                {errors.max_capacity && (
                  <p className="text-sm text-red-500">{errors.max_capacity.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                {...register('image_url')}
                placeholder="https://example.com/course-image.jpg"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  {...register('is_active')}
                  defaultChecked={watch('is_active')}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="display" {...register('display')} defaultChecked={watch('display')} />
                <Label htmlFor="display">Visible on Website</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course "{deletingCourse?.title}". This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
