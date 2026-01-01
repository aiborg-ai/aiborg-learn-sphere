/**
 * Generating Step - Step 2 of Lesson Generation Wizard
 * Shows loading animation and polls for job completion
 */

import { useEffect, useState } from 'react';
import {
  Loader2,
  Search,
  Target,
  FileText,
  Edit,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LessonOnDemandService } from '@/services/lesson-on-demand';
import { logger } from '@/utils/logger';

interface GeneratingStepProps {
  jobId: string;
  onComplete: (lessonId: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

const PROGRESS_STAGES = [
  { label: 'Analyzing topic', icon: Search, duration: 2000 },
  { label: 'Creating learning objectives', icon: Target, duration: 3000 },
  { label: 'Generating content', icon: FileText, duration: 8000 },
  { label: 'Creating practice exercises', icon: Edit, duration: 3000 },
  { label: 'Generating quiz questions', icon: HelpCircle, duration: 3000 },
  { label: 'Adding resources', icon: BookOpen, duration: 2000 },
];

export function GeneratingStep({ jobId, onComplete, onError, onBack }: GeneratingStepProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Advance through progress stages
  useEffect(() => {
    if (error || !isPolling) return;

    const stage = PROGRESS_STAGES[currentStage];
    if (!stage) return;

    const timer = setTimeout(() => {
      if (currentStage < PROGRESS_STAGES.length - 1) {
        setCurrentStage(prev => prev + 1);
      }
    }, stage.duration);

    return () => clearTimeout(timer);
  }, [currentStage, error, isPolling]);

  // Poll job status
  useEffect(() => {
    if (!jobId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const job = await LessonOnDemandService.getJobStatus(jobId);

        if (job.status === 'completed') {
          setIsPolling(false);
          clearInterval(pollInterval);
          if (job.output_content_id) {
            onComplete(job.output_content_id);
          } else {
            setError('Lesson generated but ID not found');
          }
        } else if (job.status === 'failed') {
          setIsPolling(false);
          clearInterval(pollInterval);
          const errorMessage = job.error_message || 'Generation failed. Please try again.';
          setError(errorMessage);
          onError(errorMessage);
        }
      } catch (err) {
        logger.error('Error polling job status:', err);
        // Continue polling even on error - might be temporary network issue
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling, onComplete, onError]);

  const handleRetry = () => {
    setError(null);
    onBack();
  };

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Generation Failed</CardTitle>
          <CardDescription>We encountered an issue while generating your lesson.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Go Back
            </Button>
            <Button onClick={handleRetry} className="flex-1">
              Try Again
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Troubleshooting tips:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>
                Ensure Ollama is running (check with{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">ollama serve</code>)
              </li>
              <li>
                Verify llama3.3:70b model is installed (
                <code className="text-xs bg-muted px-1 py-0.5 rounded">ollama list</code>)
              </li>
              <li>Check your topic is clear and specific</li>
              <li>Try a shorter duration or simpler topic</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <Loader2 className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-spin" />
          </div>
        </div>
        <CardTitle className="text-2xl">Generating Your Lesson</CardTitle>
        <CardDescription className="text-base">
          Please wait while AI creates your custom lesson. This typically takes 30-60 seconds.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Progress Stages */}
        <div className="space-y-4">
          {PROGRESS_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;

            return (
              <div
                key={stage.label}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                    : isCompleted
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-muted/30 border-muted'
                }`}
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${
                    isCurrent
                      ? 'bg-amber-200 dark:bg-amber-900'
                      : isCompleted
                        ? 'bg-green-200 dark:bg-green-900'
                        : 'bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isCurrent ? (
                    <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCurrent
                        ? 'text-amber-900 dark:text-amber-100'
                        : isCompleted
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {stage.label}
                  </p>
                </div>

                {/* Loading Spinner for Current */}
                {isCurrent && (
                  <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Did you know?</strong> The AI is analyzing educational best practices,
            curriculum standards, and learning science research to create a high-quality lesson
            tailored to your specifications.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(((currentStage + 1) / PROGRESS_STAGES.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
