/**
 * Analytics Error Boundary
 * Catches errors in analytics components and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Analytics Error Boundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <CardTitle>Analytics Error</CardTitle>
                <CardDescription>Something went wrong while loading analytics data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-mono text-destructive">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload Page
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple Error Display Component
 * For displaying inline errors without full error boundary
 */
interface ErrorDisplayProps {
  error: Error | string;
  retry?: () => void;
}

export function AnalyticsErrorDisplay({ error, retry }: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Card className="border-destructive">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
        <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
        {retry && (
          <Button onClick={retry} variant="default" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
