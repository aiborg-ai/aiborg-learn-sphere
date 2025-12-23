import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, TrendingUp } from '@/components/ui/icons';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section8CompetitiveProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section8Competitive({ formData, onUpdate }: Section8CompetitiveProps) {
  const competitors = formData.competitors || [];

  const addCompetitor = () => {
    onUpdate({
      competitors: [
        ...competitors,
        {
          competitorName: '',
          aiUseCase: '',
          advantage: '',
          threatLevel: 3,
        },
      ],
    });
  };

  const removeCompetitor = (index: number) => {
    onUpdate({
      competitors: competitors.filter((_, i) => i !== index),
    });
  };

  const updateCompetitor = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ competitors: updated });
  };

  const getThreatColor = (level: number) => {
    if (level >= 4) return 'text-red-600 dark:text-red-400';
    if (level >= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Instructions:</strong> Analyze how competitors are using AI and what advantage it
          gives them. This helps identify opportunities and threats.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 italic">
          Example: Competitor X uses AI personalization for higher retention (Threat level: 4)
        </p>
      </div>

      <div className="space-y-4">
        {competitors.map((competitor, index) => (
          <Card key={index} className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-destructive hover:text-destructive"
              onClick={() => removeCompetitor(index)}
              aria-label="Remove competitor"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pr-12">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Competitor #{index + 1}</h4>
                {competitor.threatLevel >= 3 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${getThreatColor(competitor.threatLevel)}`} />
                    <span
                      className={`text-sm font-semibold ${getThreatColor(competitor.threatLevel)}`}
                    >
                      Threat: {competitor.threatLevel}/5
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`competitor-name-${index}`}>
                  Competitor Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`competitor-name-${index}`}
                  value={competitor.competitorName}
                  onChange={e => updateCompetitor(index, 'competitorName', e.target.value)}
                  placeholder="e.g., Competitor X"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ai-use-case-${index}`}>
                  AI Use Case <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`ai-use-case-${index}`}
                  value={competitor.aiUseCase}
                  onChange={e => updateCompetitor(index, 'aiUseCase', e.target.value)}
                  placeholder="e.g., AI personalization, Automation, Predictive analytics"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`advantage-${index}`}>
                  Competitive Advantage Gained <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`advantage-${index}`}
                  value={competitor.advantage}
                  onChange={e => updateCompetitor(index, 'advantage', e.target.value)}
                  placeholder="e.g., Higher retention, Cost reduction, Better customer experience"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Threat Level (1-5)</div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Low</span>
                  <Slider
                    value={[competitor.threatLevel]}
                    onValueChange={value => updateCompetitor(index, 'threatLevel', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-20 text-right">Critical</span>
                  <span
                    className={`text-lg font-bold w-8 text-center ${getThreatColor(competitor.threatLevel)}`}
                  >
                    {competitor.threatLevel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How significant is the competitive threat from their AI implementation?
                </p>
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addCompetitor} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </Button>
      </div>

      {competitors.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No competitors added yet. Click "Add Competitor" to get started.</p>
        </div>
      )}
    </div>
  );
}
