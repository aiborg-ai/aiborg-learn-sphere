import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { StudentProgressViewer } from './StudentProgressViewer';
import {
  TrendingUp,
  Clock,
  Users,
  Award,
  AlertTriangle,
  Loader2,
  Eye,
} from '@/components/ui/icons';

export function ProgressTrackingDashboard() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [selectedStudent, setSelectedStudent] = useState<{
    userId: string;
    courseId: number;
  } | null>(null);

  const { courseProgress, loading } = useProgressTracking({ courseId: selectedCourseId });

  // Calculate statistics
  const getStatistics = () => {
    if (courseProgress.length === 0) {
      return {
        totalStudents: 0,
        averageCompletion: 0,
        atRiskCount: 0,
        highPerformers: 0,
        totalTimeSpent: 0,
      };
    }

    const totalStudents = courseProgress.length;
    const averageCompletion =
      courseProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / totalStudents;
    const atRiskCount = courseProgress.filter(p => (p.completion_percentage || 0) < 30).length;
    const highPerformers = courseProgress.filter(p => (p.completion_percentage || 0) >= 80).length;
    const totalTimeSpent = courseProgress.reduce((sum, p) => sum + (p.total_time_spent || 0), 0);

    return {
      totalStudents,
      averageCompletion,
      atRiskCount,
      highPerformers,
      totalTimeSpent,
    };
  };

  const stats = getStatistics();

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (percentage >= 30) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">At Risk</Badge>;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getLastAccessedStatus = (lastAccessed: string | null) => {
    if (!lastAccessed) return { text: 'Never', color: 'text-gray-500' };

    const days = Math.floor(
      (Date.now() - new Date(lastAccessed).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days === 0) return { text: 'Today', color: 'text-green-600' };
    if (days === 1) return { text: '1 day ago', color: 'text-green-600' };
    if (days <= 3) return { text: `${days} days ago`, color: 'text-blue-600' };
    if (days <= 7) return { text: `${days} days ago`, color: 'text-yellow-600' };
    return { text: `${days} days ago`, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold">Progress Tracking</h2>
          <p className="text-muted-foreground">Monitor student progress and performance</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalStudents}</div>
              <p className="text-xs text-blue-700 mt-1">Enrolled in courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Avg Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {stats.averageCompletion.toFixed(1)}%
              </div>
              <p className="text-xs text-green-700 mt-1">Average progress</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.atRiskCount}</div>
              <p className="text-xs text-red-700 mt-1">Below 30% completion</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">High Performers</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.highPerformers}</div>
              <p className="text-xs text-purple-700 mt-1">Above 80% completion</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {formatTime(stats.totalTimeSpent)}
              </div>
              <p className="text-xs text-orange-700 mt-1">Combined learning time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Progress Overview</CardTitle>
                <CardDescription>Course completion and engagement metrics</CardDescription>
              </div>
              <Select
                value={selectedCourseId?.toString() || 'all'}
                onValueChange={value =>
                  setSelectedCourseId(value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {/* Would need to fetch courses list */}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseProgress.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No progress data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    courseProgress.map(progress => {
                      const lastAccessStatus = getLastAccessedStatus(progress.last_accessed);
                      const isAtRisk = (progress.completion_percentage || 0) < 30;

                      return (
                        <TableRow key={progress.id} className={isAtRisk ? 'bg-red-50' : ''}>
                          <TableCell className="font-medium">
                            {progress.user?.display_name || 'N/A'}
                            {isAtRisk && (
                              <AlertTriangle className="inline ml-2 h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>{progress.course?.title || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress
                                value={progress.completion_percentage || 0}
                                className="w-24"
                              />
                              <span className="text-xs text-gray-600">
                                {(progress.completion_percentage || 0).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatTime(progress.total_time_spent || 0)}</TableCell>
                          <TableCell>
                            <span className={lastAccessStatus.color}>{lastAccessStatus.text}</span>
                          </TableCell>
                          <TableCell>
                            {getCompletionBadge(progress.completion_percentage || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedStudent({
                                  userId: progress.user_id,
                                  courseId: progress.course_id,
                                })
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Students Alert */}
        {stats.atRiskCount > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                At-Risk Students Alert
              </CardTitle>
              <CardDescription className="text-red-700">
                {stats.atRiskCount} student(s) with less than 30% completion - intervention may be
                needed
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Student Progress Viewer Dialog */}
      {selectedStudent && (
        <StudentProgressViewer
          userId={selectedStudent.userId}
          courseId={selectedStudent.courseId}
          open={!!selectedStudent}
          onOpenChange={open => !open && setSelectedStudent(null)}
        />
      )}
    </>
  );
}
