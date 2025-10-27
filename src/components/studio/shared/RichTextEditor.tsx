/**
 * RichTextEditor Component
 * Rich text editor wrapper for content creation
 * Uses Textarea for now, can be enhanced with TipTap or similar later
 */

import React, { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image, Eye, Code } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  showPreview?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Start typing...',
  minHeight = 200,
  maxHeight = 600,
  showPreview = true,
  required,
  error,
  className,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Insert markdown formatting
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // Toolbar actions
  const toolbar = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertFormatting('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertFormatting('*', '*'),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertFormatting('- ', ''),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertFormatting('1. ', ''),
    },
    {
      icon: LinkIcon,
      label: 'Link',
      action: () => insertFormatting('[', '](url)'),
    },
    {
      icon: Image,
      label: 'Image',
      action: () => insertFormatting('![alt text](', ')'),
    },
    {
      icon: Code,
      label: 'Code',
      action: () => insertFormatting('`', '`'),
    },
  ];

  // Simple markdown-to-HTML converter (basic)
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-muted-foreground">No content to preview</p>';

    return text
      .split('\n\n')
      .map(paragraph => {
        let html = paragraph;

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" class="text-primary underline">$1</a>'
        );

        // Code
        html = html.replace(
          /`(.+?)`/g,
          '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
        );

        // Lists
        if (html.startsWith('- ')) {
          html =
            '<ul class="list-disc list-inside">' +
            html.replace(/^- (.+)$/gm, '<li>$1</li>') +
            '</ul>';
        } else if (html.match(/^\d+\. /)) {
          html =
            '<ol class="list-decimal list-inside">' +
            html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>') +
            '</ol>';
        } else {
          html = `<p>${html}</p>`;
        }

        return html;
      })
      .join('');
  };

  const editorContent = (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted rounded-md">
        {toolbar.map((tool, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={tool.action}
            title={tool.label}
            className="h-8 w-8 p-0"
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">{value.length} characters</div>
      </div>

      {/* Text Area */}
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('font-mono text-sm resize-none', error && 'border-destructive')}
        style={{ minHeight, maxHeight }}
        required={required}
      />

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Markdown Help */}
      <div className="text-xs text-muted-foreground">
        <strong>Markdown supported:</strong> **bold**, *italic*, [link](url), `code`, # headers, -
        lists
      </div>
    </div>
  );

  const previewContent = (
    <Card
      className="p-4 prose prose-sm max-w-none"
      style={{ minHeight, maxHeight, overflow: 'auto' }}
    >
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
    </Card>
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {showPreview ? (
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'edit' | 'preview')}>
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            {editorContent}
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            {previewContent}
          </TabsContent>
        </Tabs>
      ) : (
        editorContent
      )}
    </div>
  );
}
