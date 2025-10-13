/**
 * ExerciseSubmission Component
 * Main interface for students to work on and submit exercises
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { useSaveSubmission, useSubmitExercise, useUserSubmission } from '@/hooks/useExercise';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  Save,
  Send,
  Upload,
  Github,
  FileText,
  Code,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import type { Exercise } from '@/services/exercise/types';

interface ExerciseSubmissionProps {
  exercise: Exercise;
}

export const ExerciseSubmission: React.FC<ExerciseSubmissionProps> = ({ exercise }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || '';

  // Fetch existing submission
  const { data: existingSubmission, isLoading } = useUserSubmission(exercise.id, userId);

  // Local state
  const [submissionText, setSubmissionText] = useState('');
  const [codeSubmission, setCodeSubmission] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Mutations
  const saveSubmission = useSaveSubmission();
  const submitExercise = useSubmitExercise();

  // Load existing submission
  useEffect(() => {
    if (existingSubmission) {
      setSubmissionText(existingSubmission.submission_text || '');
      setCodeSubmission(existingSubmission.code_submission || '');
      setGithubUrl(existingSubmission.github_repo_url || '');
      setFiles(existingSubmission.file_urls || []);
    } else if (exercise.starter_code) {
      setCodeSubmission(exercise.starter_code);
    }
  }, [existingSubmission, exercise.starter_code]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (submissionText || codeSubmission || githubUrl || files.length > 0) {
        handleSaveDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [submissionText, codeSubmission, githubUrl, files]);

  const handleSaveDraft = async () => {
    try {
      await saveSubmission.mutateAsync({
        exercise_id: exercise.id,
        user_id: userId,
        submission_text: submissionText,
        code_submission: codeSubmission,
        github_repo_url: githubUrl,
        file_urls: files,
      });
      setLastSaved(new Date());
      toast({
        title: 'Draft saved',
        description: 'Your work has been saved automatically.',
      });
    } catch (error) {
      logger.error('Failed to save draft', { error });
    }
  };

  const handleSubmit = async () => {
    if (!existingSubmission?.id) {
      // Save first if no submission exists
      try {
        const result = await saveSubmission.mutateAsync({
          exercise_id: exercise.id,
          user_id: userId,
          submission_text: submissionText,
          code_submission: codeSubmission,
          github_repo_url: githubUrl,
          file_urls: files,
        });

        // Now submit
        await submitExercise.mutateAsync(result.id);
      } catch (error) {
        logger.error('Failed to submit exercise', { error, exerciseId: exercise.id });
        toast({
          title: 'Submission failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Save and submit existing
      try {
        await saveSubmission.mutateAsync({
          exercise_id: exercise.id,
          user_id: userId,
          submission_text: submissionText,
          code_submission: codeSubmission,
          github_repo_url: githubUrl,
          file_urls: files,
        });

        const result = await submitExercise.mutateAsync(existingSubmission.id);

        toast({
          title: 'Exercise submitted!',
          description: result.auto_graded
            ? `You scored ${result.score}% and earned ${result.points_earned} points!`
            : 'Your submission is under review.',
        });

        // Navigate to results
        navigate(`/exercise/${exercise.id}/results/${existingSubmission.id}`);
      } catch (error) {
        logger.error('Failed to submit exercise', { error, exerciseId: exercise.id });
        toast({
          title: 'Submission failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const canSubmit = () => {
    if (exercise.exercise_type === 'coding') {
      return codeSubmission.trim().length > 0;
    }
    if (exercise.exercise_type === 'writing') {
      return submissionText.trim().length > 0;
    }
    // For other types, at least something should be provided
    return (
      submissionText.trim().length > 0 ||
      codeSubmission.trim().length > 0 ||
      githubUrl.trim().length > 0 ||
      files.length > 0
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-12">Loading exercise...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{exercise.title}</CardTitle>
              <CardDescription className="text-base">{exercise.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{exercise.difficulty_level}</Badge>
              <Badge>{exercise.points_reward} points</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Revision Notice */}
      {existingSubmission?.status === 'needs_revision' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Revision Requested</h3>
                <p className="text-sm text-orange-800">{existingSubmission.feedback}</p>
                <p className="text-xs text-orange-600 mt-2">
                  Revision #{existingSubmission.revision_count + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {exercise.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: exercise.instructions }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Submission Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Submission</span>
            {lastSaved && (
              <span className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={exercise.exercise_type === 'coding' ? 'code' : 'text'}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
              <TabsTrigger value="github">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="files">
                <Upload className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>

            {/* Text Submission */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submission-text">Written Response</Label>
                <Textarea
                  id="submission-text"
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  placeholder="Write your response here..."
                  className="min-h-[400px] font-mono"
                />
                <p className="text-sm text-muted-foreground">{submissionText.length} characters</p>
              </div>
            </TabsContent>

            {/* Code Submission */}
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code-submission">Code Solution</Label>
                <Textarea
                  id="code-submission"
                  value={codeSubmission}
                  onChange={e => setCodeSubmission(e.target.value)}
                  placeholder="// Write your code here..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  {codeSubmission.split('\n').length} lines
                </p>
                {exercise.test_cases && exercise.test_cases.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Your code will be automatically tested against{' '}
                      {exercise.test_cases.length} test cases when submitted.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* GitHub Submission */}
            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-url">GitHub Repository URL</Label>
                <Input
                  id="github-url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  type="url"
                />
                <p className="text-sm text-muted-foreground">
                  Link to your GitHub repository containing the project.
                </p>
              </div>
            </TabsContent>

            {/* File Upload */}
            <TabsContent value="files" className="space-y-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    File upload functionality coming soon
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: {exercise.max_file_size_mb}MB
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files</Label>
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm flex-1">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Rubric Preview */}
      {exercise.rubric && exercise.rubric.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grading Rubric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercise.rubric.map((item, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">{item.criteria}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-sm font-medium">Max Points: {item.max_points}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
        <Button
          onClick={handleSaveDraft}
          variant="outline"
          disabled={saveSubmission.isPending}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          disabled={!canSubmit() || submitExercise.isPending}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Exercise
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you ready to submit your exercise?
              {exercise.exercise_type === 'coding' && exercise.test_cases
                ? ' Your code will be automatically tested and graded.'
                : ' Your submission will be reviewed by an instructor.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitExercise.isPending}>
              {submitExercise.isPending ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
