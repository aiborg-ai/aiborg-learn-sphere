import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { ProfilingQuestionnaire } from './ProfilingQuestionnaire';
import { AssessmentHeader } from './wizard/AssessmentHeader';
import { QuestionDisplay } from './wizard/QuestionDisplay';
import { AnswerOptions } from './wizard/AnswerOptions';
import { NavigationButtons } from './wizard/NavigationButtons';
import { EmptyStates } from './wizard/EmptyStates';
import { useAssessmentQuestions } from './wizard/hooks/useAssessmentQuestions';
import { useAssessmentSubmit } from './wizard/hooks/useAssessmentSubmit';
import { useAssessmentNavigation } from './wizard/hooks/useAssessmentNavigation';
import type { ProfilingData } from './wizard/types';

export const AIAssessmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [showProfiling, setShowProfiling] = useState(true);
  const [profilingData, setProfilingData] = useState<ProfilingData | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const { user } = useAuth();
  const { selectedAudience } = usePersonalization();

  // Enforce authentication requirement
  React.useEffect(() => {
    if (!user && !showProfiling) {
      navigate('/auth', {
        state: {
          returnTo: '/ai-assessment',
          message: 'Please sign in to take the assessment and save your results.',
        },
      });
    }
  }, [user, showProfiling, navigate]);

  // Fetch questions based on profiling data
  const { questions, loading } = useAssessmentQuestions({
    profilingData,
    selectedAudience,
    user,
    showProfiling,
    onAssessmentInitialized: id => {
      setAssessmentId(id);
      setStartTime(new Date());
    },
  });

  // Navigation state and handlers
  const {
    currentQuestionIndex,
    answers,
    selectedOptions,
    handleNext,
    handlePrevious,
    handleSingleChoice,
    handleMultipleChoice,
  } = useAssessmentNavigation({
    questions,
    user,
    assessmentId,
    onSubmit: async () => {
      // This will be called by handleNext when on last question
      await submitAssessment();
    },
  });

  // Submit logic
  const { submitAssessment, submitting } = useAssessmentSubmit({
    user,
    assessmentId,
    questions,
    answers,
    startTime,
    profilingData,
  });

  const handleProfilingComplete = (data: ProfilingData) => {
    // If business/SME audience, redirect to company assessment
    if (data.audience_type === 'business') {
      navigate('/sme-assessment', { state: { profilingData: data } });
      return;
    }

    // Otherwise, continue with personal AI assessment
    setProfilingData(data);
    setShowProfiling(false);
  };

  const handleSkipProfiling = () => {
    // Check authentication before proceeding
    if (!user) {
      navigate('/auth', {
        state: {
          returnTo: '/ai-assessment',
          message: 'Please sign in to take the assessment and save your results.',
        },
      });
      return;
    }

    setProfilingData({ audience_type: selectedAudience });
    setShowProfiling(false);
  };

  // Show profiling questionnaire first
  if (showProfiling) {
    return (
      <ProfilingQuestionnaire onComplete={handleProfilingComplete} onSkip={handleSkipProfiling} />
    );
  }

  if (loading) {
    return <EmptyStates type="loading" />;
  }

  if (questions.length === 0) {
    return <EmptyStates type="no-questions" />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-xl">
        <AssessmentHeader
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          currentQuestion={currentQuestion}
          progress={progress}
        />

        <CardContent className="space-y-6">
          <QuestionDisplay
            question_text={currentQuestion.question_text}
            help_text={currentQuestion.help_text}
          />

          <div className="space-y-3">
            <AnswerOptions
              question={currentQuestion}
              selectedOptions={selectedOptions}
              onSingleChoice={handleSingleChoice}
              onMultipleChoice={handleMultipleChoice}
            />
          </div>
        </CardContent>

        <NavigationButtons
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          submitting={submitting}
          canGoPrevious={currentQuestionIndex > 0}
        />
      </Card>
    </div>
  );
};
