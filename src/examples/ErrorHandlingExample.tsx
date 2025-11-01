/**
 * Error Handling Examples
 *
 * This file demonstrates how to use the new error handling utilities
 * and error boundaries in the application.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AsyncErrorBoundary } from '@/components/error-boundaries';
import {
  handleError,
  withErrorHandler,
  withRetry,
  ApiError,
  ValidationError,
  NotFoundError,
} from '@/utils/error-handling';

/**
 * Example 1: Component with AsyncErrorBoundary
 *
 * Wrap components that fetch data with AsyncErrorBoundary to
 * provide inline error UI instead of crashing the whole page.
 */
function DataFetchingComponent() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate potential error
      if (Math.random() > 0.7) {
        throw new ApiError('Failed to fetch data', 500);
      }

      setData('Data loaded successfully!');
    } catch (error) {
      // Use centralized error handler
      handleError(error, {
        showToast: true,
        logError: true,
        context: { component: 'DataFetchingComponent' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 1: Basic Error Handling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data (70% success rate)'}
        </Button>
        {data && <p className="text-sm text-green-600">{data}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Using withErrorHandler wrapper
 *
 * Wrap async functions to automatically handle errors
 */
const safeFetch = withErrorHandler(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError('Network request failed', response.status);
    }
    return response.json();
  },
  { showToast: true, logError: true }
);

function AutoErrorHandlingComponent() {
  const [result, setResult] = useState<string | null>(null);

  const fetchWithAutoHandling = async () => {
    // Errors are automatically handled by the wrapper
    const data = await safeFetch('https://jsonplaceholder.typicode.com/posts/1');
    setResult(data ? `Loaded: ${data.title}` : 'Error occurred');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 2: Auto Error Handling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchWithAutoHandling}>Fetch with Auto Error Handling</Button>
        {result && <p className="text-sm">{result}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Using withRetry for resilient operations
 *
 * Automatically retry failed operations with exponential backoff
 */
function RetryComponent() {
  const [status, setStatus] = useState<string>('');

  const fetchWithRetry = async () => {
    setStatus('Attempting...');

    try {
      const result = await withRetry(
        async () => {
          // Simulate flaky API (60% failure rate)
          if (Math.random() > 0.4) {
            throw new ApiError('Temporary failure');
          }
          return 'Success!';
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
          onRetry: attempt => {
            setStatus(`Retry attempt ${attempt}...`);
          },
        }
      );

      setStatus(`✅ ${result}`);
    } catch (error) {
      setStatus('❌ Failed after 3 retries');
      handleError(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 3: Retry Logic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchWithRetry}>Fetch with Retry (max 3 attempts)</Button>
        {status && <p className="text-sm">{status}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Custom Error Types
 *
 * Use specific error types for better error categorization
 */
function CustomErrorsComponent() {
  const throwValidationError = () => {
    const error = new ValidationError('Invalid email format', {
      email: ['Must be a valid email address'],
    });
    handleError(error, { showToast: true });
  };

  const throwNotFoundError = () => {
    const error = new NotFoundError('User', { userId: '123' });
    handleError(error, { showToast: true });
  };

  const throwApiError = () => {
    const error = new ApiError('Server error', 500, 'INTERNAL_ERROR', {
      endpoint: '/api/data',
    });
    handleError(error, { showToast: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 4: Custom Error Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={throwValidationError} variant="outline" size="sm">
            Validation Error
          </Button>
          <Button onClick={throwNotFoundError} variant="outline" size="sm">
            Not Found Error
          </Button>
          <Button onClick={throwApiError} variant="outline" size="sm">
            API Error
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Click buttons to see different error toast notifications
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Main Example Component
 *
 * Wraps all examples with AsyncErrorBoundary to demonstrate
 * error isolation at component level
 */
export function ErrorHandlingExample() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Error Handling Examples</h1>
        <p className="text-muted-foreground">
          Demonstrations of the new error handling utilities and boundaries
        </p>
      </div>

      <AsyncErrorBoundary>
        <DataFetchingComponent />
      </AsyncErrorBoundary>

      <AsyncErrorBoundary>
        <AutoErrorHandlingComponent />
      </AsyncErrorBoundary>

      <AsyncErrorBoundary>
        <RetryComponent />
      </AsyncErrorBoundary>

      <AsyncErrorBoundary>
        <CustomErrorsComponent />
      </AsyncErrorBoundary>
    </div>
  );
}
