import type { ReactElement } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Create a new QueryClient for testing with disabled retries and caching
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component with all necessary providers for testing
 */
export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <PersonalizationProvider>
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
        </PersonalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
