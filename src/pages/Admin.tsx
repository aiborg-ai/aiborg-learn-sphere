import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, BookOpen, Megaphone, Trash2, Shield, Eye, Edit, Plus, UserCheck, Star, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Review } from '@/hooks/useReviews';
import type { Event } from '@/hooks/useEvents';
import type { Course } from '@/hooks/useCourses';
import BlogManager from './Admin/BlogManager';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  audience: string; // Kept for backward compatibility
  audiences: string[]; // New field for multiple audiences
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: number;
  enrolled_at: string;
  payment_status: string;
  payment_amount: number | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
  courses: {
    title: string;
    start_date: string;
    price: string;
  } | null;
}

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 1 });
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const courseForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      audience: 'Professionals', // Kept for backward compatibility
      audiences: ['Professionals'], // New field for multiple audiences
      mode: 'Online',
      duration: '6 hrs/4 sessions',
      price: '£99',
      level: 'Intermediate',
      start_date: 'Enquire for start date',
      features: '',
      category: 'AI Fundamentals',
      keywords: '',
      prerequisites: 'None',
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }
    
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [user, profile, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      // Fetch enrollments with user and course details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles(display_name, email),
          courses(title, start_date, price)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments((enrollmentsData as Enrollment[]) || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.filter(u => u.user_id !== userId));
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const createCourse = async (data: any) => {
    try {
      const courseData = {
        title: data.title,
        description: data.description,
        audience: data.audiences?.[0] || data.audience, // Use first audience for backward compatibility
        mode: data.mode,
        duration: data.duration,
        price: data.price,
        level: data.level,
        start_date: data.start_date,
        features: typeof data.features === 'string' ? data.features.split(',').map((f: string) => f.trim()).filter((f: string) => f) : data.features,
        category: data.category,
        keywords: typeof data.keywords === 'string' ? data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : data.keywords,
        prerequisites: data.prerequisites || 'None',
        is_active: true,
        sort_order: courses.length + 1
      };

      const { data: insertedCourse, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      // Now insert the audiences into the junction table
      if (insertedCourse && data.audiences && data.audiences.length > 0) {
        const audiencesData = data.audiences.map((audience: string) => ({
          course_id: insertedCourse.id,
          audience: audience
        }));

        const { error: audienceError } = await supabase
          .from('course_audiences')
          .insert(audiencesData);

        if (audienceError) {
          console.error('Error adding audiences:', audienceError);
        }
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });
      
      setIsAddingCourse(false);
      courseForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const updateCourse = async (data: any) => {
    if (!editingCourse) return;

    try {
      const courseData = {
        title: data.title,
        description: data.description,
        audience: data.audiences?.[0] || data.audience, // Use first audience for backward compatibility
        mode: data.mode,
        duration: data.duration,
        price: data.price,
        level: data.level,
        start_date: data.start_date,
        features: typeof data.features === 'string' ? data.features.split(',').map((f: string) => f.trim()).filter((f: string) => f) : data.features,
        category: data.category,
        keywords: typeof data.keywords === 'string' ? data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : data.keywords,
        prerequisites: data.prerequisites || 'None',
      };

      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourse.id);

      if (error) throw error;

      // Update audiences in the junction table
      // First, delete existing audiences
      const { error: deleteError } = await supabase
        .from('course_audiences')
        .delete()
        .eq('course_id', editingCourse.id);

      if (deleteError) {
        console.error('Error deleting old audiences:', deleteError);
      }

      // Then insert new audiences
      if (data.audiences && data.audiences.length > 0) {
        const audiencesData = data.audiences.map((audience: string) => ({
          course_id: editingCourse.id,
          audience: audience
        }));

        const { error: audienceError } = await supabase
          .from('course_audiences')
          .insert(audiencesData);

        if (audienceError) {
          console.error('Error adding audiences:', audienceError);
        }
      }

      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      
      setIsEditingCourse(false);
      setEditingCourse(null);
      courseForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

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
      console.error('Error deleting course:', error);
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
      console.error('Error updating course status:', error);
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
      console.error('Error updating course display:', error);
      toast({
        title: "Error",
        description: "Failed to update course display",
        variant: "destructive",
      });
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const priority = parseInt(formData.get('priority') as string);

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          priority,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));
      
      toast({
        title: "Success",
        description: "Announcement status updated",
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    courseForm.reset({
      title: course.title,
      description: course.description,
      audience: course.audience, // Keep for backward compatibility
      audiences: course.audiences || (course.audience ? [course.audience] : []), // Set audiences array
      mode: course.mode,
      duration: course.duration,
      price: course.price,
      level: course.level,
      start_date: course.start_date,
      features: course.features.join(', '),
      category: course.category,
      keywords: course.keywords.join(', '),
      prerequisites: course.prerequisites || 'None',
    });
    setIsEditingCourse(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-secondary" />
            <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
          </div>
          <Link to="/">
            <Button variant="outline" className="btn-outline-ai">
              Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="text-white data-[state=active]:bg-white/20">
              <UserCheck className="h-4 w-4 mr-2" />
              Enrollments ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-white data-[state=active]:bg-white/20">
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-white/20">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-white/80">
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Created</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-white">{user.display_name || 'N/A'}</TableCell>
                        <TableCell className="text-white/80">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
                            >
                              <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUser(user.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Course Management</CardTitle>
                      <CardDescription className="text-white/80">
                        Create, edit, and manage courses
                      </CardDescription>
                    </div>
                    <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
                      <DialogTrigger asChild>
                        <Button className="btn-hero">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Course
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md">
                        <DialogHeader>
                          <DialogTitle>Add New Course</DialogTitle>
                        </DialogHeader>
                        <Form {...courseForm}>
                          <form onSubmit={courseForm.handleSubmit(createCourse)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={courseForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Course title" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={courseForm.control}
                                name="audiences"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Audiences (Select Multiple)</FormLabel>
                                    <div className="space-y-2 border rounded-md p-3">
                                      {["Young Learners", "Teenagers", "Professionals", "SMEs"].map(audience => (
                                        <div key={audience} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`add-${audience}`}
                                            value={audience}
                                            checked={field.value?.includes(audience) || false}
                                            onChange={(e) => {
                                              const updatedValue = e.target.checked
                                                ? [...(field.value || []), audience]
                                                : (field.value || []).filter((a: string) => a !== audience);
                                              field.onChange(updatedValue);
                                            }}
                                            className="rounded border-gray-300"
                                          />
                                          <label htmlFor={`add-${audience}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {audience}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={courseForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Course description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={courseForm.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="£99" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={courseForm.control}
                                name="duration"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="6 hrs/4 sessions" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={courseForm.control}
                                name="level"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Level</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={courseForm.control}
                                name="mode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mode</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Online">Online</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        <SelectItem value="In-person">In-person</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={courseForm.control}
                                name="start_date"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Enquire for start date" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={courseForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="AI Fundamentals" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={courseForm.control}
                                name="prerequisites"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Prerequisites</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="None" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={courseForm.control}
                              name="features"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Features (comma-separated)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Interactive lessons, Hands-on projects, Certificates" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={courseForm.control}
                              name="keywords"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Keywords (comma-separated)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="AI, machine learning, python" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsAddingCourse(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" className="btn-hero">
                                Create Course
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead className="text-white">Title</TableHead>
                         <TableHead className="text-white">Audience</TableHead>
                         <TableHead className="text-white">Price</TableHead>
                         <TableHead className="text-white">Level</TableHead>
                         <TableHead className="text-white">Status</TableHead>
                         <TableHead className="text-white">Display</TableHead>
                         <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="text-white font-medium">{course.title}</TableCell>
                          <TableCell className="text-white/80">{course.audience}</TableCell>
                          <TableCell className="text-white/80">{course.price}</TableCell>
                          <TableCell className="text-white/80">{course.level}</TableCell>
                           <TableCell>
                             <Badge variant={course.is_active ? 'default' : 'secondary'}>
                               {course.is_active ? 'Active' : 'Inactive'}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => toggleCourseDisplay(course.id, course.display)}
                               className="text-white hover:bg-white/20"
                             >
                               {course.display ? (
                                 <Eye className="h-4 w-4 text-green-400" />
                               ) : (
                                 <Eye className="h-4 w-4 text-gray-400" />
                               )}
                             </Button>
                           </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditCourse(course)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={course.is_active ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => toggleCourseStatus(course.id, course.is_active)}
                                >
                                  {course.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  variant={course.display ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => toggleCourseDisplay(course.id, course.display)}
                                >
                                  {course.display ? 'Hide' : 'Show'}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
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
                </CardContent>
              </Card>

              {/* Edit Course Dialog */}
              <Dialog open={isEditingCourse} onOpenChange={setIsEditingCourse}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md">
                  <DialogHeader>
                    <DialogTitle>Edit Course</DialogTitle>
                  </DialogHeader>
                  <Form {...courseForm}>
                    <form onSubmit={courseForm.handleSubmit(updateCourse)} className="space-y-4">
                      {/* Same form fields as Add Course */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={courseForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Course title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={courseForm.control}
                          name="audiences"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Audiences (Select Multiple)</FormLabel>
                              <div className="space-y-2 border rounded-md p-3">
                                {["Young Learners", "Teenagers", "Professionals", "SMEs"].map(audience => (
                                  <div key={audience} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`edit-${audience}`}
                                      value={audience}
                                      checked={field.value?.includes(audience) || false}
                                      onChange={(e) => {
                                        const updatedValue = e.target.checked
                                          ? [...(field.value || []), audience]
                                          : (field.value || []).filter((a: string) => a !== audience);
                                        field.onChange(updatedValue);
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label htmlFor={`edit-${audience}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {audience}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={courseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Course description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditingCourse(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="btn-hero">
                          Update Course
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Course Enrollments</CardTitle>
                <CardDescription className="text-white/80">
                  View all user enrollments and payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Course</TableHead>
                      <TableHead className="text-white">Enrolled Date</TableHead>
                      <TableHead className="text-white">Payment</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="text-white">
                          <div>
                            <p className="font-medium">{enrollment.profiles?.display_name || 'N/A'}</p>
                            <p className="text-white/60 text-sm">{enrollment.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p className="font-medium">{enrollment.courses?.title}</p>
                            <p className="text-white/60 text-sm">Starts: {enrollment.courses?.start_date}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={enrollment.payment_status === 'completed' ? 'default' : 'secondary'}>
                            {enrollment.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {enrollment.payment_amount ? `£${enrollment.payment_amount}` : enrollment.courses?.price || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Create New Announcement</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createAnnouncement} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Announcement title"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-white">Content</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Announcement content"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-white">Priority</Label>
                      <Select name="priority" defaultValue="1">
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="btn-hero" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Existing Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Title</TableHead>
                        <TableHead className="text-white">Content</TableHead>
                        <TableHead className="text-white">Priority</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Created</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="text-white font-medium">{announcement.title}</TableCell>
                          <TableCell className="text-white/80 max-w-xs truncate">{announcement.content}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              Priority {announcement.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                              {announcement.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/80">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={announcement.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                            >
                              {announcement.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="events">
            <EventsManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Reviews Management Component
function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(display_name, email),
          courses(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewDisplay = async (reviewId: string, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ display: !currentDisplay })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, display: !currentDisplay } : r
      ));
      
      toast({
        title: "Success",
        description: `Review ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      console.error('Error updating review display:', error);
      toast({
        title: "Error",
        description: "Failed to update review display",
        variant: "destructive",
      });
    }
  };

  const toggleReviewApproval = async (reviewId: string, currentApproval: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: !currentApproval })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, approved: !currentApproval } : r
      ));
      
      toast({
        title: "Success",
        description: `Review ${!currentApproval ? 'approved' : 'unapproved'}`,
      });
    } catch (error) {
      console.error('Error updating review approval:', error);
      toast({
        title: "Error",
        description: "Failed to update review approval",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Reviews Management</CardTitle>
        <CardDescription className="text-white/80">
          Manage review approval and frontend display
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Course</TableHead>
              <TableHead className="text-white">User</TableHead>
              <TableHead className="text-white">Rating</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Approved</TableHead>
              <TableHead className="text-white">Display</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="text-white">
                  {review.courses?.title || `Course ${review.course_id}`}
                </TableCell>
                <TableCell className="text-white">
                  {review.profiles?.display_name || review.profiles?.email || 'Anonymous'}
                </TableCell>
                <TableCell className="text-white">
                  {review.rating}/5 ⭐
                </TableCell>
                <TableCell className="text-white">
                  {review.review_type}
                </TableCell>
                <TableCell>
                  <Badge variant={review.approved ? 'default' : 'secondary'}>
                    {review.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReviewDisplay(review.id, review.display)}
                    className="text-white hover:bg-white/20"
                  >
                    {review.display ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant={review.approved ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleReviewApproval(review.id, review.approved)}
                    >
                      {review.approved ? 'Unapprove' : 'Approve'}
                    </Button>
                    <Button
                      variant={review.display ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleReviewDisplay(review.id, review.display)}
                    >
                      {review.display ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Events Management Component
function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEventDisplay = async (eventId: number, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ display: !currentDisplay })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e => 
        e.id === eventId ? { ...e, display: !currentDisplay } : e
      ));
      
      toast({
        title: "Success",
        description: `Event ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      console.error('Error updating event display:', error);
      toast({
        title: "Error",
        description: "Failed to update event display",
        variant: "destructive",
      });
    }
  };

  const toggleEventStatus = async (eventId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e => 
        e.id === eventId ? { ...e, is_active: !currentStatus } : e
      ));
      
      toast({
        title: "Success",
        description: `Event ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Events Management</CardTitle>
        <CardDescription className="text-white/80">
          Manage event status and frontend display
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Title</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Location</TableHead>
              <TableHead className="text-white">Price</TableHead>
              <TableHead className="text-white">Active</TableHead>
              <TableHead className="text-white">Display</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-white font-medium">
                  {event.title}
                </TableCell>
                <TableCell className="text-white">
                  {new Date(event.event_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-white">
                  {event.location}
                </TableCell>
                <TableCell className="text-white">
                  £{event.price}
                </TableCell>
                <TableCell>
                  <Badge variant={event.is_active ? 'default' : 'secondary'}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEventDisplay(event.id, event.display)}
                    className="text-white hover:bg-white/20"
                  >
                    {event.display ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant={event.is_active ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleEventStatus(event.id, event.is_active)}
                    >
                      {event.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant={event.display ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleEventDisplay(event.id, event.display)}
                    >
                      {event.display ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}