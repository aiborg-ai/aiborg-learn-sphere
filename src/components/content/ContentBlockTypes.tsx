/**
 * Content Block Types for Course Builder
 *
 * Defines the various content block types available in the course builder
 */

import React from 'react';
import {
  Type,
  Video,
  Image,
  FileText,
  Code,
  ListChecks,
  HelpCircle,
  Link,
  Quote,
  Calculator,
  Table,
  Heading1,
  Heading2,
  SeparatorHorizontal,
  MessageSquare,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  Lightbulb,
} from '@/components/ui/icons';

export type ContentBlockType =
  | 'text'
  | 'heading'
  | 'subheading'
  | 'video'
  | 'image'
  | 'document'
  | 'code'
  | 'quiz'
  | 'assignment'
  | 'link'
  | 'quote'
  | 'latex'
  | 'table'
  | 'divider'
  | 'callout'
  | 'download'
  | 'discussion';

export interface ContentBlockDefinition {
  type: ContentBlockType;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'basic' | 'media' | 'interactive' | 'advanced';
  defaultData: Record<string, unknown>;
}

export const contentBlockDefinitions: ContentBlockDefinition[] = [
  // Basic blocks
  {
    type: 'text',
    label: 'Text',
    description: 'Rich text content with formatting',
    icon: Type,
    category: 'basic',
    defaultData: {
      content: '',
      format: 'html',
    },
  },
  {
    type: 'heading',
    label: 'Heading',
    description: 'Section heading (H2)',
    icon: Heading1,
    category: 'basic',
    defaultData: {
      content: 'Section Title',
      level: 2,
    },
  },
  {
    type: 'subheading',
    label: 'Subheading',
    description: 'Subsection heading (H3)',
    icon: Heading2,
    category: 'basic',
    defaultData: {
      content: 'Subsection Title',
      level: 3,
    },
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Highlighted quote or callout',
    icon: Quote,
    category: 'basic',
    defaultData: {
      content: '',
      author: '',
      source: '',
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator',
    icon: SeparatorHorizontal,
    category: 'basic',
    defaultData: {
      style: 'line',
    },
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Info, warning, or tip box',
    icon: Lightbulb,
    category: 'basic',
    defaultData: {
      content: '',
      variant: 'info', // info, warning, success, tip
    },
  },

  // Media blocks
  {
    type: 'video',
    label: 'Video',
    description: 'YouTube, Vimeo, or uploaded video',
    icon: Video,
    category: 'media',
    defaultData: {
      url: '',
      title: '',
      provider: 'youtube',
      autoplay: false,
    },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Image with caption',
    icon: Image,
    category: 'media',
    defaultData: {
      url: '',
      alt: '',
      caption: '',
      width: 'full',
    },
  },
  {
    type: 'document',
    label: 'Document',
    description: 'PDF or document viewer',
    icon: FileText,
    category: 'media',
    defaultData: {
      url: '',
      title: '',
      type: 'pdf',
    },
  },
  {
    type: 'download',
    label: 'Download',
    description: 'Downloadable resource',
    icon: Download,
    category: 'media',
    defaultData: {
      url: '',
      title: '',
      fileSize: '',
      fileType: '',
    },
  },

  // Interactive blocks
  {
    type: 'quiz',
    label: 'Quiz',
    description: 'Multiple choice or short answer',
    icon: ListChecks,
    category: 'interactive',
    defaultData: {
      questions: [],
      passingScore: 70,
      allowRetry: true,
      showAnswers: true,
    },
  },
  {
    type: 'assignment',
    label: 'Assignment',
    description: 'Submission-based task',
    icon: HelpCircle,
    category: 'interactive',
    defaultData: {
      title: '',
      description: '',
      dueDate: null,
      points: 100,
      submissionType: 'file',
    },
  },
  {
    type: 'discussion',
    label: 'Discussion',
    description: 'Discussion prompt for students',
    icon: MessageSquare,
    category: 'interactive',
    defaultData: {
      prompt: '',
      allowReplies: true,
      requireResponse: false,
    },
  },

  // Advanced blocks
  {
    type: 'code',
    label: 'Code',
    description: 'Code snippet with syntax highlighting',
    icon: Code,
    category: 'advanced',
    defaultData: {
      content: '',
      language: 'javascript',
      showLineNumbers: true,
      runnable: false,
    },
  },
  {
    type: 'latex',
    label: 'Math/LaTeX',
    description: 'Mathematical equations',
    icon: Calculator,
    category: 'advanced',
    defaultData: {
      content: '',
      displayMode: true,
    },
  },
  {
    type: 'table',
    label: 'Table',
    description: 'Data table',
    icon: Table,
    category: 'advanced',
    defaultData: {
      headers: ['Column 1', 'Column 2'],
      rows: [['', '']],
      sortable: false,
    },
  },
  {
    type: 'link',
    label: 'External Link',
    description: 'Link to external resource',
    icon: Link,
    category: 'advanced',
    defaultData: {
      url: '',
      title: '',
      description: '',
      openInNewTab: true,
    },
  },
];

// Group blocks by category
export const blocksByCategory = contentBlockDefinitions.reduce(
  (acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  },
  {} as Record<string, ContentBlockDefinition[]>
);

// Get block definition by type
export function getBlockDefinition(type: ContentBlockType): ContentBlockDefinition | undefined {
  return contentBlockDefinitions.find(b => b.type === type);
}

/**
 * ContentBlockPalette Component
 * Shows available blocks that can be added to a course
 */
interface ContentBlockPaletteProps {
  onSelect: (type: ContentBlockType) => void;
  className?: string;
}

export function ContentBlockPalette({ onSelect, className = '' }: ContentBlockPaletteProps) {
  const categories = [
    { key: 'basic', label: 'Basic' },
    { key: 'media', label: 'Media' },
    { key: 'interactive', label: 'Interactive' },
    { key: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {categories.map(category => (
        <div key={category.key}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category.label}</h4>
          <div className="grid grid-cols-2 gap-2">
            {blocksByCategory[category.key]?.map(block => {
              const Icon = block.icon;
              return (
                <button
                  key={block.type}
                  onClick={() => onSelect(block.type)}
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{block.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {block.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Callout variants for the callout block
 */
export const calloutVariants = {
  info: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300',
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300',
  },
};
