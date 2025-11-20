import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { ProfilingQuestionnaire } from './ProfilingQuestionnaire';
import { AssessmentProgressIndicator } from './AssessmentProgressIndicator';
import { LiveStatsPanel } from './LiveStatsPanel';
import {
  AdaptiveAssessmentHeader,
  AssessmentFooter,
  QuestionRenderer,
  AssessmentLoadingState,
  useAssessmentState,
  useAssessmentLogic,
} from './wizard';

export const AIAssessmentWizardAdaptive: React.FC = () => {
  const { user } = useAuth();
  const state = useAssessmentState();
  const logic = useAssessmentLogic(state);

  // Initialize assessment when profiling is complete
  useEffect(() => {
    if (!state.showProfiling && state.profilingData && !state.assessmentId) {
      logic.initializeAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.showProfiling, state.profilingData]);

  // Fetch first question when engine is ready
  useEffect(() => {
    if (state.adaptiveEngine && !state.currentQuestion) {
      logic.fetchNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.adaptiveEngine]);

  const handleSingleChoice = (optionId: string) => {
    state.setSelectedOptions([optionId]);
  };

  const handleMultipleChoice = (optionId: string) => {
    const newSelection = state.selectedOptions.includes(optionId)
      ? state.selectedOptions.filter(id => id !== optionId)
      : [...state.selectedOptions, optionId];
    state.setSelectedOptions(newSelection);
  };

  const handleVoiceAnswer = (text: string) => {
    state.setVoiceAnswer(text);
  };

  // Show profiling questionnaire first
  if (state.showProfiling) {
    return (
      <ProfilingQuestionnaire
        onComplete={logic.handleProfilingComplete}
        onSkip={logic.handleSkipProfiling}
      />
    );
  }

  if (state.loading || !state.currentQuestion) {
    return <AssessmentLoadingState />;
  }

  const estimatedRemaining = state.adaptiveEngine?.getEstimatedQuestionsRemaining() || 0;
  const hasAnswer = state.selectedOptions.length > 0 || state.voiceAnswer !== null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AssessmentProgressIndicator
        questionsAnswered={state.questionsAnswered}
        currentAbility={state.currentAbility}
        confidenceLevel={state.confidenceLevel}
        performanceTrend={state.performanceTrend}
        lastAnswerCorrect={state.lastAnswerCorrect}
        estimatedQuestionsRemaining={estimatedRemaining}
        currentDifficulty={state.currentQuestion.difficulty_level}
      />

      <Card className="shadow-xl">
        <AdaptiveAssessmentHeader
          questionsAnswered={state.questionsAnswered}
          estimatedRemaining={estimatedRemaining}
          confidenceLevel={state.confidenceLevel}
          lastAnswerCorrect={state.lastAnswerCorrect}
          performanceTrend={state.performanceTrend}
          currentQuestion={state.currentQuestion}
        />

        <CardContent className="space-y-6">
          <QuestionRenderer
            currentQuestion={state.currentQuestion}
            selectedOptions={state.selectedOptions}
            onSingleChoice={handleSingleChoice}
            onMultipleChoice={handleMultipleChoice}
            onVoiceAnswer={handleVoiceAnswer}
            onSelectionChange={state.setSelectedOptions}
          />
        </CardContent>

        <AssessmentFooter
          submitting={state.submitting}
          hasAnswer={hasAnswer}
          estimatedRemaining={estimatedRemaining}
          onNext={logic.handleNext}
        />
      </Card>

      {!user && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to use the adaptive assessment feature.
          </AlertDescription>
        </Alert>
      )}

      <LiveStatsPanel
        questionsAnswered={state.questionsAnswered}
        correctAnswers={state.correctAnswers}
        totalPoints={state.totalPointsEarned}
        averageTimePerQuestion={
          state.questionTimes.length > 0
            ? Math.floor(
                state.questionTimes.reduce((a, b) => a + b, 0) / state.questionTimes.length
              )
            : 0
        }
        currentStreak={state.currentStreak}
        levelProgress={state.levelProgress}
        nearbyAchievements={[]}
        leaderboardChange={0}
        isCollapsed={state.liveStatsPanelCollapsed}
        onToggle={() => state.setLiveStatsPanelCollapsed(!state.liveStatsPanelCollapsed)}
        lastAnswerCorrect={state.lastAnswerCorrect}
        lastAnswerPointsEarned={state.lastAnswerPointsEarned}
        showLastAnswerFeedback={state.showAnswerFeedback}
      />
    </div>
  );
};
