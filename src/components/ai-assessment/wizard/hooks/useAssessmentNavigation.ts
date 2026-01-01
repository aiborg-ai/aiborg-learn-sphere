import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import type { AssessmentQuestion, UserAnswer } from '../types';

interface UseAssessmentNavigationProps {
  questions: AssessmentQuestion[];
  user: User | null;
  assessmentId: string | null;
  onSubmit: () => Promise<void>;
}

interface UseAssessmentNavigationReturn {
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  selectedOptions: string[];
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  handleSingleChoice: (optionId: string, points: number) => void;
  handleMultipleChoice: (optionId: string, points: number) => void;
}

export const useAssessmentNavigation = ({
  questions,
  user,
  assessmentId,
  onSubmit,
}: UseAssessmentNavigationProps): UseAssessmentNavigationReturn => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { toast } = useToast();

  const updateAnswer = (optionIds: string[], score: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_options: optionIds,
        score_earned: score,
      },
    }));
  };

  const handleSingleChoice = (optionId: string, points: number) => {
    setSelectedOptions([optionId]);
    updateAnswer([optionId], points);
  };

  const handleMultipleChoice = (optionId: string, _points: number) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];

    setSelectedOptions(newSelection);

    // Calculate total points for multiple selections
    const currentQuestion = questions[currentQuestionIndex];
    const totalPoints = newSelection.reduce((sum, id) => {
      const option = currentQuestion?.options?.find(o => o.id === id);
      return sum + (option?.points || 0);
    }, 0);

    updateAnswer(newSelection, totalPoints);
  };

  const handleNext = async () => {
    const currentAnswer = answers[questions[currentQuestionIndex].id];

    // Validate answer
    if (!currentAnswer || currentAnswer.selected_options.length === 0) {
      toast({
        title: 'Please select an answer',
        description: 'You must answer the current question before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    // Save answer to database if logged in
    if (user && assessmentId) {
      try {
        await supabase.from('user_assessment_answers').insert({
          assessment_id: assessmentId,
          question_id: currentAnswer.question_id,
          selected_options: currentAnswer.selected_options,
          score_earned: currentAnswer.score_earned,
        });
      } catch (_error) {
        logger.error('Error saving answer:', _error);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      await onSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = answers[questions[currentQuestionIndex - 1].id];
      setSelectedOptions(prevAnswer?.selected_options || []);
    }
  };

  return {
    currentQuestionIndex,
    answers,
    selectedOptions,
    handleNext,
    handlePrevious,
    handleSingleChoice,
    handleMultipleChoice,
  };
};
