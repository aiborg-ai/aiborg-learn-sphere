/**
 * OnboardingTooltip Component
 *
 * Progressive onboarding tooltip that shows contextual tips as users explore.
 * Automatically tracks when tips are shown and dismissed.
 */

import { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { OnboardingTooltipProps } from '@/types/onboarding';

export function OnboardingTooltip({
  tipId,
  title,
  description,
  placement = 'bottom',
  icon,
  actionLabel = 'Got it',
  children,
  delay = 800,
  showOnce = true,
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasShownRef = useRef(false);

  // Position calculation
  const getTooltipPosition = () => {
    const positions = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };
    return positions[placement];
  };

  // Arrow position
  const getArrowPosition = () => {
    const positions = {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-8 border-x-8 border-x-transparent border-t-background',
      bottom:
        'bottom-full left-1/2 -translate-x-1/2 border-b-8 border-x-8 border-x-transparent border-b-background',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-8 border-y-8 border-y-transparent border-l-background',
      right:
        'right-full top-1/2 -translate-y-1/2 border-r-8 border-y-8 border-y-transparent border-r-background',
    };
    return positions[placement];
  };

  useEffect(() => {
    // Check if tip should be shown
    if (showOnce && hasShownRef.current) {
      return;
    }

    // Delay before showing tooltip
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      setTimeout(() => {
        setIsVisible(true);
        hasShownRef.current = true;
      }, 50);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, showOnce]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
    }, 300);
  };

  const handleComplete = () => {
    handleDismiss();
    // Emit custom event that useOnboarding hook will listen to
    window.dispatchEvent(
      new CustomEvent('onboarding-tip-completed', {
        detail: { tipId },
      })
    );
  };

  return (
    <div className="relative inline-block">
      {children}

      {shouldRender && (
        <div
          className={cn(
            'absolute z-50 transition-all duration-300',
            getTooltipPosition(),
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          )}
        >
          {/* Arrow */}
          <div className={cn('absolute w-0 h-0', getArrowPosition())} />

          {/* Tooltip Card */}
          <Card className="w-80 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {icon && (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name={icon as any} size={20} className="text-primary" />
                    </div>
                  )}
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={handleDismiss}
                  aria-label="Dismiss tip"
                >
                  <X size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>

              <div className="flex gap-2">
                <Button onClick={handleComplete} className="flex-1 gap-2" size="sm">
                  <Check size={16} />
                  {actionLabel}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDismiss} className="text-xs">
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Lightweight version that attaches to existing elements
 */
export function OnboardingHighlight({
  tipId,
  title,
  description,
  placement = 'bottom',
  icon,
  actionLabel = 'Got it',
  targetSelector,
  delay = 800,
  showOnce = true,
}: Omit<OnboardingTooltipProps, 'children'> & { targetSelector: string }) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Find target element
    const element = document.querySelector(targetSelector) as HTMLElement;
    if (element) {
      setTargetElement(element);

      // Add highlight class
      element.classList.add('onboarding-highlight');

      // Show tooltip after delay
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }

    return () => {
      if (element) {
        element.classList.remove('onboarding-highlight');
      }
    };
  }, [targetSelector, delay]);

  const handleComplete = () => {
    setIsVisible(false);
    if (targetElement) {
      targetElement.classList.remove('onboarding-highlight');
    }
    // Emit completion event
    window.dispatchEvent(
      new CustomEvent('onboarding-tip-completed', {
        detail: { tipId },
      })
    );
  };

  if (!targetElement || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed z-50"
      style={{
        top: targetElement.getBoundingClientRect().bottom + window.scrollY + 8,
        left: targetElement.getBoundingClientRect().left + window.scrollX,
      }}
    >
      <Card className="w-80 shadow-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon name={icon as any} size={20} className="text-primary" />
                </div>
              )}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss tip"
            >
              <X size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>

          <Button onClick={handleComplete} className="w-full gap-2" size="sm">
            <Check size={16} />
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
