/**
 * Knowledgebase CMS
 * Content management system for knowledgebase entries
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Shield, BarChart3, FileText, Users, Calendar, Building2 } from '@/components/ui/icons';
import KnowledgebaseDashboard from './components/KnowledgebaseDashboard';
import KnowledgebaseEntryManager from './components/KnowledgebaseEntryManager';

function KnowledgebaseCMS() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is admin
  const isAdmin = user?.email === 'hirendra.vikram@aiborg.ai';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access the Knowledgebase CMS.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">Knowledgebase CMS</h1>
          <p className="text-muted-foreground">
            Manage AI Pioneers, Events, Companies, and Research entries
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="pioneers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pioneers</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Research</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <KnowledgebaseDashboard />
          </TabsContent>

          <TabsContent value="pioneers" className="space-y-6">
            <KnowledgebaseEntryManager topicType="pioneers" />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <KnowledgebaseEntryManager topicType="events" />
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <KnowledgebaseEntryManager topicType="companies" />
          </TabsContent>

          <TabsContent value="research" className="space-y-6">
            <KnowledgebaseEntryManager topicType="research" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default KnowledgebaseCMS;
