import React, { useState, useEffect, useRef } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Brain,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from 'lucide-react';
import type { AdaptiveAssessmentEngine } from '@/services/AdaptiveAssessmentEngine';
import { createAdaptiveEngine, type AdaptiveQuestion } from '@/services/AdaptiveAssessmentEngine';
import { ADAPTIVE_CONFIG } from '@/config/adaptiveAssessment';

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
  const [adaptiveEngine, setAdaptiveEngine] = useState<AdaptiveAssessmentEngine | null>(null);

  // Performance tracking
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentAbility, setCurrentAbility] = useState(ADAPTIVE_CONFIG.INITIAL_ABILITY);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [performanceTrend, setPerformanceTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const questionStartTime = useRef<Date | null>(null);

  const { user } = useAuth();
  const { selectedAudience } = usePersonalization();
  const { toast } = useToast();

  // Initialize assessment when profiling is complete
  useEffect(() => {
    if (!showProfiling && profilingData && !assessmentId) {
      initializeAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfiling, profilingData]);

  // Fetch first question when engine is ready
  useEffect(() => {
    if (adaptiveEngine && !currentQuestion) {
      fetchNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptiveEngine]);

  const initializeAssessment = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to take the adaptive assessment',
        variant: 'destructive',
      });
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

  const handleNext = async () => {
    if (!adaptiveEngine || !currentQuestion) return;

    // Validate answer
    if (selectedOptions.length === 0) {
      toast({
        title: 'Please select an answer',
        description: 'You must answer the current question before proceeding.',
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

      // Determine performance trend
      if (result.newAbility > previousAbility + 0.2) {
        setPerformanceTrend('up');
      } else if (result.newAbility < previousAbility - 0.2) {
        setPerformanceTrend('down');
      } else {
        setPerformanceTrend('stable');
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

      // Navigate to profile with assessments tab
      toast({
        title: 'Assessment Complete!',
        description: 'Your results have been saved to your profile.',
      });
      window.location.href = `/profile?tab=assessments`;
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
        // Standard single choice
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentQuestion.question_text}</h3>
              {currentQuestion.help_text && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {currentQuestion.help_text}
                </p>
              )}
            </div>
            <RadioGroup value={selectedOptions[0] || ''} onValueChange={handleSingleChoice}>
              {currentQuestion.options.map(option => (
                <div
                  key={option.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.option_text}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'multiple_choice':
      default:
        // Standard multiple choice
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentQuestion.question_text}</h3>
              {currentQuestion.help_text && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {currentQuestion.help_text}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <div
                  key={option.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={() => handleMultipleChoice(option.id)}
                    className="mt-1"
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.option_text}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    )}
                  </Label>
                </div>
              ))}
            </div>
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
    </div>
  );
};
