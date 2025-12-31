import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import type { AssessmentQuestion, UserAnswer, ProfilingData } from '../types';
import { generateRecommendations } from '../utils/recommendations';
import {
  detectEarlySubmission,
  calculateBonusPoints,
  type EarlySubmissionResult,
} from '@/utils/earlySubmissionDetection';

interface UseAssessmentSubmitProps {
  user: User | null;
  assessmentId: string | null;
  questions: AssessmentQuestion[];
  answers: Record<string, UserAnswer>;
  startTime: Date | null;
  profilingData: ProfilingData | null;
}

interface UseAssessmentSubmitReturn {
  submitAssessment: () => Promise<void>;
  submitting: boolean;
  earlyCompletionResult: EarlySubmissionResult | null;
}

const MILLISECONDS_PER_SECOND = 1000;
const EXPERT_THRESHOLD = 80;
const ADVANCED_THRESHOLD = 60;
const INTERMEDIATE_THRESHOLD = 40;
const STRONG_THRESHOLD = 75;
const PROFICIENT_THRESHOLD = 50;
const DEVELOPING_THRESHOLD = 25;

export const useAssessmentSubmit = ({
  user,
  assessmentId,
  questions,
  answers,
  startTime,
  profilingData,
}: UseAssessmentSubmitProps): UseAssessmentSubmitReturn => {
  const [submitting, setSubmitting] = useState(false);
  const [earlyCompletionResult, setEarlyCompletionResult] = useState<EarlySubmissionResult | null>(
    null
  );
  const { toast } = useToast();

  const calculateCategoryInsights = async (assessmentId: string) => {
    // Group answers by category and calculate insights
    const categoryScores: Record<string, { score: number; maxScore: number; questions: number }> =
      {};

    questions.forEach(question => {
      const answer = answers[question.id];
      if (!categoryScores[question.category_id]) {
        categoryScores[question.category_id] = { score: 0, maxScore: 0, questions: 0 };
      }
      categoryScores[question.category_id].score += answer?.score_earned || 0;
      categoryScores[question.category_id].maxScore += question.points_value;
      categoryScores[question.category_id].questions += 1;
    });

    // Save insights
    for (const [categoryId, data] of Object.entries(categoryScores)) {
      const percentage = (data.score / data.maxScore) * 100;
      let strengthLevel = 'weak';
      if (percentage >= STRONG_THRESHOLD) strengthLevel = 'strong';
      else if (percentage >= PROFICIENT_THRESHOLD) strengthLevel = 'proficient';
      else if (percentage >= DEVELOPING_THRESHOLD) strengthLevel = 'developing';

      try {
        await supabase.from('assessment_insights').insert({
          assessment_id: assessmentId,
          category_id: categoryId,
          category_score: data.score,
          category_max_score: data.maxScore,
          strength_level: strengthLevel,
          recommendations: generateRecommendations(strengthLevel, categoryId, profilingData),
        });
      } catch (_error) {
        logger._error('Error saving insights:', _error);
      }
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);

    try {
      // Calculate total score
      const totalScore = Object.values(answers).reduce(
        (sum, answer) => sum + answer.score_earned,
        0
      );
      const maxPossibleScore = questions.reduce((sum, q) => sum + q.points_value, 0);
      const completionTime = startTime
        ? Math.floor((Date.now() - startTime.getTime()) / MILLISECONDS_PER_SECOND)
        : 0;

      // Determine augmentation level
      const scorePercentage = (totalScore / maxPossibleScore) * 100;
      let augmentationLevel = 'beginner';
      if (scorePercentage >= EXPERT_THRESHOLD) augmentationLevel = 'expert';
      else if (scorePercentage >= ADVANCED_THRESHOLD) augmentationLevel = 'advanced';
      else if (scorePercentage >= INTERMEDIATE_THRESHOLD) augmentationLevel = 'intermediate';

      // Detect early completion
      // Estimate: 2 minutes per question as baseline
      const MINUTES_PER_QUESTION = 2;
      const estimatedTimeMinutes = questions.length * MINUTES_PER_QUESTION;
      const estimatedTimeMs = estimatedTimeMinutes * 60 * MILLISECONDS_PER_SECOND;

      let earlyResult: EarlySubmissionResult | null = null;
      let bonusScore = 0;

      if (startTime && scorePercentage >= 50) {
        // Only award early bonus if score is decent
        // Create a synthetic "due date" based on estimated completion time
        const estimatedDueDate = new Date(startTime.getTime() + estimatedTimeMs);
        const completionDate = new Date();

        earlyResult = detectEarlySubmission(completionDate, {
          dueDate: estimatedDueDate,
          postedDate: startTime,
          customThresholds: {
            veryEarly: 0.5, // Completed in first 50% of estimated time
            early: 0.7, // Completed in first 70% of estimated time
            onTime: 0.9, // Completed within 90% of estimated time
          },
          bonusPoints: {
            enabled: true,
            veryEarly: 5, // 5% bonus for very quick completion
            early: 3, // 3% bonus for quick completion
            onTime: 1, // 1% bonus for efficient completion
          },
        });

        bonusScore = calculateBonusPoints(totalScore, earlyResult);
        setEarlyCompletionResult(earlyResult);
      }

      if (user && assessmentId) {
        // Calculate final score with bonus
        const finalScore = totalScore + bonusScore;

        // Update assessment record
        const { error } = await supabase
          .from('user_ai_assessments')
          .update({
            total_score: finalScore,
            max_possible_score: maxPossibleScore,
            augmentation_level: augmentationLevel,
            completion_time_seconds: completionTime,
            is_complete: true,
            completed_at: new Date().toISOString(),
            // Store early completion metadata
            early_completion_bonus: bonusScore,
            early_completion_category: earlyResult?.category,
            time_efficiency_percentage: earlyResult?.timePercentageUsed,
          })
          .eq('id', assessmentId);

        if (error) throw error;

        // Calculate and save category insights
        await calculateCategoryInsights(assessmentId);
      }

      // Navigate to results page
      if (assessmentId) {
        const bonusMessage =
          bonusScore > 0
            ? ` +${bonusScore} bonus points for ${earlyResult?.category} completion!`
            : '';

        toast({
          title: 'Assessment Complete!',
          description: `Your results have been saved to your profile.${bonusMessage}`,
        });
        // Redirect to results page instead of profile
        setTimeout(() => {
          window.location.href = `/ai-assessment/results/${assessmentId}`;
        }, 2000);
      } else {
        // For non-logged in users, show results in modal or redirect
        const finalScore = totalScore + bonusScore;
        const bonusMessage = bonusScore > 0 ? ` (+${bonusScore} early bonus)` : '';

        toast({
          title: 'Assessment Complete!',
          description: `Your AI Augmentation Score: ${finalScore}/${maxPossibleScore}${bonusMessage} (${augmentationLevel})`,
        });
      }
    } catch (_error) {
      logger._error('Error submitting assessment:', _error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitAssessment,
    submitting,
    earlyCompletionResult,
  };
};
