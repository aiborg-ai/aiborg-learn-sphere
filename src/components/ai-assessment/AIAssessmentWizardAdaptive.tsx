import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ProfilingQuestionnaire } from './ProfilingQuestionnaire';
import { ScenarioQuestion } from './ScenarioQuestion';
import { DragDropRanking } from './DragDropRanking';
import { CodeEvaluation } from './CodeEvaluation';
import { CaseStudy } from './CaseStudy';
import { AnswerOptions } from './wizard/AnswerOptions';
import { QuestionDisplay } from './wizard/QuestionDisplay';
import { AssessmentProgressIndicator } from './AssessmentProgressIndicator';
import { LiveStatsPanel } from './LiveStatsPanel';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Brain,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from 'lucide-react';
import type { AdaptiveAssessmentEngine } from '@/services/AdaptiveAssessmentEngine';
import { createAdaptiveEngine, type AdaptiveQuestion } from '@/services/AdaptiveAssessmentEngine';
import { ADAPTIVE_CONFIG } from '@/config/adaptiveAssessment';
import { AdaptiveAssessmentEngagementService } from '@/services/analytics/AdaptiveAssessmentEngagementService';
import { AchievementService, PointsService } from '@/services/gamification';
import { showAchievementToast } from '../gamification/AchievementUnlockToast';

interface ProfilingData {
  audience_type: string;
  experience_level?: string;
  industry?: string;
  job_role?: string;
  years_experience?: number;
  company_size?: string;
  education_level?: string;
  grade_level?: string;
  interests?: string[];
  goals?: string[];
  current_tools?: string[];
  challenges?: string[];
}

