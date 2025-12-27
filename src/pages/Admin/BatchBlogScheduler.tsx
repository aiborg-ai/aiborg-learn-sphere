/**
 * Batch Blog Scheduler - Main Admin Page
 *
 * Comprehensive admin tool for batch blog creation with AI, smart scheduling,
 * templates, campaigns, and auto-publishing.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Sparkles, FileText, FolderKanban, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BatchCreator } from '@/components/batch-blog-scheduler/BatchCreator';
import { PublishingCalendar } from '@/components/batch-blog-scheduler/PublishingCalendar';
import { TemplateManager } from '@/components/batch-blog-scheduler/TemplateManager';
import { CampaignManager } from '@/components/batch-blog-scheduler/CampaignManager';
import { BatchJobsHistory } from '@/components/batch-blog-scheduler/BatchJobsHistory';

export default function BatchBlogScheduler() {
  const [activeTab, setActiveTab] = useState('batch-creator');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Batch Blog Scheduler
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, schedule, and manage blog posts at scale with AI assistance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="batch-creator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Batch Creator</span>
              <span className="sm:hidden">Create</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmpl</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
              <span className="sm:hidden">Camp</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">Hist</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Batch Creator */}
          <TabsContent value="batch-creator" className="mt-6">
            <BatchCreator />
          </TabsContent>

          {/* Tab 2: Publishing Calendar */}
          <TabsContent value="calendar" className="mt-6">
            <PublishingCalendar />
          </TabsContent>

          {/* Tab 3: Template Manager */}
          <TabsContent value="templates" className="mt-6">
            <TemplateManager />
          </TabsContent>

          {/* Tab 4: Campaign Manager */}
          <TabsContent value="campaigns" className="mt-6">
            <CampaignManager />
          </TabsContent>

          {/* Tab 5: Batch Jobs History */}
          <TabsContent value="history" className="mt-6">
            <BatchJobsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
