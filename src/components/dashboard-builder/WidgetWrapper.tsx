/**
 * Widget Wrapper
 *
 * Wraps all dashboard widgets with common functionality:
 * - Header with title
 * - Loading/error states
 * - Edit/remove controls
 * - Styling based on appearance config
 */

import React, { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, X, Grip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardWidget } from '@/types/dashboard';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  isEditing?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onConfigure?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  widget,
  isEditing = false,
  isSelected = false,
  onSelect,
  onConfigure,
  onRemove,
  children,
  className,
}: WidgetWrapperProps) {
  const { config } = widget;
  const appearance = config.appearance || {};

  // Build style from appearance config
  const cardStyle: React.CSSProperties = {
    backgroundColor: appearance.backgroundColor,
    borderColor: appearance.borderColor,
    borderWidth: appearance.borderWidth,
    borderRadius: appearance.borderRadius,
    padding: appearance.padding,
  };

  const showHeader = config.showTitle !== false && config.title;
  const showBorder = appearance.showBorder !== false;

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        isEditing && 'cursor-move hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        showBorder || 'border-0',
        className
      )}
      style={cardStyle}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Edit Controls */}
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-background/80 backdrop-blur"
            onClick={e => {
              e.stopPropagation();
              onConfigure?.();
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-background/80 backdrop-blur text-destructive"
            onClick={e => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Drag Handle (only in edit mode) */}
      {isEditing && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Grip className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold" style={{ color: appearance.headerColor }}>
            {config.title}
          </CardTitle>
          {config.subtitle && <p className="text-sm text-muted-foreground">{config.subtitle}</p>}
        </CardHeader>
      )}

      {/* Content */}
      <CardContent className={cn(!showHeader && 'pt-6')}>
        <Suspense
          fallback={
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          }
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </Suspense>
      </CardContent>
    </Card>
  );
}

/**
 * Error Boundary for widget content
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-destructive">Failed to load widget</p>
          <p className="text-xs text-muted-foreground mt-1">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetWrapper;
