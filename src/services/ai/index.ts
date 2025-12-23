/**
 * AI Services
 * Export all AI-related services
 */

export { OllamaService, type ChatMessage, type ChatOptions } from './OllamaService';

export {
  FreeResponseGradingService,
  type GradingResult,
  type RubricScore,
  type RubricCriterion,
  type GradingOptions,
} from './FreeResponseGradingService';

export {
  WrongAnswerExplanationService,
  type QuestionType,
  type LearningStyle,
  type ExplanationResponse,
  type ExplanationRequest,
} from './WrongAnswerExplanationService';

export { EmbeddingService } from './EmbeddingService';
export { RecommendationEngineService } from './RecommendationEngineService';
export { StudyAssistantOrchestrator } from './StudyAssistantOrchestrator';
