import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStudentProgressDetails } from '@/hooks/useProgressTracking';
import {
  User,
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface StudentProgressViewerProps {
  userId: string;
  courseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProgressViewer({
  userId,
  courseId,
  open,
  onOpenChange,
}: StudentProgressViewerProps) {
  const { progressDetails, loading } = useStudentProgressDetails(userId, courseId);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `< 1m`;
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-blue-600';
    if (grade >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!progressDetails) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Progress Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive progress report for {progressDetails.userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{progressDetails.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{progressDetails.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-medium">{progressDetails.courseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Accessed</p>
                <p className="font-medium">
                  {progressDetails.lastAccessed
                    ? new Date(progressDetails.lastAccessed).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Alert */}
          {progressDetails.isAtRisk && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  At-Risk Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 mb-2">
                  This student requires attention due to the following factors:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {progressDetails.riskFactors.map((factor, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {factor}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Progress Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-4 w-4" />
                  Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-900">
                    {progressDetails.completionPercentage.toFixed(1)}%
                  </div>
                  <Progress value={progressDetails.completionPercentage} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                  <Clock className="h-4 w-4" />
                  Time Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {formatTime(progressDetails.totalTimeSpent)}
                </div>
                <p className="text-xs text-green-700 mt-1">Total learning time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                  <Award className="h-4 w-4" />
                  Avg Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getGradeColor(progressDetails.averageGrade)}`}
                >
                  {progressDetails.averageGrade !== null
                    ? `${progressDetails.averageGrade.toFixed(1)}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-purple-700 mt-1">Average score</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                  <FileText className="h-4 w-4" />
                  Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {progressDetails.assignmentsCompleted}/{progressDetails.assignmentsTotal}
                </div>
                <p className="text-xs text-orange-700 mt-1">Submitted</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Materials Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Materials Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Materials</span>
                    <Badge variant="outline">
                      {progressDetails.materialsCompleted} / {progressDetails.materialsTotal}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {progressDetails.materialsTotal > 0
                          ? (
                              (progressDetails.materialsCompleted /
                                progressDetails.materialsTotal) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        progressDetails.materialsTotal > 0
                          ? (progressDetails.materialsCompleted / progressDetails.materialsTotal) *
                            100
                          : 0
                      }
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    {progressDetails.materialsCompleted === progressDetails.materialsTotal &&
                    progressDetails.materialsTotal > 0 ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-600">
                            All materials completed!
                          </p>
                          <p className="text-xs text-gray-600">Great progress</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            {progressDetails.materialsTotal - progressDetails.materialsCompleted}{' '}
                            materials remaining
                          </p>
                          <p className="text-xs text-gray-600">Keep going!</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Submitted</span>
                    <Badge variant="outline">
                      {progressDetails.assignmentsCompleted} / {progressDetails.assignmentsTotal}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span>
                        {progressDetails.assignmentsTotal > 0
                          ? (
                              (progressDetails.assignmentsCompleted /
                                progressDetails.assignmentsTotal) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        progressDetails.assignmentsTotal > 0
                          ? (progressDetails.assignmentsCompleted /
                              progressDetails.assignmentsTotal) *
                            100
                          : 0
                      }
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <Award
                      className={`h-5 w-5 mt-0.5 ${getGradeColor(progressDetails.averageGrade)}`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        Average Grade:{' '}
                        {progressDetails.averageGrade !== null
                          ? `${progressDetails.averageGrade.toFixed(1)}%`
                          : 'Not graded yet'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {progressDetails.assignmentsTotal - progressDetails.assignmentsCompleted}{' '}
                        pending
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Overall Status</p>
                  <p className="font-semibold">
                    {progressDetails.completionPercentage >= 80 ? (
                      <span className="text-green-600">Excellent Progress</span>
                    ) : progressDetails.completionPercentage >= 60 ? (
                      <span className="text-blue-600">Good Progress</span>
                    ) : progressDetails.completionPercentage >= 30 ? (
                      <span className="text-yellow-600">Needs Improvement</span>
                    ) : (
                      <span className="text-red-600">At Risk</span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Engagement Level</p>
                  <p className="font-semibold">
                    {progressDetails.totalTimeSpent > 3600 ? (
                      <span className="text-green-600">High</span>
                    ) : progressDetails.totalTimeSpent > 1800 ? (
                      <span className="text-blue-600">Moderate</span>
                    ) : (
                      <span className="text-yellow-600">Low</span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Activity Status</p>
                  <p className="font-semibold">
                    {!progressDetails.lastAccessed ? (
                      <span className="text-gray-600">Never Active</span>
                    ) : Math.floor(
                        (Date.now() - new Date(progressDetails.lastAccessed).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) <= 1 ? (
                      <span className="text-green-600">Recently Active</span>
                    ) : Math.floor(
                        (Date.now() - new Date(progressDetails.lastAccessed).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) <= 7 ? (
                      <span className="text-blue-600">Moderately Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
