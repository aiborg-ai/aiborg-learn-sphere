/**
 * AI Content Manager
 *
 * Admin UI for managing AI system prompts, content templates, and grading rubrics.
 * Allows CRUD operations without code changes.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, MessageSquare, FileText, ClipboardCheck, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SystemPromptsTab from './ai-content/SystemPromptsTab';
import ContentTemplatesTab from './ai-content/ContentTemplatesTab';
import GradingRubricsTab from './ai-content/GradingRubricsTab';

export default function AIContentManager() {
  const [activeTab, setActiveTab] = useState('prompts');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Content Manager</h1>
            <p className="text-muted-foreground">
              Manage AI prompts, templates, and rubrics without code changes
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes made here take effect within 5 minutes (cache expiry). All modifications are
          logged for audit trail.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            System Prompts
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Templates
          </TabsTrigger>
          <TabsTrigger value="rubrics" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Grading Rubrics
          </TabsTrigger>
        </TabsList>

        {/* System Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI System Prompts</CardTitle>
              <CardDescription>
                Manage system prompts for chatbot, grading, explanations, and more. Use{' '}
                {'{{variable}}'} syntax for dynamic content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemPromptsTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>
                Manage personalized content templates for different audiences (primary, secondary,
                professional, business).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentTemplatesTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading Rubrics Tab */}
        <TabsContent value="rubrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grading Rubrics</CardTitle>
              <CardDescription>
                Manage AI grading rubrics with criteria, weights, and scoring levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GradingRubricsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
