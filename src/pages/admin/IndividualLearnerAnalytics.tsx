/**
 * Individual Learner Analytics Dashboard
 * Comprehensive view of individual learner performance, progress, and engagement
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useLearnerDashboard,
  useLearnerHealthScore,
} from '@/hooks/admin/useIndividualLearnerAnalytics';
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Activity,
  Download,
  Loader2,
} from '@/components/ui/icons';
import { formatDistanceToNow } from 'date-fns';
import ExportModal from '@/components/analytics/ExportModal';
import RefreshIndicator from '@/components/analytics/RefreshIndicator';
import AnalyticsSettingsDialog from '@/components/analytics/AnalyticsSettingsDialog';
import type { ChartSection } from '@/services/analytics/EnhancedPDFExportService';
import { useAuth } from '@/hooks/useAuth';
import { useAnalyticsPreferences, useShouldRefreshPage } from '@/hooks/useAnalyticsPreferences';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Settings } from '@/components/ui/icons';
import { exportAnalyticsToPDF, type AnalyticsSection, type DateRange } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function IndividualLearnerAnalytics() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Get user preferences
  const { data: preferences } = useAnalyticsPreferences(user?.id || '');
  const shouldRefresh = useShouldRefreshPage(preferences, 'learner');

  const {
    data: dashboard,
    isLoading,
    refetch: refetchDashboard,
  } = useLearnerDashboard(userId || '');
  const { data: healthScore, refetch: refetchHealthScore } = useLearnerHealthScore(userId || '');

  // Auto-refresh setup
  const { state: refreshState, refresh: manualRefresh } = useAutoRefresh({
    interval: preferences?.auto_refresh_interval || 180000,
    enabled: shouldRefresh,
    onRefresh: async () => {
      await Promise.all([refetchDashboard(), refetchHealthScore()]);
    },
  });

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (!dashboard?.summary) {
      toast.error('Unable to export PDF - no data available');
      return;
    }

    try {
      setIsExportingPDF(true);
      toast.info('Generating PDF report... This may take a few moments', { duration: 3000 });

      // Define sections to include in the PDF
      const sections: AnalyticsSection[] = [
        {
          title: 'Learner Overview',
          elementId: 'learner-header',
          includeInExport: true,
        },
        {
          title: 'Key Performance Metrics',
          elementId: 'learner-metrics',
          includeInExport: true,
        },
        {
          title: 'Course Performance',
          elementId: 'learner-courses',
          includeInExport: true,
        },
        {
          title: 'Learning Velocity',
          elementId: 'learner-velocity',
          includeInExport: true,
        },
        {
          title: 'Skills Progress',
          elementId: 'learner-skills',
          includeInExport: true,
        },
        {
          title: 'Engagement Timeline',
          elementId: 'learner-engagement',
          includeInExport: true,
        },
      ];

      // Date range (no filter applied for learner analytics)
      const dateRange: DateRange = {
        startDate: null,
        endDate: null,
        preset: 'All Time',
      };

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const learnerName = dashboard.summary.full_name?.replace(/\s+/g, '-') || userId;
      const filename = `Learner-Analytics-${learnerName}-${timestamp}.pdf`;

      await exportAnalyticsToPDF(sections, dateRange, filename);

      toast.success('PDF report generated successfully!');
    } catch (_error) {
      logger.error('PDF export _error:', _error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export sections
  const exportSections: ChartSection[] = [
    { elementId: 'learner-header', title: 'Learner Overview', includeInExport: true },
    { elementId: 'learner-metrics', title: 'Key Performance Metrics', includeInExport: true },
    { elementId: 'learner-courses', title: 'Course Performance', includeInExport: true },
    { elementId: 'learner-velocity', title: 'Learning Velocity', includeInExport: true },
    { elementId: 'learner-skills', title: 'Skills Progress', includeInExport: true },
    { elementId: 'learner-engagement', title: 'Engagement Timeline', includeInExport: true },
  ];

  // CSV data from course performance
  const csvData =
    dashboard?.courses?.map(course => ({
      course_id: course.course_id,
      course_title: course.course_title,
      progress_percentage: course.progress_percentage,
      time_spent_minutes: course.time_spent_minutes,
      engagement_score: course.engagement_score,
      assignments_completed: course.assignments_completed,
      assignments_total: course.assignments_total,
      enrollment_date: course.enrollment_date,
      completion_date: course.completion_date,
    })) || [];

  if (!userId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No user ID provided</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!dashboard?.summary) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Learner not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { summary, courses, velocity, assessments, timeline, atRisk, learningPaths, skills } =
    dashboard;

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'dormant':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div id="learner-header" className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarImage src={summary.avatar_url || ''} />
            <AvatarFallback>
              {summary.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{summary.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={summary.learner_status === 'active' ? 'default' : 'secondary'}>
                {summary.learner_status}
              </Badge>
              {summary.department && (
                <span className="text-sm text-muted-foreground">{summary.department}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Refresh Indicator */}
          {preferences?.show_refresh_indicator && (
            <RefreshIndicator
              isRefreshing={refreshState.isRefreshing}
              lastRefreshed={refreshState.lastRefresh}
              autoRefreshEnabled={refreshState.isEnabled}
              refreshInterval={preferences?.auto_refresh_interval}
              onManualRefresh={manualRefresh}
              compact
            />
          )}

          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          {/* Health Score */}
          <Card className="w-48">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Health Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getHealthScoreColor(healthScore || 0)}`}>
                  {healthScore || 0}
                </span>
                <span className="text-muted-foreground">/100</span>
              </div>
              <Progress value={healthScore || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* At-Risk Alert */}
      {atRisk && atRisk.risk_score >= 40 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Needs Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Risk Score:{' '}
                  <span className={getRiskScoreColor(atRisk.risk_score)}>
                    {atRisk.risk_score}/100
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended: {atRisk.recommended_action}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Send Reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div id="learner-metrics" className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_enrollments}</div>
            <p className="text-xs text-muted-foreground">{summary.completed_courses} completed</p>
            <Progress
              value={(summary.completed_courses / summary.total_enrollments) * 100}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avg_progress_percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
            <Progress value={summary.avg_progress_percentage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avg_assignment_score.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.submitted_assignments} assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summary.total_time_spent_minutes / 60)}h
            </div>
            <p className="text-xs text-muted-foreground">{summary.active_days_count} active days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Course Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Recent course activity</CardDescription>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.slice(0, 5).map(course => (
                      <div key={course.course_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{course.course_title}</span>
                          <Badge
                            variant={
                              course.engagement_score >= 80
                                ? 'default'
                                : course.engagement_score >= 50
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {course.engagement_score}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{course.progress_percentage.toFixed(0)}% complete</span>
                          <span>•</span>
                          <span>{Math.round(course.time_spent_minutes / 60)}h spent</span>
                          {course.completed_at && (
                            <>
                              <span>•</span>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            </>
                          )}
                        </div>
                        <Progress value={course.progress_percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No courses enrolled</p>
                )}
              </CardContent>
            </Card>

            {/* Assessment Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Performance</CardTitle>
                <CardDescription>Assignment submission patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {assessments ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {assessments.on_time_count}
                        </div>
                        <div className="text-xs text-muted-foreground">On Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {assessments.late_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Late</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {assessments.overdue_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Average Score</span>
                        <span className="font-medium">{assessments.avg_score.toFixed(1)}%</span>
                      </div>
                      <Progress value={assessments.avg_score} className="h-2" />
                    </div>

                    {assessments.improvement_trend !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        {assessments.improvement_trend > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">
                              +{assessments.improvement_trend.toFixed(1)}% improvement
                            </span>
                          </>
                        ) : assessments.improvement_trend < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">
                              {assessments.improvement_trend.toFixed(1)}% decline
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No change in trend</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assessments submitted</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Learning Paths */}
          {learningPaths && learningPaths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Paths</CardTitle>
                <CardDescription>Progress through learning paths</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningPaths.map(path => (
                    <div key={path.learning_path_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{path.path_title}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            Step {path.current_step} of {path.total_steps} • {path.completed_steps}{' '}
                            completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {path.progress_percentage.toFixed(0)}%
                          </div>
                          {path.estimated_days_to_complete && (
                            <div className="text-xs text-muted-foreground">
                              ~{path.estimated_days_to_complete}d to complete
                            </div>
                          )}
                        </div>
                      </div>
                      <Progress value={path.progress_percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div id="learner-courses">
            <Card>
              <CardHeader>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>Detailed course performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map(course => (
                      <div
                        key={course.course_id}
                        className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{course.course_title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              {course.category && (
                                <Badge variant="outline">{course.category}</Badge>
                              )}
                              {course.difficulty_level && (
                                <Badge variant="outline">{course.difficulty_level}</Badge>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              course.engagement_score >= 80
                                ? 'default'
                                : course.engagement_score >= 50
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            Engagement: {course.engagement_score}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Progress</div>
                            <div className="font-medium">
                              {course.progress_percentage.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Time Spent</div>
                            <div className="font-medium">
                              {Math.round(course.time_spent_minutes / 60)}h
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Assignments</div>
                            <div className="font-medium">
                              {course.submitted_count}/{course.assignment_count}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg Score</div>
                            <div className="font-medium">
                              {course.avg_assignment_score.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <Progress value={course.progress_percentage} className="h-2" />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Enrolled {formatDistanceToNow(new Date(course.enrolled_at))} ago
                          </span>
                          {course.completed_at ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Completed {formatDistanceToNow(new Date(course.completed_at))} ago
                            </span>
                          ) : (
                            <span>
                              Last accessed {formatDistanceToNow(new Date(course.last_accessed))}{' '}
                              ago
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No courses enrolled</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Velocity Tab */}
        <TabsContent value="velocity" className="space-y-4">
          <div id="learner-velocity">
            <Card>
              <CardHeader>
                <CardTitle>Learning Velocity</CardTitle>
                <CardDescription>Weekly learning activity trends</CardDescription>
              </CardHeader>
              <CardContent>
                {velocity && velocity.length > 0 ? (
                  <div className="space-y-4">
                    {velocity.map(week => (
                      <div key={week.week_start} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Week of {new Date(week.week_start).toLocaleDateString()}
                          </span>
                          <div className="flex gap-4">
                            <span>{week.active_courses} courses</span>
                            <span>{Math.round(week.weekly_time_spent / 60)}h</span>
                            <span>{week.active_days_in_week} days</span>
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded overflow-hidden flex">
                          <div
                            className="bg-blue-500"
                            style={{
                              width: `${Math.min((week.weekly_time_spent / 600) * 100, 100)}%`,
                            }}
                            title={`${week.weekly_time_spent} minutes`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No velocity data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div id="learner-skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills Progress</CardTitle>
                <CardDescription>Skill acquisition and proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                {skills && skills.length > 0 ? (
                  <div className="space-y-4">
                    {skills.map(skill => (
                      <div key={skill.skill_name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{skill.skill_name}</span>
                            {skill.skill_category && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({skill.skill_category})
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={
                              skill.proficiency_level === 'expert'
                                ? 'default'
                                : skill.proficiency_level === 'advanced'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {skill.proficiency_level}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {skill.completed_courses_with_skill} of {skill.courses_with_skill} courses
                          completed • {skill.avg_progress_in_skill.toFixed(0)}% avg progress
                        </div>
                        <Progress
                          value={
                            (skill.completed_courses_with_skill / skill.courses_with_skill) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No skills data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div id="learner-engagement">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Timeline</CardTitle>
                <CardDescription>Recent activity and engagement patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline && timeline.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.slice(0, 14).map(event => (
                      <div
                        key={`${event.activity_date}-${event.event_type}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground min-w-[80px]">
                            {new Date(event.activity_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{event.event_count} events</span>
                          <span>{Math.round(event.session_duration_minutes)}m session</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No engagement data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        sections={exportSections}
        reportTitle={`${summary.full_name} - Learning Analytics`}
        reportSubtitle="Individual Performance Report"
        csvData={csvData}
        csvTemplate="coursePerformance"
        metadata={{
          Learner: summary.full_name || 'Unknown',
          Department: summary.department || 'N/A',
          Status: summary.learner_status || 'Unknown',
          'Health Score': `${healthScore || 0}/100`,
          'Total Courses': summary.total_enrollments?.toString() || '0',
          Completed: summary.completed_courses?.toString() || '0',
        }}
      />

      {/* Analytics Settings Dialog */}
      <AnalyticsSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
