/**
 * AudienceSelector Component
 * Multi-select component for choosing target audiences
 */

import React from 'react';
import { Users, Check } from '@/components/ui/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AudienceSelectorProps {
  selectedAudiences: string[];
  onChange: (audiences: string[]) => void;
  availableAudiences?: string[];
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

// Default audience options
const DEFAULT_AUDIENCES = [
  {
    value: 'students',
    label: 'Students',
    description: 'Individual learners and students',
  },
  {
    value: 'professionals',
    label: 'Professionals',
    description: 'Working professionals seeking upskilling',
  },
  {
    value: 'executives',
    label: 'Executives',
    description: 'C-level executives and senior management',
  },
  {
    value: 'teams',
    label: 'Teams',
    description: 'Corporate teams and departments',
  },
  {
    value: 'educators',
    label: 'Educators',
    description: 'Teachers and educational professionals',
  },
  {
    value: 'developers',
    label: 'Developers',
    description: 'Software developers and engineers',
  },
  {
    value: 'designers',
    label: 'Designers',
    description: 'UI/UX designers and creative professionals',
  },
  {
    value: 'managers',
    label: 'Managers',
    description: 'Project and product managers',
  },
  {
    value: 'entrepreneurs',
    label: 'Entrepreneurs',
    description: 'Startup founders and business owners',
  },
  {
    value: 'consultants',
    label: 'Consultants',
    description: 'Independent consultants and advisors',
  },
];

export function AudienceSelector({
  selectedAudiences,
  onChange,
  availableAudiences,
  label = 'Target Audience',
  description = 'Select one or more target audiences for this content',
  required,
  error,
  className,
}: AudienceSelectorProps) {
  // Use provided audiences or defaults
  const audiences = availableAudiences
    ? availableAudiences.map(aud => ({
        value: aud,
        label: aud,
        description: '',
      }))
    : DEFAULT_AUDIENCES;

  // Toggle audience selection
  const toggleAudience = (audienceValue: string) => {
    const isSelected = selectedAudiences.includes(audienceValue);
    if (isSelected) {
      onChange(selectedAudiences.filter(a => a !== audienceValue));
    } else {
      onChange([...selectedAudiences, audienceValue]);
    }
  };

  // Select all
  const selectAll = () => {
    onChange(audiences.map(a => a.value));
  };

  // Clear all
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <Label>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button type="button" onClick={clearAll} className="text-xs text-primary hover:underline">
            Clear All
          </button>
        </div>
      </div>

      {/* Selected Count Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={selectedAudiences.length > 0 ? 'default' : 'secondary'}>
          <Users className="w-3 h-3 mr-1" />
          {selectedAudiences.length} selected
        </Badge>
      </div>

      {/* Audience Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map(audience => {
          const isSelected = selectedAudiences.includes(audience.value);
          return (
            <Card
              key={audience.value}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'border-primary bg-primary/5',
                error && 'border-destructive'
              )}
              onClick={() => toggleAudience(audience.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={audience.value}
                    checked={isSelected}
                    onCheckedChange={() => toggleAudience(audience.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={audience.value} className="font-medium cursor-pointer">
                      {audience.label}
                    </Label>
                    {audience.description && (
                      <p className="text-xs text-muted-foreground mt-1">{audience.description}</p>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Selected Audiences Summary */}
      {selectedAudiences.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Selected Audiences:</p>
            <div className="flex flex-wrap gap-2">
              {selectedAudiences.map(audienceValue => {
                const audience = audiences.find(a => a.value === audienceValue);
                return (
                  <Badge key={audienceValue} variant="secondary">
                    {audience?.label || audienceValue}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
