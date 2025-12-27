import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { TenantProvider } from '@/contexts/TenantContext';
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
import { SkipLink } from '@/components/accessibility/SkipLink';
import { AnnouncerProvider } from '@/components/accessibility/LiveRegion';
import {
  DashboardSkeleton,
  ProfileSkeleton,
  AnalyticsSkeleton,
  CourseSkeleton,
  StudioSkeleton,
  AdminSkeleton,
  CalendarSkeleton,
  SessionSkeleton,
  DashboardBuilderSkeleton,
  SMEAssessmentSkeleton,
  WorkshopSessionSkeleton,
  InstructorDashboardSkeleton,
} from '@/components/skeletons';

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
const BatchBlogScheduler = lazy(() => import('./pages/Admin/BatchBlogScheduler'));
const AIAssessment = lazy(() => import('./pages/AIAssessment'));
const AIAssessmentResults = lazy(() => import('./pages/AIAssessmentResults'));
const SMEAssessment = lazy(() => import('./pages/SMEAssessment'));
const SMEAssessmentReport = lazy(() => import('./pages/SMEAssessmentReport'));

// New Assessment Tool pages
const AIReadinessAssessment = lazy(() => import('./pages/AIReadinessAssessment'));
const AIReadinessResults = lazy(() => import('./pages/AIReadinessResults'));
const AIReadinessAdminDashboard = lazy(() => import('./pages/admin/AIReadinessAdminDashboard'));
const AIAwarenessAssessment = lazy(() => import('./pages/AIAwarenessAssessment'));
const AIFluencyAssessment = lazy(() => import('./pages/AIFluencyAssessment'));
const AssessmentResultsPage = lazy(() => import('./pages/AssessmentResultsPage'));
const SkillsAssessmentResultsPage = lazy(() => import('./pages/SkillsAssessmentResultsPage'));
const AssessmentHistoryPanel = lazy(() =>
  import('./components/assessment-tools').then(m => ({ default: m.AssessmentHistoryPanel }))
);
const AssessmentQuestionsManagement = lazy(() => import('./pages/AssessmentQuestionsManagement'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const CoursesListPage = lazy(() => import('./pages/CoursesListPage'));
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

// Study Groups pages
// TEMPORARY: Commented out until pages are ready
// const StudyGroupsPage = lazy(() => import('./pages/StudyGroupsPage'));
// const StudyGroupDetailPage = lazy(() => import('./pages/StudyGroupDetailPage'));

// Peer Review pages
// TEMPORARY: Commented out until page is ready
// const PeerReviewPage = lazy(() => import('./pages/PeerReviewPage'));

// Shared Resources page
// TEMPORARY: Commented out until page is ready
// const SharedResourcesPage = lazy(() => import('./pages/SharedResourcesPage'));

// Collaborative Hub page
// TEMPORARY: Commented out until page is ready
// const CollaborativePage = lazy(() => import('./pages/CollaborativePage'));

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

// Tenant Management (Admin)
const TenantManagement = lazy(() => import('./pages/admin/TenantManagement'));
const WhiteLabelSettings = lazy(() => import('./pages/settings/WhiteLabelSettings'));

// AIBORGLingo Admin
const LingoAdmin = lazy(() => import('./pages/admin/lingo/LingoAdmin'));
const DomainManagement = lazy(() => import('./pages/settings/DomainManagement'));

// SME Admin
const SMEAdminDashboard = lazy(() => import('./pages/admin/SMEAdminDashboard'));

// Knowledge Base Admin
const KBArticleGenerator = lazy(() => import('./pages/admin/KBArticleGenerator'));

// Knowledge Base Public Pages
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const KBArticle = lazy(() => import('./pages/KBArticle'));

// AIBORGLingo User Pages
const LingoHome = lazy(() => import('./pages/lingo/LingoHome'));
const LingoLessonPlayer = lazy(() => import('./pages/lingo/LingoLessonPlayer'));
const LingoLessonComplete = lazy(() => import('./pages/lingo/LingoLessonComplete'));
const LingoLeaderboard = lazy(() => import('./pages/lingo/LingoLeaderboard'));
const LingoAchievements = lazy(() => import('./pages/lingo/LingoAchievements'));

// Dashboard Builder
const DashboardBuilderPage = lazy(() => import('./pages/DashboardBuilderPage'));
const TemplateGalleryPage = lazy(() => import('./pages/TemplateGalleryPage'));

// Offline Content
const OfflineContentPage = lazy(() => import('./pages/OfflineContent'));

// Surveys
const SurveysPage = lazy(() => import('./pages/surveys/SurveysPage'));
const PublicSurvey = lazy(() => import('./pages/surveys/PublicSurvey'));
const AdminSurveys = lazy(() => import('./pages/admin/AdminSurveys'));

// Legal pages
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Aggregated Reports
// TEMPORARY: Commented out until page is ready
// const AggregatedReportsDashboard = lazy(() => import('./pages/admin/AggregatedReportsDashboard'));

// Export queryClient for use in prefetch utilities
export const queryClient = new QueryClient({
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
      {/* WCAG 2.4.1: Skip link for keyboard users to bypass navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
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
                <Suspense fallback={<ProfileSkeleton />}>
                  <RouteWrapper routeName="Profile">
                    <Profile />
                  </RouteWrapper>
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <RouteWrapper routeName="Dashboard">
                    <Dashboard />
                  </RouteWrapper>
                </Suspense>
              }
            />
            <Route
              path="/dashboard-builder"
              element={
                <Suspense fallback={<DashboardBuilderSkeleton />}>
                  <RouteWrapper routeName="Dashboard Builder">
                    <DashboardBuilderPage />
                  </RouteWrapper>
                </Suspense>
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
                <Suspense fallback={<AdminSkeleton />}>
                  <RouteWrapper routeName="Admin">
                    <Admin />
                  </RouteWrapper>
                </Suspense>
              }
            />
            <Route
              path="/admin/studio"
              element={
                <Suspense fallback={<StudioSkeleton />}>
                  <RouteWrapper routeName="Studio">
                    <Studio />
                  </RouteWrapper>
                </Suspense>
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
              path="/admin/batch-blog-scheduler"
              element={
                <RouteWrapper routeName="Batch Blog Scheduler">
                  <Suspense fallback={<AdminSkeleton />}>
                    <BatchBlogScheduler />
                  </Suspense>
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/sme"
              element={
                <Suspense fallback={<AdminSkeleton />}>
                  <RouteWrapper routeName="SME Admin Dashboard">
                    <SMEAdminDashboard />
                  </RouteWrapper>
                </Suspense>
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
              path="/admin/kb/generate"
              element={
                <RouteWrapper routeName="KB Article Generator">
                  <KBArticleGenerator />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/tenants"
              element={
                <RouteWrapper routeName="Tenant Management">
                  <TenantManagement />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/lingo"
              element={
                <RouteWrapper routeName="AIBORGLingo Admin">
                  <LingoAdmin />
                </RouteWrapper>
              }
            />
            <Route
              path="/admin/surveys"
              element={
                <RouteWrapper routeName="Surveys Admin">
                  <AdminSurveys />
                </RouteWrapper>
              }
            />
            {/* TEMPORARY: Commented out until AggregatedReportsDashboard is ready */}
            {/* <Route
              path="/admin/reports"
              element={
                <Suspense fallback={<AnalyticsSkeleton />}>
                  <RouteWrapper routeName="Aggregated Reports">
                    <AggregatedReportsDashboard />
                  </RouteWrapper>
                </Suspense>
              }
            /> */}

            {/* Public Surveys */}
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/surveys/:surveyId" element={<PublicSurvey />} />

            {/* AIBORGLingo User Routes */}
            <Route
              path="/lingo"
              element={
                <RouteWrapper routeName="AIBORGLingo">
                  <LingoHome />
                </RouteWrapper>
              }
            />
            <Route
              path="/lingo/lesson/:lessonId"
              element={
                <RouteWrapper routeName="Lingo Lesson">
                  <LingoLessonPlayer />
                </RouteWrapper>
              }
            />
            <Route
              path="/lingo/lesson/:lessonId/complete"
              element={
                <RouteWrapper routeName="Lesson Complete">
                  <LingoLessonComplete />
                </RouteWrapper>
              }
            />
            <Route
              path="/lingo/leaderboard"
              element={
                <RouteWrapper routeName="Lingo Leaderboard">
                  <LingoLeaderboard />
                </RouteWrapper>
              }
            />
            <Route
              path="/lingo/achievements"
              element={
                <RouteWrapper routeName="Lingo Achievements">
                  <LingoAchievements />
                </RouteWrapper>
              }
            />

            <Route
              path="/settings/white-label"
              element={
                <RouteWrapper routeName="White-Label Settings">
                  <WhiteLabelSettings />
                </RouteWrapper>
              }
            />
            <Route
              path="/settings/domains"
              element={
                <RouteWrapper routeName="Domain Management">
                  <DomainManagement />
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

            {/* Knowledge Base */}
            <Route path="/kb" element={<KnowledgeBase />} />
            <Route path="/kb/:slug" element={<KBArticle />} />

            <Route path="/search" element={<SearchPage />} />

            {/* Legal pages */}
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

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
              path="/courses"
              element={
                <RouteWrapper routeName="Courses">
                  <CoursesListPage />
                </RouteWrapper>
              }
            />
            <Route
              path="/course/:courseId"
              element={
                <Suspense fallback={<CourseSkeleton />}>
                  <RouteWrapper routeName="Course">
                    <CoursePage />
                  </RouteWrapper>
                </Suspense>
              }
            />
            <Route
              path="/instructor"
              element={
                <Suspense fallback={<InstructorDashboardSkeleton />}>
                  <RouteWrapper routeName="Instructor Dashboard">
                    <InstructorDashboard />
                  </RouteWrapper>
                </Suspense>
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
            <Route
              path="/sme-assessment"
              element={
                <Suspense fallback={<SMEAssessmentSkeleton />}>
                  <RouteWrapper routeName="SME Assessment">
                    <SMEAssessment />
                  </RouteWrapper>
                </Suspense>
              }
            />
            <Route path="/sme-assessment-report/:assessmentId" element={<SMEAssessmentReport />} />

            {/* New Assessment Tool routes */}
            <Route path="/assessment/ai-readiness" element={<AIReadinessAssessment />} />
            <Route
              path="/assessment/ai-readiness/results/:assessmentId"
              element={<AIReadinessResults />}
            />
            <Route path="/admin/ai-readiness-dashboard" element={<AIReadinessAdminDashboard />} />
            <Route path="/assessment/ai-awareness" element={<AIAwarenessAssessment />} />
            <Route path="/assessment/ai-fluency" element={<AIFluencyAssessment />} />
            <Route
              path="/assessment/:toolSlug/results/:attemptId"
              element={<AssessmentResultsPage />}
            />
            <Route
              path="/skills/assessment/:assessmentId/results"
              element={<SkillsAssessmentResultsPage />}
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
            <Route
              path="/calendar"
              element={
                <Suspense fallback={<CalendarSkeleton />}>
                  <CalendarPage />
                </Suspense>
              }
            />
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
                <Suspense fallback={<AnalyticsSkeleton />}>
                  <RouteWrapper routeName="Analytics">
                    <AnalyticsPage />
                  </RouteWrapper>
                </Suspense>
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
            <Route
              path="/workshop/session/:sessionId"
              element={
                <Suspense fallback={<WorkshopSessionSkeleton />}>
                  <RouteWrapper routeName="Workshop Session">
                    <WorkshopSessionPage />
                  </RouteWrapper>
                </Suspense>
              }
            />

            {/* Session routes */}
            <Route
              path="/sessions"
              element={
                <Suspense fallback={<SessionSkeleton />}>
                  <SessionsPage />
                </Suspense>
              }
            />

            {/* Membership routes */}
            <Route path="/family-membership" element={<FamilyMembershipPage />} />
            <Route path="/family-membership/enroll" element={<FamilyMembershipEnrollment />} />

            {/* Forum routes */}
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum/:categorySlug" element={<ForumCategoryPage />} />
            <Route path="/forum/:categorySlug/:threadSlug" element={<ForumThreadPage />} />

            {/* TEMPORARY: Commented out until collaborative pages are ready */}
            {/* Collaborative Hub - Main Page */}
            {/* <Route path="/collaborate" element={<CollaborativePage />} /> */}

            {/* Study Groups routes */}
            {/* <Route path="/collaborate/groups" element={<StudyGroupsPage />} /> */}
            {/* <Route path="/collaborate/groups/:groupId" element={<StudyGroupDetailPage />} /> */}

            {/* Peer Review routes */}
            {/* <Route path="/collaborate/peer-review" element={<PeerReviewPage />} /> */}

            {/* Shared Resources routes */}
            {/* <Route path="/collaborate/resources" element={<SharedResourcesPage />} /> */}

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
      <TenantProvider>
        <PersonalizationProvider>
          {/* WCAG 4.1.3: Global announcer for screen reader status messages */}
          <AnnouncerProvider>
            <TooltipProvider>
              <BrowserRouter>
                <AppWithShortcuts />
              </BrowserRouter>
            </TooltipProvider>
          </AnnouncerProvider>
        </PersonalizationProvider>
      </TenantProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
