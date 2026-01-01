/**
 * Enhanced Team Analytics Page
 * Comprehensive analytics dashboard with 8 advanced metrics
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Zap,
  Users,
  GraduationCap,
  Clock,
  UserCog,
  DollarSign,
  Download,
  RefreshCw,
  Loader2,
} from '@/components/ui/icons';
import { useEnhancedTeamAnalytics } from '@/hooks/useTeamAnalytics';
import { SkillsGapChart } from '@/components/admin/analytics/enhanced/SkillsGapChart';
import { TeamMomentumGauge } from '@/components/admin/analytics/enhanced/TeamMomentumGauge';
import { TeamHealthDashboard } from '@/components/admin/analytics/enhanced/TeamHealthDashboard';
import { ROIMetricsCards } from '@/components/admin/analytics/enhanced/ROIMetricsCards';
import { exportAnalyticsToPDF, type AnalyticsSection, type DateRange } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface EnhancedTeamAnalyticsProps {
  organizationId: string;
  managerId?: string;
}

export function EnhancedTeamAnalytics({ organizationId, managerId }: EnhancedTeamAnalyticsProps) {
  const analytics = useEnhancedTeamAnalytics(organizationId, managerId);

  const [activeTab, setActiveTab] = React.useState('overview');
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info('Generating PDF report... This may take a few moments', { duration: 3000 });

      // Define sections to include in the PDF
      const sections: AnalyticsSection[] = [
        {
          title: 'Team Health Dashboard',
          elementId: 'team-health-dashboard',
          includeInExport: true,
        },
        {
          title: 'Team Momentum',
          elementId: 'team-momentum-gauge',
          includeInExport: true,
        },
        {
          title: 'ROI Metrics',
          elementId: 'roi-metrics-cards',
          includeInExport: true,
        },
        {
          title: 'Skills Gap Analysis',
          elementId: 'skills-gap-chart',
          includeInExport: true,
        },
      ];

      // Date range (no filter applied for team analytics)
      const dateRange: DateRange = {
        startDate: null,
        endDate: null,
        preset: 'All Time',
      };

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Team-Analytics-${organizationId}-${timestamp}.pdf`;

      await exportAnalyticsToPDF(sections, dateRange, filename);

      toast.success('PDF report generated successfully!');
    } catch (_error) {
      logger.error('PDF export _error:', _error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    // Invalidate all queries to force refresh
    window.location.reload();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Team Analytics</h1>
          <p className="text-muted-foreground">
            Advanced insights into skills, momentum, health, and ROI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Tabs for different metric categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills">
            <GraduationCap className="h-4 w-4 mr-2" />
            Skills & Learning
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Team Health Score */}
            <div id="team-health-dashboard">
              <TeamHealthDashboard
                data={analytics.healthScore.data}
                isLoading={analytics.healthScore.isLoading}
                isError={analytics.healthScore.isError}
              />
            </div>

            {/* Team Momentum */}
            <div id="team-momentum-gauge">
              <TeamMomentumGauge
                data={analytics.momentum.data}
                isLoading={analytics.momentum.isLoading}
                isError={analytics.momentum.isError}
              />
            </div>
          </div>

          {/* ROI Overview */}
          <div id="roi-metrics-cards">
            <ROIMetricsCards
              data={analytics.roi.data}
              isLoading={analytics.roi.isLoading}
              isError={analytics.roi.isError}
            />
          </div>
        </TabsContent>

        {/* Skills & Learning Tab */}
        <TabsContent value="skills" className="space-y-6">
          {/* Skills Gap Analysis */}
          <div id="skills-gap-chart">
            <SkillsGapChart
              data={analytics.skillsGap.data || []}
              isLoading={analytics.skillsGap.isLoading}
              isError={analytics.skillsGap.isError}
            />
          </div>

          {/* Learning Path Effectiveness & Time to Competency */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Learning Path Effectiveness
                </CardTitle>
                <CardDescription>Success rates by learning pathway</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.learningPaths.isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : analytics.learningPaths.data && analytics.learningPaths.data.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.learningPaths.data.slice(0, 5).map((path, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{path.path_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {path.total_enrolled} enrolled • {path.total_completed} completed
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={path.completion_rate >= 70 ? 'default' : 'secondary'}>
                            {path.completion_rate.toFixed(1)}%
                          </Badge>
                          {path.avg_days_to_complete && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {path.avg_days_to_complete.toFixed(0)} days avg
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No learning paths data</p>
                )}
              </CardContent>
            </Card>

            {/* Time to Competency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time-to-Competency
                </CardTitle>
                <CardDescription>Average time from enrollment to completion</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.timeToCompetency.isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : analytics.timeToCompetency.data &&
                  analytics.timeToCompetency.data.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.timeToCompetency.data.slice(0, 5).map((course, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{course.course_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.total_completions} completions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{course.avg_days.toFixed(0)} days</p>
                          <p className="text-xs text-muted-foreground">
                            Median: {course.median_days.toFixed(0)}d
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No competency data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Team Momentum */}
            <TeamMomentumGauge
              data={analytics.momentum.data}
              isLoading={analytics.momentum.isLoading}
              isError={analytics.momentum.isError}
            />

            {/* Collaboration Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cross-Team Collaboration
                </CardTitle>
                <CardDescription>Courses with multi-team enrollment</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.collaboration.isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : analytics.collaboration.data ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold">
                          {analytics.collaboration.data.total_cross_team_courses}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Shared Courses</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold">
                          {analytics.collaboration.data.avg_teams_per_course.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Avg Teams</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold">
                          {analytics.collaboration.data.collaboration_score.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Collab Score</p>
                      </div>
                    </div>

                    {/* Most Collaborative Course */}
                    {analytics.collaboration.data.most_collaborative_course && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Most Collaborative Course
                        </p>
                        <p className="font-semibold">
                          {analytics.collaboration.data.most_collaborative_course.course_title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analytics.collaboration.data.most_collaborative_course.teams_enrolled}{' '}
                          teams •{' '}
                          {analytics.collaboration.data.most_collaborative_course.total_learners}{' '}
                          learners
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No collaboration data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Manager Dashboard (if managerId provided) */}
          {managerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Manager Dashboard
                </CardTitle>
                <CardDescription>Your team's progress and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.managerDashboard.isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : analytics.managerDashboard.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-xl font-bold">
                          {analytics.managerDashboard.data.direct_reports_count}
                        </p>
                        <p className="text-xs text-muted-foreground">Direct Reports</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-xl font-bold">
                          {analytics.managerDashboard.data.avg_team_progress.toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Progress</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-xl font-bold">
                          {analytics.managerDashboard.data.team_completion_rate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Completion Rate</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-xl font-bold text-orange-600">
                          {analytics.managerDashboard.data.members_with_overdue}
                        </p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>

                    {/* At-Risk Members */}
                    {analytics.managerDashboard.data.at_risk_members.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3">At-Risk Team Members</h4>
                        <div className="space-y-2">
                          {analytics.managerDashboard.data.at_risk_members.map((member, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm">{member.name}</span>
                              <div className="flex gap-1">
                                {member.risk_factors.map((factor, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Manager data not available
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <ROIMetricsCards
            data={analytics.roi.data}
            isLoading={analytics.roi.isLoading}
            isError={analytics.roi.isError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedTeamAnalytics;
