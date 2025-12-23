import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from '@/components/ui/icons';
import type { AssessmentFormData } from '@/types/aiAssessment';

interface Section7ResourcesProps {
  formData: Partial<AssessmentFormData>;
  onUpdate: (data: Partial<AssessmentFormData>) => void;
}

export function Section7Resources({ formData, onUpdate }: Section7ResourcesProps) {
  const resources = formData.resources || [];

  const addResource = () => {
    onUpdate({
      resources: [
        ...resources,
        {
          resourceType: '',
          isAvailable: false,
          additionalRequirements: '',
        },
      ],
    });
  };

  const removeResource = (index: number) => {
    onUpdate({
      resources: resources.filter((_, i) => i !== index),
    });
  };

  const updateResource = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ resources: updated });
  };

  const resourceTypes = [
    'AI Talent',
    'Infrastructure',
    'Budget',
    'Training',
    'Data',
    'Tools & Software',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>Instructions:</strong> Assess what resources you currently have and what
          additional requirements are needed for AI implementation.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 italic">
          Example: AI Talent - No → Hire 2 AI specialists
        </p>
      </div>

      <div className="space-y-4">
        {resources.map((resource, index) => (
          <Card key={index} className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-destructive hover:text-destructive"
              onClick={() => removeResource(index)}
              aria-label="Remove resource"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pr-12">
              <h4 className="font-semibold">Resource #{index + 1}</h4>

              <div className="space-y-2">
                <Label htmlFor={`resource-type-${index}`}>
                  Resource Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`resource-type-${index}`}
                  value={resource.resourceType}
                  onChange={e => updateResource(index, 'resourceType', e.target.value)}
                  placeholder="e.g., AI Talent, Infrastructure, Budget, Training"
                  list={`resource-types-${index}`}
                />
                <datalist id={`resource-types-${index}`}>
                  {resourceTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`available-${index}`}
                  checked={resource.isAvailable}
                  onCheckedChange={checked =>
                    updateResource(index, 'isAvailable', checked === true)
                  }
                />
                <Label htmlFor={`available-${index}`} className="font-normal cursor-pointer">
                  Resource is currently available
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`requirements-${index}`}>
                  Additional Requirements
                  {!resource.isAvailable && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id={`requirements-${index}`}
                  value={resource.additionalRequirements}
                  onChange={e => updateResource(index, 'additionalRequirements', e.target.value)}
                  placeholder={
                    resource.isAvailable
                      ? 'Any upgrades or enhancements needed'
                      : 'What needs to be acquired or developed'
                  }
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addResource} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {resources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No resources added yet. Click "Add Resource" to get started.</p>
        </div>
      )}
    </div>
  );
}
