/**
 * Lazy-loaded chart components to reduce initial bundle size
 * Charts are only loaded when actually used
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from '@/components/ui/icons';

// Create a loading fallback component
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
    <div className="text-center space-y-2">
      <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-600" />
      <p className="text-xs text-muted-foreground">Loading chart...</p>
    </div>
  </div>
);

// Wrapper component for lazy-loaded charts
function createLazyChart<P = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
  const LazyComponent = lazy(importFunc);

  return function LazyChart(props: P) {
    return (
      <Suspense fallback={<ChartLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Export lazy-loaded chart components
export const LazyLineChart = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.LineChart }))
);

export const LazyBarChart = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.BarChart }))
);

export const LazyAreaChart = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.AreaChart }))
);

export const LazyPieChart = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.PieChart }))
);

export const LazyRadarChart = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.RadarChart }))
);

// Lazy-load chart primitives as well to avoid loading recharts eagerly
export const LazyLine = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Line }))
);

export const LazyBar = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Bar }))
);

export const LazyArea = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Area }))
);

export const LazyPie = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Pie }))
);

export const LazyCell = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Cell }))
);

export const LazyRadar = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Radar }))
);

export const LazyXAxis = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.XAxis }))
);

export const LazyYAxis = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.YAxis }))
);

export const LazyCartesianGrid = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.CartesianGrid }))
);

export const LazyTooltip = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Tooltip }))
);

export const LazyLegend = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.Legend }))
);

export const LazyResponsiveContainer = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))
);

export const LazyPolarGrid = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.PolarGrid }))
);

export const LazyPolarAngleAxis = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.PolarAngleAxis }))
);

export const LazyPolarRadiusAxis = createLazyChart(() =>
  import('recharts').then(mod => ({ default: mod.PolarRadiusAxis }))
);

/**
 * Note: For better performance when using multiple chart components together,
 * consider importing recharts directly in that specific component file:
 *
 * import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
 *
 * This avoids multiple lazy loading delays when multiple chart elements are needed.
 * Use the Lazy exports above only when charts appear conditionally or in separate routes.
 */
