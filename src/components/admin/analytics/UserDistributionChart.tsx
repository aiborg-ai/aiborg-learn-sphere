import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from './constants';
import type { PlatformMetrics } from './types';

interface UserDistributionChartProps {
  platformMetrics: PlatformMetrics | null;
}

export function UserDistributionChart({ platformMetrics }: UserDistributionChartProps) {
  const data = [
    { name: 'Students', value: platformMetrics?.totalStudents || 0 },
    { name: 'Instructors', value: platformMetrics?.totalInstructors || 0 },
    { name: 'Admins', value: platformMetrics?.totalAdmins || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>Users by role</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
