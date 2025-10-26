/**
 * CourseTemplates Component
 * Pre-defined templates to speed up course creation
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Course } from './types';

interface CourseTemplate {
  name: string;
  description: string;
  data: Partial<Course>;
  badge?: string;
}

const templates: CourseTemplate[] = [
  {
    name: 'AI Fundamentals Course',
    description: 'Beginner-level AI course template for professionals',
    badge: 'Popular',
    data: {
      category: 'AI',
      mode: 'Online',
      level: 'Beginner',
      duration: '8 weeks',
      price: '£89',
      audience: 'Professionals',
      audiences: ['Professionals', 'SMEs & Corporate'],
      features: [
        'Live Q&A sessions',
        'Hands-on projects',
        'Certificate of completion',
        'Lifetime access to materials',
      ],
      keywords: ['AI', 'Artificial Intelligence', 'Beginner', 'Online Course'],
      prerequisites: 'No prior experience required',
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0,
    },
  },
  {
    name: 'Corporate AI Workshop',
    description: 'Enterprise-level AI training for teams',
    data: {
      category: 'Corporate Training',
      mode: 'Hybrid',
      level: 'Intermediate',
      duration: '12 weeks',
      price: '£5,100',
      audience: 'SMEs & Corporate',
      audiences: ['SMEs & Corporate', 'Business Leaders'],
      features: [
        'Customized curriculum',
        'Team collaboration exercises',
        'ROI-focused projects',
        'Executive briefings',
        'Post-training support',
      ],
      keywords: ['Corporate Training', 'AI Strategy', 'Enterprise', 'Team Training'],
      prerequisites: 'Business decision-making authority recommended',
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0,
    },
  },
  {
    name: 'Teen AI Course',
    description: 'Fun and engaging AI course for teenagers',
    data: {
      category: 'Young Learners',
      mode: 'Online',
      level: 'Beginner',
      duration: '6 weeks',
      price: '£39',
      audience: 'Teens (13-18)',
      audiences: ['Teens (13-18)', 'Students'],
      features: [
        'Project-based learning',
        'Gamified challenges',
        'Peer collaboration',
        'College application boost',
      ],
      keywords: ['Teen', 'Student', 'AI for Kids', 'STEM Education'],
      prerequisites: 'Interest in technology and coding',
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0,
    },
  },
  {
    name: 'Kids AI Adventures',
    description: 'Interactive AI learning for young children',
    data: {
      category: 'Young Learners',
      mode: 'Online',
      level: 'Beginner',
      duration: '4 weeks',
      price: '£25',
      audience: 'Kids (6-12)',
      audiences: ['Kids (6-12)', 'Primary Students'],
      features: [
        'Fun animations',
        'Interactive games',
        'Parent dashboard',
        'No coding required',
        'Weekly progress reports',
      ],
      keywords: ['Kids', 'Elementary', 'Fun Learning', 'AI for Children'],
      prerequisites: 'None - designed for beginners',
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0,
    },
  },
  {
    name: 'Advanced ML Course',
    description: 'Deep dive into machine learning algorithms',
    data: {
      category: 'Machine Learning',
      mode: 'Online',
      level: 'Advanced',
      duration: '10 weeks',
      price: '£199',
      audience: 'Professionals',
      audiences: ['Professionals', 'Data Scientists', 'Developers'],
      features: [
        'Advanced algorithms',
        'Real-world datasets',
        'Industry case studies',
        'Capstone project',
        'Mentor support',
      ],
      keywords: ['Machine Learning', 'Advanced', 'Deep Learning', 'Neural Networks'],
      prerequisites: 'Python programming and statistics background required',
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0,
    },
  },
];

interface CourseTemplatesProps {
  onSelectTemplate: (template: Partial<Course>) => void;
}

export function CourseTemplates({ onSelectTemplate }: CourseTemplatesProps) {
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
                  {template.data.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.data.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.data.duration}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.data.price}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
