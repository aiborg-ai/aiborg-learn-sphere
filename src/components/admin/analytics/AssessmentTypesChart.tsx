import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from './constants';
import type { AssessmentAnalytics } from './types';

interface AssessmentTypesChartProps {
  data: AssessmentAnalytics | null;
}

export function AssessmentTypesChart({ data }: AssessmentTypesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Types</CardTitle>
        <CardDescription>Distribution by assessment type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data?.assessmentsByType || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, count }) => `${type}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {(data?.assessmentsByType || []).map((_, index) => (
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
