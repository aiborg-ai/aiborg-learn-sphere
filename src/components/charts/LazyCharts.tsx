/**
 * Lazy-loaded chart components to reduce initial bundle size
 * Charts are only loaded when actually used
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

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

// Re-export chart primitives (these are lighter)
export {
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
