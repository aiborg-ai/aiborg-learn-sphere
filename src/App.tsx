import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PersonalizationProvider } from "@/contexts/PersonalizationContext";
import { Loader2 } from "lucide-react";

// Create a loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-white" />
  </div>
);

// Eagerly load the main page
import Index from "./pages/Index";

// Lazy load all other routes
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/AdminRefactored"));
const CMS = lazy(() => import("./pages/CMS"));
const BlogCMS = lazy(() => import("./pages/CMS/BlogCMS"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const BlogPage = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/Blog/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/DashboardRefactored"));
const HomeworkSubmission = lazy(() => import("./pages/HomeworkSubmissionRefactored"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const TemplateImport = lazy(() => import("./pages/admin/TemplateImport"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PersonalizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </PersonalizationProvider>
  </QueryClientProvider>
);

export default App;