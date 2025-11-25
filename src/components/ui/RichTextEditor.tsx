/**
 * RichTextEditor Component
 * Simple textarea-based editor as temporary fallback
 * TODO: Fix TipTap initialization issue and restore rich text editing
 */

import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write something...',
  className = '',
}: RichTextEditorProps) {
  // Temporary fallback to simple textarea to unblock the site
  // TipTap was causing initialization errors
  return (
    <div className={`border rounded-lg ${className}`}>
      <Textarea
        value={content || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] border-0 focus-visible:ring-0"
      />
    </div>
  );
}
