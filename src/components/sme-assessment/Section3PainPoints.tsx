import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section3PainPointsProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section3PainPoints({ formData, onUpdate }: Section3PainPointsProps) {
  const painPoints = formData.painPoints || [];

  const addPainPoint = () => {
    onUpdate({
      painPoints: [
        ...painPoints,
        {
          painPoint: '',
          currentImpact: 3,
          aiCapabilityToAddress: '',
          impactAfterAI: 2,
        },
      ],
    });
  };

  const removePainPoint = (index: number) => {
    onUpdate({
      painPoints: painPoints.filter((_, i) => i !== index),
    });
  };

  const updatePainPoint = (index: number, field: string, value: string | number) => {
    const updated = [...painPoints];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ painPoints: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Instructions:</strong> Identify key pain points in your product or operations and
          how AI could address them. Add at least 2-3 pain points for a comprehensive assessment.
        </p>
      </div>

      <div className="space-y-4">
        {painPoints.map((painPoint, index) => (
          <Card key={index} className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-destructive hover:text-destructive"
              onClick={() => removePainPoint(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pr-12">
              <h4 className="font-semibold">Pain Point #{index + 1}</h4>

              <div className="space-y-2">
                <Label htmlFor={`pain-point-${index}`}>
                  Pain Point Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`pain-point-${index}`}
                  value={painPoint.painPoint}
                  onChange={e => updatePainPoint(index, 'painPoint', e.target.value)}
                  placeholder="e.g., Slow onboarding"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Current Impact (1-5)</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Low</span>
                  <Slider
                    value={[painPoint.currentImpact]}
                    onValueChange={value => updatePainPoint(index, 'currentImpact', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">High</span>
                  <span className="text-lg font-bold text-primary w-8 text-center">
                    {painPoint.currentImpact}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ai-capability-${index}`}>
                  AI Capability to Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`ai-capability-${index}`}
                  value={painPoint.aiCapabilityToAddress}
                  onChange={e => updatePainPoint(index, 'aiCapabilityToAddress', e.target.value)}
                  placeholder="e.g., Chatbots/Automation"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Impact After AI Implementation (1-5)</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Low</span>
                  <Slider
                    value={[painPoint.impactAfterAI]}
                    onValueChange={value => updatePainPoint(index, 'impactAfterAI', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">High</span>
                  <span className="text-lg font-bold text-green-600 w-8 text-center">
                    {painPoint.impactAfterAI}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addPainPoint} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Pain Point
        </Button>
      </div>

      {painPoints.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No pain points added yet. Click "Add Pain Point" to get started.</p>
        </div>
      )}
    </div>
  );
}
