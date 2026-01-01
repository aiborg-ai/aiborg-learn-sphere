/**
 * Public Survey Page
 * Allows visitors to take surveys and share their learning preferences
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import {
  SurveyService,
  AUDIENCE_CATEGORIES,
  type Survey,
  type SurveyQuestion,
  type AudienceCategory,
  type AnswerValue,
} from '@/services/surveys';
import {
  Briefcase,
  GraduationCap,
  Rocket,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Send,
} from 'lucide-react';

const CATEGORY_ICONS: Record<AudienceCategory, React.ReactNode> = {
  professional: <Briefcase className="h-8 w-8" />,
  student: <GraduationCap className="h-8 w-8" />,
  entrepreneur: <Rocket className="h-8 w-8" />,
  career_changer: <RefreshCw className="h-8 w-8" />,
};

const CATEGORY_COLORS: Record<AudienceCategory, string> = {
  professional: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  student: 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400',
  entrepreneur: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  career_changer: 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

type Step = 'category' | 'questions' | 'email' | 'complete';

export default function PublicSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t: _t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<AudienceCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [email, setEmail] = useState('');

  // Load survey data
  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) return;

      try {
        setLoading(true);
        const data = await SurveyService.getSurveyWithQuestions(surveyId);
        setSurvey(data.survey);
        setQuestions(data.questions);
      } catch (_error) {
        logger.error('Failed to load survey:', _error);
        toast({
          title: 'Survey Not Found',
          description: 'This survey may have ended or been removed.',
          variant: 'destructive',
        });
        navigate('/surveys');
      } finally {
        setLoading(false);
      }
    };

    loadSurvey();
  }, [surveyId, navigate, toast]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    step === 'category'
      ? 0
      : step === 'questions'
        ? ((currentQuestionIndex + 1) / questions.length) * 80 + 10
        : step === 'email'
          ? 95
          : 100;

  const handleCategorySelect = (category: AudienceCategory) => {
    setSelectedCategory(category);
    setStep('questions');
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChoiceToggle = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  };

  const canProceed = () => {
    if (!currentQuestion) return true;
    if (!currentQuestion.is_required) return true;

    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;

    return true;
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep(survey?.allow_anonymous ? 'email' : 'email');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('category');
    }
  };

  const handleSubmit = async () => {
    if (!survey || !selectedCategory) return;

    try {
      setSubmitting(true);
      await SurveyService.submitResponse({
        survey_id: survey.id,
        respondent_category: selectedCategory,
        respondent_email: email || undefined,
        answers,
      });

      setStep('complete');
      toast({
        title: 'Thank You!',
        description: 'Your response has been submitted successfully.',
      });
    } catch (_error) {
      logger.error('Failed to submit survey:', _error);
      toast({
        title: 'Submission Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Survey not found</p>
            <Button className="mt-4" onClick={() => navigate('/surveys')}>
              View All Surveys
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Help Us Improve
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-muted-foreground max-w-lg mx-auto">{survey.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Category</span>
            <span>Questions</span>
            <span>Submit</span>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Category Selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Which best describes you?</CardTitle>
                  <CardDescription>
                    This helps us understand our audience better and tailor content accordingly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {AUDIENCE_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        'flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:scale-[1.02]',
                        selectedCategory === category.id
                          ? CATEGORY_COLORS[category.id]
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'mb-3',
                          selectedCategory === category.id ? '' : 'text-muted-foreground'
                        )}
                      >
                        {CATEGORY_ICONS[category.id]}
                      </div>
                      <h3 className="font-semibold text-center">{category.name}</h3>
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        {category.description}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Questions */}
          {step === 'questions' && currentQuestion && (
            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </Badge>
                    {currentQuestion.is_required && (
                      <Badge variant="outline" className="text-red-500 border-red-500">
                        Required
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Single Choice */}
                  {currentQuestion.question_type === 'single_choice' && (
                    <RadioGroup
                      value={(answers[currentQuestion.id] as string) || ''}
                      onValueChange={value => handleAnswerChange(currentQuestion.id, value)}
                    >
                      {(currentQuestion.options || []).map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50"
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {currentQuestion.metadata?.max_selections && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Select up to {currentQuestion.metadata.max_selections} options
                        </p>
                      )}
                      {(currentQuestion.options || []).map((option, idx) => {
                        const selected = ((answers[currentQuestion.id] as string[]) || []).includes(
                          option
                        );
                        const maxReached =
                          currentQuestion.metadata?.max_selections &&
                          ((answers[currentQuestion.id] as string[]) || []).length >=
                            currentQuestion.metadata.max_selections;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-center space-x-3 p-3 rounded-lg',
                              selected ? 'bg-primary/10' : 'hover:bg-muted/50',
                              maxReached && !selected && 'opacity-50'
                            )}
                          >
                            <Checkbox
                              id={`option-${idx}`}
                              checked={selected}
                              disabled={maxReached && !selected}
                              onCheckedChange={() =>
                                handleMultipleChoiceToggle(currentQuestion.id, option)
                              }
                            />
                            <Label
                              htmlFor={`option-${idx}`}
                              className={cn(
                                'flex-1 cursor-pointer',
                                maxReached && !selected && 'cursor-not-allowed'
                              )}
                            >
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating */}
                  {currentQuestion.question_type === 'rating' && (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{currentQuestion.metadata?.labels?.[0] || 'Low'}</span>
                        <span>{currentQuestion.metadata?.labels?.[1] || 'High'}</span>
                      </div>
                      <Slider
                        min={currentQuestion.metadata?.min || 1}
                        max={currentQuestion.metadata?.max || 5}
                        step={1}
                        value={[(answers[currentQuestion.id] as number) || 3]}
                        onValueChange={([value]) => handleAnswerChange(currentQuestion.id, value)}
                        className="py-4"
                      />
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="text-lg px-4 py-1">
                          {(answers[currentQuestion.id] as number) || 3}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Text */}
                  {currentQuestion.question_type === 'text' && (
                    <Textarea
                      placeholder={currentQuestion.metadata?.placeholder || 'Type your answer...'}
                      value={(answers[currentQuestion.id] as string) || ''}
                      onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)}
                      rows={4}
                    />
                  )}
                </CardContent>

                {/* Navigation */}
                <div className="flex justify-between p-6 pt-0">
                  <Button variant="outline" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Email (optional) */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Almost done!</CardTitle>
                  <CardDescription>
                    Optionally share your email to receive updates about new courses matching your
                    interests.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium">Your Response Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Category:{' '}
                      <span className="font-medium text-foreground">
                        {AUDIENCE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Questions answered:{' '}
                      <span className="font-medium text-foreground">
                        {Object.keys(answers).length} of {questions.length}
                      </span>
                    </p>
                  </div>
                </CardContent>
                <div className="flex justify-between p-6 pt-0">
                  <Button variant="outline" onClick={() => setStep('questions')}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="text-center">
                <CardContent className="pt-12 pb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Your feedback helps us create better learning experiences for everyone.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Go Home
                    </Button>
                    <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
