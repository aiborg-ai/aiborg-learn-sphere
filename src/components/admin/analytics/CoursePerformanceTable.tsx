import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from '@/components/ui/icons';
import { formatCurrency, formatPercentage } from './utils';
import type { CourseAnalytics } from './types';

interface CoursePerformanceTableProps {
  data: CourseAnalytics[];
}

export function CoursePerformanceTable({ data }: CoursePerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Performance Table</CardTitle>
        <CardDescription>Detailed course metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Course</th>
                <th className="p-3 text-center font-medium">Enrollments</th>
                <th className="p-3 text-center font-medium">Completion Rate</th>
                <th className="p-3 text-center font-medium">Avg Rating</th>
                <th className="p-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((course, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-3">{course.courseTitle}</td>
                  <td className="p-3 text-center">{course.enrollments}</td>
                  <td className="p-3 text-center">
                    <Badge variant={course.completionRate >= 50 ? 'default' : 'secondary'}>
                      {formatPercentage(course.completionRate)}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {course.averageRating.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">{formatCurrency(course.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
