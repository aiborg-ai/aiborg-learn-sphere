/**
 * Lesson on Demand Wizard - Main Page
 * Multi-step wizard for generating AI-powered lessons
 */

import { useState } from 'react';
import { TopicInputStep } from '@/components/lesson-on-demand/TopicInputStep';
import { GeneratingStep } from '@/components/lesson-on-demand/GeneratingStep';
import { SaveStep } from '@/components/lesson-on-demand/SaveStep';
import { LessonProgressIndicator } from '@/components/lesson-on-demand/LessonProgressIndicator';
import { LessonOnDemandService, type GeneratedLesson } from '@/services/lesson-on-demand';
import { type TopicInputFormData } from '@/schemas/lessonOnDemand';
import { useToast } from '@/hooks/use-toast';

const WIZARD_STEPS = [
  { label: 'Topic', description: 'Choose topic' },
  { label: 'Generate', description: 'AI creates lesson' },
  { label: 'Complete', description: 'Save & publish' },
];

export default function LessonOnDemandWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [topicData, setTopicData] = useState<TopicInputFormData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const { toast } = useToast();

  const handleTopicSubmit = async (data: TopicInputFormData) => {
    try {
      setTopicData(data);

      // Create generation job
      const newJobId = await LessonOnDemandService.generateLesson(data);
      setJobId(newJobId);

      // Move to generating step
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: 'Failed to start generation',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleGenerationComplete = async (lessonId: string) => {
    try {
      // Fetch the generated lesson
      const lesson = await LessonOnDemandService.getLesson(lessonId);

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      setGeneratedLesson(lesson);
      setCurrentStep(3);

      toast({
        title: 'Lesson generated!',
        description: 'Your lesson has been created successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to load lesson',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleGenerationError = (error: string) => {
    toast({
      title: 'Generation failed',
      description: error,
      variant: 'destructive',
    });
  };

  const handleBackToTopic = () => {
    setCurrentStep(1);
    setJobId(null);
  };

  const handleGenerateAnother = () => {
    setCurrentStep(1);
    setTopicData(null);
    setJobId(null);
    setGeneratedLesson(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Lesson on Demand</h1>
          <p className="text-muted-foreground">Generate custom lessons with AI in minutes</p>
        </div>

        {/* Progress Indicator */}
        <LessonProgressIndicator
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS}
        />

        {/* Wizard Steps */}
        <div className="mt-8">
          {currentStep === 1 && (
            <TopicInputStep onNext={handleTopicSubmit} initialData={topicData || undefined} />
          )}

          {currentStep === 2 && jobId && (
            <GeneratingStep
              jobId={jobId}
              onComplete={handleGenerationComplete}
              onError={handleGenerationError}
              onBack={handleBackToTopic}
            />
          )}

          {currentStep === 3 && generatedLesson && (
            <SaveStep lesson={generatedLesson} onGenerateAnother={handleGenerateAnother} />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by Ollama llama3.3:70b • AI-generated content may require review</p>
        </div>
      </div>
    </div>
  );
}
