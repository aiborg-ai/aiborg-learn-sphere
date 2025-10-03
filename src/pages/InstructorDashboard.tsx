import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  BookOpen,
  Users,
  FileText,
  Upload,
  GraduationCap,
  BarChart,
  AlertCircle,
  Loader2,
  PlusCircle,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { logger } from '@/utils/logger';

// Import instructor components
import { MaterialUploadSection } from '@/components/instructor/MaterialUploadSection';
import { EnrolledStudents } from '@/components/instructor/EnrolledStudents';
import { AssignmentManagement } from '@/components/instructor/AssignmentManagement';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    totalMaterials: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user has instructor role
    checkInstructorRole();
  }, [user, navigate]);

  const checkInstructorRole = async () => {
    if (!user) return;

    try {
      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!roleData || (roleData.role !== 'instructor' && roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
        // Not an instructor, redirect
        navigate('/dashboard');
        return;
      }

      // Load instructor data
      await fetchInstructorData();
    } catch (error) {
      logger.error('Error checking instructor role:', error);
      setLoading(false);
    }
  };

  const fetchInstructorData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all courses (instructors can manage all courses for now)
      // In production, you'd filter by instructor_id if that column exists
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setInstructorCourses(coursesData || []);
      setStats(prev => ({ ...prev, totalCourses: coursesData?.length || 0 }));

      // Fetch enrollment count
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('payment_status', 'completed');

      if (!enrollmentsError) {
        setStats(prev => ({ ...prev, totalStudents: enrollmentsData?.length || 0 }));
      }

      // Fetch pending assignments count
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('homework_submissions')
        .select('id')
        .in('status', ['submitted', 'grading']);

      if (!assignmentsError) {
        setStats(prev => ({ ...prev, pendingAssignments: assignmentsData?.length || 0 }));
      }

      // Fetch materials count
      const { data: materialsData, error: materialsError } = await supabase
        .from('course_materials')
        .select('id')
        .eq('is_active', true);

      if (!materialsError) {
        setStats(prev => ({ ...prev, totalMaterials: materialsData?.length || 0 }));
      }

    } catch (error) {
      logger.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInstructorData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Instructor Portal
              </h1>
              <p className="text-white/80">
                Manage your courses, students, and course materials
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="btn-outline-ai">
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending Grading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingAssignments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Course Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMaterials}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-white data-[state=active]:bg-white/20">
              <Upload className="h-4 w-4 mr-2" />
              Upload Materials
            </TabsTrigger>
            <TabsTrigger value="students" className="text-white data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-white/20">
              <FileText className="h-4 w-4 mr-2" />
              Assignments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Courses
                </CardTitle>
                <CardDescription>
                  Courses you're managing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {instructorCourses.length > 0 ? (
                  <div className="space-y-3">
                    {instructorCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{course.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <Badge variant="outline">{course.level}</Badge>
                            <span>{course.duration}</span>
                            <span>{course.mode}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedCourse?.id === course.id && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/course/${course.id}`);
                            }}
                          >
                            View Course
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No courses assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedCourse && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Course selected: <strong>{selectedCourse.title}</strong>. Use the tabs above to manage materials, students, and assignments for this course.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            {selectedCourse ? (
              <MaterialUploadSection
                courseId={selectedCourse.id}
                courseName={selectedCourse.title}
                onUploadComplete={handleRefresh}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Please select a course from the Overview tab first
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            {selectedCourse ? (
              <EnrolledStudents courseId={selectedCourse.id} courseName={selectedCourse.title} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Please select a course from the Overview tab first
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            {selectedCourse ? (
              <AssignmentManagement
                courseId={selectedCourse.id}
                courseName={selectedCourse.title}
                onUpdate={handleRefresh}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Please select a course from the Overview tab first
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
