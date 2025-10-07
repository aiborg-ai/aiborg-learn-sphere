// Components
export { AssessmentHeader } from './AssessmentHeader';
export { QuestionDisplay } from './QuestionDisplay';
export { AnswerOptions } from './AnswerOptions';
export { NavigationButtons } from './NavigationButtons';
export { EmptyStates } from './EmptyStates';

// Hooks
export { useAssessmentQuestions } from './hooks/useAssessmentQuestions';
export { useAssessmentSubmit } from './hooks/useAssessmentSubmit';
export { useAssessmentNavigation } from './hooks/useAssessmentNavigation';

// Types
export type {
  AssessmentQuestion,
  RecommendedQuestion,
  AssessmentOption,
  UserAnswer,
  ProfilingData,
} from './types';

// Utils
export { generateRecommendations } from './utils/recommendations';
