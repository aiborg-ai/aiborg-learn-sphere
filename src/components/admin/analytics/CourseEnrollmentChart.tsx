import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CourseAnalytics } from './types';

interface CourseEnrollmentChartProps {
  data: CourseAnalytics[];
}

export function CourseEnrollmentChart({ data }: CourseEnrollmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Courses by Enrollment</CardTitle>
        <CardDescription>Most popular courses on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="courseTitle" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="enrollments" fill="#8b5cf6" name="Enrollments" />
            <Bar dataKey="completions" fill="#10b981" name="Completions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