export const AIAssessmentWizardAdaptive: React.FC = () => {
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

  const questionStartTime = useRef<Date | null>(null);

  const { user } = useAuth();
  const { selectedAudience } = usePersonalization();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize assessment when profiling is complete
  useEffect(() => {
    if (!showProfiling && profilingData && !assessmentId) {
      initializeAssessment();
    }
    // Dependencies intentionally limited - initializeAssessment is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfiling, profilingData]);

  // Fetch first question when engine is ready
  useEffect(() => {
    if (adaptiveEngine && !currentQuestion) {
      fetchNextQuestion();
    }
    // Dependencies intentionally limited - fetchNextQuestion is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptiveEngine]);

  const initializeAssessment = async () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description:
          'The adaptive assessment requires sign-in to save your progress and results. Please sign in to continue.',
        variant: 'destructive',
      });
      // Optionally navigate to auth page after a delay
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      return;
    }

    try {
      setLoading(true);

      // Create assessment record
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .insert({
          user_id: user.id,
          audience_type: profilingData?.audience_type || selectedAudience || 'professional',
          profiling_data: profilingData || {},
          started_at: new Date().toISOString(),
          is_adaptive: true,
          current_ability_estimate: ADAPTIVE_CONFIG.INITIAL_ABILITY,
          ability_standard_error: ADAPTIVE_CONFIG.INITIAL_STANDARD_ERROR,
        })
        .select()
        .single();

      if (error) throw error;

      setAssessmentId(data.id);

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
          setCurrentStreak(streakResult.newStreak);
          if (streakResult.streakIncreased && streakResult.newStreak > 1) {
            toast({
              title: '🔥 Streak Active!',
              description: `${streakResult.newStreak} day streak! Points multiplier: ${streakResult.multiplier}x`,
            });
          }
        }
      } catch (error) {
        logger.error('Error updating streak:', error);
        // Non-critical, continue with assessment
      }

      // Initialize adaptive engine
      const engine = await createAdaptiveEngine(data.id);
      setAdaptiveEngine(engine);

      const state = engine.getState();
      setCurrentAbility(state.currentAbility);
      setConfidenceLevel(state.confidenceLevel);
      setQuestionsAnswered(state.questionsAnswered);
    } catch (error) {
      logger.error('Error initializing adaptive assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    if (!adaptiveEngine) return;

    try {
      setLoading(true);

      // Check if assessment should end
      if (adaptiveEngine.shouldEndAssessment()) {
        await submitAssessment();
        return;
      }

      const nextQuestion = await adaptiveEngine.getNextQuestion();

      if (!nextQuestion) {
        // No more questions available
        await submitAssessment();
        return;
      }

      setCurrentQuestion(nextQuestion);
      setSelectedOptions([]);
      setVoiceAnswer(null);
      questionStartTime.current = new Date();
    } catch (error) {
      logger.error('Error fetching next question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load next question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleChoice = (optionId: string) => {
    setSelectedOptions([optionId]);
  };

  const handleMultipleChoice = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];

    setSelectedOptions(newSelection);
  };

  const handleVoiceAnswer = (text: string) => {
    setVoiceAnswer(text);
  };

  const handleNext = async () => {
    if (!adaptiveEngine || !currentQuestion) return;

    // Validate answer - require either selected options or voice answer
    if (selectedOptions.length === 0 && !voiceAnswer) {
      toast({
        title: 'Please provide an answer',
        description:
          'You must answer the current question before proceeding (select an option or provide a voice answer).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Calculate time spent
      const timeSpent = questionStartTime.current
        ? Math.floor((Date.now() - questionStartTime.current.getTime()) / 1000)
        : undefined;

      // Store voice answer as metadata if provided
      if (voiceAnswer) {
        await supabase
          .from('assessment_responses')
          .update({ voice_answer: voiceAnswer })
          .eq('assessment_id', assessmentId)
          .eq('question_id', currentQuestion.id);
      }

      // Record answer and get result
      const result = await adaptiveEngine.recordAnswer(
        currentQuestion.id,
        selectedOptions,
        timeSpent
      );

      // Update UI state
      setLastAnswerCorrect(result.isCorrect);
      setQuestionsAnswered(prev => prev + 1);

      const previousAbility = currentAbility;
      setCurrentAbility(result.newAbility);
      setConfidenceLevel(adaptiveEngine.getState().confidenceLevel);

      // Update live stats
      if (result.isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        setTotalPointsEarned(prev => prev + result.pointsEarned);
      }
      if (timeSpent !== undefined) {
        setQuestionTimes(prev => [...prev, timeSpent]);
      }

      // Determine performance trend
      if (result.newAbility > previousAbility + 0.2) {
        setPerformanceTrend('up');
      } else if (result.newAbility < previousAbility - 0.2) {
        setPerformanceTrend('down');
      } else {
        setPerformanceTrend('stable');
      }

      // Track question answered event
      if (user) {
        await AdaptiveAssessmentEngagementService.trackEvent(user.id, 'question_answered', {
          assessment_id: assessmentId,
          question_id: currentQuestion.id,
          is_correct: result.isCorrect,
          ability_before: previousAbility,
          ability_after: result.newAbility,
          time_spent: timeSpent,
        });
      }

      // Award points and check achievements for correct answers
      if (user && result.isCorrect) {
        try {
          // Award points for correct answer
          const pointsAwarded = await PointsService.awardPoints(
            user.id,
            result.pointsEarned,
            'assessment_question',
            `Correct answer in ${currentQuestion.category_name}`,
            {
              assessment_id: assessmentId,
              question_id: currentQuestion.id,
              difficulty: currentQuestion.difficulty_level,
              ability_score: result.newAbility,
            }
          );

          // Check and unlock achievements
          const unlockedAchievements = await AchievementService.checkAndUnlock(user.id, {
            action: 'assessment_completed',
            metadata: {
              assessment_id: assessmentId,
              questions_answered: questionsAnswered + 1,
              current_ability: result.newAbility,
              difficulty_level: currentQuestion.difficulty_level,
            },
          });

          // Show achievement notifications
          if (unlockedAchievements && unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
              showAchievementToast(achievement, toast);
            });
          }

          // Update level progress for live stats
          if (pointsAwarded) {
            const pointsToNextLevel = PointsService.calculatePointsForLevel(
              pointsAwarded.newLevel + 1
            );
            const pointsProgress = ((pointsAwarded.newPoints % 100) / 100) * 100;
            setLevelProgress(pointsProgress);
          }

          // Show level-up notification if applicable
          if (pointsAwarded?.leveledUp) {
            toast({
              title: '🎉 Level Up!',
              description: `You've reached level ${pointsAwarded.newLevel}!`,
              duration: 4000,
            });
          }
        } catch (error) {
          logger.error('Error awarding points/achievements:', error);
          // Non-critical, continue with assessment
        }
      }

      // Show feedback toast
      if (ADAPTIVE_CONFIG.UI.SHOW_PERFORMANCE_TREND) {
        toast({
          title: result.isCorrect ? 'Correct!' : 'Incorrect',
          description: result.isCorrect
            ? `Great job! +${result.pointsEarned} points`
            : "Don't worry, let's try a different question",
          variant: result.isCorrect ? 'default' : 'destructive',
        });
      }

      // Fetch next question
      await fetchNextQuestion();
    } catch (error) {
      logger.error('Error processing answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!adaptiveEngine || !assessmentId) return;

    setSubmitting(true);

    try {
      const finalScore = await adaptiveEngine.calculateFinalScore();
      const state = adaptiveEngine.getState();

      // Update assessment record
      const { error } = await supabase
        .from('user_ai_assessments')
        .update({
          current_ability_estimate: finalScore.abilityScore,
          augmentation_level: finalScore.augmentationLevel,
          is_complete: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (error) throw error;

      // Track assessment completed event
      if (user) {
        await AdaptiveAssessmentEngagementService.trackEvent(user.id, 'assessment_completed', {
          assessment_id: assessmentId,
          final_ability: finalScore.abilityScore,
          augmentation_level: finalScore.augmentationLevel,
          questions_answered: state.questionsAnswered,
          confidence_level: state.confidenceLevel,
        });
      }

      // Award completion bonus points and check achievements
      if (user) {
        try {
          // Calculate completion bonus based on performance
          const completionBonus = Math.floor(
            100 + finalScore.abilityScore * 50 + state.confidenceLevel * 2
          );

          // Award completion points
          const pointsAwarded = await PointsService.awardPoints(
            user.id,
            completionBonus,
            'assessment_completed',
            `Completed assessment with ${finalScore.augmentationLevel} level`,
            {
              assessment_id: assessmentId,
              final_ability: finalScore.abilityScore,
              augmentation_level: finalScore.augmentationLevel,
              questions_answered: state.questionsAnswered,
              confidence_level: state.confidenceLevel,
            }
          );

          // Check and unlock completion achievements
          const unlockedAchievements = await AchievementService.checkAndUnlock(user.id, {
            action: 'assessment_completed',
            metadata: {
              assessment_id: assessmentId,
              final_ability: finalScore.abilityScore,
              augmentation_level: finalScore.augmentationLevel,
              questions_answered: state.questionsAnswered,
              confidence_level: state.confidenceLevel,
            },
          });

          // Show achievement notifications
          if (unlockedAchievements && unlockedAchievements.length > 0) {
            unlockedAchievements.forEach((achievement, index) => {
              setTimeout(() => {
                showAchievementToast(achievement, toast);
              }, index * 1000); // Stagger by 1 second
            });
          }

          // Show level-up notification if applicable
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

          // Show completion summary with points
          toast({
            title: 'Assessment Complete!',
            description: `You earned ${completionBonus} bonus points! Your results have been saved.`,
            duration: 5000,
          });
        } catch (error) {
          logger.error('Error awarding completion rewards:', error);
          // Show basic completion toast
          toast({
            title: 'Assessment Complete!',
            description: 'Your results have been saved to your profile.',
          });
        }
      } else {
        // User not logged in - show basic completion toast
        toast({
          title: 'Assessment Complete!',
          description: 'Your results have been saved to your profile.',
        });
      }

      // Navigate to profile with assessments tab after a delay to allow toasts to show
      setTimeout(() => {
        window.location.href = `/profile?tab=assessments`;
      }, 2000);
    } catch (error) {
      logger.error('Error submitting adaptive assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
    setProfilingData({ audience_type: selectedAudience || 'professional' });
    setShowProfiling(false);
  };

  const renderQuestionComponent = () => {
    if (!currentQuestion || !currentQuestion.options || currentQuestion.options.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No options available for this question. Please contact support.
            <div className="mt-2 text-xs font-mono">Question ID: {currentQuestion?.id}</div>
          </AlertDescription>
        </Alert>
      );
    }

    switch (currentQuestion.question_type) {
      case 'scenario_multimedia':
        return (
          <ScenarioQuestion
            question={currentQuestion}
            selectedOptions={selectedOptions}
            onSelectionChange={setSelectedOptions}
            showHints={false}
          />
        );

      case 'drag_drop_ranking':
      case 'drag_drop_ordering':
        return (
          <DragDropRanking
            question={currentQuestion}
            selectedOrdering={selectedOptions}
            onOrderingChange={setSelectedOptions}
          />
        );

      case 'code_evaluation':
        return (
          <CodeEvaluation
            question={currentQuestion}
            selectedOptions={selectedOptions}
            onSelectionChange={setSelectedOptions}
          />
        );

      case 'case_study':
        return (
          <CaseStudy
            question={currentQuestion}
            selectedOptions={selectedOptions}
            onSelectionChange={setSelectedOptions}
          />
        );

      case 'single_choice':
      case 'frequency':
      case 'scale':
        // Standard single choice with voice input support
        return (
          <div className="space-y-4">
            <QuestionDisplay
              question_text={currentQuestion.question_text}
              help_text={currentQuestion.help_text}
            />
            <AnswerOptions
              question={currentQuestion}
              selectedOptions={selectedOptions}
              onSingleChoice={(optionId, points) => handleSingleChoice(optionId)}
              onMultipleChoice={() => {}}
              onVoiceAnswer={handleVoiceAnswer}
              enableVoiceInput={true}
            />
          </div>
        );

      case 'multiple_choice':
      default:
        // Standard multiple choice with voice input support
        return (
          <div className="space-y-4">
            <QuestionDisplay
              question_text={currentQuestion.question_text}
              help_text={currentQuestion.help_text}
            />
            <AnswerOptions
              question={currentQuestion}
              selectedOptions={selectedOptions}
              onSingleChoice={() => {}}
              onMultipleChoice={(optionId, points) => handleMultipleChoice(optionId)}
              onVoiceAnswer={handleVoiceAnswer}
              enableVoiceInput={true}
            />
          </div>
        );
    }
  };

  // Show profiling questionnaire first
  if (showProfiling) {
    return (
      <ProfilingQuestionnaire onComplete={handleProfilingComplete} onSkip={handleSkipProfiling} />
    );
  }

  if (loading || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const estimatedRemaining = adaptiveEngine?.getEstimatedQuestionsRemaining() || 0;
  const difficultyColor =
    currentQuestion.difficulty_level === 'foundational'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : currentQuestion.difficulty_level === 'applied'
        ? 'bg-green-50 text-green-700 border-green-200'
        : currentQuestion.difficulty_level === 'advanced'
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Enhanced Progress Indicator */}
      <AssessmentProgressIndicator
        questionsAnswered={questionsAnswered}
        currentAbility={currentAbility}
        confidenceLevel={confidenceLevel}
        performanceTrend={performanceTrend}
        lastAnswerCorrect={lastAnswerCorrect}
        estimatedQuestionsRemaining={estimatedRemaining}
        currentDifficulty={currentQuestion.difficulty_level}
      />

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">AIBORG Assessment</CardTitle>
                <CardDescription>Adaptive difficulty • Personalized questions</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Q{questionsAnswered + 1}
                {estimatedRemaining > 0 && ` • ~${estimatedRemaining} more`}
              </Badge>
              {ADAPTIVE_CONFIG.UI.SHOW_PERFORMANCE_TREND && lastAnswerCorrect !== null && (
                <div className="flex items-center gap-1 text-sm">
                  {lastAnswerCorrect ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {performanceTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {performanceTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {performanceTrend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                </div>
              )}
            </div>
          </div>

          {ADAPTIVE_CONFIG.UI.ENABLE_PROGRESS_VIZ && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{confidenceLevel}% confidence</span>
              </div>
              <Progress value={confidenceLevel} className="h-2" />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">{currentQuestion.category_name}</Badge>
            {ADAPTIVE_CONFIG.UI.SHOW_DIFFICULTY_LEVEL && (
              <Badge variant="outline" className={difficultyColor}>
                {currentQuestion.difficulty_level.charAt(0).toUpperCase() +
                  currentQuestion.difficulty_level.slice(1)}
              </Badge>
            )}
            {currentQuestion.irt_difficulty !== undefined && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                IRT: {currentQuestion.irt_difficulty.toFixed(1)}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Render appropriate question component based on type */}
          {renderQuestionComponent()}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={handleNext} disabled={submitting || selectedOptions.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {estimatedRemaining === 0 ? 'Complete Assessment' : 'Next Question'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {!user && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to use the adaptive assessment feature.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Stats Panel */}
      <LiveStatsPanel
        questionsAnswered={questionsAnswered}
        correctAnswers={correctAnswers}
        totalPoints={totalPointsEarned}
        averageTimePerQuestion={
          questionTimes.length > 0
            ? Math.floor(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length)
            : 0
        }
        currentStreak={currentStreak}
        levelProgress={levelProgress}
        nearbyAchievements={[]}
        leaderboardChange={0}
        isCollapsed={liveStatsPanelCollapsed}
        onToggle={() => setLiveStatsPanelCollapsed(!liveStatsPanelCollapsed)}
      />
    </div>
  );
};
