/**
 * Topic Input Step - Step 1 of Lesson Generation Wizard
 * Collects user input for lesson topic, audience, difficulty, and options
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  topicInputSchema,
  type TopicInputFormData,
  AUDIENCE_OPTIONS,
  DIFFICULTY_OPTIONS,
  DURATION_OPTIONS,
} from '@/schemas/lessonOnDemand';

interface TopicInputStepProps {
  onNext: (data: TopicInputFormData) => void;
  initialData?: Partial<TopicInputFormData>;
}

export function TopicInputStep({ onNext, initialData }: TopicInputStepProps) {
  const form = useForm<TopicInputFormData>({
    resolver: zodResolver(topicInputSchema),
    defaultValues: {
      topic: initialData?.topic || '',
      audience: initialData?.audience || 'professional',
      difficulty: initialData?.difficulty || 'intermediate',
      duration_minutes: initialData?.duration_minutes || 45,
      curriculum_type: initialData?.curriculum_type || '',
      grade_level: initialData?.grade_level || '',
      include_exercises: initialData?.include_exercises ?? true,
      include_quiz: initialData?.include_quiz ?? true,
      num_quiz_questions: initialData?.num_quiz_questions || 5,
    },
  });

  const watchIncludeQuiz = form.watch('include_quiz');
  const watchCurriculumType = form.watch('curriculum_type');

  const handleSubmit = (data: TopicInputFormData) => {
    onNext(data);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <CardTitle className="text-2xl">Generate Your Custom Lesson</CardTitle>
        <CardDescription className="text-base">
          AI-powered lesson generation using Ollama llama3.3:70b. Create a complete lesson with
          objectives, content, exercises, and quizzes in minutes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-base font-semibold">
              Lesson Topic *
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., Introduction to Machine Learning for Healthcare Professionals"
              className="min-h-[100px] resize-none"
              {...form.register('topic')}
            />
            {form.formState.errors.topic && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.topic.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Describe what you want to teach. Be specific about the topic and focus area.
            </p>
          </div>

          {/* Audience and Difficulty Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-base font-semibold">
                Target Audience *
              </Label>
              <Select
                value={form.watch('audience')}
                onValueChange={value =>
                  form.setValue('audience', value as TopicInputFormData['audience'])
                }
              >
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.audience && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.audience.message}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-base font-semibold">
                Difficulty Level *
              </Label>
              <Select
                value={form.watch('difficulty')}
                onValueChange={value =>
                  form.setValue('difficulty', value as TopicInputFormData['difficulty'])
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.difficulty && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.difficulty.message}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-semibold">
              Lesson Duration *
            </Label>
            <Select
              value={form.watch('duration_minutes')?.toString()}
              onValueChange={value => form.setValue('duration_minutes', parseInt(value))}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.duration_minutes && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.duration_minutes.message}
              </p>
            )}
          </div>

          {/* Curriculum Alignment (Optional) */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Curriculum Alignment (Optional)</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="curriculum_type" className="text-sm">
                  Curriculum Type
                </Label>
                <Input
                  id="curriculum_type"
                  placeholder="e.g., Common Core, AP, IB"
                  {...form.register('curriculum_type')}
                />
              </div>

              {watchCurriculumType && (
                <div className="space-y-2">
                  <Label htmlFor="grade_level" className="text-sm">
                    Grade Level
                  </Label>
                  <Input
                    id="grade_level"
                    placeholder="e.g., Grade 10, Year 7"
                    {...form.register('grade_level')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Options */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-muted">
            <Label className="text-sm font-semibold">Lesson Content Options</Label>

            <div className="space-y-3">
              {/* Include Exercises */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="include_exercises" className="text-sm font-medium cursor-pointer">
                    Include Practice Exercises
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add hands-on activities to reinforce learning
                  </p>
                </div>
                <Switch
                  id="include_exercises"
                  checked={form.watch('include_exercises')}
                  onCheckedChange={checked => form.setValue('include_exercises', checked)}
                />
              </div>

              {/* Include Quiz */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="include_quiz" className="text-sm font-medium cursor-pointer">
                    Include Knowledge Quiz
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add assessment questions to test understanding
                  </p>
                </div>
                <Switch
                  id="include_quiz"
                  checked={form.watch('include_quiz')}
                  onCheckedChange={checked => form.setValue('include_quiz', checked)}
                />
              </div>

              {/* Number of Quiz Questions */}
              {watchIncludeQuiz && (
                <div className="ml-6 space-y-2 pt-2">
                  <Label htmlFor="num_quiz_questions" className="text-sm">
                    Number of Quiz Questions
                  </Label>
                  <Input
                    id="num_quiz_questions"
                    type="number"
                    min="3"
                    max="10"
                    className="w-32"
                    {...form.register('num_quiz_questions', { valueAsNumber: true })}
                  />
                  {form.formState.errors.num_quiz_questions && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.num_quiz_questions.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Generate Lesson
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
