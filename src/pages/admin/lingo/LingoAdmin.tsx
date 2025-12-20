/**
 * AIBORGLingo Admin Dashboard
 *
 * Comprehensive admin panel for managing lessons, questions, and viewing analytics.
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar, Footer } from '@/components/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icon } from '@/utils/iconLoader';
import { LingoLessonManager } from './LingoLessonManager';
import { LingoQuestionEditor } from './LingoQuestionEditor';
import { LingoAnalyticsDashboard } from './LingoAnalyticsDashboard';
import { LingoImportExport } from '@/components/admin/lingo/LingoImportExport';

export default function LingoAdmin() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin access check
  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    user?.email === 'hirendra.vikram@aiborg.ai';

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Icon name="ShieldAlert" className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to access the AIBORGLingo Admin Dashboard.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Icon name="ShieldX" className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the AIBORGLingo Admin Dashboard. Contact an
              administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Icon name="Gamepad2" className="h-8 w-8 text-emerald-500" />
              AIBORGLingo Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage lessons, questions, and view learning analytics
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open('https://aiborglingo.aiborg.ai', '_blank')}
          >
            <Icon name="ExternalLink" className="h-4 w-4 mr-2" />
            View AIBORGLingo
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Icon name="LayoutDashboard" className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <Icon name="BookOpen" className="h-4 w-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Icon name="MessageSquareQuestion" className="h-4 w-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="import-export" className="flex items-center gap-2">
              <Icon name="ArrowUpDown" className="h-4 w-4" />
              <span className="hidden sm:inline">Import/Export</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Icon name="BarChart3" className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <LingoAnalyticsDashboard showOverviewOnly />
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <LingoLessonManager />
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <LingoQuestionEditor />
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-6">
            <LingoImportExport onImportComplete={() => setActiveTab('lessons')} />
          </TabsContent>

          {/* Full Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <LingoAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
