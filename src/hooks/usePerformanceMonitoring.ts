import { useState, useEffect } from 'react';
import {
  PerformanceMonitoringService,
  type PerformanceReport,
  type WebVitalsMetrics,
} from '@/services/PerformanceMonitoringService';
import { logger } from '@/utils/logger';

interface UsePerformanceMonitoringReturn {
  webVitals: WebVitalsMetrics;
  performanceReport: PerformanceReport | null;
  refreshReport: () => Promise<void>;
  loading: boolean;
}

/**
 * Custom hook for performance monitoring
 *
 * Provides real-time access to performance metrics
 * and Web Vitals data.
 *
 * @example
 * ```tsx
 * function PerformanceDashboard() {
 *   const { webVitals, performanceReport } = usePerformanceMonitoring();
 *
 *   return (
 *     <div>
 *       <h2>Web Vitals</h2>
 *       <p>LCP: {webVitals.lcp}ms</p>
 *       <p>FID: {webVitals.fid}ms</p>
 *       <p>CLS: {webVitals.cls}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMonitoring(): UsePerformanceMonitoringReturn {
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshReport = async () => {
    setLoading(true);
    try {
      const report = await PerformanceMonitoringService.getPerformanceReport();
      setPerformanceReport(report);
      setWebVitals(report.webVitals);
    } catch (_error) {
      logger._error('Failed to fetch performance report:', _error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial report
    refreshReport();

    // Refresh every 30 seconds
    const interval = setInterval(refreshReport, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    webVitals,
    performanceReport,
    refreshReport,
    loading,
  };
}
