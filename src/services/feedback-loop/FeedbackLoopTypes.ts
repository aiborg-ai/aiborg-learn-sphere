/**
 * Feedback Loop Types
 *
 * Comprehensive type definitions for the assessment → study plan feedback loop.
 * Includes types for:
 * - Feedback events and triggers
 * - Study plan adjustments
 * - Flashcard generation
 * - Retention predictions
 * - SM-2 enhancements
 */

// ============================================================================
// Core Event Types
// ============================================================================

export type FeedbackEventType =
  | 'answer_submitted'
  | 'assessment_completed'
  | 'ability_changed'
  | 'accuracy_drop'
  | 'mastery_achieved'
  | 'struggle_detected'
  | 'streak_broken'
  | 'plan_adjusted';

export type TriggerType =
  | 'accuracy_drop' // Accuracy fell below threshold
  | 'ability_change' // Significant ability estimate change
  | 'mastery_gap' // Gap between target and current ability
  | 'time_based' // Scheduled review timing
  | 'streak_break' // Learning streak interrupted
  | 'performance_spike'; // Sudden improvement

export type AdjustmentSeverity = 'mild' | 'moderate' | 'severe';

export type DifficultyDirection = 'increase' | 'decrease' | 'maintain';

// ============================================================================
// Answer Event Types
// ============================================================================

export interface AnswerEvent {
  userId: string;
  assessmentId: string;
  questionId: string;
  isCorrect: boolean;
  selectedOptions: string[];
  correctOptions: string[];
  timeSpent: number; // seconds
  abilityBefore: number;
  abilityAfter: number;
  standardError: number;
  questionDifficulty: number;
  questionCategory?: string;
  questionTopics?: string[];
  timestamp: Date;
}

export interface SlidingWindowMetrics {
  windowSize: number;
  recentAnswers: {
    questionId: string;
    isCorrect: boolean;
    difficulty: number;
    timestamp: Date;
  }[];
  accuracy: number; // 0-100
  averageDifficulty: number;
  abilityTrend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// Trigger Detection Types
// ============================================================================

export interface TriggerCondition {
  type: TriggerType;
  threshold: number;
  windowSize?: number;
  direction?: 'above' | 'below' | 'either';
}

export interface DetectedTrigger {
  type: TriggerType;
  severity: AdjustmentSeverity;
  value: number;
  threshold: number;
  metadata: Record<string, unknown>;
  detectedAt: Date;
}

export interface TriggerDetectionResult {
  triggered: boolean;
  triggers: DetectedTrigger[];
  metrics: SlidingWindowMetrics;
  recommendedAction?: RecommendedAction;
}

export interface RecommendedAction {
  action:
    | 'reduce_difficulty'
    | 'increase_difficulty'
    | 'add_remedial'
    | 'resequence'
    | 'generate_flashcards'
    | 'schedule_review';
  severity: AdjustmentSeverity;
  categories?: string[];
  topics?: string[];
  reason: string;
}

// ============================================================================
// Feedback Loop Event (Database Record)
// ============================================================================

export interface FeedbackLoopEvent {
  id: string;
  userId: string;
  assessmentId: string;
  eventType: FeedbackEventType;
  abilityBefore: number;
  abilityAfter: number;
  triggersFired: number;
  triggerData: {
    triggers: DetectedTrigger[];
    metrics: SlidingWindowMetrics;
    actionsApplied: AppliedAction[];
  };
  createdAt: Date;
}

export interface AppliedAction {
  action: RecommendedAction['action'];
  success: boolean;
  details: Record<string, unknown>;
  appliedAt: Date;
}

// ============================================================================
// Study Plan Adjustment Types
// ============================================================================

export interface PlanAdjustmentRequest {
  userId: string;
  planId: string;
  action: RecommendedAction['action'];
  severity: AdjustmentSeverity;
  categories?: string[];
  topics?: string[];
  triggerData?: DetectedTrigger;
}

export interface PlanAdjustmentResult {
  success: boolean;
  adjustmentId: string;
  tasksAffected: number;
  changes: PlanChange[];
  newPlanSnapshot?: GeneratedPlanSnapshot;
}

export interface PlanChange {
  type: 'difficulty_change' | 'task_added' | 'task_removed' | 'task_reordered' | 'content_replaced';
  taskId?: string;
  before?: unknown;
  after?: unknown;
  reason: string;
}

export interface GeneratedPlanSnapshot {
  planId: string;
  totalTasks: number;
  averageDifficulty: number;
  difficultyDistribution: Record<string, number>;
  weeklyHours: number[];
}

export interface DifficultyAdjustmentConfig {
  // Difficulty level mapping
  levels: {
    beginner: { min: number; max: number };
    intermediate: { min: number; max: number };
    advanced: { min: number; max: number };
    expert: { min: number; max: number };
  };

  // Adjustment step sizes by severity
  stepSizes: {
    mild: number; // e.g., 0.2 theta
    moderate: number; // e.g., 0.5 theta
    severe: number; // e.g., 1.0 theta
  };

