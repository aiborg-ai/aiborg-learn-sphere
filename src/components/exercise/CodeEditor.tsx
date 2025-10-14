/**
 * CodeEditor Component
 * Simple code editor with syntax highlighting and line numbers
 * For now, using a textarea with monospace font
 * TODO: Integrate Monaco Editor or CodeMirror for advanced features
 */

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  showRunButton?: boolean;
  onRun?: () => void;
  starterCode?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  placeholder = '// Write your code here...',
  readOnly = false,
  showRunButton = false,
  onRun,
  starterCode,
}) => {
  const { toast } = useToast();
  const [lineCount, setLineCount] = useState(value.split('\n').length);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setLineCount(newValue.split('\n').length);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard',
      });
    } catch (_error) {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    if (starterCode) {
      onChange(starterCode);
      toast({
        title: 'Code reset',
        description: 'Starter code restored',
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          Code Editor
          <Badge variant="outline" className="font-mono text-xs">
            {language}
          </Badge>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{lineCount} lines</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleCopy} disabled={!value}>
            <Copy className="h-4 w-4" />
          </Button>
          {starterCode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={readOnly}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {showRunButton && onRun && (
            <Button type="button" variant="outline" size="sm" onClick={onRun}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r border-border rounded-l-md overflow-hidden">
          <div className="py-3 px-2 text-xs text-muted-foreground text-right font-mono">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code textarea */}
        <Textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="font-mono text-sm min-h-[400px] pl-16 resize-y"
          spellCheck={false}
          style={{
            tabSize: 2,
            lineHeight: '1.5rem',
          }}
          onKeyDown={e => {
            // Handle Tab key for indentation
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newValue = value.substring(0, start) + '  ' + value.substring(end);
              onChange(newValue);
              // Set cursor position after the inserted spaces
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              }, 0);
            }
          }}
        />
      </div>

      {/* Info/Help Text */}
      <p className="text-xs text-muted-foreground">
        Press Tab to indent. {readOnly ? 'Read-only mode' : 'Changes are auto-saved'}
      </p>
    </div>
  );
};
