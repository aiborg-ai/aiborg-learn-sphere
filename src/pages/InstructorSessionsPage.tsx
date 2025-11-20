import { useState } from 'react';
import { InstructorAttendanceDashboard } from '@/components/InstructorAttendanceDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourses } from '@/hooks/useCourses';
import { useCourseSessions } from '@/hooks/useCourseSessions';
import { useSessionAttendance } from '@/hooks/useSessionAttendance';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Calendar, TrendingUp, Users } from '@/components/ui/icons';

export default function InstructorSessionsPage() {
  const { courses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();

  // Filter to get only courses where user is instructor
  // For now, we'll show all courses (in production, filter by instructor_id)
  const instructorCourses = courses;

  // Get data for selected course
  const courseId = selectedCourseId || instructorCourses?.[0]?.id;
  const { sessions, sessionStats } = useCourseSessions(courseId);
  const { courseReport } = useSessionAttendance(undefined, courseId);

  if (!instructorCourses || instructorCourses.length === 0) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No Courses Assigned</h2>
          <p className="mt-2 text-muted-foreground">
            You don't have any courses assigned to you as an instructor
          </p>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions?.filter(
    s => s.status === 'scheduled' && new Date(s.session_date) >= new Date()
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Session Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your course sessions and mark attendance
        </p>
      </div>

      {/* Course Selector */}
      {instructorCourses.length > 1 && (
        <div className="mb-6">
          <Label htmlFor="course-select">Select Course</Label>
          <select
            id="course-select"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={courseId}
            onChange={e => setSelectedCourseId(Number(e.target.value))}
          >
            {instructorCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Statistics */}
      {sessionStats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Sessions
              </CardDescription>
              <CardTitle className="text-3xl">{sessionStats.total_sessions}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {sessionStats.completed_sessions}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Upcoming
              </CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {sessionStats.upcoming_sessions}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Avg Attendance
              </CardDescription>
              <CardTitle className="text-3xl">
                {sessionStats.avg_attendance?.toFixed(0) || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="report">Attendance Report</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <InstructorAttendanceDashboard courseId={courseId!} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled course sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {!upcomingSessions || upcomingSessions.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Upcoming Sessions</h3>
                  <p className="mt-2 text-muted-foreground">
                    You don't have any upcoming sessions scheduled
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingSessions.map(session => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{session.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Session #{session.session_number}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(session.session_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {session.start_time} - {session.end_time}
                          </TableCell>
                          <TableCell>{session.location || session.meeting_url || '-'}</TableCell>
                          <TableCell>
                            {session.max_capacity
                              ? `${session.current_attendance}/${session.max_capacity}`
                              : session.current_attendance}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={session.status === 'scheduled' ? 'default' : 'secondary'}
                            >
                              {session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Attendance Report</CardTitle>
              <CardDescription>Overall attendance statistics for all students</CardDescription>
            </CardHeader>
            <CardContent>
              {!courseReport || courseReport.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Attendance Data</h3>
                  <p className="mt-2 text-muted-foreground">No attendance has been recorded yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Total Sessions</TableHead>
                        <TableHead>Attended</TableHead>
                        <TableHead>Missed</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Excused</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseReport.map(student => (
                        <TableRow key={student.user_id}>
                          <TableCell className="font-medium">{student.user_name}</TableCell>
                          <TableCell>{student.total_sessions}</TableCell>
                          <TableCell className="text-green-600">{student.attended}</TableCell>
                          <TableCell className="text-red-600">{student.missed}</TableCell>
                          <TableCell className="text-yellow-600">{student.late}</TableCell>
                          <TableCell className="text-blue-600">{student.excused}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={student.attendance_rate >= 75 ? 'default' : 'destructive'}
                              >
                                {student.attendance_rate?.toFixed(0) || 0}%
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
