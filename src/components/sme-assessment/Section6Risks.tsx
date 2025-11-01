import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section6RisksProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section6Risks({ formData, onUpdate }: Section6RisksProps) {
  const risks = formData.risks || [];

  const addRisk = () => {
    onUpdate({
      risks: [
        ...risks,
        {
          riskFactor: '',
          specificRisk: '',
          likelihood: 3,
          impactRating: 3,
          mitigationStrategy: '',
        },
      ],
    });
  };

  const removeRisk = (index: number) => {
    onUpdate({
      risks: risks.filter((_, i) => i !== index),
    });
  };

  const updateRisk = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...risks];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ risks: updated });
  };

  const riskFactors = [
    'Data Security',
    'Compliance',
    'User Acceptance',
    'Technical Complexity',
    'Cost Overrun',
  ];

  const getRiskLevel = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 20) return { label: 'Critical', color: 'text-red-600 dark:text-red-400' };
    if (score >= 12) return { label: 'High', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 6) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Low', color: 'text-green-600 dark:text-green-400' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Instructions:</strong> Identify potential risks and mitigation strategies.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 italic">
          Example: Data breaches (Likelihood: 3, Impact: 5) → Mitigation: Encryption, audits
        </p>
      </div>

      <div className="space-y-4">
        {risks.map((risk, index) => {
          const riskLevel = getRiskLevel(risk.likelihood, risk.impactRating);
          return (
            <Card key={index} className="p-6 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-destructive hover:text-destructive"
                onClick={() => removeRisk(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="space-y-4 pr-12">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Risk #{index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${riskLevel.color}`} />
                    <span className={`text-sm font-semibold ${riskLevel.color}`}>
                      {riskLevel.label} Risk
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`risk-factor-${index}`}>
                    Risk Factor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`risk-factor-${index}`}
                    value={risk.riskFactor}
                    onChange={e => updateRisk(index, 'riskFactor', e.target.value)}
                    placeholder="e.g., Data Security, Compliance, User Acceptance"
                    list={`risk-factors-${index}`}
                  />
                  <datalist id={`risk-factors-${index}`}>
                    {riskFactors.map(factor => (
                      <option key={factor} value={factor} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`specific-risk-${index}`}>
                    Specific Risk <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`specific-risk-${index}`}
                    value={risk.specificRisk}
                    onChange={e => updateRisk(index, 'specificRisk', e.target.value)}
                    placeholder="e.g., Data breaches, Regulatory risk"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Likelihood (1-5)</div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[risk.likelihood]}
                        onValueChange={value => updateRisk(index, 'likelihood', value[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-primary w-8 text-center">
                        {risk.likelihood}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Impact (1-5)</div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[risk.impactRating]}
                        onValueChange={value => updateRisk(index, 'impactRating', value[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-primary w-8 text-center">
                        {risk.impactRating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mitigation-${index}`}>
                    Mitigation Strategy <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id={`mitigation-${index}`}
                    value={risk.mitigationStrategy}
                    onChange={e => updateRisk(index, 'mitigationStrategy', e.target.value)}
                    placeholder="e.g., Encryption, regular audits, user training"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </Card>
          );
        })}

        <Button onClick={addRisk} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Risk
        </Button>
      </div>

      {risks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No risks added yet. Click "Add Risk" to get started.</p>
        </div>
      )}
    </div>
  );
}
