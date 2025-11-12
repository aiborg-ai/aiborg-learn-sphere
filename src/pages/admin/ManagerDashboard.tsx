/**
 * Manager Dashboard
 * View and manage direct reports with performance insights
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useManagerDashboard,
  useAtRiskDirectReports,
  useTopPerformingReports,
} from '@/hooks/admin/useIndividualLearnerAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { Users, AlertTriangle, Search, ChevronRight, Activity, Award, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RefreshIndicator from '@/components/analytics/RefreshIndicator';
import AnalyticsSettingsDialog from '@/components/analytics/AnalyticsSettingsDialog';
import { useAnalyticsPreferences, useShouldRefreshPage } from '@/hooks/useAnalyticsPreferences';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Settings } from 'lucide-react';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get user preferences
  const { data: preferences } = useAnalyticsPreferences(user?.id || '');
  const shouldRefresh = useShouldRefreshPage(preferences, 'manager');

  const {
    data: dashboard,
    isLoading,
    refetch: refetchDashboard,
  } = useManagerDashboard(user?.id || '');
  const { data: atRiskReports, refetch: refetchAtRisk } = useAtRiskDirectReports(
    user?.id || '',
    40
  );
  const { data: topPerformers, refetch: refetchTopPerformers } = useTopPerformingReports(
    user?.id || '',
    5
  );

  // Auto-refresh setup
  const { state: refreshState, refresh: manualRefresh } = useAutoRefresh({
    interval: preferences?.auto_refresh_interval || 180000,
    enabled: shouldRefresh,
    onRefresh: async () => {
      await Promise.all([refetchDashboard(), refetchAtRisk(), refetchTopPerformers()]);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const filteredReports = dashboard.directReports.filter(report =>
    report.report_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'dormant':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRiskLevel = (score: number | null) => {
    if (!score) return { label: 'Low', color: 'text-green-600' };
    if (score >= 70) return { label: 'High', color: 'text-red-600' };
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
          <p className="text-muted-foreground">Monitor and support your direct reports</p>
        </div>
        <div className="flex items-center gap-3">
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

          {/* Settings Button */}
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalReports}</div>
            <p className="text-xs text-muted-foreground">Direct team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {((dashboard.activeCount / dashboard.totalReports) * 100).toFixed(0)}% of team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.atRiskCount}</div>
            <p className="text-xs text-muted-foreground">Need intervention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.inactiveCount}</div>
            <p className="text-xs text-muted-foreground">Not recently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reports ({dashboard.totalReports})</TabsTrigger>
          <TabsTrigger value="at-risk">At Risk ({dashboard.atRiskCount})</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
        </TabsList>

        {/* All Reports Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Click on a team member to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredReports.map(report => (
                  <div
                    key={report.report_user_id}
                    onClick={() => navigate(`/admin/learner-analytics/${report.report_user_id}`)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {report.report_name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{report.report_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusColor(report.learner_status)}>
                            {report.learner_status}
                          </Badge>
                          {report.department && (
                            <span className="text-sm text-muted-foreground">
                              {report.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="font-medium">
                          {report.avg_progress_percentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Courses</div>
                        <div className="font-medium">
                          {report.completed_courses}/{report.total_enrollments}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                        <div className="font-medium">{report.avg_assignment_score.toFixed(0)}%</div>
                      </div>
                      {report.risk_score !== null && report.risk_score >= 40 && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Risk</div>
                          <div className={`font-medium ${getRiskLevel(report.risk_score).color}`}>
                            {getRiskLevel(report.risk_score).label}
                          </div>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No team members found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* At-Risk Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Team Members Needing Support
              </CardTitle>
              <CardDescription>
                Learners with risk scores ≥ 40 who may need intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {atRiskReports && atRiskReports.length > 0 ? (
                <div className="space-y-4">
                  {atRiskReports.map(report => (
                    <div key={report.report_user_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {report.report_name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{report.report_name}</div>
                            <div className="text-sm text-muted-foreground">{report.department}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Risk Score</div>
                          <div
                            className={`text-2xl font-bold ${getRiskLevel(report.risk_score).color}`}
                          >
                            {report.risk_score}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Status</div>
                          <Badge variant={getStatusColor(report.learner_status)}>
                            {report.learner_status}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Progress</div>
                          <div className="font-medium">
                            {report.avg_progress_percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last Active</div>
                          <div className="font-medium">
                            {report.last_active_date
                              ? formatDistanceToNow(new Date(report.last_active_date), {
                                  addSuffix: true,
                                })
                              : 'Never'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">In Progress</div>
                          <div className="font-medium">{report.in_progress_courses} courses</div>
                        </div>
                      </div>

                      {report.recommended_action && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium">Recommended Action</div>
                            <div className="text-sm text-muted-foreground">
                              {report.recommended_action}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/learner-analytics/${report.report_user_id}`)
                          }
                        >
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Send Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No team members currently at risk
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>Your highest-achieving team members</CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers && topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {topPerformers.map((report, index) => (
                    <div
                      key={report.report_user_id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {report.report_name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{report.report_name}</div>
                        <div className="text-sm text-muted-foreground">{report.department}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Progress</div>
                          <div className="text-lg font-bold text-green-600">
                            {report.avg_progress_percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                          <div className="text-lg font-bold">
                            {report.completed_courses}/{report.total_enrollments}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Score</div>
                          <div className="text-lg font-bold">
                            {report.avg_assignment_score.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/learner-analytics/${report.report_user_id}`)
                        }
                      >
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No performance data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Settings Dialog */}
      <AnalyticsSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
