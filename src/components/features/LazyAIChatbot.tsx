/**
 * LazyAIChatbot Component
 *
 * Lazy-loaded wrapper for the AIChatbot component to improve initial page load.
 * The chatbot bundle (~150KB+) is only loaded when the user clicks to open it.
 *
 * Performance Impact:
 * - Reduces initial JS bundle by ~150KB
 * - Improves TTI (Time to Interactive) by deferring non-critical UI
 * - Uses code splitting to load chatbot on-demand
 */

import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

// Lazy load the AIChatbot component
const AIChatbot = lazy(() =>
  import('./AIChatbot').then(module => ({ default: module.AIChatbot }))
);

/**
 * Loading fallback for the chatbot
 * Shows a minimal placeholder while the chatbot bundle loads
 */
function ChatbotLoadingFallback() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 w-80">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading AI Assistant...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LazyAIChatbot Component
 *
 * Drop-in replacement for AIChatbot that:
 * - Shows a floating button when closed
 * - Lazy loads the full chatbot only when opened
 * - Maintains the same UX as the original component
 */
export function LazyAIChatbot() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Once loaded, render the full chatbot
  if (isLoaded) {
    return (
      <Suspense fallback={<ChatbotLoadingFallback />}>
        <AIChatbot />
      </Suspense>
    );
  }

  // Show floating button to trigger chatbot load
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsLoaded(true)}
        size="lg"
        className={cn(
          "rounded-full shadow-lg h-14 w-14 p-0",
          "hover:scale-110 transition-transform duration-200",
          "bg-primary hover:bg-primary/90"
        )}
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
