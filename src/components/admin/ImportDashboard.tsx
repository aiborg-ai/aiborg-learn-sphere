import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Package, AlertCircle, CheckCircle, Clock } from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

import { logger } from '@/utils/logger';
interface ImportLog {
  id: string;
  status: string;
  created_at: string;
  import_time_ms?: number;
  import_type: string;
  items_imported?: number;
  summary?: {
    categories?: Record<string, number>;
  };
  [key: string]: unknown;
}

interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalCourses: number;
  totalEvents: number;
  avgImportTime: number;
  lastImportDate: string;
  activeSchedules: number;
}

interface ChartData {
  date: string;
  courses: number;
  events: number;
  total: number;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

interface SuccessRateData {
  type: string;
  success: number;
  failed: number;
  rate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ImportDashboard() {
  const [stats, setStats] = useState<ImportStats>({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    totalCourses: 0,
    totalEvents: 0,
    avgImportTime: 0,
    lastImportDate: '',
    activeSchedules: 0,
  });

  const [timeRange, setTimeRange] = useState('7d');
  const [importHistory, setImportHistory] = useState<ChartData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [successRates, setSuccessRates] = useState<SuccessRateData[]>([]);
  const [recentImports, setRecentImports] = useState<ImportLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate = subDays(endDate, 1);
          break;
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
      }

      // Fetch import logs
      const { data: logs, error: logsError } = await supabase
        .from('import_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Fetch courses and events counts
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Fetch active schedules
      const { count: schedulesCount } = await supabase
        .from('scheduled_imports')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Process stats
      const totalImports = logs?.length || 0;
      const successfulImports = logs?.filter(l => l.status === 'completed').length || 0;
      const failedImports = logs?.filter(l => l.status === 'failed').length || 0;

      // Calculate average import time
      const importTimes = logs?.filter(l => l.import_time_ms).map(l => l.import_time_ms) || [];
      const avgImportTime =
        importTimes.length > 0 ? importTimes.reduce((a, b) => a + b, 0) / importTimes.length : 0;

      // Get last import date
      const lastImportDate = logs && logs.length > 0 ? logs[0].created_at : '';

      setStats({
        totalImports,
        successfulImports,
        failedImports,
        totalCourses: coursesCount || 0,
        totalEvents: eventsCount || 0,
        avgImportTime: Math.round(avgImportTime),
        lastImportDate,
        activeSchedules: schedulesCount || 0,
      });

      // Process chart data
      processImportHistory(logs || [], startDate, endDate);
      processCategoryBreakdown(logs || []);
      processSuccessRates(logs || []);

      // Set recent imports
      setRecentImports(logs?.slice(0, 5) || []);
    } catch (_error) {
      logger.error('Error fetching dashboard data:', _error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const processImportHistory = (logs: ImportLog[], startDate: Date, endDate: Date) => {
    const dailyData: { [key: string]: { courses: number; events: number } } = {};

    // Initialize all days in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'MMM dd');
      dailyData[dateKey] = { courses: 0, events: 0 };
    }

    // Count imports by day
    logs.forEach(log => {
      if (log.status === 'completed') {
        const dateKey = format(new Date(log.created_at), 'MMM dd');
        if (dailyData[dateKey]) {
          if (log.import_type === 'course') {
            dailyData[dateKey].courses += log.items_imported || 0;
          } else if (log.import_type === 'event') {
            dailyData[dateKey].events += log.items_imported || 0;
          }
        }
      }
    });

    // Convert to array
    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      courses: data.courses,
      events: data.events,
      total: data.courses + data.events,
    }));

    setImportHistory(chartData);
  };

  const processCategoryBreakdown = (logs: ImportLog[]) => {
    const categoryCount: { [key: string]: number } = {};

    logs.forEach(log => {
      if (log.status === 'completed' && log.summary?.categories) {
        Object.entries(log.summary.categories).forEach(([category, count]) => {
          categoryCount[category] = (categoryCount[category] || 0) + (count as number);
        });
      }
    });

    const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
    const data = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    setCategoryBreakdown(data);
  };

  const processSuccessRates = (logs: ImportLog[]) => {
    const courseStats = { success: 0, failed: 0 };
    const eventStats = { success: 0, failed: 0 };

    logs.forEach(log => {
      if (log.import_type === 'course') {
        if (log.status === 'completed') courseStats.success++;
        else if (log.status === 'failed') courseStats.failed++;
      } else if (log.import_type === 'event') {
        if (log.status === 'completed') eventStats.success++;
        else if (log.status === 'failed') eventStats.failed++;
      }
    });

    const courseTotal = courseStats.success + courseStats.failed;
    const eventTotal = eventStats.success + eventStats.failed;

    setSuccessRates([
      {
        type: 'Courses',
        success: courseStats.success,
        failed: courseStats.failed,
        rate: courseTotal > 0 ? Math.round((courseStats.success / courseTotal) * 100) : 0,
      },
      {
        type: 'Events',
        success: eventStats.success,
        failed: eventStats.failed,
        rate: eventTotal > 0 ? Math.round((eventStats.success / eventTotal) * 100) : 0,
      },
    ]);
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: StatCardProps) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>{trendValue}</span>
            <span>from last period</span>
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Import Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Monitor your template import performance and statistics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Imports"
          value={stats.totalImports}
          icon={Package}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Success Rate"
          value={`${
            stats.totalImports > 0
              ? Math.round((stats.successfulImports / stats.totalImports) * 100)
              : 0
          }%`}
          icon={CheckCircle}
          trend={stats.failedImports > 0 ? 'down' : 'up'}
          trendValue={stats.failedImports > 0 ? `-${stats.failedImports}` : '+100%'}
        />
        <StatCard
          title="Avg Import Time"
          value={`${(stats.avgImportTime / 1000).toFixed(1)}s`}
          icon={Clock}
        />
        <StatCard title="Active Schedules" value={stats.activeSchedules} icon={Calendar} />
      </div>

      {/* Charts */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="success">Success Rates</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import Trend</CardTitle>
              <CardDescription>Number of items imported over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="350">
                <AreaChart data={importHistory}>
                  <defs>
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="courses"
                    stackId="1"
                    stroke="#0088FE"
                    fillOpacity={1}
                    fill="url(#colorCourses)"
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stackId="1"
                    stroke="#00C49F"
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Breakdown of imports by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="350">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Most imported categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.count}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {category.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="success">
          <Card>
            <CardHeader>
              <CardTitle>Success Rates by Type</CardTitle>
              <CardDescription>Import success and failure rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="350">
                <BarChart data={successRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" stackId="a" fill="#00C49F" name="Successful" />
                  <Bar dataKey="failed" stackId="a" fill="#FF8042" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {successRates.map(item => (
                  <div key={item.type} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{item.type}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-bold text-green-600">{item.rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Performance Metrics</CardTitle>
                <CardDescription>System performance during imports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Processing Time</span>
                    <Badge variant="outline">{(stats.avgImportTime / 1000).toFixed(2)}s</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Courses Imported</span>
                    <Badge variant="outline">{stats.totalCourses}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Events Imported</span>
                    <Badge variant="outline">{stats.totalEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Failed Imports</span>
                    <Badge variant="destructive">{stats.failedImports}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Import Activity</CardTitle>
                <CardDescription>Latest import operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentImports.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {log.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {log.import_type === 'course' ? 'Courses' : 'Events'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={log.status === 'completed' ? 'default' : 'destructive'}>
                          {log.items_imported || 0} items
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
