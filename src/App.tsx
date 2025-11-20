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
import { RouteWrapper } from '@/components/RouteWrapper';
import { PerformanceMonitoring } from '@/components/monitoring/PerformanceMonitoring';
import { LoginNotificationChecker } from '@/components/notifications/LoginNotificationChecker';
import { InstallPWAPrompt } from '@/components/pwa/InstallPWAPrompt';

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
const Studio = lazy(() => import('./pages/Studio'));
const CMS = lazy(() => import('./pages/CMS'));
const BlogCMS = lazy(() => import('./pages/CMS/BlogCMS'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const ClaimFreePass = lazy(() => import('./pages/ClaimFreePass'));
const BlogPage = lazy(() => import('./pages/Blog'));
const BlogPostPage = lazy(() => import('./pages/Blog/BlogPost'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/DashboardRefactored'));
const HomeworkSubmission = lazy(() => import('./pages/HomeworkSubmissionRefactored'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const TemplateImport = lazy(() => import('./pages/admin/TemplateImport'));
const AIBlogWorkflow = lazy(() => import('./pages/Admin/AIBlogWorkflow'));
const AIAssessment = lazy(() => import('./pages/AIAssessment'));
const AIAssessmentResults = lazy(() => import('./pages/AIAssessmentResults'));
const SMEAssessment = lazy(() => import('./pages/SMEAssessment'));
const SMEAssessmentReport = lazy(() => import('./pages/SMEAssessmentReport'));

// New Assessment Tool pages
const AIReadinessAssessment = lazy(() => import('./pages/AIReadinessAssessment'));
const AIAwarenessAssessment = lazy(() => import('./pages/AIAwarenessAssessment'));
const AIFluencyAssessment = lazy(() => import('./pages/AIFluencyAssessment'));
const AssessmentResultsPage = lazy(() => import('./pages/AssessmentResultsPage'));
const AssessmentHistoryPanel = lazy(() =>
  import('./components/assessment-tools').then(m => ({ default: m.AssessmentHistoryPanel }))
);
const AssessmentQuestionsManagement = lazy(() => import('./pages/AssessmentQuestionsManagement'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const ClassroomPage = lazy(() => import('./pages/instructor/ClassroomPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const WatchLaterPage = lazy(() => import('./pages/WatchLaterPage'));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ReviewSubmissionPage = lazy(() => import('./pages/ReviewSubmissionPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const LearningPathsPage = lazy(() => import('./pages/LearningPathsPage'));
const LearningPathWizard = lazy(() => import('./components/learning-path/LearningPathWizard'));
const AILearningPathDetail = lazy(() => import('./pages/AILearningPathDetail'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AdvancedAnalyticsDashboard = lazy(() => import('./pages/AdvancedAnalyticsDashboard'));
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const IconTest = lazy(() =>
  import('@/components/shared/IconTest').then(m => ({ default: m.IconTest }))
);

// Session Tickets
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const InstructorSessionsPage = lazy(() => import('./pages/InstructorSessionsPage'));

// Event Session Tickets
const MyEventTicketsPage = lazy(() => import('./pages/MyEventTicketsPage'));
const ErrorHandlingExample = lazy(() =>
  import('./examples/ErrorHandlingExample').then(m => ({ default: m.ErrorHandlingExample }))
);

// Quiz pages
const QuizTaker = lazy(() => import('./components/quiz').then(m => ({ default: m.QuizTaker })));
const QuizResults = lazy(() => import('./components/quiz').then(m => ({ default: m.QuizResults })));
const QuizReview = lazy(() => import('./components/quiz').then(m => ({ default: m.QuizReview })));

// Exercise pages
const ExerciseSubmissionPage = lazy(() => import('./pages/ExerciseSubmissionPage'));
const ExerciseResultsPage = lazy(() => import('./pages/ExerciseResultsPage'));

// Workshop pages
const WorkshopsPage = lazy(() => import('./pages/WorkshopsPage'));
const WorkshopSessionPage = lazy(() => import('./pages/WorkshopSessionPage'));

// Membership pages
const FamilyMembershipPage = lazy(() => import('./pages/FamilyMembershipPage'));
const FamilyMembershipEnrollment = lazy(() => import('./pages/FamilyMembershipEnrollment'));

// Forum pages
const ForumPage = lazy(() => import('./pages/ForumPage'));
const ForumCategoryPage = lazy(() => import('./pages/ForumCategoryPage'));
const ForumThreadPage = lazy(() => import('./pages/ForumThreadPage'));

// Session pages
const SessionsPage = lazy(() => import('./pages/SessionsPage'));

// Search page
const SearchPage = lazy(() => import('./pages/SearchPage'));

// Flashcard pages
const FlashcardsPage = lazy(() => import('./pages/flashcards/FlashcardsPage'));
const DeckPage = lazy(() => import('./pages/flashcards/DeckPage'));
const ReviewSessionPage = lazy(() => import('./pages/flashcards/ReviewSessionPage'));

// RAG Management (Admin)
const RAGManagement = lazy(() => import('./pages/admin/RAGManagement'));

// Dashboard Builder
const DashboardBuilderPage = lazy(() => import('./pages/DashboardBuilderPage'));
const TemplateGalleryPage = lazy(() => import('./pages/TemplateGalleryPage'));

// Offline Content
const OfflineContentPage = lazy(() => import('./pages/OfflineContent'));

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
      <InstallPWAPrompt />
      <PerformanceMonitoring />
      <LoginNotificationChecker />
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
            <Route
              path="/profile"
              element={
                <RouteWrapper routeName="Profile">
                  <Profile />
                </RouteWrapper>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RouteWrapper routeName="Dashboard">
                  <Dashboard />
                </RouteWrapper>
              }
            />
            <Route
              path="/dashboard-builder"
              element={
                <RouteWrapper routeName="Dashboard Builder">
                  <DashboardBuilderPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/template-gallery"
              element={
                <RouteWrapper routeName="Template Gallery">
                  <TemplateGalleryPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin"
              element={
                <RouteWrapper routeName="Admin">
                  <Admin />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/studio"
              element={
                <RouteWrapper routeName="Studio">
                  <Studio />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/template-import"
              element={
                <RouteWrapper routeName="Template Import">
                  <TemplateImport />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/ai-blog-workflow"
              element={
                <RouteWrapper routeName="AI Blog Generator">
                  <AIBlogWorkflow />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/assessment-questions"
              element={
                <RouteWrapper routeName="Assessment Questions">
                  <AssessmentQuestionsManagement />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/rag-management"
              element={
                <RouteWrapper routeName="RAG System">
                  <RAGManagement />
                </RouteWrapper>
              }
            />
            <Route
              path="/cms"
              element={
                <RouteWrapper routeName="CMS">
                  <CMS />
                </RouteWrapper>
              }
            />
            <Route
              path="/cms/blog"
              element={
                <RouteWrapper routeName="Blog CMS">
                  <BlogCMS />
                </RouteWrapper>
              }
            />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/claim-free-pass" element={<ClaimFreePass />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Flashcard routes */}
            <Route
              path="/flashcards"
              element={
                <RouteWrapper routeName="Flashcards">
                  <FlashcardsPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/flashcards/:deckId"
              element={
                <RouteWrapper routeName="Deck">
                  <DeckPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/flashcards/:deckId/review"
              element={
                <RouteWrapper routeName="Review Session">
                  <ReviewSessionPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/assignment/:assignmentId"
              element={
                <RouteWrapper routeName="Assignment">
                  <HomeworkSubmission />
                </RouteWrapper>
              }
            />
            <Route path="/user/:userId" element={<PublicProfile />} />
            <Route
              path="/course/:courseId"
              element={
                <RouteWrapper routeName="Course">
                  <CoursePage />
                </RouteWrapper>
              }
            />
            <Route
              path="/instructor"
              element={
                <RouteWrapper routeName="Instructor Dashboard">
                  <InstructorDashboard />
                </RouteWrapper>
              }
            />
            <Route
              path="/instructor/classroom/:courseId"
              element={
                <RouteWrapper routeName="Classroom">
                  <ClassroomPage />
                </RouteWrapper>
              }
            />
            <Route path="/ai-assessment" element={<AIAssessment />} />
            <Route path="/ai-assessment/results/:assessmentId" element={<AIAssessmentResults />} />
            <Route path="/sme-assessment" element={<SMEAssessment />} />
            <Route path="/sme-assessment-report/:assessmentId" element={<SMEAssessmentReport />} />

            {/* New Assessment Tool routes */}
            <Route path="/assessment/ai-readiness" element={<AIReadinessAssessment />} />
            <Route path="/assessment/ai-awareness" element={<AIAwarenessAssessment />} />
            <Route path="/assessment/ai-fluency" element={<AIFluencyAssessment />} />
            <Route
              path="/assessment/:toolSlug/results/:attemptId"
              element={<AssessmentResultsPage />}
            />
            <Route path="/assessment/:toolSlug/history" element={<AssessmentHistoryPanel />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route
              path="/offline-content"
              element={
                <RouteWrapper routeName="Offline Content">
                  <OfflineContentPage />
                </RouteWrapper>
              }
            />
            <Route path="/watch-later" element={<WatchLaterPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/review/submit" element={<ReviewSubmissionPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route path="/my-event-tickets" element={<MyEventTicketsPage />} />
            <Route path="/instructor/sessions" element={<InstructorSessionsPage />} />
            <Route path="/learning-paths" element={<LearningPathsPage />} />
            <Route path="/learning-path/generate" element={<LearningPathWizard />} />
            <Route path="/learning-path/ai/:pathId" element={<AILearningPathDetail />} />
            <Route
              path="/analytics"
              element={
                <RouteWrapper routeName="Analytics">
                  <AnalyticsPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/analytics/advanced"
              element={
                <RouteWrapper routeName="Advanced Analytics">
                  <AdvancedAnalyticsDashboard />
                </RouteWrapper>
              }
            />
            <Route
              path="/gamification"
              element={
                <RouteWrapper routeName="Gamification">
                  <GamificationPage />
                </RouteWrapper>
              }
            />
            <Route path="/test-icons" element={<IconTest />} />
            <Route path="/examples/error-handling" element={<ErrorHandlingExample />} />

            {/* Quiz routes */}
            <Route path="/quiz/:quizId" element={<QuizTaker />} />
            <Route path="/quiz/:quizId/results/:attemptId" element={<QuizResults />} />
            <Route path="/quiz/:quizId/review/:attemptId" element={<QuizReview />} />

            {/* Exercise routes */}
            <Route path="/exercise/:exerciseId/submit" element={<ExerciseSubmissionPage />} />
            <Route
              path="/exercise/:exerciseId/results/:submissionId"
              element={<ExerciseResultsPage />}
            />

            {/* Workshop routes */}
            <Route path="/workshops" element={<WorkshopsPage />} />
            <Route path="/workshop/:workshopId" element={<WorkshopsPage />} />
            <Route path="/workshop/session/:sessionId" element={<WorkshopSessionPage />} />

            {/* Session routes */}
            <Route path="/sessions" element={<SessionsPage />} />

            {/* Membership routes */}
            <Route path="/family-membership" element={<FamilyMembershipPage />} />
            <Route path="/family-membership/enroll" element={<FamilyMembershipEnrollment />} />

            {/* Forum routes */}
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum/:categorySlug" element={<ForumCategoryPage />} />
            <Route path="/forum/:categorySlug/:threadSlug" element={<ForumThreadPage />} />

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
