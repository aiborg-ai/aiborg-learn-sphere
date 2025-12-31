import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { createAdaptiveEngine } from '@/services/AdaptiveAssessmentEngine';
import { ADAPTIVE_CONFIG } from '@/config/adaptiveAssessment';
import { AdaptiveAssessmentEngagementService } from '@/services/analytics/AdaptiveAssessmentEngagementService';
import { AchievementService, PointsService } from '@/services/gamification';
import { showAchievementToast } from '../../gamification/AchievementUnlockToast';
import type { ProfilingData } from './types';

/**
 * Custom hook for assessment business logic
 */
export const useAssessmentLogic = (state: Record<string, unknown>) => {
  const { user } = useAuth();
  const { selectedAudience } = usePersonalization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const initializeAssessment = async () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description:
          'The adaptive assessment requires sign-in to save your progress and results. Please sign in to continue.',
        variant: 'destructive',
      });
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      return;
    }

    try {
      state.setLoading(true);

      // Create assessment record
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .insert({
          user_id: user.id,
          audience_type: state.profilingData?.audience_type || selectedAudience || 'professional',
          profiling_data: state.profilingData || {},
          started_at: new Date().toISOString(),
          is_adaptive: true,
          current_ability_estimate: ADAPTIVE_CONFIG.INITIAL_ABILITY,
          ability_standard_error: ADAPTIVE_CONFIG.INITIAL_STANDARD_ERROR,
        })
        .select()
        .single();

      if (error) throw error;

      state.setAssessmentId(data.id);

      // Track assessment started event
      await AdaptiveAssessmentEngagementService.trackEvent(user.id, 'assessment_started', {
        assessment_id: data.id,
        audience_type: data.audience_type,
        is_adaptive: true,
      });

      // Update daily streak for gamification
      try {
        const streakResult = await PointsService.updateStreak(user.id);
        if (streakResult) {
          state.setCurrentStreak(streakResult.newStreak);
          if (streakResult.streakIncreased && streakResult.newStreak > 1) {
            toast({
              title: '🔥 Streak Active!',
              description: `${streakResult.newStreak} day streak! Points multiplier: ${streakResult.multiplier}x`,
            });
          }
        }
      } catch (_error) {
        logger._error('Error updating streak:', _error);
      }

      // Initialize adaptive engine
      const engine = await createAdaptiveEngine(data.id);
      state.setAdaptiveEngine(engine);

      const engineState = engine.getState();
      state.setCurrentAbility(engineState.currentAbility);
      state.setConfidenceLevel(engineState.confidenceLevel);
      state.setQuestionsAnswered(engineState.questionsAnswered);
    } catch (_error) {
      logger._error('Error initializing adaptive assessment:', _error);
      toast({
        title: 'Error',
        description: 'Failed to initialize assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    if (!state.adaptiveEngine) return;

    try {
      state.setLoading(true);

      // Check if assessment should end
      if (state.adaptiveEngine.shouldEndAssessment()) {
        await submitAssessment();
        return;
      }

      const nextQuestion = await state.adaptiveEngine.getNextQuestion();

      if (!nextQuestion) {
        await submitAssessment();
        return;
      }

      state.setCurrentQuestion(nextQuestion);
      state.setSelectedOptions([]);
      state.setVoiceAnswer(null);
      state.questionStartTime.current = new Date();
    } catch (_error) {
      logger._error('Error fetching next question:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load next question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!state.adaptiveEngine || !state.currentQuestion) return;

    if (state.selectedOptions.length === 0 && !state.voiceAnswer) {
      toast({
        title: 'Please provide an answer',
        description:
          'You must answer the current question before proceeding (select an option or provide a voice answer).',
        variant: 'destructive',
      });
      return;
    }

    try {
      state.setSubmitting(true);

      const timeSpent = state.questionStartTime.current
        ? Math.floor((Date.now() - state.questionStartTime.current.getTime()) / 1000)
        : undefined;

      if (state.voiceAnswer) {
        await supabase
          .from('assessment_responses')
          .update({ voice_answer: state.voiceAnswer })
          .eq('assessment_id', state.assessmentId)
          .eq('question_id', state.currentQuestion.id);
      }

      const result = await state.adaptiveEngine.recordAnswer(
        state.currentQuestion.id,
        state.selectedOptions,
        timeSpent
      );

      state.setLastAnswerCorrect(result.isCorrect);
      state.setQuestionsAnswered((prev: number) => prev + 1);

      const previousAbility = state.currentAbility;
      state.setCurrentAbility(result.newAbility);
      state.setConfidenceLevel(state.adaptiveEngine.getState().confidenceLevel);

      if (result.isCorrect) {
        state.setCorrectAnswers((prev: number) => prev + 1);
        state.setTotalPointsEarned((prev: number) => prev + result.pointsEarned);
      }

      // Set feedback state for LiveStatsPanel
      state.setLastAnswerPointsEarned(result.pointsEarned);
      state.setShowAnswerFeedback(true);

      // Auto-hide feedback after 4 seconds
      setTimeout(() => {
        state.setShowAnswerFeedback(false);
      }, 4000);
      if (timeSpent !== undefined) {
        state.setQuestionTimes((prev: number[]) => [...prev, timeSpent]);
      }

      if (result.newAbility > previousAbility + 0.2) {
        state.setPerformanceTrend('up');
      } else if (result.newAbility < previousAbility - 0.2) {
        state.setPerformanceTrend('down');
      } else {
        state.setPerformanceTrend('stable');
      }

      if (user) {
        await AdaptiveAssessmentEngagementService.trackEvent(user.id, 'question_answered', {
          assessment_id: state.assessmentId,
          question_id: state.currentQuestion.id,
          is_correct: result.isCorrect,
          ability_before: previousAbility,
          ability_after: result.newAbility,
          time_spent: timeSpent,
        });
      }

      if (user && result.isCorrect) {
        try {
          const pointsAwarded = await PointsService.awardPoints(
            user.id,
            result.pointsEarned,
            'assessment_question',
            `Correct answer in ${state.currentQuestion.category_name}`,
            {
              assessment_id: state.assessmentId,
              question_id: state.currentQuestion.id,
              difficulty: state.currentQuestion.difficulty_level,
              ability_score: result.newAbility,
            }
          );

          const unlockedAchievements = await AchievementService.checkAndUnlock(user.id, {
            action: 'assessment_completed',
            metadata: {
              assessment_id: state.assessmentId,
              questions_answered: state.questionsAnswered + 1,
              current_ability: result.newAbility,
              difficulty_level: state.currentQuestion.difficulty_level,
            },
          });

          if (unlockedAchievements && unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
              showAchievementToast(achievement, toast);
            });
          }

          if (pointsAwarded) {
            const _pointsToNextLevel = PointsService.calculatePointsForLevel(
              pointsAwarded.newLevel + 1
            );
            const pointsProgress = ((pointsAwarded.newPoints % 100) / 100) * 100;
            state.setLevelProgress(pointsProgress);
          }

          if (pointsAwarded?.leveledUp) {
            toast({
              title: '🎉 Level Up!',
              description: `You've reached level ${pointsAwarded.newLevel}!`,
              duration: 4000,
            });
          }
        } catch (_error) {
          logger._error('Error awarding points/achievements:', _error);
        }
      }

      // Toast notification disabled - feedback now shown in LiveStatsPanel
      // if (ADAPTIVE_CONFIG.UI.SHOW_PERFORMANCE_TREND) {
      //   toast({
      //     title: result.isCorrect ? 'Correct!' : 'Incorrect',
      //     description: result.isCorrect
      //       ? `Great job! +${result.pointsEarned} points`
      //       : "Don't worry, let's try a different question",
      //     variant: result.isCorrect ? 'default' : 'destructive',
      //   });
      // }

      await fetchNextQuestion();
    } catch (_error) {
      logger._error('Error processing answer:', _error);
      toast({
        title: 'Error',
        description: 'Failed to process your answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!state.adaptiveEngine || !state.assessmentId) return;

    state.setSubmitting(true);

    try {
      const finalScore = await state.adaptiveEngine.calculateFinalScore();
      const engineState = state.adaptiveEngine.getState();

      const { error } = await supabase
        .from('user_ai_assessments')
        .update({
          current_ability_estimate: finalScore.abilityScore,
          augmentation_level: finalScore.augmentationLevel,
          is_complete: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', state.assessmentId);

      if (error) throw error;

      if (user) {
        await AdaptiveAssessmentEngagementService.trackEvent(user.id, 'assessment_completed', {
          assessment_id: state.assessmentId,
          final_ability: finalScore.abilityScore,
          augmentation_level: finalScore.augmentationLevel,
          questions_answered: engineState.questionsAnswered,
          confidence_level: engineState.confidenceLevel,
        });
      }

      if (user) {
        try {
          const completionBonus = Math.floor(
            100 + finalScore.abilityScore * 50 + engineState.confidenceLevel * 2
          );

          const pointsAwarded = await PointsService.awardPoints(
            user.id,
            completionBonus,
            'assessment_completed',
            `Completed assessment with ${finalScore.augmentationLevel} level`,
            {
              assessment_id: state.assessmentId,
              final_ability: finalScore.abilityScore,
              augmentation_level: finalScore.augmentationLevel,
              questions_answered: engineState.questionsAnswered,
              confidence_level: engineState.confidenceLevel,
            }
          );

          const unlockedAchievements = await AchievementService.checkAndUnlock(user.id, {
            action: 'assessment_completed',
            metadata: {
              assessment_id: state.assessmentId,
              final_ability: finalScore.abilityScore,
              augmentation_level: finalScore.augmentationLevel,
              questions_answered: engineState.questionsAnswered,
              confidence_level: engineState.confidenceLevel,
            },
          });

          if (unlockedAchievements && unlockedAchievements.length > 0) {
            unlockedAchievements.forEach((achievement, index) => {
              setTimeout(() => {
                showAchievementToast(achievement, toast);
              }, index * 1000);
            });
          }

          if (pointsAwarded?.leveledUp) {
            setTimeout(
              () => {
                toast({
                  title: '🎉 Level Up!',
                  description: `You've reached level ${pointsAwarded.newLevel}!`,
                  duration: 4000,
                });
              },
              (unlockedAchievements?.length || 0) * 1000
            );
          }

          toast({
            title: 'Assessment Complete!',
            description: `You earned ${completionBonus} bonus points! Your results have been saved.`,
            duration: 5000,
          });
        } catch (_error) {
          logger._error('Error awarding completion rewards:', _error);
          toast({
            title: 'Assessment Complete!',
            description: 'Your results have been saved to your profile.',
          });
        }
      } else {
        toast({
          title: 'Assessment Complete!',
          description: 'Your results have been saved to your profile.',
        });
      }

      setTimeout(() => {
        navigate(`/ai-assessment/results/${state.assessmentId}`);
      }, 2000);
    } catch (_error) {
      logger._error('Error submitting adaptive assessment:', _error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setSubmitting(false);
    }
  };

  const handleProfilingComplete = (data: ProfilingData) => {
    if (data.audience_type === 'business') {
      navigate('/sme-assessment', { state: { profilingData: data } });
      return;
    }
    state.setProfilingData(data);
    state.setShowProfiling(false);
  };

  const handleSkipProfiling = () => {
    state.setProfilingData({ audience_type: selectedAudience || 'professional' });
    state.setShowProfiling(false);
  };

  return {
    initializeAssessment,
    fetchNextQuestion,
    handleNext,
    submitAssessment,
    handleProfilingComplete,
    handleSkipProfiling,
  };
};
