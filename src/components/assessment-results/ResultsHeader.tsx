import React from 'react';
import { Link } from 'react-router-dom';

interface ResultsHeaderProps {
  completedAt: string;
}

export function ResultsHeader({ completedAt }: ResultsHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        to="/ai-assessment"
        className="text-primary hover:underline flex items-center gap-2 mb-4"
      >
        ← Back to Assessment
      </Link>
      <h1 className="text-4xl font-bold mb-2">Your AI Augmentation Results</h1>
      <p className="text-muted-foreground">
        Completed on {new Date(completedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
