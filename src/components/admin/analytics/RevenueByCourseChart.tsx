import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from './utils';
import type { RevenueMetrics } from './types';

interface RevenueByCourseChartProps {
  data: RevenueMetrics | null;
}

export function RevenueByCourseChart({ data }: RevenueByCourseChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Course</CardTitle>
        <CardDescription>Top 10 revenue-generating courses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.revenueByCourse || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="courseTitle" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={value => formatCurrency(Number(value))} />
            <Bar dataKey="amount" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
