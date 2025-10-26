import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
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
import { Course, CourseManagementProps, CourseTable, CourseFormDialog } from './course-management';

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

  // State for dynamic array fields
  const [formAudiences, setFormAudiences] = useState<string[]>([]);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formKeywords, setFormKeywords] = useState<string[]>([]);

  const form = useForm<Course>({
    defaultValues: {
      title: '',
      description: '',
      audience: 'SMEs & Corporate',
      audiences: [],
      mode: 'Online',
      duration: '8 weeks',
      price: '£0',
      level: 'Beginner',
      start_date: new Date().toISOString().split('T')[0],
      features: [],
      category: 'AI',
      keywords: [],
      prerequisites: 'None',
      is_active: true,
      currently_enrolling: true,
      sort_order: 0,
      display: true,
    },
  });

  const { reset } = form;

  const openCreateDialog = () => {
    setEditingCourse(null);
    setFormAudiences([]);
    setFormFeatures([]);
    setFormKeywords([]);
    reset({
      title: '',
      description: '',
      audience: 'SMEs & Corporate',
      audiences: [],
      mode: 'Online',
      duration: '8 weeks',
      price: '£0',
      level: 'Beginner',
      start_date: new Date().toISOString().split('T')[0],
      features: [],
      category: 'AI',
      keywords: [],
      prerequisites: 'None',
      is_active: true,
      currently_enrolling: true,
      sort_order: 0,
      display: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormAudiences(course.audiences || []);
    setFormFeatures(course.features || []);
    setFormKeywords(course.keywords || []);
    reset({
      ...course,
      start_date: course.start_date ? new Date(course.start_date).toISOString().split('T')[0] : '',
      audiences: course.audiences || [],
      features: course.features || [],
      keywords: course.keywords || [],
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
      // Set audience to first audiences element for backward compatibility
      const primaryAudience = formAudiences.length > 0 ? formAudiences[0] : 'SMEs & Corporate';

      const courseData = {
        title: data.title,
        description: data.description,
        audience: primaryAudience,
        mode: data.mode,
        duration: data.duration,
        price: data.price,
        level: data.level,
        start_date: data.start_date,
        features: formFeatures,
        category: data.category,
        keywords: formKeywords,
        prerequisites: data.prerequisites,
        is_active: data.is_active,
        currently_enrolling: data.currently_enrolling,
        sort_order: data.sort_order,
        display: data.display,
        updated_at: new Date().toISOString(),
      };

      if (editingCourse?.id) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;

        // Update course_audiences table
        await supabase.from('course_audiences').delete().eq('course_id', editingCourse.id);

        if (formAudiences.length > 0) {
          const audienceRecords = formAudiences.map(audience => ({
            course_id: editingCourse.id,
            audience: audience,
          }));

          const { error: audienceError } = await supabase
            .from('course_audiences')
            .insert(audienceRecords);

          if (audienceError) throw audienceError;
        }

        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        // Create new course
        const { data: newCourse, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;

        // Insert course_audiences
        if (formAudiences.length > 0 && newCourse) {
          const audienceRecords = formAudiences.map(audience => ({
            course_id: newCourse.id,
            audience: audience,
          }));

          const { error: audienceError } = await supabase
            .from('course_audiences')
            .insert(audienceRecords);

          if (audienceError) throw audienceError;
        }

        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
      }

      onRefresh();
      setIsDialogOpen(false);
      reset();
      setFormAudiences([]);
      setFormFeatures([]);
      setFormKeywords([]);
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

  const handleDuplicate = (course: Course) => {
    // Create a copy with modified title and reset some fields
    const duplicatedCourse = {
      ...course,
      id: undefined, // Remove ID so it creates a new course
      title: `${course.title} (Copy)`,
      is_active: false, // Set to inactive by default
      display: false, // Hide by default
      created_at: undefined,
      updated_at: undefined,
    };

    // Open edit dialog with duplicated data
    setEditingCourse(null); // Treat as new course
    setFormAudiences(duplicatedCourse.audiences || []);
    setFormFeatures(duplicatedCourse.features || []);
    setFormKeywords(duplicatedCourse.keywords || []);
    reset(duplicatedCourse);
    setIsDialogOpen(true);

    toast({
      title: 'Course duplicated',
      description: 'You can now edit and save the duplicated course',
    });
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
          <CourseTable
            courses={courses}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onDuplicate={handleDuplicate}
            onToggleStatus={toggleCourseStatus}
          />
        </CardContent>
      </Card>

      <CourseFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        form={form}
        isLoading={isLoading}
        editingCourse={editingCourse}
        audiences={formAudiences}
        setAudiences={setFormAudiences}
        features={formFeatures}
        setFeatures={setFormFeatures}
        keywords={formKeywords}
        setKeywords={setFormKeywords}
      />

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
