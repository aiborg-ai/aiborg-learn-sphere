/**
 * Enhanced SM-2 Service
 *
 * IRT-calibrated SM-2 implementation that integrates with adaptive assessment.
 * Provides ability-based easiness factor initialization and interval adjustment.
 *
 * Key features:
 * - IRT difficulty → Initial EF mapping
 * - Ability-adjusted interval calculation
 * - Personalized SM-2 parameters per user
 * - Retention prediction integration
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  EnhancedSM2State,
  ReviewHistoryEntry,
  SM2CalibrationParams,
  DEFAULT_SM2_CALIBRATION,
  EnhancedReviewResult,
  PersonalizedSM2Params,
} from './FeedbackLoopTypes';

export class EnhancedSM2Service {
  private defaultParams: SM2CalibrationParams;

  constructor(params: Partial<SM2CalibrationParams> = {}) {
    this.defaultParams = { ...DEFAULT_SM2_CALIBRATION, ...params };
  }

  /**
   * Initialize SM-2 state with ability calibration
   *
   * @param userAbility - User's current ability estimate (theta)
   * @param cardDifficulty - Card's IRT difficulty
   * @returns Initial enhanced SM-2 state
   */
  initializeWithAbility(userAbility: number, cardDifficulty: number): EnhancedSM2State {
    const gap = userAbility - cardDifficulty;
    const initialEF = this.calculateInitialEF(gap);

    return {
      easinessFactor: initialEF,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
      irtDifficulty: cardDifficulty,
      userAbilityAtCreate: userAbility,
      calibrationFactor: this.calculateCalibrationFactor(gap),
      retentionEstimate: 1.0, // 100% at start
      reviewHistory: [],
    };
  }

  /**
   * Calculate enhanced review result with ability adjustment
   */
  calculateEnhancedReview(
    state: EnhancedSM2State,
    quality: number,
    responseTime?: number,
    currentUserAbility?: number
  ): EnhancedReviewResult {
    // Standard SM-2 calculation with enhancements
    const oldEF = state.easinessFactor;
    const oldInterval = state.interval;

    // Apply ability adjustment if user ability has changed
    let abilityAdjustment = 1.0;
    if (currentUserAbility !== undefined && state.lastUserAbility !== undefined) {
      const abilityChange = currentUserAbility - state.lastUserAbility;
      abilityAdjustment = 1 + abilityChange * 0.1; // 10% per theta point
    }

    // Calculate new EF using SM-2 formula with modifications
    let newEF = oldEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Apply calibration factor based on IRT difficulty
    newEF *= state.calibrationFactor;

    // Apply ability adjustment
    newEF *= abilityAdjustment;

    // Clamp EF to valid range
    newEF = Math.max(this.defaultParams.minEF, Math.min(this.defaultParams.maxEF, newEF));

    // Calculate new interval
    let newInterval: number;
    let newRepetitions = state.repetitions;
    let learningStatus: EnhancedReviewResult['learningStatus'];

    if (quality < 3) {
      // Failed review - reset
      newInterval = 1;
      newRepetitions = 0;
      learningStatus = state.repetitions > 0 ? 'relearning' : 'new';
    } else {
      newRepetitions++;

      if (newRepetitions === 1) {
        newInterval = 1;
        learningStatus = 'learning';
      } else if (newRepetitions === 2) {
        newInterval = 6;
        learningStatus = 'learning';
      } else {
        newInterval = Math.round(oldInterval * newEF);
        learningStatus = newInterval >= 21 ? 'graduated' : 'review';
      }

      // Apply easy/hard modifiers based on quality
      if (quality === 5) {
        newInterval = Math.round(newInterval * this.defaultParams.easyBonus);
      } else if (quality === 3) {
        newInterval = Math.round(newInterval * this.defaultParams.hardPenalty);
      }
    }

    // Calculate retention prediction
    const retentionPrediction = this.predictRetention(state, newInterval);

    // Create review history entry
    const historyEntry: ReviewHistoryEntry = {
      reviewDate: new Date(),
      quality,
      responseTime: responseTime || 0,
      wasRecalled: quality >= 3,
      intervalBefore: oldInterval,
      intervalAfter: newInterval,
      efBefore: oldEF,
      efAfter: newEF,
    };

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Build new state
    const newState: EnhancedSM2State = {
      ...state,
      easinessFactor: newEF,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate,
      lastReviewDate: new Date(),
      lastUserAbility: currentUserAbility ?? state.lastUserAbility,
      retentionEstimate: retentionPrediction,
      reviewHistory: [...state.reviewHistory, historyEntry].slice(-20), // Keep last 20
    };

    return {
      newState,
      retentionPrediction,
      recommendedReviewDate: nextReviewDate,
      learningStatus,
    };
  }

  /**
   * Sync user ability changes to all flashcard EFs
   */
  async syncUserAbility(userId: string, newAbility: number): Promise<number> {
    try {
      // Get all user's flashcards with enhanced state
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select(
          `
          id,
          easiness_factor,
          interval,
          repetitions,
          flashcard_sources (
            initial_ef,
            irt_difficulty
          )
        `
        )
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching flashcards for ability sync:', error);
        return 0;
      }

      let updatedCount = 0;

      for (const flashcard of flashcards || []) {
        const source = (flashcard.flashcard_sources as any)?.[0];
        if (!source) continue;

        const irtDifficulty = source.irt_difficulty;
        const gap = newAbility - irtDifficulty;
        const newCalibrationFactor = this.calculateCalibrationFactor(gap);

        // Adjust EF based on new ability
        const baseEF = flashcard.easiness_factor;
        const oldCalibration = this.calculateCalibrationFactor(0); // Default
        const efWithoutCalibration = baseEF / oldCalibration;
        const newEF = Math.max(
          this.defaultParams.minEF,
          Math.min(this.defaultParams.maxEF, efWithoutCalibration * newCalibrationFactor)
        );

        if (Math.abs(newEF - baseEF) > 0.1) {
          const { error: updateError } = await supabase
            .from('flashcards')
            .update({ easiness_factor: newEF })
            .eq('id', flashcard.id);

          if (!updateError) {
            updatedCount++;
          }
        }
      }

      logger.info('Synced user ability to flashcards', { userId, updatedCount, newAbility });
      return updatedCount;
    } catch (error) {
      logger.error('Error syncing user ability:', error);
      return 0;
    }
  }

  /**
   * Get personalized SM-2 parameters for user
   */
  async getPersonalizedParams(userId: string): Promise<PersonalizedSM2Params | null> {
    try {
      // Analyze user's review history to derive personalized parameters
      const { data: reviewData, error } = await supabase
        .from('flashcard_reviews')
        .select('quality, interval_before, interval_after, ef_before, ef_after')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !reviewData || reviewData.length < 10) {
        return null; // Not enough data
      }

      // Calculate personalized multipliers based on actual performance
      let totalEFChange = 0;
      let totalIntervalChange = 0;
      let successCount = 0;
      let failCount = 0;

      for (const review of reviewData) {
        if (review.quality >= 3) {
          successCount++;
          totalEFChange += review.ef_after - review.ef_before;
          totalIntervalChange += review.interval_after / Math.max(1, review.interval_before);
        } else {
          failCount++;
        }
      }

      const successRate = successCount / reviewData.length;

      // Derive personalized parameters
      const efMultiplier = successRate > 0.8 ? 1.1 : successRate < 0.6 ? 0.9 : 1.0;
      const intervalMultiplier = successRate > 0.85 ? 1.2 : successRate < 0.5 ? 0.8 : 1.0;

      return {
        userId,
        efMultiplier,
        intervalMultiplier,
        hardIntervalModifier: failCount > successCount ? 0.7 : 0.8,
        easyIntervalModifier: successRate > 0.9 ? 1.5 : 1.3,
        graduationThreshold: successRate > 0.85 ? 14 : 21,
        lapseThreshold: failCount / reviewData.length > 0.3 ? 0.5 : 0.3,
        lastCalibrated: new Date(),
      };
    } catch (error) {
      logger.error('Error getting personalized params:', error);
      return null;
    }
  }

  /**
   * Calculate optimal review time based on retention target
   */
  calculateOptimalReviewTime(state: EnhancedSM2State, targetRetention: number = 0.85): Date {
    // Use forgetting curve formula: R = e^(-t/S)
    // Where S is stability (related to interval and EF)
    // Solve for t: t = -S * ln(R)

    const stability = this.calculateStability(state);
    const daysUntilTarget = -stability * Math.log(targetRetention);

    const optimalDate = new Date(state.lastReviewDate || new Date());
    optimalDate.setDate(optimalDate.getDate() + Math.max(1, Math.round(daysUntilTarget)));

    return optimalDate;
  }

  /**
   * Predict retention at given number of days
   */
  private predictRetention(state: EnhancedSM2State, daysFromNow: number): number {
    const stability = this.calculateStability(state);
    return Math.exp(-daysFromNow / stability);
  }

  /**
   * Calculate memory stability (in days)
   */
  private calculateStability(state: EnhancedSM2State): number {
    // Base stability from interval and EF
    const baseStability = state.interval * (state.easinessFactor / 2.5);

    // Adjust for repetitions (more reviews = more stable)
    const repBonus = 1 + state.repetitions * 0.1;

    // Adjust for IRT difficulty (harder cards decay faster)
    const difficultyPenalty = 1 - state.irtDifficulty * 0.05;

    return Math.max(1, baseStability * repBonus * difficultyPenalty);
  }

  /**
   * Calculate initial EF based on ability-difficulty gap
   */
  private calculateInitialEF(gap: number): number {
    // Gap < 0: card is harder than user → lower EF
    // Gap > 0: card is easier than user → higher EF

    let ef = this.defaultParams.baseEF;

    if (gap < -1.5) {
      ef = 1.4;
    } else if (gap < -1) {
      ef = 1.7;
    } else if (gap < -0.5) {
      ef = 2.0;
    } else if (gap < 0) {
      ef = 2.3;
    } else if (gap < 0.5) {
      ef = 2.5;
    } else if (gap < 1) {
      ef = 2.7;
    } else {
      ef = 2.9;
    }

    return Math.max(this.defaultParams.minEF, Math.min(this.defaultParams.maxEF, ef));
  }

  /**
   * Calculate calibration factor based on ability-difficulty gap
   */
  private calculateCalibrationFactor(gap: number): number {
    // Factor adjusts how quickly EF changes during reviews
    // Harder cards (negative gap) should have lower factor (slower EF increase)
    // Easier cards (positive gap) should have higher factor (faster EF increase)

    if (gap < -1) {
      return 0.85; // Much harder: conservative
    } else if (gap < 0) {
      return 0.95; // Harder: slightly conservative
    } else if (gap < 1) {
      return 1.0; // About right: normal
    } else {
      return 1.05; // Easier: slightly aggressive
    }
  }

  /**
   * Bulk update flashcard states after review
   */
  async processReview(
    userId: string,
    flashcardId: string,
    quality: number,
    responseTime?: number
  ): Promise<EnhancedReviewResult | null> {
    try {
      // Get current flashcard state
      const { data: flashcard, error } = await supabase
        .from('flashcards')
        .select(
          `
          id,
          easiness_factor,
          interval,
          repetitions,
          next_review_date,
          last_review_date,
          flashcard_sources (
            initial_ef,
            irt_difficulty
          )
        `
        )
        .eq('id', flashcardId)
        .eq('user_id', userId)
        .single();

      if (error || !flashcard) {
        logger.error('Flashcard not found:', error);
        return null;
      }

      // Get current user ability
      const { data: assessment } = await supabase
        .from('user_ai_assessments')
        .select('current_ability')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const currentAbility = assessment?.current_ability || 0;
      const source = (flashcard.flashcard_sources as any)?.[0];

      // Build current state
      const currentState: EnhancedSM2State = {
        easinessFactor: flashcard.easiness_factor,
        interval: flashcard.interval,
        repetitions: flashcard.repetitions,
        nextReviewDate: new Date(flashcard.next_review_date),
        lastReviewDate: flashcard.last_review_date
          ? new Date(flashcard.last_review_date)
          : undefined,
        irtDifficulty: source?.irt_difficulty || 0,
        userAbilityAtCreate: source?.initial_ef || 0,
        lastUserAbility: currentAbility,
        calibrationFactor: this.calculateCalibrationFactor(
          currentAbility - (source?.irt_difficulty || 0)
        ),
        retentionEstimate: 0.5, // Will be recalculated
        reviewHistory: [],
      };

      // Calculate review result
      const result = this.calculateEnhancedReview(
        currentState,
        quality,
        responseTime,
        currentAbility
      );

      // Save updated state
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          easiness_factor: result.newState.easinessFactor,
          interval: result.newState.interval,
          repetitions: result.newState.repetitions,
          next_review_date: result.newState.nextReviewDate.toISOString(),
          last_review_date: new Date().toISOString(),
        })
        .eq('id', flashcardId);

      if (updateError) {
        logger.error('Error updating flashcard:', updateError);
        return null;
      }

      // Log review
      await this.logReview(userId, flashcardId, quality, result, responseTime);

      return result;
    } catch (error) {
      logger.error('Error processing review:', error);
      return null;
    }
  }

  /**
   * Log review to history
   */
  private async logReview(
    userId: string,
    flashcardId: string,
    quality: number,
    result: EnhancedReviewResult,
    responseTime?: number
  ): Promise<void> {
    try {
      await supabase.from('flashcard_reviews').insert({
        user_id: userId,
        flashcard_id: flashcardId,
        quality,
        response_time: responseTime,
        was_recalled: quality >= 3,
        interval_before: result.newState.interval,
        interval_after: result.newState.interval,
        ef_before: result.newState.easinessFactor,
        ef_after: result.newState.easinessFactor,
        retention_estimate: result.retentionPrediction,
        learning_status: result.learningStatus,
      });
    } catch (error) {
      logger.warn('Failed to log review:', error);
    }
  }

  /**
   * Get due flashcards with retention estimates
   */
  async getDueFlashcardsWithRetention(userId: string, limit: number = 20) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('flashcards')
      .select(
        `
        id,
        front,
        back,
        easiness_factor,
        interval,
        repetitions,
        next_review_date,
        last_review_date,
        flashcard_sources (
          irt_difficulty
        )
      `
      )
      .eq('user_id', userId)
      .lte('next_review_date', now)
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('Error fetching due flashcards:', error);
      return [];
    }

    // Calculate retention for each
    return (data || []).map(card => {
      const source = (card.flashcard_sources as any)?.[0];
      const daysSinceReview = card.last_review_date
        ? Math.floor(
            (Date.now() - new Date(card.last_review_date).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      const state: EnhancedSM2State = {
        easinessFactor: card.easiness_factor,
        interval: card.interval,
        repetitions: card.repetitions,
        nextReviewDate: new Date(card.next_review_date),
        lastReviewDate: card.last_review_date ? new Date(card.last_review_date) : undefined,
        irtDifficulty: source?.irt_difficulty || 0,
        userAbilityAtCreate: 0,
        calibrationFactor: 1,
        retentionEstimate: 0,
        reviewHistory: [],
      };

      const retention = this.predictRetention(state, daysSinceReview);

      return {
        ...card,
        estimatedRetention: retention,
        urgency: retention < 0.5 ? 'critical' : retention < 0.7 ? 'high' : 'normal',
      };
    });
  }
}

// Singleton instance
export const enhancedSM2Service = new EnhancedSM2Service();
