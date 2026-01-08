/**
 * Predictive Analytics Dashboard
 *
 * ML-powered learner predictions dashboard showing:
 * - At-risk learners requiring intervention
 * - Prediction analytics and trends
 * - Intervention management
 * - Model performance metrics
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtRiskLearnersTable } from '@/components/admin/predictions/AtRiskLearnersTable';
import { PredictionAnalytics } from '@/components/admin/predictions/PredictionAnalytics';
import { InterventionManagement } from '@/components/admin/predictions/InterventionManagement';
import { ModelPerformance } from '@/components/admin/predictions/ModelPerformance';
import { GeneratePredictionsButton } from '@/components/admin/predictions/GeneratePredictionsButton';
import { AlertTriangle, TrendingDown, Users, Brain } from 'lucide-react';
import { usePredictionStats } from '@/hooks/admin/usePredictionStats';

export default function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState('at-risk');
  const { stats, isLoading } = usePredictionStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Predictive Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ML-powered insights for learner success and early intervention
            </p>
          </div>
          <GeneratePredictionsButton />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">At-Risk Learners</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '—' : stats?.atRiskCount || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.criticalCount || 0} critical priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Declining Engagement</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? '—' : stats?.decliningEngagement || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Interventions</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? '—' : stats?.activeInterventions || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
              <Brain className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '—' : `${stats?.modelAccuracy || 0}%`}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="at-risk">At-Risk Learners</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="performance">Model Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="at-risk" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>At-Risk Learners Requiring Intervention</CardTitle>
                <CardDescription>
                  Learners identified as high or critical risk for dropout or failure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AtRiskLearnersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PredictionAnalytics />
          </TabsContent>

          <TabsContent value="interventions" className="mt-6">
            <InterventionManagement />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <ModelPerformance />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
