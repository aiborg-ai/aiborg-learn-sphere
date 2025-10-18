
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, CheckCircle2, Target } from 'lucide-react';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section9ActionPlanProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section9ActionPlan({ formData, onUpdate }: Section9ActionPlanProps) {
  const nextSteps = formData.recommendedNextSteps || [];

  const addNextStep = () => {
    onUpdate({
      recommendedNextSteps: [...nextSteps, ''],
    });
  };

  const removeNextStep = (index: number) => {
    onUpdate({
      recommendedNextSteps: nextSteps.filter((_, i) => i !== index),
    });
  };

  const updateNextStep = (index: number, value: string) => {
    const updated = [...nextSteps];
    updated[index] = value;
    onUpdate({ recommendedNextSteps: updated });
  };

  const suggestedSteps = [
    'Finalize AI pilot project',
    'Allocate necessary resources',
    'Establish AI steering committee',
    'Conduct team training workshops',
    'Set up data infrastructure',
    'Define success metrics and KPIs',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-900 dark:text-green-100 mb-1">
              Final Section: Implementation Decision & Action Plan
            </p>
            <p className="text-green-700 dark:text-green-300">
              Summarize your findings and create a roadmap for AI adoption
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="benefit-summary">
          Summarize benefit of AI adoption <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="benefit-summary"
          value={formData.aiAdoptionBenefitSummary || ''}
          onChange={(e) => onUpdate({ aiAdoptionBenefitSummary: e.target.value })}
          placeholder='e.g., "AI adoption strongly aligns with mission, enhances efficiency, and increases user satisfaction."'
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Provide a concise summary of the key benefits and strategic value
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium">
          Overall AI Opportunity Rating (1-5) <span className="text-red-500">*</span>
        </div>
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">1 - Low opportunity</span>
              <span className="text-3xl font-bold text-primary">
                {formData.overallOpportunityRating || 3}
              </span>
              <span className="text-sm text-muted-foreground">5 - Excellent opportunity</span>
            </div>
            <Slider
              value={[formData.overallOpportunityRating || 3]}
              onValueChange={(value) => onUpdate({ overallOpportunityRating: value[0] })}
              min={1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          Based on all sections, rate the overall AI opportunity for your organization
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Recommended Next Steps <span className="text-red-500">*</span></div>
          <span className="text-xs text-muted-foreground">Add 3-5 actionable steps</span>
        </div>

        {nextSteps.map((step, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-3" />
                <Input
                  id={`next-step-${index}`}
                  value={step}
                  onChange={(e) => updateNextStep(index, e.target.value)}
                  placeholder={`Step ${index + 1}: e.g., ${suggestedSteps[index % suggestedSteps.length]}`}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNextStep(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button onClick={addNextStep} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Next Step
        </Button>

        {nextSteps.length === 0 && (
          <Card className="p-6 bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              No steps added yet. Add recommended actions for AI implementation.
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="completed-by">
          Completed By <span className="text-red-500">*</span>
        </Label>
        <Input
          id="completed-by"
          value={formData.completedBy || ''}
          onChange={(e) => onUpdate({ completedBy: e.target.value })}
          placeholder="Your name or role"
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground">Name of the person completing this assessment</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Suggested Next Steps:</strong>
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
          {suggestedSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
