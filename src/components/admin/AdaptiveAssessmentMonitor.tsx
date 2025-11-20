import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  AlertTriangle,
  Info,
} from '@/components/ui/icons';
import {
  AdaptiveAssessmentEngagementService,
  type AdaptiveEngagementMetrics,
  type UserEngagementData,
  type EngagementTimeSeries,
} from '@/services/analytics/AdaptiveAssessmentEngagementService';
import { logger } from '@/utils/logger';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function AdaptiveAssessmentMonitor() {
  const [metrics, setMetrics] = useState<AdaptiveEngagementMetrics | null>(null);
  const [userData, setUserData] = useState<UserEngagementData[]>([]);
  const [timeSeries, setTimeSeries] = useState<EngagementTimeSeries[]>([]);
  const [alerts, setAlerts] = useState<
    Array<{ type: string; message: string; metric: string; value: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const [metricsData, users, series, alertsData] = await Promise.all([
        AdaptiveAssessmentEngagementService.getEngagementMetrics(),
        AdaptiveAssessmentEngagementService.getUserEngagementData(50),
        AdaptiveAssessmentEngagementService.getEngagementTimeSeries(30),
        AdaptiveAssessmentEngagementService.getEngagementAlerts(),
      ]);

      setMetrics(metricsData);
      setUserData(users);
      setTimeSeries(series);
      setAlerts(alertsData);
    } catch (error) {
      logger.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const abilityDistData = Object.entries(metrics.abilityDistribution).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.message}</AlertTitle>
              <AlertDescription>
                {alert.metric}: {(alert.value * 100).toFixed(1)}%
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.completionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedAssessments} / {metrics.totalAssessments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.engagementScore}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.engagementScore >= 70
                ? 'Excellent'
                : metrics.engagementScore >= 50
                  ? 'Good'
                  : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageTimePerQuestion.toFixed(0)}s per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Exit Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.quickExitRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Users leaving in first 2 questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Ability Distribution</CardTitle>
                <CardDescription>User proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={abilityDistData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {abilityDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Metrics</CardTitle>
                <CardDescription>Average values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg. Questions Answered</span>
                  <Badge variant="outline">{metrics.averageQuestionsAnswered.toFixed(1)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Early Stop Rate</span>
                  <Badge variant="outline">{(metrics.earlyStopRate * 100).toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Max Questions Rate</span>
                  <Badge variant="outline">{(metrics.maxQuestionsRate * 100).toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg. Ability Score</span>
                  <Badge variant="outline">{metrics.averageAbilityScore.toFixed(2)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg. Confidence</span>
                  <Badge variant="outline">{metrics.averageConfidence.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Return Rate</span>
                  <Badge variant="outline">{(metrics.returnRate * 100).toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Completions vs Abandons</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completions" stroke="#10b981" name="Completions" />
                  <Line type="monotone" dataKey="abandons" stroke="#ef4444" name="Abandons" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Ability Score Trend</CardTitle>
              <CardDescription>Daily average ability scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-3, 3]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="averageAbility"
                    stroke="#3b82f6"
                    name="Avg Ability"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Top 50 users by activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Latest Score</TableHead>
                    <TableHead>Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.displayName || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.totalAttempts}</TableCell>
                      <TableCell>{user.completedAttempts}</TableCell>
                      <TableCell>
                        {user.latestAbilityScore !== null
                          ? user.latestAbilityScore.toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.engagementLevel === 'high'
                              ? 'default'
                              : user.engagementLevel === 'medium'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {user.engagementLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questions per Assessment</CardTitle>
              <CardDescription>Distribution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageQuestions" fill="#3b82f6" name="Avg Questions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {alerts.length === 0
                    ? 'Healthy'
                    : alerts.some(a => a.type === 'critical')
                      ? 'Critical'
                      : 'Warning'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Median Completion</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.medianCompletionTime.toFixed(1)} min
                </div>
                <p className="text-xs text-muted-foreground">50th percentile</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalAssessments}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
