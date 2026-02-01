import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  BarChart3,
  FileText,
  MessageSquare,
  Image,
  FolderOpen,
} from '@/components/ui/icons';
import BlogCMSDashboard from './components/BlogCMSDashboard';
import BlogPostManager from './components/BlogPostManager';
import BlogMediaLibrary from './components/BlogMediaLibrary';
import BlogCategoryManager from './components/BlogCategoryManager';
import BlogCommentModerator from './components/BlogCommentModerator';
import BlogAnalytics from './components/BlogAnalytics';

function BlogCMS() {
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
          <p className="text-muted-foreground">You don't have permission to access the Blog CMS.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">Blog Content Management System</h1>
          <p className="text-muted-foreground">
            Manage your blog posts, media, comments, and analytics
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <BlogCMSDashboard />
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <BlogPostManager />
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <BlogMediaLibrary />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <BlogCategoryManager />
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <BlogCommentModerator />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <BlogAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default BlogCMS;
