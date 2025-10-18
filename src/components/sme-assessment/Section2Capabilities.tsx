import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AssessmentFormData, AIAdoptionLevel } from '@/types/aiAssessment';

interface Section2CapabilitiesProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section2Capabilities({ formData, onUpdate }: Section2CapabilitiesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-sm font-medium">
          Current AI adoption level <span className="text-red-500">*</span>
        </div>
        <RadioGroup
          value={formData.currentAIAdoptionLevel || 'none'}
          onValueChange={(value: AIAdoptionLevel) =>
            onUpdate({ currentAIAdoptionLevel: value })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none" className="font-normal cursor-pointer">
              None - No current AI implementation
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="experimentation" id="experimentation" />
            <Label htmlFor="experimentation" className="font-normal cursor-pointer">
              Experimentation - Testing AI tools in pilot projects
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="partial" id="partial" />
            <Label htmlFor="partial" className="font-normal cursor-pointer">
              Partial Implementation - AI used in some departments/processes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full-scale" id="full-scale" />
            <Label htmlFor="full-scale" className="font-normal cursor-pointer">
              Full-scale Deployment - AI integrated across the organization
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium">
          Internal AI Expertise (1-5) <span className="text-red-500">*</span>
        </div>
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">1 - No expertise</span>
              <span className="text-2xl font-bold text-primary">
                {formData.internalAIExpertise || 1}
              </span>
              <span className="text-sm text-muted-foreground">5 - Expert team</span>
            </div>
            <Slider
              value={[formData.internalAIExpertise || 1]}
              onValueChange={(value) => onUpdate({ internalAIExpertise: value[0] })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          Example: 2 = Limited expertise (may need to hire or train)
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium">
          Data Availability - Quality, Volume, Accessibility (1-5){' '}
          <span className="text-red-500">*</span>
        </div>
        <Card className="p-6 bg-muted/30">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">1 - Poor data</span>
              <span className="text-2xl font-bold text-primary">
                {formData.dataAvailabilityRating || 1}
              </span>
              <span className="text-sm text-muted-foreground">5 - Excellent data</span>
            </div>
            <Slider
              value={[formData.dataAvailabilityRating || 1]}
              onValueChange={(value) => onUpdate({ dataAvailabilityRating: value[0] })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          Example: 3 = Moderate - some data available but needs organization
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalCapabilities">Additional AI capabilities required:</Label>
        <Textarea
          id="additionalCapabilities"
          value={formData.additionalAICapabilities || ''}
          onChange={(e) => onUpdate({ additionalAICapabilities: e.target.value })}
          placeholder='e.g., "Hire or train data scientists familiar with NLP models."'
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          List any specific expertise, tools, or infrastructure needed
        </p>
      </div>
    </div>
  );
}