  // Minimum/maximum bounds
  absoluteMin: number;
  absoluteMax: number;
}

// ============================================================================
// Flashcard Generation Types
// ============================================================================

export interface FlashcardGenerationRequest {
  userId: string;
  sourceType: 'assessment' | 'quiz' | 'course' | 'manual';
  questionId: string;
  userAbility: number;
  questionDifficulty: number;
  questionText: string;
  correctAnswer: string;
  userAnswer?: string;
  explanation?: string;
  topics?: string[];
  category?: string;
}

export interface GeneratedFlashcard {
  id?: string;
  front: string;
  back: string;
  initialEF: number;
  irtDifficulty: number;
  sourceType: FlashcardGenerationRequest['sourceType'];
  sourceQuestionId: string;
  tags: string[];
  createdAt: Date;
}

export interface FlashcardSource {
  id: string;
  flashcardId: string;
  sourceType: FlashcardGenerationRequest['sourceType'];
  questionId: string;
  initialEF: number;
  irtDifficulty: number;
  createdAt: Date;
}

export interface BatchFlashcardResult {
  generated: number;
  skipped: number;
  errors: number;
  flashcards: GeneratedFlashcard[];
  skipReasons: {
    questionId: string;
    reason: string;
  }[];
}

// ============================================================================
// Enhanced SM-2 Types
// ============================================================================

export interface SM2State {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
}

export interface EnhancedSM2State extends SM2State {
  irtDifficulty: number;
  userAbilityAtCreate: number;
  lastUserAbility?: number;
  calibrationFactor: number;
  retentionEstimate: number;
  reviewHistory: ReviewHistoryEntry[];
}

export interface ReviewHistoryEntry {
  reviewDate: Date;
  quality: number; // 0-5
  responseTime: number; // seconds
  wasRecalled: boolean;
  intervalBefore: number;
  intervalAfter: number;
  efBefore: number;
  efAfter: number;
}

export interface SM2CalibrationParams {
  abilityDifficultyGap: number;
  baseEF: number;
  minEF: number;
  maxEF: number;
  intervalMultiplier: number;
  easyBonus: number;
  hardPenalty: number;
}

export interface EnhancedReviewResult {
  newState: EnhancedSM2State;
  retentionPrediction: number;
  recommendedReviewDate: Date;
  learningStatus: 'new' | 'learning' | 'review' | 'relearning' | 'graduated';
}

// ============================================================================
// Retention Prediction Types
// ============================================================================

export interface RetentionObservation {
  id?: string;
  userId: string;
  topicId?: string;
  flashcardId?: string;
  daysSinceLastReview: number;
  wasRecalled: boolean;
  qualityScore: number; // 0-5
  predictedRetention: number;
  observedAt: Date;
}

export interface ForgettingCurve {
  userId: string;
  topicId?: string;
  decayConstant: number; // k in R = e^(-k*t)
  initialRetention: number;
  halfLife: number; // days
  confidence: number; // 0-1
  dataPoints: number;
  lastUpdated: Date;
}

export interface RetentionPrediction {
  retention: number; // 0-1
  confidence: number; // 0-1
  optimalReviewDate: Date;
  urgency: 'overdue' | 'due_soon' | 'optimal' | 'early';
  daysUntilOptimal: number;
}

export interface PersonalizedSM2Params {
  userId: string;
  efMultiplier: number;
  intervalMultiplier: number;
  hardIntervalModifier: number;
  easyIntervalModifier: number;
  graduationThreshold: number;
  lapseThreshold: number;
  lastCalibrated: Date;
}

// ============================================================================
// Ability Trajectory Types
// ============================================================================

export interface AbilitySnapshot {
  id?: string;
  userId: string;
  categoryId?: string;
  abilityEstimate: number;
  standardError: number;
  confidenceLower: number;
  confidenceUpper: number;
  sourceAssessmentId?: string;
  recordedAt: Date;
}

export interface AbilityTrajectory {
  userId: string;
  categoryId?: string;
  snapshots: AbilitySnapshot[];
  currentAbility: number;
  trend: 'improving' | 'stable' | 'declining';
  velocity: number; // ability change per week
  volatility: number; // standard deviation of changes
  forecast: AbilityForecast;
}

export interface AbilityForecast {
  predictedAbility: number;
  confidenceInterval: [number, number];
  weeksAhead: number;
  reliability: number;
}

// ============================================================================
// Analytics & Insights Types
// ============================================================================

export interface StudySessionAnalytics {
  id?: string;
  userId: string;
  sessionStart: Date;
  durationMinutes: number;
  hourOfDay: number;
  dayOfWeek: number;
  questionsAttempted: number;
  questionsCorrect: number;
  abilityStart: number;
  abilityEnd: number;
  focusScore: number;
  sessionType: 'assessment' | 'quiz' | 'flashcard' | 'course' | 'mixed';
  createdAt: Date;
}

export interface LearningVelocitySnapshot {
  id?: string;
  userId: string;
  categoryId?: string;
  weekStartDate: Date;
  abilityStart: number;
  abilityEnd: number;
  velocity: number;
  hoursStudied: number;
  questionsAnswered: number;
  accuracy: number;
  createdAt: Date;
}

export interface StudyPatternInsight {
  type:
    | 'optimal_time'
    | 'session_length'
    | 'topic_preference'
    | 'learning_pace'
    | 'retention_pattern';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  dataPoints: number;
  metadata: Record<string, unknown>;
}

export interface OptimalStudySchedule {
  userId: string;
  weeklyMinutes: number;
  optimalHours: number[]; // 0-23
  optimalDays: number[]; // 0-6 (Sun-Sat)
  recommendedSessionLength: number; // minutes
  recommendedBreakFrequency: number; // minutes
  topicRotationSuggestion: string[];
  generatedAt: Date;
}

// ============================================================================
// Goal Prediction Types
// ============================================================================

export interface EnhancedGoalPrediction {
  goalId: string;
  userId: string;
  completionProbability: number;
  predictedCompletionDate: Date;
  confidenceInterval: [Date, Date];
  riskFactors: RiskFactor[];
  accelerationFactors: AccelerationFactor[];
  trajectory: 'on_track' | 'at_risk' | 'ahead' | 'behind';
  daysRemaining: number;
  requiredDailyProgress: number;
  currentDailyProgress: number;
}

export interface RiskFactor {
  type: 'consistency' | 'difficulty' | 'time' | 'retention' | 'engagement';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface AccelerationFactor {
  type: 'momentum' | 'mastery' | 'efficiency' | 'dedication';
  strength: 'low' | 'medium' | 'high';
  description: string;
  leverage: string;
}

// ============================================================================
// LLM Rationale Types
// ============================================================================

export interface LLMRationaleRequest {
  userId: string;
  rationaleType: 'study_plan' | 'recommendation' | 'advice' | 'feedback';
  context: RationaleContext;
  maxTokens?: number;
}

export interface RationaleContext {
  learnerProfile?: {
    learningStyle?: string;
    preferredDifficulty?: string;
    goals?: string[];
    strengths?: string[];
    weaknesses?: string[];
  };
  assessmentData?: {
    recentScores?: number[];
    abilityEstimate?: number;
    topicPerformance?: Record<string, number>;
  };
  studyPlanData?: {
    totalWeeks?: number;
    weeklyHours?: number;
    focusTopics?: string[];
    currentProgress?: number;
  };
  additionalContext?: Record<string, unknown>;
}

export interface LLMRationaleResponse {
  rationale: string;
  model: string;
  tokensUsed: number;
  cached: boolean;
  cacheKey?: string;
  expiresAt?: Date;
}

export interface CachedRationale {
  id: string;
  userId: string;
  contextHash: string;
  rationaleType: LLMRationaleRequest['rationaleType'];
  generatedRationale: string;
  modelVersion: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// Service Configuration Types
// ============================================================================

export interface FeedbackLoopConfig {
  // Trigger thresholds
  accuracyDropThreshold: number; // e.g., 60
  abilityChangeThreshold: number; // e.g., 0.5
  masteryGapThreshold: number; // e.g., 1.0

