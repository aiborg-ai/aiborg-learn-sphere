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
import { BookOpen, Edit, Plus, Trash2, Save, X } from 'lucide-react';
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
  id?: number;
  title: string;
  description: string;
  audience: string; // Kept for backward compatibility
  audiences: string[]; // Multi-audience support
  mode: string; // online, in-person, hybrid
  duration: string; // "8 weeks", "40 hours", etc.
  price: string; // Can include currency symbols
  level: string; // beginner, intermediate, advanced
  start_date: string;
  features: string[]; // Array of course features/highlights
  category: string;
  keywords: string[]; // For SEO and search
  prerequisites: string; // Course requirements
  is_active: boolean;
  currently_enrolling: boolean;
  sort_order: number;
  display: boolean;
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

  // State for dynamic array fields
  const [formAudiences, setFormAudiences] = useState<string[]>([]);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [newAudienceInput, setNewAudienceInput] = useState('');
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');

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
        // First, delete existing audience associations
        await supabase.from('course_audiences').delete().eq('course_id', editingCourse.id);

        // Then insert new ones
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
                  <TableHead>Audiences</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Enrolling</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No courses found. Create your first course to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={course.title}>
                          {course.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {course.audiences?.slice(0, 2).map((aud, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {aud}
                            </Badge>
                          ))}
                          {course.audiences && course.audiences.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{course.audiences.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            course.mode === 'Online'
                              ? 'default'
                              : course.mode === 'Hybrid'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {course.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{course.duration}</span>
                      </TableCell>
                      <TableCell className="font-medium">{course.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{course.sort_order}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.currently_enrolling ? 'default' : 'secondary'}>
                          {course.currently_enrolling ? 'Yes' : 'No'}
                        </Badge>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
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
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    {...register('category')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="AI">AI</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Young Learners">Young Learners</option>
                    <option value="Corporate Training">Corporate Training</option>
                  </select>
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
            </div>

            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Course Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode *</Label>
                  <select
                    id="mode"
                    {...register('mode')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <select
                    id="level"
                    {...register('level')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input id="duration" {...register('duration')} placeholder="8 weeks / 40 hours" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" {...register('price')} placeholder="£5,100 / Free" />
                </div>

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
                  <Label htmlFor="sort_order">Display Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...register('sort_order')}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  {...register('prerequisites')}
                  placeholder="No prior experience required / Basic Python knowledge recommended"
                  rows={2}
                />
              </div>
            </div>

            {/* Audiences */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Target Audiences</h3>
              <div className="space-y-2">
                <Label>Audiences</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAudienceInput}
                    onChange={e => setNewAudienceInput(e.target.value)}
                    placeholder="e.g., SMEs & Corporate"
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAudienceInput.trim()) {
                          setFormAudiences([...formAudiences, newAudienceInput.trim()]);
                          setNewAudienceInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newAudienceInput.trim()) {
                        setFormAudiences([...formAudiences, newAudienceInput.trim()]);
                        setNewAudienceInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formAudiences.map((audience, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {audience}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setFormAudiences(formAudiences.filter((_, i) => i !== index))
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Course Features</h3>
              <div className="space-y-2">
                <Label>Features/Highlights</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeatureInput}
                    onChange={e => setNewFeatureInput(e.target.value)}
                    placeholder="e.g., Live Q&A sessions"
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFeatureInput.trim()) {
                          setFormFeatures([...formFeatures, newFeatureInput.trim()]);
                          setNewFeatureInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newFeatureInput.trim()) {
                        setFormFeatures([...formFeatures, newFeatureInput.trim()]);
                        setNewFeatureInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFormFeatures(formFeatures.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">SEO & Search</h3>
              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeywordInput}
                    onChange={e => setNewKeywordInput(e.target.value)}
                    placeholder="e.g., AI, Machine Learning"
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newKeywordInput.trim()) {
                          setFormKeywords([...formKeywords, newKeywordInput.trim()]);
                          setNewKeywordInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newKeywordInput.trim()) {
                        setFormKeywords([...formKeywords, newKeywordInput.trim()]);
                        setNewKeywordInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {keyword}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFormKeywords(formKeywords.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Status & Visibility */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Status & Visibility</h3>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={checked => setValue('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Course Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="currently_enrolling"
                    checked={watch('currently_enrolling')}
                    onCheckedChange={checked => setValue('currently_enrolling', checked)}
                  />
                  <Label htmlFor="currently_enrolling">Currently Enrolling</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="display"
                    checked={watch('display')}
                    onCheckedChange={checked => setValue('display', checked)}
                  />
                  <Label htmlFor="display">Visible on Website</Label>
                </div>
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
                {isLoading ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </>
                )}
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
