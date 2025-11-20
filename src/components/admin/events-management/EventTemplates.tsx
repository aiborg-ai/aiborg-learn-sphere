/**
 * EventTemplates Component
 * Pre-defined templates to speed up event creation
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from '@/components/ui/icons';
import { Event } from './types';

interface EventTemplate {
  name: string;
  description: string;
  data: Partial<Event>;
  badge?: string;
}

const templates: EventTemplate[] = [
  {
    name: 'AI Workshop',
    description: 'Hands-on AI workshop template',
    badge: 'Popular',
    data: {
      event_type: 'workshop',
      location: 'Tech Hub London',
      max_capacity: 50,
      event_time: '10:00',
      is_active: true,
      is_visible: true,
      is_past: false,
    },
  },
  {
    name: 'Online Webinar',
    description: 'Virtual webinar event',
    data: {
      event_type: 'webinar',
      location: 'Online (Zoom)',
      max_capacity: 200,
      event_time: '14:00',
      is_active: true,
      is_visible: true,
      is_past: false,
    },
  },
  {
    name: 'ML Bootcamp',
    description: 'Intensive machine learning bootcamp',
    data: {
      event_type: 'bootcamp',
      location: 'Hybrid (Online + In-person)',
      max_capacity: 30,
      event_time: '09:00',
      is_active: true,
      is_visible: true,
      is_past: false,
    },
  },
  {
    name: 'AI Seminar',
    description: 'Educational seminar on AI topics',
    data: {
      event_type: 'seminar',
      location: 'University Auditorium',
      max_capacity: 100,
      event_time: '18:00',
      is_active: true,
      is_visible: true,
      is_past: false,
    },
  },
];

interface EventTemplatesProps {
  onSelectTemplate: (template: Partial<Event>) => void;
}

export function EventTemplates({ onSelectTemplate }: EventTemplatesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Start from a Template</h3>
      </div>
      <div className="grid gap-3">
        {templates.map((template, index) => (
          <Card key={index} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    {template.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {template.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectTemplate(template.data)}
                  className="ml-2"
                >
                  Use Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {template.data.event_type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.data.location}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Max: {template.data.max_capacity}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
