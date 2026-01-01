/**
 * Save Step - Final step of Lesson Generation Wizard
 * Save, publish, or export the generated lesson
 */

import { useState } from 'react';
import { CheckCircle2, Download, Eye, Edit, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LessonOnDemandService, type GeneratedLesson } from '@/services/lesson-on-demand';
import { useToast } from '@/hooks/use-toast';

interface SaveStepProps {
  lesson: GeneratedLesson;
  onGenerateAnother: () => void;
}

export function SaveStep({ lesson, onGenerateAnother }: SaveStepProps) {
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExportMarkdown = async () => {
    try {
      setIsExporting(true);
      const markdown = await LessonOnDemandService.exportAsMarkdown(lesson.id);

      // Create download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded!',
        description: 'Lesson exported as Markdown',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export lesson',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewLesson = () => {
    navigate(`/lessons/${lesson.id}`);
  };

  const handleEditLesson = () => {
    navigate(`/lessons/${lesson.id}/edit`);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <CardTitle className="text-2xl">Lesson Generated Successfully!</CardTitle>
        <CardDescription className="text-base">
          Your custom lesson has been created and saved to your library.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lesson Summary */}
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{lesson.audience}</Badge>
            <Badge variant="secondary">{lesson.difficulty}</Badge>
            <Badge variant="outline">{lesson.estimated_duration_minutes} minutes</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {lesson.learning_objectives.length}
              </div>
              <div className="text-xs text-muted-foreground">Objectives</div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {lesson.content_sections.length}
              </div>
              <div className="text-xs text-muted-foreground">Sections</div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {lesson.practice_exercises.length}
              </div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {lesson.quiz_questions.length}
              </div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleViewLesson} size="lg" className="w-full">
              <Eye className="mr-2 h-5 w-5" />
              View Lesson
            </Button>
            <Button onClick={handleEditLesson} variant="outline" size="lg" className="w-full">
              <Edit className="mr-2 h-5 w-5" />
              Edit Lesson
            </Button>
          </div>

          <Button
            onClick={handleExportMarkdown}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isExporting}
          >
            <Download className="mr-2 h-5 w-5" />
            {isExporting ? 'Exporting...' : 'Export as Markdown'}
          </Button>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={onGenerateAnother}
                variant="outline"
                size="lg"
                className="w-full border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
              >
                <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
                Generate Another Lesson
              </Button>
              <Button onClick={handleDashboard} variant="ghost" size="lg" className="w-full">
                <Home className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-4 bg-muted/50 rounded-lg border">
          <p className="font-semibold mb-2">What's next?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>
                Your lesson is saved in <strong>Draft</strong> status
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>You can edit, refine, and customize it anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Publish it when ready to share with students</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
