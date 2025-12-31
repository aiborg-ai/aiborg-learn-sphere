/**
 * BlogContentStep Component
 * Step 2: Blog content - RichTextEditor with full editing capabilities
 */

import React from 'react';
import { Edit } from '@/components/ui/icons';
import { RichTextEditor } from '@/components/studio/shared/RichTextEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, BlogWizardData } from '@/types/studio.types';

export function BlogContentStep({ data, onUpdate }: StepComponentProps<BlogWizardData>) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Edit className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Content</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Write your blog post content with rich text formatting
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Use the formatting toolbar to add headers, bold text, links, lists, and more. Switch to
          preview mode to see how your content will look to readers.
        </AlertDescription>
      </Alert>

      {/* Blog Content Editor */}
      <RichTextEditor
        label="Blog Content"
        value={data.content}
        onChange={content => onUpdate({ content })}
        placeholder="Start writing your blog post here...

Use markdown formatting:
- # for headers (# H1, ## H2, ### H3)
- **bold text** for emphasis
- *italic text* for subtle emphasis
- [link text](url) for links
- `code` for inline code
- Lists with - or 1.

Tell your story, share your insights, and engage your readers!"
        minHeight={400}
        maxHeight={800}
        showPreview
        required
      />

      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg space-y-2">
        <p className="font-semibold">Writing Tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Start with a compelling introduction that hooks your readers</li>
          <li>Use headers to organize your content into scannable sections</li>
          <li>Break up long paragraphs for better readability</li>
          <li>Include examples, stories, or case studies to illustrate your points</li>
          <li>End with a clear conclusion or call-to-action</li>
        </ul>
      </div>

      {/* Character/Word Count Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div>
          <span className="font-semibold">{data.content.length}</span> characters
        </div>
        <div>
          <span className="font-semibold">
            {data.content.trim() ? data.content.trim().split(/\s+/).length : 0}
          </span>{' '}
          words
        </div>
        <div>
          <span className="font-semibold">
            {Math.ceil((data.content.trim() ? data.content.trim().split(/\s+/).length : 0) / 200)}
          </span>{' '}
          min read
        </div>
      </div>
    </div>
  );
}
