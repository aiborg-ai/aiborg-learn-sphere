/**
 * CourseAudienceStep Component
 * Step 4: Target audience selection and description
 */

import React from 'react';
import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AudienceSelector } from '@/components/studio/shared/AudienceSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData } from '@/types/studio.types';

export function CourseAudienceStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Target Audience</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define who this course is designed for
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Selecting the right audience helps us show your course to the most relevant students.
        </AlertDescription>
      </Alert>

      {/* Audience Selector */}
      <AudienceSelector
        selectedAudiences={data.audiences}
        onChange={audiences => onUpdate({ audiences })}
        label="Target Audiences"
        description="Select all audience types that would benefit from this course"
        required
      />

      {/* Target Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="target-description">Ideal Participant Description (Optional)</Label>
        <Textarea
          id="target-description"
          value={data.target_description || ''}
          onChange={e => onUpdate({ target_description: e.target.value })}
          placeholder="Describe the ideal participant for this course in more detail. For example: 'Mid-level managers looking to transition into executive roles' or 'Developers with 2+ years experience wanting to learn AI/ML'..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Provide additional context to help prospective students know if this course is right for
          them
        </p>
      </div>
    </div>
  );
}
