import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from '@/components/ui/icons';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section4UserImpactProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section4UserImpact({ formData, onUpdate }: Section4UserImpactProps) {
  const userImpacts = formData.userImpacts || [];

  const addUserImpact = () => {
    onUpdate({
      userImpacts: [
        ...userImpacts,
        {
          userGroup: '',
          satisfactionRating: 3,
          userPainPoints: '',
          aiImprovements: '',
          impactRating: 3,
        },
      ],
    });
  };

  const removeUserImpact = (index: number) => {
    onUpdate({
      userImpacts: userImpacts.filter((_, i) => i !== index),
    });
  };

  const updateUserImpact = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...userImpacts];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ userImpacts: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Instructions:</strong> Identify different user groups and how AI could improve
          their experience.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 italic">
          Example: Voice-based interfaces to help visually impaired users
        </p>
      </div>

      <div className="space-y-4">
        {userImpacts.map((impact, index) => (
          <Card key={index} className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-destructive hover:text-destructive"
              onClick={() => removeUserImpact(index)}
              aria-label="Remove user group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pr-12">
              <h4 className="font-semibold">User Group #{index + 1}</h4>

              <div className="space-y-2">
                <Label htmlFor={`user-group-${index}`}>
                  User Group <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`user-group-${index}`}
                  value={impact.userGroup}
                  onChange={e => updateUserImpact(index, 'userGroup', e.target.value)}
                  placeholder="e.g., End Customers, Internal Sales Team"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Current Satisfaction (1-5)</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Poor</span>
                  <Slider
                    value={[impact.satisfactionRating]}
                    onValueChange={value => updateUserImpact(index, 'satisfactionRating', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">Excellent</span>
                  <span className="text-lg font-bold text-primary w-8 text-center">
                    {impact.satisfactionRating}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`user-pain-${index}`}>
                  User Pain Points <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`user-pain-${index}`}
                  value={impact.userPainPoints}
                  onChange={e => updateUserImpact(index, 'userPainPoints', e.target.value)}
                  placeholder="e.g., Slow response time"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ai-improvements-${index}`}>
                  AI Improvements <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`ai-improvements-${index}`}
                  value={impact.aiImprovements}
                  onChange={e => updateUserImpact(index, 'aiImprovements', e.target.value)}
                  placeholder="e.g., AI-powered instant responses"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Expected Impact (1-5)</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Low</span>
                  <Slider
                    value={[impact.impactRating]}
                    onValueChange={value => updateUserImpact(index, 'impactRating', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">High</span>
                  <span className="text-lg font-bold text-green-600 w-8 text-center">
                    {impact.impactRating}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addUserImpact} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add User Group
        </Button>
      </div>

      {userImpacts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No user groups added yet. Click "Add User Group" to get started.</p>
        </div>
      )}
    </div>
  );
}
