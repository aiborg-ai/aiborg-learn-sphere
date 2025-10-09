import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RevenueAnalytics } from './RevenueAnalytics';
import { EnrollmentAnalytics } from './EnrollmentAnalytics';
import { DollarSign, Users, Activity, Calendar } from 'lucide-react';

export function AnalyticsDashboardEnhanced() {
  const [dateRangePreset, setDateRangePreset] = useState<string>('30');

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRangePreset) {
      case '7':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '365':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics & Reports</h2>
          <p className="text-muted-foreground">Comprehensive business intelligence</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="h-4 w-4 mr-2" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Activity className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <EnrollmentAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Engagement metrics coming soon</p>
            <p className="text-sm mt-2">This feature will be available in the next update</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
