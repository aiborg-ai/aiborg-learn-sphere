import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Edit, Eye, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Course {
  id: number;
  title: string;
  description: string;
  audience: string;
  audiences: string[];
  mode: string;
  duration: string;
  price: string;
  level: string;
  start_date: string;
  features: string[];
  category: string;
  keywords: string[];
  prerequisites: string | null;
  is_active: boolean;
  display: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CourseManagementProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onRefresh: () => void;
}

export function CourseManagement({ courses, setCourses, onRefresh }: CourseManagementProps) {
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();
  const courseForm = useForm();

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    courseForm.reset({
      title: course.title,
      description: course.description,
      audiences: course.audiences || [course.audience],
      mode: course.mode,
      duration: course.duration,
      price: course.price,
      level: course.level,
      start_date: course.start_date,
      features: course.features.join('\n'),
      category: course.category,
      keywords: course.keywords.join(','),
      prerequisites: course.prerequisites || '',
      sort_order: course.sort_order
    });
    setIsEditingCourse(true);
  };

  interface CourseFormData {
    title: string;
    description: string;
    audiences: string[];
    mode: string;
    duration: string;
    price: string;
    level: string;
    start_date: string;
    features: string;
    category: string;
    keywords: string;
    prerequisites?: string;
    sort_order?: number;
  }

  const onSubmitCourse = async (data: CourseFormData) => {
    const courseData = {
      title: data.title,
      description: data.description,
      audience: data.audiences[0],
      mode: data.mode,
      duration: data.duration,
      price: data.price,
      level: data.level,
      start_date: data.start_date,
      features: data.features.split('\n').filter((f: string) => f.trim()),
      category: data.category,
      keywords: data.keywords.split(',').map((k: string) => k.trim()),
      prerequisites: data.prerequisites || null,
      is_active: true,
      display: true,
      sort_order: data.sort_order || 0
    };

    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      if (newCourse && data.audiences && data.audiences.length > 0) {
        const audiencesData = data.audiences.map((audience: string) => ({
          course_id: newCourse.id,
          audience: audience
        }));

        const { error: audienceError } = await supabase
          .from('course_audiences')
          .insert(audiencesData);

        if (audienceError) {
          logger.error('Error adding audiences:', audienceError);
        }
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      setIsAddingCourse(false);
      courseForm.reset();
      onRefresh();
    } catch (error) {
      logger.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const onUpdateCourse = async (data: CourseFormData) => {
    if (!editingCourse) return;

    const courseData = {
      title: data.title,
      description: data.description,
      audience: data.audiences[0],
      mode: data.mode,
      duration: data.duration,
      price: data.price,
      level: data.level,
      start_date: data.start_date,
      features: data.features.split('\n').filter((f: string) => f.trim()),
      category: data.category,
      keywords: data.keywords.split(',').map((k: string) => k.trim()),
      prerequisites: data.prerequisites || null,
      sort_order: data.sort_order || 0
    };

    try {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourse.id);

      if (error) throw error;

      const { error: deleteError } = await supabase
        .from('course_audiences')
        .delete()
        .eq('course_id', editingCourse.id);

      if (deleteError) {
        logger.error('Error deleting old audiences:', deleteError);
      }

      if (data.audiences && data.audiences.length > 0) {
        const audiencesData = data.audiences.map((audience: string) => ({
          course_id: editingCourse.id,
          audience: audience
        }));

        const { error: audienceError } = await supabase
          .from('course_audiences')
          .insert(audiencesData);

        if (audienceError) {
          logger.error('Error adding audiences:', audienceError);
        }
      }

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

      setIsEditingCourse(false);
      setEditingCourse(null);
      courseForm.reset();
      onRefresh();
    } catch (error) {
      logger.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: number) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error) {
      logger.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const toggleCourseStatus = async (courseId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, is_active: !currentStatus } : c
      ));

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      logger.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    }
  };

  const toggleCourseDisplay = async (courseId: number, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ display: !currentDisplay })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, display: !currentDisplay } : c
      ));

      toast({
        title: "Success",
        description: `Course ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      logger.error('Error updating course display:', error);
      toast({
        title: "Error",
        description: "Failed to update course display",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle>Course Management</CardTitle>
        <CardDescription>Create and manage courses</CardDescription>
        <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <CourseForm form={courseForm} onSubmit={onSubmitCourse} />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditingCourse} onOpenChange={setIsEditingCourse}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <CourseForm form={courseForm} onSubmit={onUpdateCourse} isEditing />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Display</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell>{course.mode}</TableCell>
                  <TableCell>{course.level}</TableCell>
                  <TableCell>{course.price}</TableCell>
                  <TableCell>
                    <Badge variant={course.is_active ? "success" : "secondary"}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.display ? "default" : "outline"}>
                      {course.display ? 'Visible' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCourseStatus(course.id, course.is_active)}
                      >
                        {course.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCourseDisplay(course.id, course.display)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface CourseFormProps {
  form: any; // This is from react-hook-form, which has complex types
  onSubmit: (data: any) => void;
  isEditing?: boolean;
}

function CourseForm({ form, onSubmit, isEditing = false }: CourseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} required />
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
                <Textarea {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Online" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Beginner" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 8 weeks" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., ₹5,999" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (one per line)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {isEditing ? 'Update Course' : 'Create Course'}
        </Button>
      </form>
    </Form>
  );
}