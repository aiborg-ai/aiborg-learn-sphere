import { useState, useRef } from 'react';
import type {
  AdaptiveQuestion,
  AdaptiveAssessmentEngine,
} from '@/services/AdaptiveAssessmentEngine';
import { ADAPTIVE_CONFIG } from '@/config/adaptiveAssessment';
import type { ProfilingData } from './types';

/**
 * Custom hook to manage assessment state
 */
export const useAssessmentState = () => {
  const [showProfiling, setShowProfiling] = useState(true);
  const [profilingData, setProfilingData] = useState<ProfilingData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voiceAnswer, setVoiceAnswer] = useState<string | null>(null);
  const [adaptiveEngine, setAdaptiveEngine] = useState<AdaptiveAssessmentEngine | null>(null);

  // Performance tracking
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentAbility, setCurrentAbility] = useState(ADAPTIVE_CONFIG.INITIAL_ABILITY);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [performanceTrend, setPerformanceTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Live stats tracking
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [liveStatsPanelCollapsed, setLiveStatsPanelCollapsed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);

  // Answer feedback tracking
  const [lastAnswerPointsEarned, setLastAnswerPointsEarned] = useState(0);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);

  const questionStartTime = useRef<Date | null>(null);

  return {
    // Profiling state
    showProfiling,
    setShowProfiling,
    profilingData,
    setProfilingData,

    // Question state
    currentQuestion,
    setCurrentQuestion,
    assessmentId,
    setAssessmentId,

    // Loading state
    loading,
    setLoading,
    submitting,
    setSubmitting,

    // Answer state
    selectedOptions,
    setSelectedOptions,
    voiceAnswer,
    setVoiceAnswer,

    // Engine state
    adaptiveEngine,
    setAdaptiveEngine,

    // Performance state
    questionsAnswered,
    setQuestionsAnswered,
    currentAbility,
    setCurrentAbility,
    confidenceLevel,
    setConfidenceLevel,
    performanceTrend,
    setPerformanceTrend,
    lastAnswerCorrect,
    setLastAnswerCorrect,

    // Stats state
    correctAnswers,
    setCorrectAnswers,
    totalPointsEarned,
    setTotalPointsEarned,
    questionTimes,
    setQuestionTimes,
    liveStatsPanelCollapsed,
    setLiveStatsPanelCollapsed,
    currentStreak,
    setCurrentStreak,
    levelProgress,
    setLevelProgress,

    // Feedback state
    lastAnswerPointsEarned,
    setLastAnswerPointsEarned,
    showAnswerFeedback,
    setShowAnswerFeedback,

    // Refs
    questionStartTime,
  };
};
