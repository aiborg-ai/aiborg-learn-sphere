/**
 * Retention Prediction Service
 *
 * Predicts memory retention using personalized forgetting curves.
 * Calculates optimal review timing and calibrates SM-2 parameters.
 *
 * Key features:
 * - Personalized forgetting curve modeling
 * - Retention prediction with confidence intervals
 * - Optimal review scheduling
 * - SM-2 parameter calibration based on actual retention data
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  RetentionObservation,
  ForgettingCurve,
  RetentionPrediction,
  PersonalizedSM2Params,
} from './FeedbackLoopTypes';

export class RetentionPredictionService {
  // Default forgetting curve parameters (Ebbinghaus-like)
  private defaultDecayConstant = 0.3; // R = e^(-k*t), k = decay constant
  private defaultHalfLife = 2.3; // ln(2) / k ≈ 2.3 days

  /**
   * Record a retention observation (used to calibrate forgetting curves)
   */
  async recordRetentionObservation(observation: Omit<RetentionObservation, 'id'>): Promise<void> {
    try {
      // Calculate predicted retention for comparison
      const predictedRetention = await this.predictRetentionForObservation(observation);

      const { error } = await supabase.from('retention_observations').insert({
        user_id: observation.userId,
        topic_id: observation.topicId,
        flashcard_id: observation.flashcardId,
        days_since_last_review: observation.daysSinceLastReview,
        was_recalled: observation.wasRecalled,
        quality_score: observation.qualityScore,
        predicted_retention: predictedRetention,
        observed_at: observation.observedAt.toISOString(),
      });

      if (error) {
        logger.error('Failed to record retention observation:', error);
      }

      // Check if we have enough data to update forgetting curve
      await this.maybeUpdateForgettingCurve(observation.userId, observation.topicId);
    } catch (error) {
      logger.error('Error recording retention observation:', error);
    }
  }

  /**
   * Build personalized forgetting curve from observations
   */
  async buildForgettingCurve(userId: string, topicId?: string): Promise<ForgettingCurve | null> {
    try {
      let query = supabase.from('retention_observations').select('*').eq('user_id', userId);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data: observations, error } = await query
        .order('observed_at', { ascending: false })
        .limit(100);

      if (error || !observations || observations.length < 5) {
        logger.info('Not enough observations for forgetting curve', {
          userId,
          topicId,
          count: observations?.length || 0,
        });
        return null;
      }

      // Fit exponential decay curve using least squares
      const { decayConstant, confidence } = this.fitExponentialCurve(observations);

      const curve: ForgettingCurve = {
        userId,
        topicId,
        decayConstant,
        initialRetention: 1.0,
        halfLife: Math.LN2 / decayConstant,
        confidence,
        dataPoints: observations.length,
        lastUpdated: new Date(),
      };

      // Cache the curve
      await this.cacheForgettingCurve(curve);

      logger.info('Forgetting curve built', {
        userId,
        topicId,
        decayConstant,
        halfLife: curve.halfLife,
        confidence,
      });

      return curve;
    } catch (error) {
      logger.error('Error building forgetting curve:', error);
      return null;
    }
  }

  /**
   * Predict current retention for a topic/flashcard
   */
  async predictCurrentRetention(
    userId: string,
    topicId: string | undefined,
    daysSinceReview: number
  ): Promise<RetentionPrediction> {
    // Get or build forgetting curve
    let curve = await this.getCachedForgettingCurve(userId, topicId);

    if (!curve) {
      curve = await this.buildForgettingCurve(userId, topicId);
    }

    const decayConstant = curve?.decayConstant || this.defaultDecayConstant;
    const confidence = curve?.confidence || 0.5;

    // R = e^(-k*t)
    const retention = Math.exp(-decayConstant * daysSinceReview);

    // Calculate optimal review date (when retention drops to 85%)
    const targetRetention = 0.85;
    const optimalDays = -Math.log(targetRetention) / decayConstant;
    const optimalReviewDate = new Date();
    optimalReviewDate.setDate(
      optimalReviewDate.getDate() + Math.round(optimalDays - daysSinceReview)
    );

    // Determine urgency
    let urgency: RetentionPrediction['urgency'];
    if (retention < 0.5) {
      urgency = 'overdue';
    } else if (retention < 0.7) {
      urgency = 'due_soon';
    } else if (retention >= 0.85) {
      urgency = 'early';
    } else {
      urgency = 'optimal';
    }

    return {
      retention,
      confidence,
      optimalReviewDate,
      urgency,
      daysUntilOptimal: Math.max(0, optimalDays - daysSinceReview),
    };
  }

  /**
   * Get calibrated SM-2 parameters based on retention data
   */
  async getCalibratedSM2Parameters(userId: string): Promise<PersonalizedSM2Params | null> {
    try {
      // Get retention observations and review history
      const { data: observations } = await supabase
        .from('retention_observations')
        .select('*')
        .eq('user_id', userId)
        .order('observed_at', { ascending: false })
        .limit(200);

      if (!observations || observations.length < 20) {
        return null; // Not enough data
      }

      // Analyze patterns
      const analysis = this.analyzeRetentionPatterns(observations);

      // Derive SM-2 calibration
      const params: PersonalizedSM2Params = {
        userId,
        efMultiplier: this.calculateEFMultiplier(analysis),
        intervalMultiplier: this.calculateIntervalMultiplier(analysis),
        hardIntervalModifier: analysis.lowRetentionRate > 0.3 ? 0.7 : 0.8,
        easyIntervalModifier: analysis.highRetentionRate > 0.7 ? 1.5 : 1.3,
        graduationThreshold: analysis.averageHalfLife > 3 ? 14 : 21,
        lapseThreshold: analysis.lowRetentionRate > 0.2 ? 0.4 : 0.3,
        lastCalibrated: new Date(),
      };

      logger.info('SM-2 parameters calibrated from retention data', {
        userId,
        params,
        observationCount: observations.length,
      });

      return params;
    } catch (error) {
      logger.error('Error calibrating SM-2 parameters:', error);
      return null;
    }
  }

  /**
   * Get items due for review with retention predictions
   */
  async getDueItemsWithRetention(userId: string, targetRetention: number = 0.85) {
    try {
      // Get all flashcards
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('id, front, last_review_date, interval, easiness_factor, tags')
        .eq('user_id', userId)
        .not('last_review_date', 'is', null);

      if (!flashcards) return [];

      const itemsWithRetention = [];

      for (const card of flashcards) {
        const daysSinceReview = card.last_review_date
          ? Math.floor(
              (Date.now() - new Date(card.last_review_date).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        // Get topic from tags (if available)
        const topicTag = card.tags?.find(
          (t: string) => !['auto-generated', 'easy', 'medium', 'hard'].includes(t)
        );

        const prediction = await this.predictCurrentRetention(userId, topicTag, daysSinceReview);

        if (prediction.retention <= targetRetention) {
          itemsWithRetention.push({
            ...card,
            daysSinceReview,
            ...prediction,
          });
        }
      }

      // Sort by urgency and retention
      itemsWithRetention.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          const urgencyOrder = { overdue: 0, due_soon: 1, optimal: 2, early: 3 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return a.retention - b.retention;
      });

      return itemsWithRetention;
    } catch (error) {
      logger.error('Error getting due items with retention:', error);
      return [];
    }
  }

  /**
   * Get retention statistics for user
   */
  async getRetentionStats(userId: string) {
    try {
      const { data: observations } = await supabase
        .from('retention_observations')
        .select('was_recalled, days_since_last_review, quality_score, predicted_retention')
        .eq('user_id', userId)
        .order('observed_at', { ascending: false })
        .limit(100);

      if (!observations || observations.length === 0) {
        return null;
      }

      const recallCount = observations.filter(o => o.was_recalled).length;
      const totalDays = observations.reduce((sum, o) => sum + o.days_since_last_review, 0);
      const avgQuality =
        observations.reduce((sum, o) => sum + (o.quality_score || 0), 0) / observations.length;
      const predictionAccuracy = this.calculatePredictionAccuracy(observations);

      // Get forgetting curve
      const curve = await this.buildForgettingCurve(userId);

      return {
        totalObservations: observations.length,
        recallRate: recallCount / observations.length,
        averageDaysBetweenReviews: totalDays / observations.length,
        averageQualityScore: avgQuality,
        predictionAccuracy,
        forgettingCurve: curve
          ? {
              decayConstant: curve.decayConstant,
              halfLife: curve.halfLife,
              confidence: curve.confidence,
            }
          : null,
      };
    } catch (error) {
      logger.error('Error getting retention stats:', error);
      return null;
    }
  }

  /**
   * Fit exponential curve to observations using least squares
   */
  private fitExponentialCurve(
    observations: Array<{
      days_since_last_review: number;
      was_recalled: boolean;
      quality_score: number | null;
    }>
  ): { decayConstant: number; confidence: number } {
    // Transform to linear: ln(R) = -k*t
    // We use quality_score >= 3 as "recalled" proxy, or was_recalled field

    const points: { t: number; lnR: number }[] = [];

    // Group by days_since_last_review and calculate recall rate
    const dayGroups = new Map<number, { recalled: number; total: number }>();

    for (const obs of observations) {
      const days = obs.days_since_last_review;
      const recalled = obs.was_recalled || obs.quality_score >= 3;

      if (!dayGroups.has(days)) {
        dayGroups.set(days, { recalled: 0, total: 0 });
      }
      const group = dayGroups.get(days)!;
      group.total++;
      if (recalled) group.recalled++;
    }

    // Convert to points for regression
    for (const [days, group] of dayGroups) {
      if (group.total >= 2) {
        // Need at least 2 observations
        const retentionRate = group.recalled / group.total;
        if (retentionRate > 0 && retentionRate < 1) {
          points.push({
            t: days,
            lnR: Math.log(retentionRate),
          });
        }
      }
    }

    if (points.length < 3) {
      return { decayConstant: this.defaultDecayConstant, confidence: 0.3 };
    }

    // Linear regression: lnR = -k*t
    // Using least squares: k = -Σ(t*lnR) / Σ(t²)
    let sumT2 = 0;
    let sumTLnR = 0;

    for (const point of points) {
      sumT2 += point.t * point.t;
      sumTLnR += point.t * point.lnR;
    }

    const k = sumT2 > 0 ? -sumTLnR / sumT2 : this.defaultDecayConstant;

    // Ensure k is positive and reasonable
    const decayConstant = Math.max(0.05, Math.min(1.0, k));

    // Calculate R² for confidence
    const meanLnR = points.reduce((sum, p) => sum + p.lnR, 0) / points.length;
    let ssRes = 0;
    let ssTot = 0;

    for (const point of points) {
      const predicted = -decayConstant * point.t;
      ssRes += (point.lnR - predicted) ** 2;
      ssTot += (point.lnR - meanLnR) ** 2;
    }

    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const confidence = Math.max(0, Math.min(1, rSquared));

    return { decayConstant, confidence };
  }

  /**
   * Analyze retention patterns from observations
   */
  private analyzeRetentionPatterns(
    observations: Array<{
      was_recalled: boolean;
      quality_score: number | null;
      days_since_last_review: number;
    }>
  ) {
    let highRetentionCount = 0;
    let lowRetentionCount = 0;
    let totalHalfLife = 0;
    let halfLifeCount = 0;

    for (const obs of observations) {
      const recalled = obs.was_recalled || obs.quality_score >= 3;
      const days = obs.days_since_last_review;

      if (recalled && days > 0) {
        // Estimate half-life from this observation
        // If recalled at day t, R(t) ≈ 0.5 + quality/10
        const estimatedR = 0.5 + (obs.quality_score || 3) / 10;
        const k = -Math.log(estimatedR) / days;
        const halfLife = Math.LN2 / k;

        if (halfLife > 0 && halfLife < 30) {
          totalHalfLife += halfLife;
          halfLifeCount++;
        }

        if (estimatedR > 0.7) highRetentionCount++;
      } else if (!recalled) {
        lowRetentionCount++;
      }
    }

    return {
      highRetentionRate: highRetentionCount / observations.length,
      lowRetentionRate: lowRetentionCount / observations.length,
      averageHalfLife: halfLifeCount > 0 ? totalHalfLife / halfLifeCount : this.defaultHalfLife,
    };
  }

  /**
   * Calculate EF multiplier based on retention analysis
   */
  private calculateEFMultiplier(
    analysis: ReturnType<typeof this.analyzeRetentionPatterns>
  ): number {
    // Higher retention rate → can increase EF faster
    if (analysis.highRetentionRate > 0.8) return 1.15;
    if (analysis.highRetentionRate > 0.6) return 1.05;
    if (analysis.lowRetentionRate > 0.3) return 0.9;
    return 1.0;
  }

  /**
   * Calculate interval multiplier based on retention analysis
   */
  private calculateIntervalMultiplier(
    analysis: ReturnType<typeof this.analyzeRetentionPatterns>
  ): number {
    // Longer half-life → can use longer intervals
    if (analysis.averageHalfLife > 5) return 1.3;
    if (analysis.averageHalfLife > 3) return 1.1;
    if (analysis.averageHalfLife < 1.5) return 0.8;
    return 1.0;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculatePredictionAccuracy(
    observations: Array<{ predicted_retention: number | null; was_recalled: boolean }>
  ): number {
    let correct = 0;

    for (const obs of observations) {
      if (obs.predicted_retention === null) continue;

      const predictedRecall = obs.predicted_retention > 0.5;
      const actualRecall = obs.was_recalled;

      if (predictedRecall === actualRecall) {
        correct++;
      }
    }

    return observations.length > 0 ? correct / observations.length : 0;
  }

  /**
   * Get cached forgetting curve
   */
  private async getCachedForgettingCurve(
    _userId: string,
    _topicId?: string
  ): Promise<ForgettingCurve | null> {
    // In production, this would use Redis or similar cache
    // For now, we'll rebuild each time
    return null;
  }

  /**
   * Cache forgetting curve
   */
  private async cacheForgettingCurve(_curve: ForgettingCurve): Promise<void> {
    // In production, this would cache to Redis or similar
    // For now, we skip caching
  }

  /**
   * Maybe update forgetting curve if enough new data
   */
  private async maybeUpdateForgettingCurve(userId: string, topicId?: string): Promise<void> {
    // Check if we have enough new observations since last curve update
    const { data, error } = await supabase
      .from('retention_observations')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('topic_id', topicId || '');

    if (error) return;

    const count = data?.length || 0;

    // Update curve every 10 new observations
    if (count > 0 && count % 10 === 0) {
      await this.buildForgettingCurve(userId, topicId);
    }
  }

  /**
   * Predict retention for a specific observation (before recording)
   */
  private async predictRetentionForObservation(
    observation: Omit<RetentionObservation, 'id'>
  ): Promise<number> {
    const curve = await this.getCachedForgettingCurve(observation.userId, observation.topicId);
    const k = curve?.decayConstant || this.defaultDecayConstant;
    return Math.exp(-k * observation.daysSinceLastReview);
  }
}

// Singleton instance
export const retentionPredictionService = new RetentionPredictionService();
