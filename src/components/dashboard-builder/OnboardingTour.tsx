/**
 * Onboarding Tour
 *
 * Interactive tour to guide users through the dashboard builder
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  MousePointer2,
  Settings,
  Share2,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'welcome',
    title: 'Welcome to Dashboard Builder!',
    description:
      "Create custom dashboards tailored to your learning journey. Let's take a quick tour to get you started.",
    icon: Sparkles,
    position: 'center',
  },
  {
    target: '.widget-palette',
    title: 'Widget Library',
    description:
      'Browse 17 different widget types organized by category. Click any widget to add it to your dashboard.',
    icon: LayoutGrid,
    position: 'right',
  },
  {
    target: '.dashboard-canvas',
    title: 'Canvas Area',
    description:
      'Drag widgets to rearrange them and resize by dragging the edges. Your layout is automatically saved.',
    icon: MousePointer2,
    position: 'center',
  },
  {
    target: '.widget-controls',
    title: 'Widget Controls',
    description:
      'Each widget has controls to configure, lock, hide, or remove it. Click the settings icon to customize.',
    icon: Settings,
    position: 'bottom',
  },
  {
    target: '.share-button',
    title: 'Share Your Dashboard',
    description:
      'Create private share links or publish your dashboard as a template for others to discover and clone.',
    icon: Share2,
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ isOpen, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (step.target === 'welcome') {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(step.target) as HTMLElement;
    setTargetElement(element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Calculate position for the tooltip
  const getTooltipStyle = () => {
    if (!targetElement || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: 'fixed' as const,
      zIndex: 10001,
    };

    switch (step.position) {
      case 'top':
        style.left = rect.left + rect.width / 2;
        style.bottom = window.innerHeight - rect.top + 20;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.left = rect.left + rect.width / 2;
        style.top = rect.bottom + 20;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.right = window.innerWidth - rect.left + 20;
        style.top = rect.top + rect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.left = rect.right + 20;
        style.top = rect.top + rect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            onClick={handleSkip}
          />

          {/* Highlight target element */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[10000] pointer-events-none"
              style={{
                left: targetElement.getBoundingClientRect().left - 4,
                top: targetElement.getBoundingClientRect().top - 4,
                width: targetElement.getBoundingClientRect().width + 8,
                height: targetElement.getBoundingClientRect().height + 8,
                border: '2px solid hsl(var(--primary))',
                borderRadius: '0.5rem',
                boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            style={getTooltipStyle()}
          >
            <Card className="w-[400px] max-w-[90vw] shadow-2xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Step {currentStep + 1} of {TOUR_STEPS.length}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Close tour"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <Button size="sm" variant="ghost" onClick={handleSkip}>
                    Skip Tour
                  </Button>

                  <Button size="sm" onClick={handleNext}>
                    {currentStep < TOUR_STEPS.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Get Started
                        <Sparkles className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default OnboardingTour;
