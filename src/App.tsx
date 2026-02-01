import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { DemoProvider } from '@/contexts/DemoContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Icon } from '@/utils/iconLoader';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/features';
import { KeyboardShortcutsHelp, OfflineBanner } from '@/components/shared';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PerformanceMonitoring } from '@/components/monitoring/PerformanceMonitoring';
import { LoginNotificationChecker } from '@/components/notifications/LoginNotificationChecker';
import { InstallPWAPrompt } from '@/components/pwa/InstallPWAPrompt';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { AnnouncerProvider } from '@/components/accessibility/LiveRegion';
import { DemoModeBadge } from '@/components/demo/DemoModeBadge';
import { allRoutes } from '@/routes';

// Eagerly load the main page for fast initial load
import Index from './pages/Index';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
    <Icon name="Loader2" size={32} className="animate-spin text-white" />
  </div>
);

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
      <DemoModeBadge />
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main page loaded eagerly for fast initial load */}
            <Route path="/" element={<Index />} />

            {/* All other routes are lazy loaded and organized by module */}
            {allRoutes.map((route, index) => (
              <Route key={route.path || index} path={route.path} element={route.element}>
                {route.children?.map((child, childIndex) => (
                  <Route key={child.path || childIndex} path={child.path} element={child.element} />
                ))}
              </Route>
            ))}
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
          <OnboardingProvider>
            <DemoProvider>
              {/* WCAG 4.1.3: Global announcer for screen reader status messages */}
              <AnnouncerProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <AppWithShortcuts />
                  </BrowserRouter>
                </TooltipProvider>
              </AnnouncerProvider>
            </DemoProvider>
          </OnboardingProvider>
        </PersonalizationProvider>
      </TenantProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
