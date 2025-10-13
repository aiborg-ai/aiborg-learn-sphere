import React from 'react';
import { Loader2 } from 'lucide-react';

export const AssessmentLoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};
