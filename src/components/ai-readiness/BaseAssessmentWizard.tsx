// ============================================================================
// Base Assessment Wizard Component for AI-Readiness
// Multi-step form container with navigation, progress tracking, and auto-save
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ProgressTracker } from './ProgressTracker';
import type { DimensionType } from '@/types/aiReadiness';

interface SectionComponentProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

interface Section {
  id: DimensionType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<SectionComponentProps>;
  questionsCount: number;
}

interface BaseAssessmentWizardProps {
  sections: Section[];
  formData: Record<string, Record<string, unknown>>;
  onSectionChange: (sectionId: DimensionType, data: Record<string, unknown>) => void;
  onSaveDraft?: () => Promise<void>;
  onComplete: () => Promise<void>;
  autoSaveInterval?: number; // milliseconds
  className?: string;
}

export function BaseAssessmentWizard({
  sections,
  formData,
  onSectionChange,
  onSaveDraft,
  onComplete,
  autoSaveInterval = 30000, // 30 seconds default
  className,
}: BaseAssessmentWizardProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentSection = sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;

  // Calculate section progress
  const getSectionProgress = useCallback(
    (sectionId: DimensionType) => {
      const sectionData = formData[sectionId] || {};
      const answeredQuestions = Object.values(sectionData).filter(
        val => val !== undefined && val !== null && val !== ''
      ).length;
      const section = sections.find(s => s.id === sectionId);
      const totalQuestions = section?.questionsCount || 0;
      const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      return {
        section: sectionId,
        label: section?.title || '',
        icon: section?.icon || (() => null),
        completed: percentage >= 90, // Consider 90%+ as completed
        questionsAnswered: answeredQuestions,
        totalQuestions,
        percentage,
      };
    },
    [formData, sections]
  );

  // Calculate overall progress
  const overallProgress = useCallback(() => {
    const sectionProgresses = sections.map(s => getSectionProgress(s.id));
    const totalPercentage =
      sectionProgresses.reduce((sum, sp) => sum + sp.percentage, 0) / sections.length;
    return totalPercentage;
  }, [sections, getSectionProgress]);

  // Auto-save functionality
  useEffect(() => {
    if (!onSaveDraft || !autoSaveInterval) return;

    const interval = setInterval(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        await onSaveDraft();
        setLastSaved(new Date());
      } catch (_error) {
        // Auto-save failed - set _error state
        setSaveError('Failed to auto-save');
      } finally {
        setIsSaving(false);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [onSaveDraft, autoSaveInterval]);

  // Manual save
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await onSaveDraft();
      setLastSaved(new Date());
    } catch (_error) {
      // Save failed - set _error state
      setSaveError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (!isLastSection) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSectionClick = (index: number) => {
    setCurrentSectionIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onComplete();
    } catch (_error) {
      // Completion failed - set _error state
      setSaveError('Failed to complete assessment');
      setIsSaving(false);
    }
  };

  const CurrentSectionComponent = currentSection.component;
  const SectionIcon = currentSection.icon;

  return (
    <div className={cn('max-w-7xl mx-auto space-y-6', className)}>
      {/* Progress Tracker */}
      <ProgressTracker
        sections={sections.map(s => getSectionProgress(s.id))}
        overallPercentage={overallProgress()}
        currentSection={currentSection.id}
      />

      {/* Main Assessment Card */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <SectionIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl">{currentSection.title}</CardTitle>
              <CardDescription className="text-white/60">
                {currentSection.description}
              </CardDescription>
            </div>
            <div className="text-sm text-white/50">
              Section {currentSectionIndex + 1} of {sections.length}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Section Component */}
          <CurrentSectionComponent
            data={formData[currentSection.id] || {}}
            onChange={(data: Record<string, unknown>) => onSectionChange(currentSection.id, data)}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              {!isFirstSection && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Save Status */}
              {onSaveDraft && (
                <div className="flex items-center gap-2 text-sm">
                  {isSaving ? (
                    <span className="text-white/50 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  ) : saveError ? (
                    <span className="text-rose-500 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {saveError}
                    </span>
                  ) : lastSaved ? (
                    <span className="text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Manual Save Button */}
              {onSaveDraft && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              )}

              {/* Next/Complete Button */}
              {isLastSection ? (
                <Button
                  onClick={handleComplete}
                  disabled={isSaving || overallProgress() < 90}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Assessment
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  Next Section
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation (Optional) */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((section, index) => {
              const progress = getSectionProgress(section.id);
              const isActive = index === currentSectionIndex;

              return (
                <Button
                  key={section.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSectionClick(index)}
                  className={cn(
                    'flex items-center gap-2',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      : 'text-white border-white/20 hover:bg-white/10',
                    progress.completed && !isActive && 'border-emerald-500/30'
                  )}
                >
                  {progress.completed && <CheckCircle2 className="h-3 w-3" />}
                  <span className="hidden sm:inline">{section.title}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
