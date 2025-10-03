import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section1MissionProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section1Mission({ formData, onUpdate }: Section1MissionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="companyName"
          value={formData.companyName || ''}
          onChange={(e) => onUpdate({ companyName: e.target.value })}
          placeholder="Enter your company name"
          className="max-w-md"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyMission">
          Company Mission Statement <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="companyMission"
          value={formData.companyMission || ''}
          onChange={(e) => onUpdate({ companyMission: e.target.value })}
          placeholder='e.g., "Empower small businesses through affordable digital solutions."'
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Describe your company's core mission and values
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aiEnhancement">
          How specifically could AI enhance your mission? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="aiEnhancement"
          value={formData.aiEnhancementDescription || ''}
          onChange={(e) => onUpdate({ aiEnhancementDescription: e.target.value })}
          placeholder='e.g., "Automate repetitive tasks, enabling businesses to reduce operational costs."'
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Explain how AI could help you achieve your mission more effectively
        </p>
      </div>

      <div className="space-y-4">
        <Label>
          Rate strategic alignment of AI with your mission (1-5){' '}
          <span className="text-red-500">*</span>
        </Label>
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">1 - No alignment</span>
              <span className="text-2xl font-bold text-primary">
                {formData.strategicAlignmentRating || 3}
              </span>
              <span className="text-sm text-muted-foreground">5 - Perfect alignment</span>
            </div>
            <Slider
              value={[formData.strategicAlignmentRating || 3]}
              onValueChange={(value) => onUpdate({ strategicAlignmentRating: value[0] })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Example:</strong> A rating of 4 would indicate that AI adoption strongly aligns
          with your mission, enhances efficiency, and increases customer satisfaction.
        </p>
      </div>
    </div>
  );
}
