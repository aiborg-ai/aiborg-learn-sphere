import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from '@/components/ui/icons';
import type { User } from '@supabase/supabase-js';

interface EmptyStatesProps {
  type: 'loading' | 'no-questions' | 'sign-in';
  user?: User | null;
}

export const EmptyStates: React.FC<EmptyStatesProps> = ({ type, user }) => {
  if (type === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (type === 'no-questions') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No assessment questions available. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (type === 'sign-in' && !user) {
    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sign in to save your assessment results and track your progress over time.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
