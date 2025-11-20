/**
 * AssessmentQuestionsManagement Page
 * Admin portal for managing assessment questions
 */

import { useState } from 'react';
import { Navbar, Footer } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Filter } from '@/components/ui/icons';
import { QuestionForm } from '@/components/admin/QuestionForm';
import {
  useAssessmentQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useAssessmentQuestion,
  type CreateQuestionInput,
} from '@/hooks/useAssessmentQuestions';

export default function AssessmentQuestionsManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  const { data: questions, isLoading } = useAssessmentQuestions();
  const { data: editingQuestion } = useAssessmentQuestion(editingQuestionId || '');
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const handleCreate = () => {
    setEditingQuestionId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (questionId: string) => {
    setEditingQuestionId(questionId);
    setIsFormOpen(true);
  };

  const handleDelete = (questionId: string) => {
    setDeleteQuestionId(questionId);
  };

  const confirmDelete = () => {
    if (deleteQuestionId) {
      deleteQuestion.mutate(deleteQuestionId);
      setDeleteQuestionId(null);
    }
  };

  const handleSubmit = (data: CreateQuestionInput) => {
    if (editingQuestionId) {
      updateQuestion.mutate(
        { questionId: editingQuestionId, input: data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingQuestionId(null);
          },
        }
      );
    } else {
      createQuestion.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingQuestionId(null);
  };

  // Filter questions
  const filteredQuestions = questions?.filter((q: Record<string, unknown>) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty_level === difficultyFilter;
    const matchesAudience =
      audienceFilter === 'all' || q.audience_filters?.includes(audienceFilter);
    return matchesSearch && matchesDifficulty && matchesAudience;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Assessment Questions</h1>
            <p className="text-muted-foreground mt-2">Manage questions for AI assessments</p>
          </div>
          <Button onClick={handleCreate} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Question
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Difficulty Filter */}
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="foundational">Foundational</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                </SelectContent>
              </Select>

              {/* Audience Filter */}
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Questions ({filteredQuestions?.length || 0})</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading questions...' : 'Click a question to edit or delete'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Audiences</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions?.map((question: Record<string, unknown>) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2">{question.question_text}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {question.assessment_categories?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {question.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {question.audience_filters?.map((aud: string) => (
                            <Badge key={aud} variant="outline" className="text-xs capitalize">
                              {aud}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{question.points_value}</TableCell>
                      <TableCell>
                        {question.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(question.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && filteredQuestions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No questions found. Click "Add Question" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestionId ? 'Edit Question' : 'Create New Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestionId
                ? 'Update the question details below'
                : 'Fill in the details to create a new assessment question'}
            </DialogDescription>
          </DialogHeader>
          <QuestionForm
            initialData={editingQuestion}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createQuestion.isPending || updateQuestion.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question and all its
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
