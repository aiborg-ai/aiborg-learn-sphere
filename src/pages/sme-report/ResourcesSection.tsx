import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from '@/components/ui/icons';
import type { ResourcesSectionProps } from './types';

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  if (resources.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Resource Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{resource.resource_type}</h3>
                {resource.additional_requirements && (
                  <p className="text-sm text-muted-foreground">
                    {resource.additional_requirements}
                  </p>
                )}
              </div>
              <Badge variant={resource.is_available ? 'default' : 'secondary'}>
                {resource.is_available ? 'Available' : 'Required'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
