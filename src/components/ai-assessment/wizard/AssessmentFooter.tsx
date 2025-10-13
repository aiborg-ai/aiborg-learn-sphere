import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface AssessmentFooterProps {
  submitting: boolean;
  hasAnswer: boolean;
  estimatedRemaining: number;
  onNext: () => void;
}

export const AssessmentFooter: React.FC<AssessmentFooterProps> = ({
  submitting,
  hasAnswer,
  estimatedRemaining,
  onNext,
}) => {
  return (
    <CardFooter className="flex justify-between">
      <Button variant="outline" disabled>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      <Button onClick={onNext} disabled={submitting || !hasAnswer}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {estimatedRemaining === 0 ? 'Complete Assessment' : 'Next Question'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </CardFooter>
  );
};
