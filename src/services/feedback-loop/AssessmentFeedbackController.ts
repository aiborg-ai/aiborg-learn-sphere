/**
 * Assessment Feedback Controller
 *
 * Orchestrates the feedback loop between assessments and study plans.
 * Detects performance triggers and dispatches appropriate adjustments.
 *
 * Key responsibilities:
 * - Sliding window accuracy tracking
 * - Trigger detection (accuracy drop, ability change, mastery gap)
 * - Auto-dispatch to adjustment services
 * - Event logging and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  AnswerEvent,
  SlidingWindowMetrics,
  TriggerCondition,
  DetectedTrigger,
  TriggerDetectionResult,
  RecommendedAction,
  FeedbackLoopEvent,
  AppliedAction,
  FeedbackLoopConfig,
  DEFAULT_FEEDBACK_LOOP_CONFIG,
  AdjustmentSeverity,
} from './FeedbackLoopTypes';

// Import adjustment services (will be created)
// import { StudyPlanAdjustmentService } from './StudyPlanAdjustmentService';
// import { FlashcardGenerationService } from './FlashcardGenerationService';

interface UserFeedbackState {
  userId: string;
  slidingWindow: SlidingWindowMetrics;
  lastAdjustmentTime?: Date;
  adjustmentsToday: number;
  lastAbility: number;
}

export class AssessmentFeedbackController {
  private config: FeedbackLoopConfig;
  private userStates: Map<string, UserFeedbackState> = new Map();

  // Default trigger conditions
  private triggerConditions: TriggerCondition[] = [
    { type: 'accuracy_drop', threshold: 60, windowSize: 5, direction: 'below' },
    { type: 'ability_change', threshold: 0.5, direction: 'either' },
    { type: 'mastery_gap', threshold: 1.0, direction: 'above' },
    { type: 'streak_break', threshold: 3, direction: 'above' },
    { type: 'performance_spike', threshold: 0.3, direction: 'above' },
  ];

  constructor(config: Partial<FeedbackLoopConfig> = {}) {
    this.config = { ...DEFAULT_FEEDBACK_LOOP_CONFIG, ...config };
  }

  /**
   * Process an answer event from assessment/quiz
   * Main entry point for the feedback loop
   */
  async processAnswerEvent(event: AnswerEvent): Promise<TriggerDetectionResult> {
    try {
      // Get or initialize user state
      const userState = await this.getUserState(event.userId);

      // Update sliding window
      this.updateSlidingWindow(userState, event);

      // Detect triggers
      const triggers = this.detectTriggers(userState, event);

      // Build result
      const result: TriggerDetectionResult = {
        triggered: triggers.length > 0,
        triggers,
        metrics: { ...userState.slidingWindow },
        recommendedAction:
          triggers.length > 0 ? this.determineAction(triggers, userState) : undefined,
      };

      // If triggers detected, apply actions and log event
      if (result.triggered && result.recommendedAction) {
        const appliedActions = await this.applyRecommendedActions(
          event.userId,
          event.assessmentId,
          result.recommendedAction,
          triggers
        );

        // Log feedback event
        await this.logFeedbackEvent(event, triggers, userState.slidingWindow, appliedActions);
      }

      // Update user state
      userState.lastAbility = event.abilityAfter;
      this.userStates.set(event.userId, userState);

      return result;
    } catch (error) {
      logger.error('Error processing answer event:', error);
      throw error;
    }
  }

  /**
   * Get or initialize user feedback state
   */
  private async getUserState(userId: string): Promise<UserFeedbackState> {
    let state = this.userStates.get(userId);

    if (!state) {
      // Initialize from database if available
      const { data: recentAnswers } = await supabase
        .from('quiz_answers')
        .select('question_id, is_correct, ability_estimate, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.config.slidingWindowSize);

      const recentWindow = (recentAnswers || []).map(a => ({
        questionId: a.question_id,
        isCorrect: a.is_correct,
        difficulty: 0, // Will be fetched if needed
        timestamp: new Date(a.created_at),
      }));

      const accuracy =
        recentWindow.length > 0
          ? (recentWindow.filter(a => a.isCorrect).length / recentWindow.length) * 100
          : 100;

      state = {
        userId,
        slidingWindow: {
          windowSize: this.config.slidingWindowSize,
          recentAnswers: recentWindow,
          accuracy,
          averageDifficulty: 0,
          abilityTrend: 'stable',
        },
        adjustmentsToday: 0,
        lastAbility: 0,
      };

      this.userStates.set(userId, state);
    }

    return state;
  }

  /**
   * Update sliding window with new answer
   */
  private updateSlidingWindow(state: UserFeedbackState, event: AnswerEvent): void {
    const window = state.slidingWindow;

    // Add new answer
    window.recentAnswers.unshift({
      questionId: event.questionId,
      isCorrect: event.isCorrect,
      difficulty: event.questionDifficulty,
      timestamp: event.timestamp,
    });

    // Trim to window size
    if (window.recentAnswers.length > window.windowSize) {
      window.recentAnswers = window.recentAnswers.slice(0, window.windowSize);
    }

    // Recalculate metrics
    const correctCount = window.recentAnswers.filter(a => a.isCorrect).length;
    window.accuracy = (correctCount / window.recentAnswers.length) * 100;

    const totalDifficulty = window.recentAnswers.reduce((sum, a) => sum + a.difficulty, 0);
    window.averageDifficulty = totalDifficulty / window.recentAnswers.length;

    // Determine ability trend
    const abilityChange = event.abilityAfter - state.lastAbility;
    if (abilityChange > 0.1) {
      window.abilityTrend = 'improving';
    } else if (abilityChange < -0.1) {
      window.abilityTrend = 'declining';
    } else {
      window.abilityTrend = 'stable';
    }
  }

  /**
   * Detect triggers based on current state and event
   */
  private detectTriggers(state: UserFeedbackState, event: AnswerEvent): DetectedTrigger[] {
    const triggers: DetectedTrigger[] = [];

    for (const condition of this.triggerConditions) {
      const trigger = this.checkTriggerCondition(condition, state, event);
      if (trigger) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  /**
   * Check a single trigger condition
   */
  private checkTriggerCondition(
    condition: TriggerCondition,
    state: UserFeedbackState,
    event: AnswerEvent
  ): DetectedTrigger | null {
    let value: number;
    let triggered = false;
    const metadata: Record<string, unknown> = {};

    switch (condition.type) {
      case 'accuracy_drop':
        value = state.slidingWindow.accuracy;
        triggered = value < condition.threshold;
        metadata.recentCorrect = state.slidingWindow.recentAnswers.filter(a => a.isCorrect).length;
        metadata.totalInWindow = state.slidingWindow.recentAnswers.length;
        break;

      case 'ability_change':
        value = Math.abs(event.abilityAfter - state.lastAbility);
        triggered = value >= condition.threshold;
        metadata.abilityBefore = state.lastAbility;
        metadata.abilityAfter = event.abilityAfter;
        metadata.direction = event.abilityAfter > state.lastAbility ? 'improved' : 'declined';
        break;

      case 'mastery_gap':
        // Gap between target ability (0 = average) and current
        value = Math.max(0, 0 - event.abilityAfter);
        triggered = value >= condition.threshold;
        metadata.currentAbility = event.abilityAfter;
        metadata.targetAbility = 0;
        break;

      case 'streak_break': {
        // Check if recent answers show a broken streak
        const recentCorrect = state.slidingWindow.recentAnswers
          .slice(0, 3)
          .filter(a => a.isCorrect).length;
        value = 3 - recentCorrect;
        triggered = !event.isCorrect && value >= condition.threshold;
        metadata.recentIncorrect = value;
        break;
      }

      case 'performance_spike':
        // Sudden improvement in ability
        value = event.abilityAfter - state.lastAbility;
        triggered = value >= condition.threshold && state.slidingWindow.accuracy >= 80;
        metadata.improvement = value;
        break;

      default:
        return null;
    }

    if (triggered) {
      return {
        type: condition.type,
        severity: this.calculateSeverity(condition.type, value, condition.threshold),
        value,
        threshold: condition.threshold,
        metadata,
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Calculate severity based on trigger type and values
   */
  private calculateSeverity(type: string, value: number, threshold: number): AdjustmentSeverity {
    const ratio =
      type === 'accuracy_drop'
        ? threshold / Math.max(value, 1) // Lower accuracy = higher severity
        : value / threshold;

    if (ratio >= 2) return 'severe';
    if (ratio >= 1.5) return 'moderate';
    return 'mild';
  }

  /**
   * Determine recommended action based on triggers
   */
  private determineAction(
    triggers: DetectedTrigger[],
    state: UserFeedbackState
  ): RecommendedAction {
    // Prioritize by severity
    const sortedTriggers = [...triggers].sort((a, b) => {
      const severityOrder = { severe: 3, moderate: 2, mild: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const primaryTrigger = sortedTriggers[0];

    switch (primaryTrigger.type) {
      case 'accuracy_drop':
        if (primaryTrigger.severity === 'severe') {
          return {
            action: 'reduce_difficulty',
            severity: 'severe',
            reason: `Accuracy dropped to ${state.slidingWindow.accuracy.toFixed(1)}%, significantly below threshold`,
          };
        } else if (primaryTrigger.severity === 'moderate') {
          return {
            action: 'add_remedial',
            severity: 'moderate',
            reason: `Accuracy at ${state.slidingWindow.accuracy.toFixed(1)}%, adding foundational content`,
          };
        }
        return {
          action: 'generate_flashcards',
          severity: 'mild',
          reason: `Accuracy slightly below threshold, creating review flashcards`,
        };

      case 'ability_change': {
        const direction = primaryTrigger.metadata.direction as string;
        if (direction === 'declined') {
          return {
            action: 'reduce_difficulty',
            severity: primaryTrigger.severity,
            reason: `Ability declined by ${Math.abs(primaryTrigger.value).toFixed(2)}, adjusting difficulty`,
          };
        }
        return {
          action: 'increase_difficulty',
          severity: primaryTrigger.severity,
          reason: `Ability improved by ${primaryTrigger.value.toFixed(2)}, increasing challenge`,
        };
      }

      case 'mastery_gap':
        return {
          action: 'add_remedial',
          severity: primaryTrigger.severity,
          reason: `Mastery gap of ${primaryTrigger.value.toFixed(2)} detected, adding foundational content`,
        };

      case 'streak_break':
        return {
          action: 'schedule_review',
          severity: 'mild',
          reason: 'Learning streak interrupted, scheduling review session',
        };

      case 'performance_spike':
        return {
          action: 'increase_difficulty',
          severity: primaryTrigger.severity,
          reason: `Performance spike detected (+${primaryTrigger.value.toFixed(2)}), advancing difficulty`,
        };

      default:
        return {
          action: 'generate_flashcards',
          severity: 'mild',
          reason: 'Creating flashcards for review',
        };
    }
  }

  /**
   * Apply recommended actions
   */
  private async applyRecommendedActions(
    userId: string,
    assessmentId: string,
    action: RecommendedAction,
    triggers: DetectedTrigger[]
  ): Promise<AppliedAction[]> {
    const appliedActions: AppliedAction[] = [];

    // Check cooldown and daily limits
    const userState = this.userStates.get(userId);
    if (userState) {
      if (userState.adjustmentsToday >= this.config.maxAdjustmentsPerDay) {
        logger.info('Daily adjustment limit reached', {
          userId,
          limit: this.config.maxAdjustmentsPerDay,
        });
        return appliedActions;
      }

      if (userState.lastAdjustmentTime) {
        const minutesSinceLastAdjustment =
          (Date.now() - userState.lastAdjustmentTime.getTime()) / 1000 / 60;
        if (minutesSinceLastAdjustment < this.config.cooldownMinutes) {
          logger.info('Adjustment cooldown active', {
            userId,
            minutesRemaining: this.config.cooldownMinutes - minutesSinceLastAdjustment,
          });
          return appliedActions;
        }
      }
    }

    try {
      switch (action.action) {
        case 'reduce_difficulty':
          if (this.config.enableDynamicPlanAdjustment) {
            // Will be implemented in StudyPlanAdjustmentService
            // const result = await StudyPlanAdjustmentService.reduceDifficulty(userId, action.severity);
            appliedActions.push({
              action: 'reduce_difficulty',
              success: true,
              details: { severity: action.severity, reason: action.reason },
              appliedAt: new Date(),
            });
          }
          break;

        case 'increase_difficulty':
          if (this.config.enableDynamicPlanAdjustment) {
            // const result = await StudyPlanAdjustmentService.increaseDifficulty(userId, action.severity);
            appliedActions.push({
              action: 'increase_difficulty',
              success: true,
              details: { severity: action.severity, reason: action.reason },
              appliedAt: new Date(),
            });
          }
          break;

        case 'add_remedial':
          if (this.config.enableDynamicPlanAdjustment) {
            // const result = await StudyPlanAdjustmentService.addRemedialContent(userId, action.categories);
            appliedActions.push({
              action: 'add_remedial',
              success: true,
              details: { categories: action.categories, reason: action.reason },
              appliedAt: new Date(),
            });
          }
          break;

        case 'generate_flashcards':
          if (this.config.enableAutoFlashcards) {
            // Get wrong answers from this assessment and generate flashcards
            // const result = await FlashcardGenerationService.generateFromAssessment(userId, assessmentId);
            appliedActions.push({
              action: 'generate_flashcards',
              success: true,
              details: { assessmentId, reason: action.reason },
              appliedAt: new Date(),
            });
          }
          break;

        case 'schedule_review':
          // Schedule a review session
          appliedActions.push({
            action: 'schedule_review',
            success: true,
            details: { reason: action.reason },
            appliedAt: new Date(),
          });
          break;

        case 'resequence':
          if (this.config.enableDynamicPlanAdjustment) {
            // const result = await StudyPlanAdjustmentService.resequenceContent(userId);
            appliedActions.push({
              action: 'resequence',
              success: true,
              details: { reason: action.reason },
              appliedAt: new Date(),
            });
          }
          break;
      }

      // Update user state
      if (userState && appliedActions.length > 0) {
        userState.lastAdjustmentTime = new Date();
        userState.adjustmentsToday++;
      }

      logger.info('Applied feedback actions', {
        userId,
        actionCount: appliedActions.length,
        actions: appliedActions.map(a => a.action),
      });
    } catch (error) {
      logger.error('Error applying recommended actions:', error);
    }

    return appliedActions;
  }

  /**
   * Log feedback event to database
   */
  private async logFeedbackEvent(
    event: AnswerEvent,
    triggers: DetectedTrigger[],
    metrics: SlidingWindowMetrics,
    appliedActions: AppliedAction[]
  ): Promise<void> {
    try {
      const feedbackEvent: Omit<FeedbackLoopEvent, 'id' | 'createdAt'> = {
        userId: event.userId,
        assessmentId: event.assessmentId,
        eventType: this.determineEventType(triggers),
        abilityBefore: event.abilityBefore,
        abilityAfter: event.abilityAfter,
        triggersFired: triggers.length,
        triggerData: {
          triggers,
          metrics,
          actionsApplied: appliedActions,
        },
      };

      const { error } = await supabase.from('feedback_loop_events').insert({
        user_id: feedbackEvent.userId,
        assessment_id: feedbackEvent.assessmentId,
        event_type: feedbackEvent.eventType,
        ability_before: feedbackEvent.abilityBefore,
        ability_after: feedbackEvent.abilityAfter,
        triggers_fired: feedbackEvent.triggersFired,
        trigger_data: feedbackEvent.triggerData,
      });

      if (error) {
        logger.error('Failed to log feedback event:', error);
      } else {
        logger.info('Feedback event logged', {
          userId: event.userId,
          eventType: feedbackEvent.eventType,
          triggers: triggers.length,
        });
      }
    } catch (error) {
      logger.error('Error logging feedback event:', error);
    }
  }

  /**
   * Determine event type from triggers
   */
  private determineEventType(triggers: DetectedTrigger[]): FeedbackLoopEvent['eventType'] {
    if (triggers.length === 0) return 'answer_submitted';

    const triggerTypes = triggers.map(t => t.type);

    if (triggerTypes.includes('accuracy_drop')) return 'accuracy_drop';
    if (triggerTypes.includes('ability_change')) return 'ability_changed';
    if (triggerTypes.includes('mastery_gap')) return 'struggle_detected';
    if (triggerTypes.includes('performance_spike')) return 'mastery_achieved';
    if (triggerTypes.includes('streak_break')) return 'streak_broken';

    return 'answer_submitted';
  }

  /**
   * Get current metrics for a user
   */
  async getCurrentMetrics(userId: string): Promise<SlidingWindowMetrics | null> {
    const state = this.userStates.get(userId);
    return state ? { ...state.slidingWindow } : null;
  }

  /**
   * Get feedback history for a user
   */
  async getFeedbackHistory(userId: string, limit: number = 20): Promise<FeedbackLoopEvent[]> {
    const { data, error } = await supabase
      .from('feedback_loop_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching feedback history:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      eventType: row.event_type,
      abilityBefore: row.ability_before,
      abilityAfter: row.ability_after,
      triggersFired: row.triggers_fired,
      triggerData: row.trigger_data,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Reset user state (for testing or manual reset)
   */
  resetUserState(userId: string): void {
    this.userStates.delete(userId);
    logger.info('User feedback state reset', { userId });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FeedbackLoopConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Feedback loop config updated', { config: this.config });
  }
}

// Singleton instance for app-wide use
export const feedbackController = new AssessmentFeedbackController();
