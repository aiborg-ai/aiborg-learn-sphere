/**
 * Placeholder Step Component
 *
 * Temporary component used for wizard steps that haven't been implemented yet.
 * Prevents runtime crashes from null! components while clearly indicating
 * the feature is incomplete.
 *
 * @deprecated This is a temporary placeholder. Replace with actual step components.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Code } from 'lucide-react';

interface PlaceholderStepProps {
  stepId: string;
  stepTitle: string;
  stepDescription: string;
  assetType: string;
}

export const PlaceholderStep = ({
  stepId,
  stepTitle,
  stepDescription,
  assetType,
}: PlaceholderStepProps) => {
  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Step Not Yet Implemented
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          This wizard step is planned but not yet available. The component needs to be created.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {stepTitle}
          </CardTitle>
          <CardDescription>{stepDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Technical Details:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong>Asset Type:</strong> {assetType}
              </li>
              <li>
                <strong>Step ID:</strong> {stepId}
              </li>
              <li>
                <strong>Component Path:</strong> src/components/studio/steps/{assetType}/{stepId}
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              To implement this step, create a new component:
            </p>
            <code className="block text-xs bg-muted px-3 py-2 rounded">
              src/components/studio/steps/{assetType}/
              {stepId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')}
              Step.tsx
            </code>
            <Button variant="outline" size="sm" disabled>
              <Code className="h-4 w-4 mr-2" />
              Create Component (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>For now:</strong> You can skip this step by clicking "Next" or use the navigation
          buttons to move between steps. Your progress will be saved.
        </AlertDescription>
      </Alert>
    </div>
  );
};

/**
 * Factory function to create placeholder components for specific steps
 * This allows us to pass step-specific information while maintaining
 * the same component structure
 */
export const createPlaceholderStep =
  (stepId: string, stepTitle: string, stepDescription: string, assetType: string) => () => (
    <PlaceholderStep
      stepId={stepId}
      stepTitle={stepTitle}
      stepDescription={stepDescription}
      assetType={assetType}
    />
  );
