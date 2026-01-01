/**
 * Benchmark Service
 * Handles performance benchmarking
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { PerformanceBenchmark } from './types';

export class BenchmarkService {
  /**
   * Get performance benchmarks
   */
  static async getPerformanceBenchmarks(
    audienceType: string,
    benchmarkType: string = 'category'
  ): Promise<PerformanceBenchmark[]> {
    try {
      const { data, error } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .eq('audience_type', audienceType)
        .eq('benchmark_type', benchmarkType)
        .order('calculated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (_error) {
      logger.error('Error getting performance benchmarks:', _error);
      return [];
    }
  }
}
