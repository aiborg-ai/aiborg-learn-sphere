import React, { useState, useEffect } from 'react';
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
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Brain,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'scale' | 'frequency';
  help_text?: string;
  order_index: number;
  points_value: number;
  difficulty_level?: 'foundational' | 'applied' | 'advanced' | 'strategic';
  recommended_experience_level?: 'none' | 'basic' | 'intermediate' | 'advanced';
  options?: AssessmentOption[];
  category?: {
    name: string;
    icon: string;
  };
}

interface RecommendedQuestion {
  question_id: string;
  question_text: string;
  category_name: string;
  difficulty_level: string;
  relevance_score: number;
}

interface AssessmentOption {
  id: string;
  option_text: string;
  option_value: string;
  points: number;
  description?: string;
  tool_recommendations?: string[];
}

interface UserAnswer {
  question_id: string;
  selected_options: string[];
  score_earned: number;
}

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

export const AIAssessmentWizard: React.FC = () => {
  const [showProfiling, setShowProfiling] = useState(true);
  const [profilingData, setProfilingData] = useState<ProfilingData | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasFetchedQuestions, setHasFetchedQuestions] = useState(false);

  const { user } = useAuth();
  const { selectedAudience } = usePersonalization();
  const { toast } = useToast();

  // Fetch questions based on audience - only when profiling is complete
  useEffect(() => {
    if (!showProfiling && profilingData && !hasFetchedQuestions) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfiling, profilingData, selectedAudience]);

  // Helper function to determine question limit based on audience and experience
  const getQuestionLimit = () => {
    const QUESTION_LIMIT = 10;
    // Fixed limit of 10 questions for all users
    return QUESTION_LIMIT;
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      // Use the recommendation function to get personalized questions
      const { data: recommendedQuestions, error: recommendationError } = await supabase.rpc(
        'get_recommended_questions',
        {
          p_audience_type: profilingData?.audience_type || selectedAudience || 'professional',
          p_experience_level: profilingData?.experience_level || 'basic',
          p_goals: profilingData?.goals || [],
          p_limit: getQuestionLimit(),
        }
      );

      if (recommendationError) {
        logger.error('Recommendation function error:', recommendationError);
        throw recommendationError;
      }

      if (!recommendedQuestions || recommendedQuestions.length === 0) {
        logger.warn('No recommended questions returned, falling back to all questions');
        // Fallback to fetching all questions if recommendation fails
        await fetchQuestionsBasic();
        return;
      }

      // Extract question IDs from recommendations
      const questionIds = recommendedQuestions.map((q: RecommendedQuestion) => q.question_id);

      // Fetch full question details with options
      const { data: questionsData, error: detailsError } = await supabase
        .from('assessment_questions')
        .select(
          `
          *,
          assessment_question_options (
            id,
            option_text,
            option_value,
            points,
            description,
            tool_recommendations,
            is_correct,
            order_index
          ),
          assessment_categories (
            name,
            icon
          )
        `
        )
        .in('id', questionIds)
        .eq('is_active', true);

      if (detailsError) throw detailsError;

      // Map and sort questions by the recommendation order
      const mappedQuestions: AssessmentQuestion[] = (questionsData || [])
        .map(q => ({
          id: q.id,
          category_id: q.category_id,
          question_text: q.question_text,
          question_type: q.question_type,
          help_text: q.help_text,
          order_index: q.order_index,
          points_value: q.points_value,
          difficulty_level: q.difficulty_level,
          recommended_experience_level: q.recommended_experience_level,
          options: q.assessment_question_options?.sort((a, b) => a.order_index - b.order_index),
          category: q.assessment_categories,
        }))
        .sort((a, b) => {
          // Sort by relevance score from recommendations
          const aIndex = questionIds.indexOf(a.id);
          const bIndex = questionIds.indexOf(b.id);
          return aIndex - bIndex;
        });

      // Deduplicate questions by ID (in case of database duplicates)
      const uniqueQuestions = Array.from(new Map(mappedQuestions.map(q => [q.id, q])).values());

      setQuestions(uniqueQuestions);
      setHasFetchedQuestions(true);

      // Initialize assessment if user is logged in
      if (user) {
        await initializeAssessment();
      }
    } catch (error) {
      logger.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback function for basic question fetching
  const fetchQuestionsBasic = async () => {
    const { data: questionsData, error: questionsError } = await supabase
      .from('assessment_questions')
      .select(
        `
        *,
        assessment_question_options (
          id,
          option_text,
          option_value,
          points,
          description,
          tool_recommendations,
          is_correct,
          order_index
        ),
        assessment_categories (
          name,
          icon
        )
      `
      )
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    const FALLBACK_LIMIT = 20;
    const mappedQuestions: AssessmentQuestion[] = (questionsData || []).map(q => ({
      id: q.id,
      category_id: q.category_id,
      question_text: q.question_text,
      question_type: q.question_type,
      help_text: q.help_text,
      order_index: q.order_index,
      points_value: q.points_value,
      difficulty_level: q.difficulty_level,
      recommended_experience_level: q.recommended_experience_level,
      options: q.assessment_question_options?.sort((a, b) => a.order_index - b.order_index),
      category: q.assessment_categories,
    }));

    setQuestions(mappedQuestions.slice(0, FALLBACK_LIMIT));

    if (user) {
      await initializeAssessment();
    }
  };

  const initializeAssessment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .insert({
          user_id: user.id,
          audience_type: selectedAudience === 'All' ? null : selectedAudience,
          profiling_data: profilingData || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setAssessmentId(data.id);
      setStartTime(new Date());
    } catch (error) {
      logger.error('Error initializing assessment:', error);
    }
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
    const totalPoints = newSelection.reduce((sum, id) => {
      const option = currentQuestion?.options?.find(o => o.id === id);
      return sum + (option?.points || 0);
    }, 0);

    updateAnswer(newSelection, totalPoints);
  };

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
      } catch (error) {
        logger.error('Error saving answer:', error);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      await submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = answers[questions[currentQuestionIndex - 1].id];
      setSelectedOptions(prevAnswer?.selected_options || []);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);

    try {
      // Calculate total score
      const MILLISECONDS_PER_SECOND = 1000;
      const EXPERT_THRESHOLD = 80;
      const ADVANCED_THRESHOLD = 60;
      const INTERMEDIATE_THRESHOLD = 40;

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

      if (user && assessmentId) {
        // Update assessment record
        const { error } = await supabase
          .from('user_ai_assessments')
          .update({
            total_score: totalScore,
            max_possible_score: maxPossibleScore,
            augmentation_level: augmentationLevel,
            completion_time_seconds: completionTime,
            is_complete: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', assessmentId);

        if (error) throw error;

        // Calculate and save category insights
        await calculateCategoryInsights(assessmentId);
      }

      // Navigate to results page
      if (assessmentId) {
        window.location.href = `/ai-assessment/results/${assessmentId}`;
      } else {
        // For non-logged in users, show results in modal or redirect
        toast({
          title: 'Assessment Complete!',
          description: `Your AI Augmentation Score: ${totalScore}/${maxPossibleScore} (${augmentationLevel})`,
        });
      }
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
    const STRONG_THRESHOLD = 75;
    const PROFICIENT_THRESHOLD = 50;
    const DEVELOPING_THRESHOLD = 25;

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
          recommendations: generateRecommendations(strengthLevel, categoryId),
        });
      } catch (error) {
        logger.error('Error saving insights:', error);
      }
    }
  };

  const generateRecommendations = (level: string, _categoryId: string): string[] => {
    // Generate personalized recommendations based on performance and profiling data
    const recommendations: string[] = [];
    const audienceType = profilingData?.audience_type;

    if (level === 'weak' || level === 'developing') {
      if (audienceType === 'primary') {
        recommendations.push('Try fun, kid-friendly AI tools in this category');
        recommendations.push('Ask a parent or teacher to help you explore these tools');
        recommendations.push('Start with simple projects to build your skills');
      } else if (audienceType === 'secondary') {
        recommendations.push('Look for student-friendly AI tools and tutorials');
        recommendations.push('Join online communities to learn from peers');
        recommendations.push('Consider free courses to build foundational knowledge');
      } else if (audienceType === 'business') {
        recommendations.push('Identify quick wins where AI can save time in your business');
        recommendations.push('Start with user-friendly, no-code AI solutions');
        recommendations.push('Consider hiring a consultant for implementation guidance');
      } else {
        recommendations.push('Consider exploring beginner-friendly AI tools in this category');
        recommendations.push('Start with one tool and master it before adding more');
        recommendations.push('Look for free tutorials and guides to get started');
      }
    } else if (level === 'proficient') {
      if (audienceType === 'business') {
        recommendations.push('Scale your AI usage across more business processes');
        recommendations.push("Train your team on the tools you've mastered");
        recommendations.push('Explore integration opportunities to maximize ROI');
      } else if (audienceType === 'professional' && profilingData?.industry) {
        recommendations.push(`Look for industry-specific AI tools in ${profilingData.industry}`);
        recommendations.push('Explore integrations between different tools');
        recommendations.push('Consider advanced features to boost productivity');
      } else {
        recommendations.push('You have a good foundation - try more advanced features');
        recommendations.push('Explore integrations between different tools');
        recommendations.push('Consider paid versions for enhanced capabilities');
      }
    } else {
      recommendations.push('You are highly augmented in this area!');
      if (audienceType === 'professional' || audienceType === 'business') {
        recommendations.push('Share your expertise through blog posts or workshops');
        recommendations.push('Mentor others in your organization');
      } else {
        recommendations.push('Share your expertise with others');
      }
      recommendations.push('Explore cutting-edge tools and beta features');
    }

    return recommendations;
  };

  const handleProfilingComplete = (data: ProfilingData) => {
    setProfilingData(data);
    setShowProfiling(false);
  };

  const handleSkipProfiling = () => {
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No assessment questions available. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
                <CardDescription>
                  Discover your AI adoption level and get personalized recommendations
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentQuestionIndex + 1} / {questions.length}
            </Badge>
          </div>

          <Progress value={progress} className="h-2" />

          {currentQuestion.category && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">{currentQuestion.category.name}</Badge>
              {currentQuestion.difficulty_level && (
                <Badge
                  variant="outline"
                  className={
                    currentQuestion.difficulty_level === 'foundational'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : currentQuestion.difficulty_level === 'applied'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : currentQuestion.difficulty_level === 'advanced'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : currentQuestion.difficulty_level === 'strategic'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ''
                  }
                >
                  {currentQuestion.difficulty_level.charAt(0).toUpperCase() +
                    currentQuestion.difficulty_level.slice(1)}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
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
            {!currentQuestion.options || currentQuestion.options.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No options available for this question. Please contact support.
                  <div className="mt-2 text-xs font-mono">Question ID: {currentQuestion.id}</div>
                </AlertDescription>
              </Alert>
            ) : currentQuestion.question_type === 'single_choice' ||
              currentQuestion.question_type === 'frequency' ||
              currentQuestion.question_type === 'scale' ? (
              <RadioGroup
                value={selectedOptions[0] || ''}
                onValueChange={value => {
                  const option = currentQuestion.options?.find(o => o.id === value);
                  if (option) {
                    handleSingleChoice(value, option.points);
                  }
                }}
              >
                {currentQuestion.options?.map(option => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.option_text}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options?.map(option => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          handleMultipleChoice(option.id, option.points);
                        } else {
                          handleMultipleChoice(option.id, option.points);
                        }
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.option_text}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      )}
                      {option.tool_recommendations && option.tool_recommendations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.tool_recommendations.map(tool => (
                            <Badge key={tool} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              <>
                Complete Assessment
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
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
            Sign in to save your assessment results and track your progress over time.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
