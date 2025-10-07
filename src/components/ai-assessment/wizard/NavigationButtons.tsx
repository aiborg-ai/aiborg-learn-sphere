import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

interface NavigationButtonsProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  submitting: boolean;
  canGoPrevious: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  submitting,
  canGoPrevious,
}) => {
  return (
    <CardFooter
      className="flex justify-between"
      role="navigation"
      aria-label="Assessment navigation"
    >
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label={`Go to previous question (question ${currentIndex})`}
        aria-disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
        Previous
      </Button>

      <Button
        onClick={onNext}
        disabled={submitting}
        aria-label={
          submitting
            ? 'Submitting assessment...'
            : currentIndex === totalQuestions - 1
              ? 'Complete and submit assessment'
              : `Go to next question (question ${currentIndex + 2} of ${totalQuestions})`
        }
        aria-busy={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : currentIndex === totalQuestions - 1 ? (
          <>
            Complete Assessment
            <CheckCircle className="h-4 w-4 ml-2" aria-hidden="true" />
          </>
        ) : (
          <>
            Next
            <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </>
        )}
      </Button>
    </CardFooter>
  );
};
