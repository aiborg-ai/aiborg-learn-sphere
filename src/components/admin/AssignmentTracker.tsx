import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAssignmentTracking } from '@/hooks/useProgressTracking';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Award,
} from '@/components/ui/icons';

export function AssignmentTracker() {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [grading, setGrading] = useState(false);

  const { submissions, loading, gradeSubmission } = useAssignmentTracking();
  const { toast } = useToast();

  const getStatusBadge = (status: string, dueDate?: string) => {
    if (status === 'graded') {
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Graded
        </Badge>
      );
    }

    if (status === 'late') {
      return (
        <Badge variant="destructive">
          <Clock className="h-3 w-3 mr-1" />
          Late
        </Badge>
      );
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getGradeColor = (grade: number | null, maxGrade: number) => {
    if (grade === null) return 'text-gray-500';
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleGradeClick = (submission: (typeof submissions)[0]) => {
    setSelectedSubmission(submission.id);
    setGradeValue(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    const grade = parseFloat(gradeValue);
    if (isNaN(grade)) {
      toast({
        title: 'Invalid Grade',
        description: 'Please enter a valid numeric grade',
        variant: 'destructive',
      });
      return;
    }

    setGrading(true);
    try {
      await gradeSubmission(selectedSubmission, grade, feedback);

      toast({
        title: 'Assignment Graded',
        description: 'Grade and feedback have been saved successfully',
      });

      setSelectedSubmission(null);
      setGradeValue('');
      setFeedback('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit grade',
        variant: 'destructive',
      });
    } finally {
      setGrading(false);
    }
  };

  const getStatistics = () => {
    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(
      s => s.status === 'submitted' || s.status === 'pending'
    ).length;
    const late = submissions.filter(s => s.status === 'late').length;

    const gradedSubmissions = submissions.filter(s => s.grade !== null);
    const averageGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : 0;

    return { total, graded, pending, late, averageGrade };
  };

  const stats = getStatistics();
  const currentSubmission = submissions.find(s => s.id === selectedSubmission);

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
          <h2 className="text-3xl font-bold">Assignment Tracker</h2>
          <p className="text-muted-foreground">Review and grade student submissions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                <FileText className="h-4 w-4" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.graded}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                <Award className="h-4 w-4" />
                Avg Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {stats.averageGrade.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Review and grade student assignments</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No submissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.user?.display_name || 'N/A'}
                        </TableCell>
                        <TableCell>{submission.assignment?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {submission.assignment?.due_date
                            ? new Date(submission.assignment.due_date).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {submission.grade !== null ? (
                            <span
                              className={getGradeColor(
                                submission.grade,
                                submission.assignment?.max_grade || 100
                              )}
                            >
                              {submission.grade} / {submission.assignment?.max_grade || 100}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status, submission.assignment?.due_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGradeClick(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {submission.status === 'graded' ? 'Review' : 'Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={open => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Assignment</DialogTitle>
            <DialogDescription>Review submission and provide grade with feedback</DialogDescription>
          </DialogHeader>

          {currentSubmission && (
            <div className="space-y-4">
              {/* Submission Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Student</p>
                      <p className="font-medium">{currentSubmission.user?.display_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assignment</p>
                      <p className="font-medium">{currentSubmission.assignment?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-medium">
                        {new Date(currentSubmission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {getStatusBadge(
                        currentSubmission.status,
                        currentSubmission.assignment?.due_date
                      )}
                    </div>
                  </div>

                  {currentSubmission.submission_text && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600 mb-1">Submission Text:</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">
                          {currentSubmission.submission_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentSubmission.file_url && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600 mb-1">Attached File:</p>
                      <a
                        href={currentSubmission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grading Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">
                    Grade (out of {currentSubmission.assignment?.max_grade || 100})
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={currentSubmission.assignment?.max_grade || 100}
                    step="0.5"
                    value={gradeValue}
                    onChange={e => setGradeValue(e.target.value)}
                    placeholder="Enter grade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSubmission(null)}
              disabled={grading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitGrade} disabled={grading || !gradeValue}>
              {grading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Grade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
