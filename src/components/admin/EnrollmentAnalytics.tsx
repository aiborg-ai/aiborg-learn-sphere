import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEnrollmentAnalytics } from '@/hooks/useAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp, BookOpen, Download, Loader2 } from 'lucide-react';

interface EnrollmentAnalyticsProps {
  dateRange: { startDate: Date; endDate: Date };
}

export function EnrollmentAnalytics({ dateRange }: EnrollmentAnalyticsProps) {
  const { data, loading } = useEnrollmentAnalytics(dateRange);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = [
      ['Enrollment Analytics Report'],
      [
        'Date Range',
        `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`,
      ],
      [],
      ['Metric', 'Value'],
      ['Total Enrollments', data.totalEnrollments.toString()],
      ['Unique Students', data.uniqueStudents.toString()],
      [],
      ['Daily Enrollments'],
      ['Date', 'Count'],
      ...data.enrollmentsByDay.map(item => [item.date, item.count.toString()]),
      [],
      ['Enrollments by Course'],
      ['Course', 'Enrollments', 'Revenue'],
      ...data.enrollmentsByCourse.map(item => [
        item.courseTitle,
        item.count.toString(),
        item.revenue.toString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enrollment_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">No enrollment data available</p>
        </CardContent>
      </Card>
    );
  }

  const avgEnrollmentsPerDay =
    data.enrollmentsByDay.length > 0
      ? (data.totalEnrollments / data.enrollmentsByDay.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Enrollment Analytics</h3>
          <p className="text-muted-foreground">
            {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
          </p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <Users className="h-4 w-4" />
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{data.totalEnrollments}</div>
            <p className="text-xs text-blue-700 mt-1">{avgEnrollmentsPerDay} per day average</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
              <TrendingUp className="h-4 w-4" />
              Unique Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{data.uniqueStudents}</div>
            <p className="text-xs text-purple-700 mt-1">Active learners</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-800">
              <BookOpen className="h-4 w-4" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {data.enrollmentsByCourse.length}
            </div>
            <p className="text-xs text-green-700 mt-1">With enrollments</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trend</CardTitle>
          <CardDescription>Daily enrollments over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.enrollmentsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelStyle={{ color: '#000' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Enrollments"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Course Popularity</CardTitle>
          <CardDescription>Enrollments and revenue by course</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.enrollmentsByCourse.slice(0, 10)}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="courseTitle" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue') return formatCurrency(value);
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Enrollments" />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Courses</CardTitle>
          <CardDescription>Most popular courses by enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.enrollmentsByCourse.slice(0, 5).map((course, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{course.courseTitle}</p>
                    <p className="text-sm text-gray-600">
                      {course.count} enrollment{course.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(course.revenue)}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
