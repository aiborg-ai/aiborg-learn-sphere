/**
 * AssessmentToolsSection Component
 * Displays assessment tools section on the home page
 * Filtered by selected audience from PersonalizationContext
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AssessmentToolCard } from './AssessmentToolCard';
import { useAssessmentTools } from '@/hooks/useAssessmentTools';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { Brain, AlertCircle, ChevronRight, Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface AssessmentToolsSectionProps {
  className?: string;
}

export function AssessmentToolsSection({ className }: AssessmentToolsSectionProps) {
  const { selectedAudience } = usePersonalization();
  const { data: tools, isLoading, error } = useAssessmentTools(selectedAudience);
  const [showAll, setShowAll] = useState(false);

  // Filter out locked tools for display (optional - you can show them grayed out)
  const availableTools = tools?.filter(tool => !tool.is_locked) || [];
  const displayedTools = showAll ? availableTools : availableTools.slice(0, 3);

  if (isLoading) {
    return (
      <section className={cn('py-16 bg-muted/30', className)}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn('py-16 bg-muted/30', className)}>
        <div className="container max-w-7xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load assessment tools. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  // Don't render section if no tools available for this audience
  if (!availableTools || availableTools.length === 0) {
    return null;
  }

  return (
    <section id="assessment-tools" className={cn('py-16 bg-muted/30', className)}>
      <div className="container max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Brain className="h-8 w-8" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Assessment Tools</h2>

          <p className="text-lg text-muted-foreground">
            Test your AI knowledge and skills with our adaptive assessments. Track your progress,
            earn achievements, and get personalized recommendations.
          </p>
        </div>

        {/* Assessment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedTools.map(tool => (
            <AssessmentToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Show More/Less Button */}
        {availableTools.length > 3 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(!showAll)}
              className="group"
            >
              {showAll ? 'Show Less' : `View All ${availableTools.length} Assessments`}
              <ChevronRight
                className={cn('ml-2 h-4 w-4 transition-transform', showAll && 'rotate-90')}
              />
            </Button>
          </div>
        )}

        {/* Info box */}
        <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{availableTools.length}</div>
              <div className="text-sm text-muted-foreground">Assessments Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Adaptive</div>
              <div className="text-sm text-muted-foreground">AI-Powered Testing</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Unlimited</div>
              <div className="text-sm text-muted-foreground">Retakes & Progress Tracking</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
