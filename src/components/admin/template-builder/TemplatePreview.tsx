import { Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { TemplateFormData, TemplateType } from './types';

interface TemplatePreviewProps {
  templateType: TemplateType;
  formData: TemplateFormData;
}

export function TemplatePreview({ templateType, formData }: TemplatePreviewProps) {
  const renderValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value || 'Not set');
  };

  const groupedData = Object.entries(formData).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length === 0) return acc;

      const category = ['title', 'name', 'description', 'price'].includes(key)
        ? 'basic'
        : ['category', 'level', 'mode', 'event_type'].includes(key)
        ? 'classification'
        : ['date', 'time', 'duration', 'start_date'].includes(key)
        ? 'schedule'
        : ['features', 'keywords', 'tags', 'speakers', 'agenda'].includes(key)
        ? 'details'
        : 'other';

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ key, value });
    }
    return acc;
  }, {} as Record<string, Array<{ key: string; value: unknown }>>);

  const categoryTitles = {
    basic: 'Basic Information',
    classification: 'Classification',
    schedule: 'Schedule',
    details: 'Additional Details',
    other: 'Other Settings'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <CardTitle>Template Preview</CardTitle>
        </div>
        <CardDescription>
          Preview of your {templateType} template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(formData).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No data to preview yet. Start filling out the form to see a preview.
          </p>
        ) : (
          <>
            {Object.entries(groupedData).map(([category, fields]) => (
              <div key={category} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {categoryTitles[category as keyof typeof categoryTitles]}
                  </h3>
                  <Separator />
                </div>

                <div className="grid gap-4">
                  {fields.map(({ key, value }) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {key.split('_').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-1">
                            {value.map((item, index) => (
                              <Badge key={index} variant="secondary">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : typeof value === 'boolean' ? (
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        ) : (
                          <p className="text-sm">{renderValue(value)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2">JSON Output</h4>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
