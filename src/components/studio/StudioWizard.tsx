/**
 * StudioWizard Component
 * Main wizard orchestrator for creating/editing assets
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Save, X, Clock } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudioProgress } from './StudioProgress';
import { useStudioWizard } from '@/hooks/studio/useStudioWizard';
import { useStudioDraft } from '@/hooks/studio/useStudioDraft';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import type { AssetType, WizardMode } from '@/types/studio.types';
import { formatDistanceToNow } from 'date-fns';

interface StudioWizardProps {
  assetType: AssetType;
  mode: WizardMode;
  assetId?: string;
  initialData?: Record<string, unknown>;
  onExit: () => void;
  onPublish?: (data: Record<string, unknown>) => Promise<void>;
  className?: string;
}

export function StudioWizard({
  assetType,
  mode,
  assetId,
  initialData,
  onExit,
  onPublish,
  className,
}: StudioWizardProps) {
  const { user } = useAuth();

  const wizard = useStudioWizard({
    assetType,
    mode,
    assetId,
    initialData,
  });

  const {
    state,
    config,
    currentStepConfig,
    progressPercentage: _progressPercentage,
    canGoNext,
    canGoPrevious,
    isOnReviewStep,
    isValid,
    actions,
  } = wizard;

  // Auto-save draft hook
  const { saveDraft } = useStudioDraft({
    userId: user?.id,
    assetType,
    mode,
    assetId,
    data: state.data,
    currentStep: state.currentStep,
    isDirty: state.isDirty,
    onSaved: draftId => {
      wizard.markAsSaved(draftId);
    },
  });

  // Handle publish
  const handlePublish = async () => {
    if (onPublish) {
      try {
        await onPublish(state.data);
        // Success will be handled by parent component
      } catch (error) {
        logger.error('Publish failed:', error);
      }
    }
  };

  // Render current step component
  const StepComponent = currentStepConfig?.component;

  return (
    <div className={cn('container max-w-5xl mx-auto p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {config.icon} {mode === 'create' ? 'Creating' : 'Editing'}: {config.title}
          </h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Last Saved Indicator */}
          {state.lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Saved {formatDistanceToNow(state.lastSaved, { addSuffix: true })}</span>
            </div>
          )}

          {/* Save Draft Button */}
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={!state.isDirty}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {/* Exit Button */}
          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      <Separator />

      {/* Progress Indicator */}
      <StudioProgress
        steps={config.steps}
        currentStep={state.currentStep}
        stepValidation={state.stepValidation}
        onStepClick={actions.goToStep}
      />

      {/* Validation Alert */}
      {!isValid && !isOnReviewStep && (
        <Alert variant="destructive">
          <AlertDescription>
            Please complete all required fields before proceeding to the next step.
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card className="p-6">
        {StepComponent ? (
          <StepComponent data={state.data} onUpdate={actions.updateData} mode={mode} />
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="text-6xl">{config.icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{currentStepConfig?.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{currentStepConfig?.description}</p>
            </div>
            <Alert>
              <AlertDescription>
                Step component not yet implemented. This is a placeholder for:{' '}
                <strong>{currentStepConfig?.id}</strong>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={actions.goToPreviousStep} disabled={!canGoPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {/* Progress Badge */}
          <div className="text-sm text-muted-foreground hidden sm:block">
            {state.currentStep + 1} of {state.totalSteps} steps
          </div>
        </div>

        {isOnReviewStep ? (
          <Button onClick={handlePublish} size="lg">
            {mode === 'create' ? 'Publish' : 'Update'}
          </Button>
        ) : (
          <Button onClick={actions.goToNextStep} disabled={!canGoNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Auto-save Indicator */}
      {state.isDirty && (
        <div className="text-xs text-muted-foreground text-center">Auto-saving changes...</div>
      )}
    </div>
  );
}
