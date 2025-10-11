import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Icon } from '@/utils/iconLoader';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/features';
import { KeyboardShortcutsHelp, OfflineBanner } from '@/components/shared';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PerformanceMonitoring } from '@/components/monitoring/PerformanceMonitoring';

// Create a loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
    <Icon name="Loader2" size={32} className="animate-spin text-white" />
  </div>
);

// Eagerly load the main page
import Index from './pages/Index';

// Lazy load all other routes
const Auth = lazy(() => import('./pages/Auth'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/AdminRefactored'));
const CMS = lazy(() => import('./pages/CMS'));
const BlogCMS = lazy(() => import('./pages/CMS/BlogCMS'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const BlogPage = lazy(() => import('./pages/Blog'));
const BlogPostPage = lazy(() => import('./pages/Blog/BlogPost'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/DashboardRefactored'));
const HomeworkSubmission = lazy(() => import('./pages/HomeworkSubmissionRefactored'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const TemplateImport = lazy(() => import('./pages/admin/TemplateImport'));
const AIAssessment = lazy(() => import('./pages/AIAssessment'));
const AIAssessmentResults = lazy(() => import('./pages/AIAssessmentResults'));
const SMEAssessment = lazy(() => import('./pages/SMEAssessment'));
const SMEAssessmentReport = lazy(() => import('./pages/SMEAssessmentReport'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const WatchLaterPage = lazy(() => import('./pages/WatchLaterPage'));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const LearningPathsPage = lazy(() => import('./pages/LearningPathsPage'));
const LearningPathWizard = lazy(() => import('./components/learning-path/LearningPathWizard'));
const AILearningPathDetail = lazy(() => import('./pages/AILearningPathDetail'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const IconTest = lazy(() => import('@/components/shared/IconTest').then(m => ({ default: m.IconTest })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper component for keyboard shortcuts
const AppWithShortcuts = () => {
  const shortcuts = useGlobalShortcuts();

  return (
    <>
      <OfflineBanner />
      <PerformanceMonitoring />
      <CommandPalette />
      <KeyboardShortcutsHelp shortcuts={shortcuts} />
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main page loaded eagerly for fast initial load */}
            <Route path="/" element={<Index />} />

            {/* All other routes are lazy loaded */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/template-import" element={<TemplateImport />} />
            <Route path="/cms" element={<CMS />} />
            <Route path="/cms/blog" element={<BlogCMS />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/assignment/:assignmentId" element={<HomeworkSubmission />} />
            <Route path="/user/:userId" element={<PublicProfile />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/ai-assessment" element={<AIAssessment />} />
            <Route path="/ai-assessment/results/:assessmentId" element={<AIAssessmentResults />} />
            <Route path="/sme-assessment" element={<SMEAssessment />} />
            <Route path="/sme-assessment-report/:assessmentId" element={<SMEAssessmentReport />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/watch-later" element={<WatchLaterPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/learning-paths" element={<LearningPathsPage />} />
            <Route path="/learning-path/generate" element={<LearningPathWizard />} />
            <Route path="/learning-path/ai/:pathId" element={<AILearningPathDetail />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/gamification" element={<GamificationPage />} />
            <Route path="/test-icons" element={<IconTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="aiborg-ui-theme">
      <PersonalizationProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppWithShortcuts />
          </BrowserRouter>
        </TooltipProvider>
      </PersonalizationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
