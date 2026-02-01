/**
 * Summit Resource Hub CMS
 * Content management system for India AI Impact Summit resources
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Shield, BarChart3, FileText, Layers } from '@/components/ui/icons';
import SummitDashboard from './components/SummitDashboard';
import SummitResourceManager from './components/SummitResourceManager';
import SummitThemeManager from './components/SummitThemeManager';

function SummitCMS() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is admin (includes demo admin for stakeholder demos)
  const adminEmails = ['hirendra.vikram@aiborg.ai', 'demo-admin@aiborg.ai'];
  const isAdmin = user?.email && adminEmails.includes(user.email);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access the Summit Resource Hub CMS.
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold">Summit Resource Hub CMS</h1>
          </div>
          <p className="text-muted-foreground">
            Manage resources for India AI Impact Summit 2026 - Seven Chakras
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SummitDashboard />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <SummitResourceManager />
          </TabsContent>

          <TabsContent value="themes" className="space-y-6">
            <SummitThemeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SummitCMS;
