/**
 * Feedback Loop Services
 *
 * Centralized exports for the assessment → study plan feedback loop.
 *
 * This module provides:
 * - AssessmentFeedbackController: Orchestrates feedback events
 * - StudyPlanAdjustmentService: Dynamic plan modifications
 * - FlashcardGenerationService: Auto-generate flashcards from wrong answers
 * - EnhancedSM2Service: IRT-calibrated spaced repetition
 * - RetentionPredictionService: Forgetting curves and retention prediction
 */

// Types
export * from './FeedbackLoopTypes';

// Services
export { AssessmentFeedbackController, feedbackController } from './AssessmentFeedbackController';

export {
  StudyPlanAdjustmentService,
  studyPlanAdjustmentService,
} from './StudyPlanAdjustmentService';

export {
  FlashcardGenerationService,
  flashcardGenerationService,
} from './FlashcardGenerationService';

export { EnhancedSM2Service, enhancedSM2Service } from './EnhancedSM2Service';

export {
  RetentionPredictionService,
  retentionPredictionService,
} from './RetentionPredictionService';

export { CrossDeckScheduler, crossDeckScheduler } from './CrossDeckScheduler';
