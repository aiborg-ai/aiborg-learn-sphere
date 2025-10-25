/**
 * QuestionForm Component
 * Form for creating and editing assessment questions
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useAssessmentCategories, type CreateQuestionInput } from '@/hooks/useAssessmentQuestions';

const questionSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  question_text: z.string().min(5, 'Question must be at least 5 characters'),
  question_type: z.enum(['single_choice', 'multiple_choice', 'scale', 'frequency']),
  difficulty_level: z.enum([
    'foundational',
    'beginner',
    'applied',
    'intermediate',
    'advanced',
    'expert',
    'strategic',
  ]),
  cognitive_level: z
    .enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'])
    .optional(),
  irt_difficulty: z.number().min(-3).max(3),
  audience_filters: z.array(z.string()).min(1, 'Select at least one audience'),
  help_text: z.string().optional(),
  points_value: z.number().int().min(1).max(100),
  options: z.array(
    z.object({
      option_text: z.string().min(1, 'Option text required'),
      option_value: z.string().min(1, 'Option value required'),
      points: z.number().int().min(0),
      is_correct: z.boolean(),
      order_index: z.number().int(),
    })
  ),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: Partial<CreateQuestionInput>;
  onSubmit: (data: CreateQuestionInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuestionForm({ initialData, onSubmit, onCancel, isLoading }: QuestionFormProps) {
  const { data: categories } = useAssessmentCategories();
  const [audiences] = useState(['primary', 'secondary', 'professional', 'business']);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      category_id: initialData?.category_id || '',
      question_text: initialData?.question_text || '',
      question_type: initialData?.question_type || 'single_choice',
      difficulty_level: initialData?.difficulty_level || 'intermediate',
      cognitive_level: initialData?.cognitive_level || 'understand',
      irt_difficulty: initialData?.irt_difficulty || 0,
      audience_filters: initialData?.audience_filters || [],
      help_text: initialData?.help_text || '',
      points_value: initialData?.points_value || 10,
      options: initialData?.options || [
        { option_text: '', option_value: '', points: 0, is_correct: false, order_index: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const handleSubmit = (data: QuestionFormValues) => {
    onSubmit(data as CreateQuestionInput);
  };

  const addOption = () => {
    append({
      option_text: '',
      option_value: '',
      points: 0,
      is_correct: false,
      order_index: fields.length,
    });
  };

  const questionType = form.watch('question_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Text */}
            <FormField
              control={form.control}
              name="question_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the question..." className="min-h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Help Text */}
            <FormField
              control={form.control}
              name="help_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Text (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Hint or explanation" {...field} />
                  </FormControl>
                  <FormDescription>Shown to help users understand the question</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_choice">Single Choice</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="scale">Scale (1-5)</SelectItem>
                        <SelectItem value="frequency">Frequency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Difficulty & Cognitive Level */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="difficulty_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="foundational">Foundational</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                        <SelectItem value="strategic">Strategic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cognitive_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognitive Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remember">Remember</SelectItem>
                        <SelectItem value="understand">Understand</SelectItem>
                        <SelectItem value="apply">Apply</SelectItem>
                        <SelectItem value="analyze">Analyze</SelectItem>
                        <SelectItem value="evaluate">Evaluate</SelectItem>
                        <SelectItem value="create">Create</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Bloom's Taxonomy level</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* IRT Difficulty */}
            <FormField
              control={form.control}
              name="irt_difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IRT Difficulty (-3 to +3)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    -3 (very easy) to +3 (very hard), 0 = medium difficulty
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audience Filters */}
            <FormField
              control={form.control}
              name="audience_filters"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Target Audiences</FormLabel>
                    <FormDescription>Select all applicable audiences</FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {audiences.map(audience => (
                      <FormField
                        key={audience}
                        control={form.control}
                        name="audience_filters"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={audience}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(audience)}
                                  onCheckedChange={checked => {
                                    return checked
                                      ? field.onChange([...field.value, audience])
                                      : field.onChange(
                                          field.value?.filter(value => value !== audience)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal capitalize">{audience}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Answer Options */}
        {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Answer Options</CardTitle>
                <Button type="button" onClick={addOption} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start border p-4 rounded-md">
                  <div className="flex-1 space-y-3">
                    <FormField
                      control={form.control}
                      name={`options.${index}.option_text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter option text" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`options.${index}.option_value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value (slug)</FormLabel>
                            <FormControl>
                              <Input placeholder="option_value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`options.${index}.points`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`options.${index}.is_correct`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>This is a correct answer</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
