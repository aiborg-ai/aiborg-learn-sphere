/**
 * Generate Predictions Button
 *
 * Triggers the Edge Function to generate ML predictions for all learners
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function GeneratePredictionsButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePredictions = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-learner-predictions', {
        body: {
          prediction_types: ['engagement', 'at_risk', 'completion'],
        },
      });

      if (error) throw error;

      toast({
        title: 'Predictions Generated',
        description: `Successfully generated ${data.predictions_generated} predictions and created ${data.alerts_created} alerts`,
      });

      // Refresh the page to show new predictions
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate predictions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleGeneratePredictions} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Brain className="mr-2 h-4 w-4" />
          Generate Predictions
        </>
      )}
    </Button>
  );
}
