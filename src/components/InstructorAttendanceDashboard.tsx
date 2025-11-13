import { useState } from 'react';
import { useSessionAttendance } from '@/hooks/useSessionAttendance';
import { useCourseSessions } from '@/hooks/useCourseSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Users,
  Search,
  Download,
  CheckCheck,
} from 'lucide-react';

interface InstructorAttendanceDashboardProps {
  courseId: number;
}

export function InstructorAttendanceDashboard({ courseId }: InstructorAttendanceDashboardProps) {
  const { sessions } = useCourseSessions(courseId);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const { attendanceList, markAttendance, bulkMarkAttendance, markAllPresent } =
    useSessionAttendance(selectedSessionId, courseId);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [participationScore, setParticipationScore] = useState<number | undefined>();

  // Filter sessions (only show scheduled and in-progress)
  const availableSessions = sessions?.filter(
    s => s.status === 'scheduled' || s.status === 'in_progress'
  );

  // Filter students by search
  const filteredStudents = attendanceList?.filter(
    student =>
      student.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAttendance = async (
    userId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    try {
      await markAttendance.mutateAsync({
        sessionId: selectedSessionId,
        userId,
        status,
      });
      toast({
        title: 'Success',
        description: `Attendance marked as ${status}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNotesDialog = (student: any) => {
    setCurrentStudent(student);
    setNotes(student.instructor_notes || '');
    setParticipationScore(student.participation_score);
    setShowNotesDialog(true);
  };

  const handleSaveNotes = async () => {
    if (!currentStudent) return;

    try {
      await markAttendance.mutateAsync({
        sessionId: selectedSessionId,
        userId: currentStudent.user_id,
        status: currentStudent.status === 'not_marked' ? 'present' : currentStudent.status,
        notes,
        participationScore,
      });
      toast({
        title: 'Success',
        description: 'Notes and score saved',
      });
      setShowNotesDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save notes',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStudent = (userId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkMarkPresent = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select students to mark as present',
        variant: 'destructive',
      });
      return;
    }

    try {
      const attendanceData = Array.from(selectedStudents).map(userId => ({
        userId,
        status: 'present' as const,
      }));

      await bulkMarkAttendance.mutateAsync(attendanceData);
      setSelectedStudents(new Set());
      toast({
        title: 'Success',
        description: `Marked ${selectedStudents.size} students as present`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllPresent = async () => {
    try {
      await markAllPresent.mutateAsync();
      toast({
        title: 'Success',
        description: 'All students marked as present',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all present',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (!attendanceList || attendanceList.length === 0) return;

    const csv = [
      ['Name', 'Email', 'Ticket Number', 'Status', 'Check-in Time', 'Participation Score', 'Notes'],
      ...attendanceList.map(student => [
        student.user_name,
        student.user_email,
        student.ticket_number,
        student.status,
        student.check_in_time || '',
        student.participation_score?.toString() || '',
        student.instructor_notes || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedSessionId}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-500">Excused</Badge>;
      case 'not_marked':
        return <Badge variant="outline">Not Marked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = attendanceList
    ? {
        total: attendanceList.length,
        present: attendanceList.filter(s => s.status === 'present').length,
        absent: attendanceList.filter(s => s.status === 'absent').length,
        late: attendanceList.filter(s => s.status === 'late').length,
        notMarked: attendanceList.filter(s => s.status === 'not_marked').length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Session Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a session to mark student attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              {availableSessions?.map(session => (
                <SelectItem key={session.id} value={session.id}>
                  {session.title} - {new Date(session.session_date).toLocaleDateString()} at{' '}
                  {session.start_time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedSessionId && stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Present
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.present}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Absent
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.absent}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Late
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.late}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Not Marked
              </CardDescription>
              <CardTitle className="text-3xl">{stats.notMarked}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>Mark attendance for each student</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!attendanceList || attendanceList.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarkAllPresent}
                  disabled={markAllPresent.isPending || !attendanceList}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Bulk Actions */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleBulkMarkPresent}
                disabled={selectedStudents.size === 0 || bulkMarkAttendance.isPending}
              >
                Mark {selectedStudents.size > 0 && `(${selectedStudents.size})`} Present
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredStudents &&
                          filteredStudents.length > 0 &&
                          filteredStudents.every(s => selectedStudents.has(s.user_id))
                        }
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedStudents(
                              new Set(filteredStudents?.map(s => s.user_id) || [])
                            );
                          } else {
                            setSelectedStudents(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.map(student => (
                    <TableRow key={student.user_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.user_id)}
                          onCheckedChange={() => handleToggleStudent(student.user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.user_name}</p>
                          <p className="text-sm text-muted-foreground">{student.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.ticket_number}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-sm">
                        {student.check_in_time
                          ? new Date(student.check_in_time).toLocaleTimeString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {student.participation_score ? (
                          <Badge variant="secondary">{student.participation_score}/100</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAttendance(student.user_id, 'present')}
                            disabled={markAttendance.isPending}
                            className="h-8 px-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAttendance(student.user_id, 'absent')}
                            disabled={markAttendance.isPending}
                            className="h-8 px-2"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAttendance(student.user_id, 'late')}
                            disabled={markAttendance.isPending}
                            className="h-8 px-2"
                          >
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenNotesDialog(student)}
                            className="h-8"
                          >
                            Notes
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
      )}

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes & Score</DialogTitle>
            <DialogDescription>
              {currentStudent?.user_name} - {currentStudent?.ticket_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="participation-score">Participation Score (0-100)</Label>
              <Input
                id="participation-score"
                type="number"
                min="0"
                max="100"
                value={participationScore || ''}
                onChange={e => setParticipationScore(Number(e.target.value) || undefined)}
                placeholder="Enter score"
              />
            </div>

            <div>
              <Label htmlFor="instructor-notes">Instructor Notes</Label>
              <Textarea
                id="instructor-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about student's participation..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={markAttendance.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
