/**
 * Course Templates
 *
 * Pre-built course templates for different industries and use cases
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  TrendingUp,
  Users,
  Code,
  GraduationCap,
  Sparkles,
  Clock,
  FileText,
} from '@/components/ui/icons';
import type { ContentBlockType } from './ContentBlockTypes';

export interface CourseTemplateBlock {
  type: ContentBlockType;
  data: Record<string, unknown>;
}

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  duration: string; // e.g., "2 hours", "1 week"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  structure: {
    sections: {
      title: string;
      lessons: {
        title: string;
        blocks: CourseTemplateBlock[];
      }[];
    }[];
  };
  thumbnail?: string;
}

export const courseTemplates: CourseTemplate[] = [
  // Compliance Training
  {
    id: 'compliance-basic',
    name: 'Compliance Training',
    description: 'Standard compliance training with policy review, quiz, and certification',
    category: 'Compliance',
    icon: Shield,
    duration: '1 hour',
    difficulty: 'beginner',
    tags: ['compliance', 'policy', 'certification'],
    structure: {
      sections: [
        {
          title: 'Introduction',
          lessons: [
            {
              title: 'Welcome & Overview',
              blocks: [
                { type: 'heading', data: { content: 'Course Overview', level: 2 } },
                {
                  type: 'text',
                  data: {
                    content:
                      '<p>Welcome to this compliance training course. This training will help you understand our company policies and procedures.</p>',
                  },
                },
                { type: 'video', data: { url: '', title: 'Introduction Video' } },
                {
                  type: 'callout',
                  data: {
                    content: 'Please complete all sections to receive your certificate.',
                    variant: 'info',
                  },
                },
              ],
            },
          ],
        },
        {
          title: 'Policy Review',
          lessons: [
            {
              title: 'Key Policies',
              blocks: [
                { type: 'heading', data: { content: 'Company Policies', level: 2 } },
                { type: 'document', data: { url: '', title: 'Policy Document' } },
                {
                  type: 'text',
                  data: {
                    content:
                      '<p>Review the above document carefully. You will be tested on this material.</p>',
                  },
                },
              ],
            },
            {
              title: 'Case Studies',
              blocks: [
                { type: 'heading', data: { content: 'Real-World Scenarios', level: 2 } },
                {
                  type: 'callout',
                  data: { content: 'Consider how you would handle each scenario.', variant: 'tip' },
                },
                { type: 'text', data: { content: '' } },
              ],
            },
          ],
        },
        {
          title: 'Assessment',
          lessons: [
            {
              title: 'Final Quiz',
              blocks: [
                { type: 'heading', data: { content: 'Knowledge Check', level: 2 } },
                { type: 'text', data: { content: '<p>You must score 80% or higher to pass.</p>' } },
                { type: 'quiz', data: { questions: [], passingScore: 80, allowRetry: true } },
              ],
            },
          ],
        },
      ],
    },
  },

  // Sales Training
  {
    id: 'sales-onboarding',
    name: 'Sales Onboarding',
    description: 'New sales rep onboarding with product knowledge, pitch practice, and role-play',
    category: 'Sales',
    icon: TrendingUp,
    duration: '4 hours',
    difficulty: 'intermediate',
    tags: ['sales', 'onboarding', 'product'],
    structure: {
      sections: [
        {
          title: 'Product Knowledge',
          lessons: [
            {
              title: 'Product Overview',
              blocks: [
                { type: 'heading', data: { content: 'Our Products', level: 2 } },
                { type: 'video', data: { url: '', title: 'Product Demo' } },
                { type: 'text', data: { content: '' } },
              ],
            },
            {
              title: 'Features & Benefits',
              blocks: [
                { type: 'heading', data: { content: 'Key Features', level: 2 } },
                {
                  type: 'table',
                  data: { headers: ['Feature', 'Benefit', 'Talk Track'], rows: [] },
                },
              ],
            },
          ],
        },
        {
          title: 'Sales Process',
          lessons: [
            {
              title: 'Sales Methodology',
              blocks: [
                { type: 'heading', data: { content: 'Our Sales Approach', level: 2 } },
                { type: 'text', data: { content: '' } },
                { type: 'image', data: { url: '', alt: 'Sales process diagram' } },
              ],
            },
            {
              title: 'Handling Objections',
              blocks: [
                { type: 'heading', data: { content: 'Common Objections', level: 2 } },
                { type: 'text', data: { content: '' } },
                {
                  type: 'callout',
                  data: {
                    content: 'Practice these responses until they feel natural.',
                    variant: 'tip',
                  },
                },
              ],
            },
          ],
        },
        {
          title: 'Practice',
          lessons: [
            {
              title: 'Role Play Scenarios',
              blocks: [
                { type: 'heading', data: { content: 'Practice Sessions', level: 2 } },
                {
                  type: 'assignment',
                  data: {
                    title: 'Record Your Pitch',
                    description: 'Record a 3-minute pitch for our main product.',
                    submissionType: 'video',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // Employee Onboarding
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'General employee onboarding covering culture, tools, and expectations',
    category: 'HR',
    icon: Users,
    duration: '2 hours',
    difficulty: 'beginner',
    tags: ['onboarding', 'hr', 'culture'],
    structure: {
      sections: [
        {
          title: 'Welcome',
          lessons: [
            {
              title: 'Welcome to the Team',
              blocks: [
                { type: 'heading', data: { content: 'Welcome!', level: 2 } },
                { type: 'video', data: { url: '', title: 'CEO Welcome Message' } },
                { type: 'text', data: { content: '' } },
              ],
            },
          ],
        },
        {
          title: 'Company Culture',
          lessons: [
            {
              title: 'Our Values',
              blocks: [
                { type: 'heading', data: { content: 'Core Values', level: 2 } },
                { type: 'text', data: { content: '' } },
              ],
            },
          ],
        },
        {
          title: 'Tools & Systems',
          lessons: [
            {
              title: 'Getting Started',
              blocks: [
                { type: 'heading', data: { content: 'Your Toolkit', level: 2 } },
                { type: 'text', data: { content: '' } },
                { type: 'download', data: { title: 'Setup Guide', url: '' } },
              ],
            },
          ],
        },
      ],
    },
  },

  // Technical Training
  {
    id: 'technical-skills',
    name: 'Technical Skills',
    description: 'Technical training with code examples, exercises, and projects',
    category: 'Technical',
    icon: Code,
    duration: '8 hours',
    difficulty: 'advanced',
    tags: ['technical', 'coding', 'hands-on'],
    structure: {
      sections: [
        {
          title: 'Fundamentals',
          lessons: [
            {
              title: 'Core Concepts',
              blocks: [
                { type: 'heading', data: { content: 'Introduction', level: 2 } },
                { type: 'text', data: { content: '' } },
                { type: 'code', data: { content: '// Example code', language: 'javascript' } },
              ],
            },
          ],
        },
        {
          title: 'Hands-On',
          lessons: [
            {
              title: 'Practice Exercise',
              blocks: [
                { type: 'heading', data: { content: 'Exercise', level: 2 } },
                { type: 'text', data: { content: '' } },
                { type: 'assignment', data: { title: 'Coding Challenge', submissionType: 'file' } },
              ],
            },
          ],
        },
        {
          title: 'Project',
          lessons: [
            {
              title: 'Final Project',
              blocks: [
                { type: 'heading', data: { content: 'Build Your Project', level: 2 } },
                { type: 'text', data: { content: '' } },
                {
                  type: 'assignment',
                  data: { title: 'Final Project', submissionType: 'file', points: 100 },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // STEM Course
  {
    id: 'stem-basics',
    name: 'STEM Fundamentals',
    description: 'Science/Math course with equations, diagrams, and problem sets',
    category: 'Education',
    icon: GraduationCap,
    duration: '6 hours',
    difficulty: 'intermediate',
    tags: ['stem', 'math', 'science'],
    structure: {
      sections: [
        {
          title: 'Theory',
          lessons: [
            {
              title: 'Core Concepts',
              blocks: [
                { type: 'heading', data: { content: 'Mathematical Foundations', level: 2 } },
                { type: 'text', data: { content: '' } },
                { type: 'latex', data: { content: 'E = mc^2', displayMode: true } },
              ],
            },
          ],
        },
        {
          title: 'Practice',
          lessons: [
            {
              title: 'Problem Set',
              blocks: [
                { type: 'heading', data: { content: 'Practice Problems', level: 2 } },
                { type: 'quiz', data: { questions: [], passingScore: 70 } },
              ],
            },
          ],
        },
      ],
    },
  },
];

// Group templates by category
export const templatesByCategory = courseTemplates.reduce(
  (acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  },
  {} as Record<string, CourseTemplate[]>
);

/**
 * CourseTemplateSelector Component
 */
interface CourseTemplateSelectorProps {
  onSelect: (template: CourseTemplate) => void;
  className?: string;
}

export function CourseTemplateSelector({ onSelect, className = '' }: CourseTemplateSelectorProps) {
  const categories = Object.keys(templatesByCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesByCategory[category].map(template => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onSelect(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {template.structure.sections.length} sections
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Start from scratch option */}
      <Card
        className="cursor-pointer hover:border-primary/50 transition-colors border-dashed"
        onClick={() =>
          onSelect({
            id: 'blank',
            name: 'Blank Course',
            description: 'Start with a blank canvas',
            category: 'Custom',
            icon: Sparkles,
            duration: 'Custom',
            difficulty: 'beginner',
            tags: [],
            structure: { sections: [] },
          })
        }
      >
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-medium">Start from Scratch</p>
            <p className="text-sm text-muted-foreground">Create a custom course structure</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
