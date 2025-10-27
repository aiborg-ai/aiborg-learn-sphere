/**
 * useStudioWizard Hook
 * Main state management for Studio wizards
 * Handles step navigation, validation, and data management
 */

import { useState, useCallback, useEffect } from 'react';
import type { AssetType, WizardMode, WizardState, WizardActions } from '@/types/studio.types';
import { getWizardConfig } from '@/lib/studio/wizard-configs';
import { validateStep } from '@/lib/studio/validation-schemas';
import { logger } from '@/utils/logger';

interface UseStudioWizardOptions<T> {
  assetType: AssetType;
  mode?: WizardMode;
  assetId?: string;
  initialData?: Partial<T>;
  onStepChange?: (step: number) => void;
  onDataChange?: (data: T) => void;
}

export function useStudioWizard<T = any>({
  assetType,
  mode = 'create',
  assetId,
  initialData,
  onStepChange,
  onDataChange,
}: UseStudioWizardOptions<T>) {
  const config = getWizardConfig(assetType);
  const totalSteps = config.steps.length;

  // Initialize wizard state
  const [state, setState] = useState<WizardState<T>>(() => ({
    assetType,
    mode,
    assetId,
    currentStep: 0,
    totalSteps,
    data: { ...config.defaultData, ...initialData } as T,
    stepValidation: new Array(totalSteps).fill(false),
    isDirty: false,
    draftId: null,
    lastSaved: undefined,
  }));

  // Update parent when step changes
  useEffect(() => {
    onStepChange?.(state.currentStep);
  }, [state.currentStep, onStepChange]);

  // Update parent when data changes
  useEffect(() => {
    if (state.isDirty) {
      onDataChange?.(state.data);
    }
  }, [state.data, state.isDirty, onDataChange]);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const currentStepConfig = config.steps[state.currentStep];
    if (!currentStepConfig) return true;

    // Skip validation for review step
    if (currentStepConfig.id === 'review') return true;

    // Use custom validation if provided
    if (currentStepConfig.validate) {
      const result = currentStepConfig.validate(state.data);
      return typeof result === 'boolean' ? result : false;
    }

    // Use schema validation
    const validation = validateStep(assetType, currentStepConfig.id, state.data);
    return validation.success;
  }, [assetType, config.steps, state.currentStep, state.data]);

  // Update validation state for current step
  const updateStepValidation = useCallback((isValid: boolean) => {
    setState(prev => {
      const newValidation = [...prev.stepValidation];
      newValidation[prev.currentStep] = isValid;
      return { ...prev, stepValidation: newValidation };
    });
  }, []);

  // Validate and update automatically
  useEffect(() => {
    const isValid = validateCurrentStep();
    updateStepValidation(isValid);
  }, [validateCurrentStep, updateStepValidation]);

  // Navigation: Go to next step
  const goToNextStep = useCallback(() => {
    if (state.currentStep >= totalSteps - 1) {
      logger.warn('Already at last step');
      return;
    }

    const isValid = validateCurrentStep();
    if (!isValid && !config.steps[state.currentStep]?.isOptional) {
      logger.warn('Current step is not valid');
      return;
    }

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, [state.currentStep, totalSteps, validateCurrentStep, config.steps]);

  // Navigation: Go to previous step
  const goToPreviousStep = useCallback(() => {
    if (state.currentStep <= 0) {
      logger.warn('Already at first step');
      return;
    }

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, [state.currentStep]);

  // Navigation: Go to specific step
  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= totalSteps) {
        logger.warn('Invalid step number');
        return;
      }

      // Only allow going to completed steps or next step
      const canGoToStep = step <= state.currentStep + 1;
      if (!canGoToStep) {
        logger.warn('Cannot skip to future steps');
        return;
      }

      setState(prev => ({
        ...prev,
        currentStep: step,
      }));
    },
    [totalSteps, state.currentStep]
  );

  // Data: Update wizard data
  const updateData = useCallback((updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates },
      isDirty: true,
    }));
  }, []);

  // Data: Reset wizard to initial state
  const reset = useCallback(() => {
    setState({
      assetType,
      mode,
      assetId,
      currentStep: 0,
      totalSteps,
      data: { ...config.defaultData, ...initialData } as T,
      stepValidation: new Array(totalSteps).fill(false),
      isDirty: false,
      draftId: null,
      lastSaved: undefined,
    });
  }, [assetType, mode, assetId, totalSteps, config.defaultData, initialData]);

  // Draft: Mark as saved
  const markAsSaved = useCallback((draftId?: string) => {
    setState(prev => ({
      ...prev,
      isDirty: false,
      draftId: draftId || prev.draftId,
      lastSaved: new Date(),
    }));
  }, []);

  // Draft: Load draft data
  const loadDraft = useCallback((draftData: Partial<T>, draftId: string, currentStep?: number) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...draftData },
      draftId,
      currentStep: currentStep ?? prev.currentStep,
      isDirty: false,
      lastSaved: new Date(),
    }));
  }, []);

  // Computed: Progress percentage
  const progressPercentage = Math.round(((state.currentStep + 1) / totalSteps) * 100);

  // Computed: Can go to next step
  const canGoNext =
    state.currentStep < totalSteps - 1 &&
    (state.stepValidation[state.currentStep] || config.steps[state.currentStep]?.isOptional);

  // Computed: Can go to previous step
  const canGoPrevious = state.currentStep > 0;

  // Computed: Is on review step
  const isOnReviewStep = config.steps[state.currentStep]?.id === 'review';

  // Actions object
  const actions: WizardActions = {
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateData,
    saveDraft: async () => {
      // This will be implemented in useStudioDraft hook
      logger.debug('Save draft called - implement in useStudioDraft');
    },
    publish: async () => {
      // This will be implemented in useStudioPublish hook
      logger.debug('Publish called - implement in useStudioPublish');
    },
    reset,
  };

  return {
    // State
    state,

    // Computed
    config,
    currentStepConfig: config.steps[state.currentStep],
    progressPercentage,
    canGoNext,
    canGoPrevious,
    isOnReviewStep,
    isValid: state.stepValidation[state.currentStep],

    // Actions
    actions,

    // Draft management
    markAsSaved,
    loadDraft,
  };
}
