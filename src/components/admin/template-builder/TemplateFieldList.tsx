import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TemplateField } from './types';
import { FieldEditor } from './FieldEditor';

interface TemplateFieldListProps {
  title: string;
  description: string;
  fields: TemplateField[];
  formData: Record<string, unknown>;
  arrayInputs: Record<string, string>;
  errors: Record<string, string>;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onFieldChange: (field: TemplateField, value: unknown) => void;
  onArrayInputChange: (fieldName: string, value: string) => void;
  onArrayAdd: (fieldName: string) => void;
  onArrayRemove: (fieldName: string, index: number) => void;
  badgeVariant?: 'destructive' | 'secondary';
  getBadgeContent: () => string;
}

export function TemplateFieldList({
  title,
  description,
  fields,
  formData,
  arrayInputs,
  errors,
  isExpanded,
  onToggleExpanded,
  onFieldChange,
  onArrayInputChange,
  onArrayAdd,
  onArrayRemove,
  badgeVariant = 'secondary',
  getBadgeContent,
}: TemplateFieldListProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggleExpanded}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={badgeVariant}>{getBadgeContent()}</Badge>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {fields.map(field => (
              <FieldEditor
                key={field.name}
                field={field}
                value={formData[field.name]}
                error={errors[field.name]}
                arrayInput={arrayInputs[field.name]}
                onFieldChange={onFieldChange}
                onArrayInputChange={onArrayInputChange}
                onArrayAdd={onArrayAdd}
                onArrayRemove={onArrayRemove}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
