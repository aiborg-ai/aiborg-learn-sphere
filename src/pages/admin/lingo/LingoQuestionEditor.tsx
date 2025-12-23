/**
 * LingoQuestionEditor Component
 *
 * Interface for creating and editing questions across 5 question types.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Icon } from '@/utils/iconLoader';
import { logger } from '@/utils/logger';
import { SortableList, DragHandle } from '@/components/admin/shared/SortableList';
import { LingoReorderService } from '@/services/lingo/LingoReorderService';

interface Lesson {
  id: string;
  lesson_id: string;
  title: string;
  skill: string;
}

interface Question {
  id: string;
  lesson_id: string;
  type: string;
  prompt: string;
  sort_order: number;
  options?: string[];
  answer?: string;
  answers?: string[];
  pairs?: Array<{ left: string; right: string }>;
  steps?: string[];
  ideal_answer?: string;
  rubric?: string;
  strictness?: number;
  pass_score?: number;
  explanation?: string;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: 'CircleDot' },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: 'TextCursor' },
  { value: 'matching', label: 'Matching', icon: 'ArrowLeftRight' },
  { value: 'ordering', label: 'Ordering', icon: 'ListOrdered' },
  { value: 'free_response', label: 'Free Response', icon: 'MessageSquare' },
];

const defaultQuestion: Partial<Question> = {
  type: 'multiple_choice',
  prompt: '',
  options: ['', '', '', ''],
  answer: '',
  answers: [''],
  pairs: [{ left: '', right: '' }],
  steps: [''],
  ideal_answer: '',
  rubric: '',
  strictness: 0.7,
  pass_score: 0.65,
  explanation: '',
  sort_order: 0,
};

export function LingoQuestionEditor() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>(defaultQuestion);
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();

  const loadLessons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lingo_lessons')
        .select('id, lesson_id, title, skill')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      logger.error('Failed to load lessons', error);
      toast({ title: 'Error', description: 'Failed to load lessons', variant: 'destructive' });
    }
  }, [toast]);

  const loadQuestions = useCallback(
    async (lessonId: string) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('lingo_questions')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        logger.error('Failed to load questions', error);
        toast({ title: 'Error', description: 'Failed to load questions', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Load lessons on mount
  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Load questions when lesson changes
  useEffect(() => {
    if (selectedLessonId) {
      loadQuestions(selectedLessonId);
    } else {
      setQuestions([]);
    }
  }, [selectedLessonId, loadQuestions]);

  function handleNewQuestion() {
    setEditingQuestion(null);
    setFormData({
      ...defaultQuestion,
      lesson_id: selectedLessonId,
      sort_order: questions.length + 1,
    });
    setIsDialogOpen(true);
  }

  function handleEditQuestion(question: Question) {
    setEditingQuestion(question);
    setFormData({
      type: question.type,
      prompt: question.prompt,
      options: question.options || ['', '', '', ''],
      answer: question.answer || '',
      answers: question.answers || [''],
      pairs: question.pairs || [{ left: '', right: '' }],
      steps: question.steps || [''],
      ideal_answer: question.ideal_answer || '',
      rubric: question.rubric || '',
      strictness: question.strictness ?? 0.7,
      pass_score: question.pass_score ?? 0.65,
      explanation: question.explanation || '',
      sort_order: question.sort_order,
    });
    setIsDialogOpen(true);
  }

  async function handleSaveQuestion() {
    // Build the question data based on type
    const questionData: Record<string, unknown> = {
      lesson_id: selectedLessonId,
      type: formData.type,
      prompt: formData.prompt,
      explanation: formData.explanation,
      sort_order: formData.sort_order,
      // Clear all type-specific fields first
      options: null,
      answer: null,
      answers: null,
      pairs: null,
      steps: null,
      ideal_answer: null,
      rubric: null,
      strictness: null,
      pass_score: null,
    };

    // Set type-specific fields
    switch (formData.type) {
      case 'multiple_choice':
        questionData.options = formData.options?.filter(o => o.trim());
        questionData.answer = formData.answer;
        break;
      case 'fill_blank':
        questionData.answers = formData.answers?.filter(a => a.trim());
        break;
      case 'matching':
        questionData.pairs = formData.pairs?.filter(p => p.left.trim() && p.right.trim());
        break;
      case 'ordering':
        questionData.steps = formData.steps?.filter(s => s.trim());
        break;
      case 'free_response':
        questionData.ideal_answer = formData.ideal_answer;
        questionData.rubric = formData.rubric;
        questionData.strictness = formData.strictness;
        questionData.pass_score = formData.pass_score;
        break;
    }

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('lingo_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Question updated successfully' });
      } else {
        const { error } = await supabase.from('lingo_questions').insert(questionData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Question created successfully' });
      }

      setIsDialogOpen(false);
      loadQuestions(selectedLessonId);
    } catch (error) {
      logger.error('Failed to save question', error);
      toast({ title: 'Error', description: 'Failed to save question', variant: 'destructive' });
    }
  }

  async function handleDeleteQuestion(question: Question) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('lingo_questions').delete().eq('id', question.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Question deleted' });
      loadQuestions(selectedLessonId);
    } catch (error) {
      logger.error('Failed to delete question', error);
      toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
    }
  }

  // Handle question reordering
  async function handleReorderQuestions(reorderedQuestions: Question[]) {
    setIsReordering(true);
    try {
      const reorderItems = reorderedQuestions.map((question, index) => ({
        id: question.id,
        sort_order: index,
      }));

      await LingoReorderService.reorderQuestions(selectedLessonId, reorderItems);

      // Update local state with new order
      setQuestions(reorderedQuestions);
      toast({ title: 'Success', description: 'Questions reordered successfully' });
    } catch (error) {
      logger.error('Failed to reorder questions', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder questions. Please try again.',
        variant: 'destructive',
      });
      // Reload to restore original order
      loadQuestions(selectedLessonId);
    } finally {
      setIsReordering(false);
    }
  }

  // Helpers for array fields
  function addArrayItem(field: 'options' | 'answers' | 'steps') {
    const current = formData[field] || [];
    setFormData(prev => ({ ...prev, [field]: [...current, ''] }));
  }

  function removeArrayItem(field: 'options' | 'answers' | 'steps', index: number) {
    const current = formData[field] || [];
    setFormData(prev => ({ ...prev, [field]: current.filter((_, i) => i !== index) }));
  }

  function updateArrayItem(field: 'options' | 'answers' | 'steps', index: number, value: string) {
    const current = formData[field] || [];
    const updated = [...current];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  }

  function addPair() {
    const current = formData.pairs || [];
    setFormData(prev => ({ ...prev, pairs: [...current, { left: '', right: '' }] }));
  }

  function removePair(index: number) {
    const current = formData.pairs || [];
    setFormData(prev => ({ ...prev, pairs: current.filter((_, i) => i !== index) }));
  }

  function updatePair(index: number, side: 'left' | 'right', value: string) {
    const current = formData.pairs || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [side]: value };
    setFormData(prev => ({ ...prev, pairs: updated }));
  }

  function getTypeIcon(type: string) {
    const typeObj = QUESTION_TYPES.find(t => t.value === type);
    return typeObj?.icon || 'HelpCircle';
  }

  function getTypeBadgeColor(type: string) {
    const colors: Record<string, string> = {
      multiple_choice: 'bg-blue-100 text-blue-800',
      fill_blank: 'bg-green-100 text-green-800',
      matching: 'bg-purple-100 text-purple-800',
      ordering: 'bg-orange-100 text-orange-800',
      free_response: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Question Editor</CardTitle>
            <CardDescription>Create and manage questions for each lesson</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map(lesson => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleNewQuestion} disabled={!selectedLessonId}>
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedLessonId ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="BookOpen" className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a lesson to view and manage its questions</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="MessageSquareQuestion" className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No questions yet. Click "Add Question" to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reorder hint */}
            {questions.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="GripVertical" className="h-4 w-4" />
                <span>Drag questions to reorder</span>
                {isReordering && <Icon name="Loader2" className="h-4 w-4 animate-spin ml-2" />}
              </div>
            )}

            <SortableList
              items={questions}
              onReorder={handleReorderQuestions}
              isReordering={isReordering}
              renderItem={(question, index, dragHandleProps) => (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={question.id} className="border rounded-lg px-4">
                    <div className="flex items-center">
                      <DragHandle dragHandleProps={dragHandleProps} className="py-4 pr-3">
                        <Icon name="GripVertical" className="h-4 w-4 text-muted-foreground" />
                      </DragHandle>
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-muted-foreground font-mono text-sm">
                            Q{index + 1}
                          </span>
                          <Badge className={getTypeBadgeColor(question.type)} variant="secondary">
                            <Icon name={getTypeIcon(question.type)} className="h-3 w-3 mr-1" />
                            {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                          </Badge>
                          <span className="truncate max-w-md">{question.prompt}</span>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-medium">{question.prompt}</p>
                          {question.explanation && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          )}
                        </div>

                        {/* Type-specific preview */}
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-1">
                            {question.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`px-3 py-2 rounded ${opt === question.answer ? 'bg-green-100 border-green-500 border' : 'bg-gray-100'}`}
                              >
                                {opt}{' '}
                                {opt === question.answer && (
                                  <Badge className="ml-2" variant="outline">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'fill_blank' && question.answers && (
                          <div>
                            <p className="text-sm text-muted-foreground">Accepted answers:</p>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {question.answers.map((ans, i) => (
                                <Badge key={i} variant="secondary">
                                  {ans}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'matching' && question.pairs && (
                          <div className="grid grid-cols-2 gap-2">
                            {question.pairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Badge variant="outline">{pair.left}</Badge>
                                <Icon name="ArrowRight" className="h-4 w-4" />
                                <Badge>{pair.right}</Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'ordering' && question.steps && (
                          <ol className="list-decimal list-inside space-y-1">
                            {question.steps.map((step, i) => (
                              <li key={i} className="text-sm">
                                {step}
                              </li>
                            ))}
                          </ol>
                        )}

                        {question.type === 'free_response' && (
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Ideal answer:</strong> {question.ideal_answer}
                            </p>
                            <p>
                              <strong>Rubric:</strong> {question.rubric}
                            </p>
                            <p>
                              <strong>Strictness:</strong> {question.strictness} |{' '}
                              <strong>Pass score:</strong> {question.pass_score}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Icon name="Pencil" className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question)}
                          >
                            <Icon name="Trash2" className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            />
          </div>
        )}

        {/* Question Editor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
              <DialogDescription>Configure the question type and content below.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Question Type */}
              <div className="grid gap-2">
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon name={type.icon} className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt */}
              <div className="grid gap-2">
                <Label htmlFor="question-prompt">Question Prompt</Label>
                <Textarea
                  id="question-prompt"
                  value={formData.prompt}
                  onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter the question text..."
                  rows={3}
                />
              </div>

              {/* Type-specific fields */}
              {formData.type === 'multiple_choice' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="option-0">Options</Label>
                    {(formData.options || []).map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          id={`option-${i}`}
                          value={opt}
                          onChange={e => updateArrayItem('options', i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                        {(formData.options?.length || 0) > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem('options', i)}
                            aria-label="Remove option"
                          >
                            <Icon name="X" className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('options')}>
                      <Icon name="Plus" className="h-4 w-4 mr-1" /> Add Option
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="correct-answer">Correct Answer</Label>
                    <Select
                      value={formData.answer}
                      onValueChange={value => setFormData(prev => ({ ...prev, answer: value }))}
                    >
                      <SelectTrigger id="correct-answer">
                        <SelectValue placeholder="Select the correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.options || [])
                          .filter(o => o.trim())
                          .map((opt, i) => (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.type === 'fill_blank' && (
                <div className="grid gap-2">
                  <Label htmlFor="answer-0">Accepted Answers (any of these will be correct)</Label>
                  {(formData.answers || []).map((ans, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        id={`answer-${i}`}
                        value={ans}
                        onChange={e => updateArrayItem('answers', i, e.target.value)}
                        placeholder={`Answer ${i + 1}`}
                      />
                      {(formData.answers?.length || 0) > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('answers', i)}
                          aria-label="Remove answer"
                        >
                          <Icon name="X" className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('answers')}>
                    <Icon name="Plus" className="h-4 w-4 mr-1" /> Add Answer
                  </Button>
                </div>
              )}

              {formData.type === 'matching' && (
                <div className="grid gap-2">
                  <Label htmlFor="pair-0-left">Matching Pairs</Label>
                  {(formData.pairs || []).map((pair, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        id={`pair-${i}-left`}
                        value={pair.left}
                        onChange={e => updatePair(i, 'left', e.target.value)}
                        placeholder="Left side"
                        className="flex-1"
                      />
                      <Icon name="ArrowRight" className="h-4 w-4 shrink-0" />
                      <Input
                        value={pair.right}
                        onChange={e => updatePair(i, 'right', e.target.value)}
                        placeholder="Right side"
                        className="flex-1"
                      />
                      {(formData.pairs?.length || 0) > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePair(i)}
                          aria-label="Remove pair"
                        >
                          <Icon name="X" className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPair}>
                    <Icon name="Plus" className="h-4 w-4 mr-1" /> Add Pair
                  </Button>
                </div>
              )}

              {formData.type === 'ordering' && (
                <div className="grid gap-2">
                  <Label htmlFor="step-0">Steps (in correct order)</Label>
                  {(formData.steps || []).map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground w-6">{i + 1}.</span>
                      <Input
                        id={`step-${i}`}
                        value={step}
                        onChange={e => updateArrayItem('steps', i, e.target.value)}
                        placeholder={`Step ${i + 1}`}
                        className="flex-1"
                      />
                      {(formData.steps?.length || 0) > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('steps', i)}
                          aria-label="Remove step"
                        >
                          <Icon name="X" className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('steps')}>
                    <Icon name="Plus" className="h-4 w-4 mr-1" /> Add Step
                  </Button>
                </div>
              )}

              {formData.type === 'free_response' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="ideal-answer">Ideal Answer</Label>
                    <Textarea
                      id="ideal-answer"
                      value={formData.ideal_answer}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, ideal_answer: e.target.value }))
                      }
                      placeholder="The ideal answer for grading comparison..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="grading-rubric">Grading Rubric</Label>
                    <Textarea
                      id="grading-rubric"
                      value={formData.rubric}
                      onChange={e => setFormData(prev => ({ ...prev, rubric: e.target.value }))}
                      placeholder="Key points to look for when grading..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Strictness: {formData.strictness}</Label>
                      <Slider
                        value={[formData.strictness || 0.7]}
                        onValueChange={([value]) =>
                          setFormData(prev => ({ ...prev, strictness: value }))
                        }
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Pass Score: {formData.pass_score}</Label>
                      <Slider
                        value={[formData.pass_score || 0.65]}
                        onValueChange={([value]) =>
                          setFormData(prev => ({ ...prev, pass_score: value }))
                        }
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Explanation */}
              <div className="grid gap-2">
                <Label htmlFor="explanation">Explanation (shown after answering)</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={e => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explanation to show the learner..."
                  rows={2}
                />
              </div>

              {/* Sort Order */}
              <div className="grid gap-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={formData.sort_order}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={!formData.prompt}>
                {editingQuestion ? 'Save Changes' : 'Create Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
