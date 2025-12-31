/**
 * Competency Service
 * Handles competency matrix and snapshots
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { CompetencySnapshot } from './types';

export class CompetencyService {
  /**
   * Get competency matrix for heat map visualization
   */
  static async getCompetencyMatrix(userId: string): Promise<CompetencySnapshot | null> {
    try {
      const { data: _matrix, error: matrixError } = await supabase.rpc('get_competency_matrix', {
        p_user_id: userId,
      });

      if (matrixError) throw matrixError;

      // Create snapshot
      const { data: _snapshotId, error: snapshotError } = await supabase.rpc(
        'create_competency_snapshot',
        { p_user_id: userId }
      );

      if (snapshotError) throw snapshotError;

      // Get full snapshot
      const { data: snapshot, error } = await supabase
        .from('competency_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (!snapshot) return null;

      // Extract top strengths and weaknesses
      const scores = Object.entries(
        (snapshot.competency_matrix as Record<string, { score: number }>) || {}
      )
        .map(([cat, data]) => ({ category: cat, score: data.score }))
        .sort((a, b) => b.score - a.score);

      return {
        id: snapshot.id,
        userId: snapshot.user_id,
        competencyMatrix: snapshot.competency_matrix as Record<
          string,
          { score: number; percentile: number; level: string }
        >,
        overallCompetency: snapshot.overall_competency || 0,
        overallPercentile: snapshot.overall_percentile || 50,
        topStrengths: scores.slice(0, 3).map(s => s.category),
        topWeaknesses: scores
          .slice(-3)
          .map(s => s.category)
          .reverse(),
        snapshotDate: snapshot.snapshot_date,
      };
    } catch (_error) {
      logger._error('Error getting competency matrix:', _error);
      return null;
    }
  }

  /**
   * Get time-series performance data
   */
  static async getPerformanceTimeSeries(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('competency_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (_error) {
      logger._error('Error getting performance time series:', _error);
      return [];
    }
  }
}
