/**
 * Admin Surveys Page
 * Manage surveys and view results
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SurveyManager, SurveyResultsDashboard } from '@/components/admin/surveys';
import { ClipboardList, BarChart3 } from 'lucide-react';

export default function AdminSurveys() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audience Surveys</h1>
        <p className="text-muted-foreground">
          Gather feedback and understand what your audience wants to learn
        </p>
      </div>

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Manage Surveys
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
          <SurveyManager />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <SurveyResultsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
