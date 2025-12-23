/**
 * LiveRegion Component
 * Announces dynamic content changes to screen readers
 * WCAG 2.1 AA - 4.1.3 Status Messages
 */

import { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';

type Politeness = 'polite' | 'assertive' | 'off';

interface LiveRegionProps {
  children?: React.ReactNode;
  politeness?: Politeness;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  role?: 'status' | 'alert' | 'log' | 'timer' | 'marquee';
  className?: string;
}

/**
 * Live region that announces content changes to screen readers.
 *
 * @example
 * // For loading states
 * <LiveRegion politeness="polite">
 *   {isLoading ? 'Loading...' : 'Content loaded'}
 * </LiveRegion>
 *
 * @example
 * // For error messages
 * <LiveRegion politeness="assertive" role="alert">
 *   {error && `Error: ${error.message}`}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  role,
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role={role}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Visually hidden live region for announcements only
 * Use this when you don't want to show the message visually
 */
export function AnnouncerRegion({
  message,
  politeness = 'polite',
}: {
  message: string;
  politeness?: Politeness;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {message}
    </div>
  );
}

// Global announcer context
interface AnnouncerContextType {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

/**
 * Provider for global announcements
 * Place this near the root of your app
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const politeTimeoutRef = useRef<NodeJS.Timeout>();
  const assertiveTimeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    if (politeness === 'assertive') {
      // Clear previous timeout
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
      // Set message (briefly clear first to ensure re-announcement)
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 50);
      // Clear after announcement
      assertiveTimeoutRef.current = setTimeout(() => setAssertiveMessage(''), 1000);
    } else {
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 50);
      politeTimeoutRef.current = setTimeout(() => setPoliteMessage(''), 1000);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <AnnouncerRegion message={politeMessage} politeness="polite" />
      <AnnouncerRegion message={assertiveMessage} politeness="assertive" />
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook to access the global announcer
 */
export function useAnnouncer() {
  const context = useContext(AnnouncerContext);
  if (!context) {
    // Return no-op if provider not available (graceful degradation)
    return { announce: () => {} };
  }
  return context;
}

/**
 * Loading state live region
 */
export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading...',
  loadedMessage = 'Content loaded',
}: {
  isLoading: boolean;
  loadingMessage?: string;
  loadedMessage?: string;
}) {
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (isLoading && !announced) {
      setAnnounced(true);
    } else if (!isLoading && announced) {
      setAnnounced(false);
    }
  }, [isLoading, announced]);

  return (
    <div aria-live="polite" aria-busy={isLoading} className="sr-only">
      {isLoading ? loadingMessage : announced ? '' : loadedMessage}
    </div>
  );
}
