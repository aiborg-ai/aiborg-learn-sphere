/**
 * Intervention Management Component
 *
 * Displays and manages interventions for at-risk learners
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function InterventionManagement() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Pending Interventions
          </CardTitle>
          <CardDescription>Require action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
          <p className="text-sm text-gray-500 mt-2">No pending interventions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            In Progress
          </CardTitle>
          <CardDescription>Currently active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
          <p className="text-sm text-gray-500 mt-2">No active interventions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Completed
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
          <p className="text-sm text-gray-500 mt-2">No completed interventions</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Recent Interventions</CardTitle>
          <CardDescription>Latest intervention activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No interventions recorded yet</p>
            <p className="text-sm mt-2">
              Interventions will appear here once generated from at-risk predictions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