  // Window sizes
  slidingWindowSize: number; // e.g., 5 questions
  velocityWindowWeeks: number; // e.g., 4 weeks

  // Adjustment limits
  maxAdjustmentsPerDay: number;
  cooldownMinutes: number;

  // Feature flags
  enableAutoFlashcards: boolean;
  enableDynamicPlanAdjustment: boolean;
  enableLLMRationale: boolean;
  enableRetentionPrediction: boolean;
}

export const DEFAULT_FEEDBACK_LOOP_CONFIG: FeedbackLoopConfig = {
  accuracyDropThreshold: 60,
  abilityChangeThreshold: 0.5,
  masteryGapThreshold: 1.0,
  slidingWindowSize: 5,
  velocityWindowWeeks: 4,
  maxAdjustmentsPerDay: 3,
  cooldownMinutes: 60,
  enableAutoFlashcards: true,
  enableDynamicPlanAdjustment: true,
  enableLLMRationale: true,
  enableRetentionPrediction: true,
};

export const DEFAULT_DIFFICULTY_CONFIG: DifficultyAdjustmentConfig = {
  levels: {
    beginner: { min: -3, max: -1 },
    intermediate: { min: -1, max: 0.5 },
    advanced: { min: 0.5, max: 1.5 },
    expert: { min: 1.5, max: 3 },
  },
  stepSizes: {
    mild: 0.2,
    moderate: 0.5,
    severe: 1.0,
  },
  absoluteMin: -3,
  absoluteMax: 3,
};

export const DEFAULT_SM2_CALIBRATION: SM2CalibrationParams = {
  abilityDifficultyGap: 0,
  baseEF: 2.5,
  minEF: 1.3,
  maxEF: 3.0,
  intervalMultiplier: 1.0,
  easyBonus: 1.3,
  hardPenalty: 0.8,
};
