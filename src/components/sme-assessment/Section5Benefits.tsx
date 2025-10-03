
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section5BenefitsProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section5Benefits({ formData, onUpdate }: Section5BenefitsProps) {
  const benefits = formData.benefits || [];

  const addBenefit = () => {
    onUpdate({
      benefits: [
        ...benefits,
        {
          benefitArea: '',
          currentStatus: '',
          aiImprovement: '',
          impactRating: 3,
        },
      ],
    });
  };

  const removeBenefit = (index: number) => {
    onUpdate({
      benefits: benefits.filter((_, i) => i !== index),
    });
  };

  const updateBenefit = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...benefits];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ benefits: updated });
  };

  const benefitAreas = ['Efficiency', 'Revenue', 'Customer Satisfaction', 'Innovation', 'Cost Reduction', 'Quality'];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Instructions:</strong> Analyze business-focused benefits from AI adoption.
          Common areas include: Efficiency, Revenue, Customer Satisfaction, Innovation
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 italic">
          Example: Process time reduced from 48 hrs to 2 hrs → Impact rating: 5
        </p>
      </div>

      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-destructive hover:text-destructive"
              onClick={() => removeBenefit(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pr-12">
              <h4 className="font-semibold">Benefit #{index + 1}</h4>

              <div className="space-y-2">
                <Label htmlFor={`benefit-area-${index}`}>
                  Benefit Area <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`benefit-area-${index}`}
                  value={benefit.benefitArea}
                  onChange={(e) => updateBenefit(index, 'benefitArea', e.target.value)}
                  placeholder="e.g., Efficiency, Revenue, Customer Satisfaction"
                  list={`benefit-areas-${index}`}
                />
                <datalist id={`benefit-areas-${index}`}>
                  {benefitAreas.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`current-status-${index}`}>
                  Current Status <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`current-status-${index}`}
                  value={benefit.currentStatus}
                  onChange={(e) => updateBenefit(index, 'currentStatus', e.target.value)}
                  placeholder="e.g., Process = 48 hrs, Conversion rate 2%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ai-improvement-${index}`}>
                  AI Improvement Target <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`ai-improvement-${index}`}
                  value={benefit.aiImprovement}
                  onChange={(e) => updateBenefit(index, 'aiImprovement', e.target.value)}
                  placeholder="e.g., Reduce to 2 hrs, Increase to 4%"
                />
              </div>

              <div className="space-y-3">
                <Label>Expected Business Impact (1-5)</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Low</span>
                  <Slider
                    value={[benefit.impactRating]}
                    onValueChange={(value) => updateBenefit(index, 'impactRating', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">High</span>
                  <span className="text-lg font-bold text-green-600 w-8 text-center">
                    {benefit.impactRating}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addBenefit} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      {benefits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No benefits added yet. Click "Add Benefit" to get started.</p>
        </div>
      )}
    </div>
  );
}
