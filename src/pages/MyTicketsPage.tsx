import { useState } from 'react';
import { useSessionTickets } from '@/hooks/useSessionTickets';
import { SessionTicketCard } from '@/components/SessionTicketCard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, TrendingUp } from '@/components/ui/icons';
import { useCourses } from '@/hooks/useCourses';
import { Label } from '@/components/ui/label';

export default function MyTicketsPage() {
  const { courses } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<number | undefined>();

  // Get tickets for selected course (or first course)
  const courseId = selectedCourse || courses?.[0]?.id;
  const { tickets, stats, isLoading } = useSessionTickets(courseId);

  if (!courses || courses.length === 0) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No Enrolled Courses</h2>
          <p className="mt-2 text-muted-foreground">
            Enroll in a course to start receiving session tickets
          </p>
        </div>
      </div>
    );
  }

  const activeTickets = tickets?.filter(t => t.status === 'active') || [];
  const attendedTickets = tickets?.filter(t => t.status === 'attended') || [];
  const upcomingTickets = activeTickets.filter(t => new Date(t.session_date) >= new Date());
  const pastTickets =
    tickets?.filter(
      t =>
        t.status === 'attended' ||
        t.status === 'missed' ||
        (t.status === 'active' && new Date(t.session_date) < new Date())
    ) || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Session Tickets</h1>
        <p className="mt-2 text-muted-foreground">View and manage your course session tickets</p>
      </div>

      {/* Course Selector */}
      {courses.length > 1 && (
        <div className="mb-6">
          <Label htmlFor="course-select">Select Course</Label>
          <select
            id="course-select"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={courseId}
            onChange={e => setSelectedCourse(Number(e.target.value))}
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-3xl">{stats.total_sessions}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attended</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.attended_sessions}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Missed</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.missed_sessions}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attendance Rate</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                {stats.attendance_rate?.toFixed(0) || 0}%
                {stats.attendance_rate && stats.attendance_rate > 75 && (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tickets */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
          <TabsTrigger value="attended">Attended ({attendedTickets.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : upcomingTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Upcoming Sessions</h3>
              <p className="mt-2 text-muted-foreground">
                You don't have any upcoming sessions scheduled
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTickets.map(ticket => (
                <SessionTicketCard key={ticket.id} ticket={ticket} courseId={courseId!} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attended" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : attendedTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Attended Sessions</h3>
              <p className="mt-2 text-muted-foreground">Your attended sessions will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attendedTickets.map(ticket => (
                <SessionTicketCard key={ticket.id} ticket={ticket} courseId={courseId!} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : pastTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Past Sessions</h3>
              <p className="mt-2 text-muted-foreground">Your session history will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastTickets.map(ticket => (
                <SessionTicketCard key={ticket.id} ticket={ticket} courseId={courseId!} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
