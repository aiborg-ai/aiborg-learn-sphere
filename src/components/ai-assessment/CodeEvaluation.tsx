import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider';
import { Code, Copy, CheckCircle, FileCode, Lightbulb, Terminal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface CodeEvaluationProps {
  question: {
    id: string;
    question_text: string;
    question_type: 'code_evaluation' | 'multiple_choice' | 'single_choice';
    code_snippet: string;
    code_language: string;
    help_text?: string;
    metadata?: {
      explanation?: string;
      expected_output?: string;
      time_complexity?: string;
      space_complexity?: string;
      concepts?: string[];
    };
    options: Array<{
      id: string;
      option_text: string;
      description?: string;
      is_correct?: boolean;
      order_index: number;
    }>;
  };
  selectedOptions: string[];
  onSelectionChange: (optionIds: string[]) => void;
}

export const CodeEvaluation: React.FC<CodeEvaluationProps> = ({
  question,
  selectedOptions,
  onSelectionChange,
}) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { toast } = useToast();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(question.code_snippet);
      setCopied(true);
      toast({
        title: 'Code copied!',
        description: 'The code snippet has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try selecting and copying the code manually.',
        variant: 'destructive',
      });
    }
  };

  const handleSingleChoice = (optionId: string) => {
    onSelectionChange([optionId]);
  };

  const handleMultipleChoice = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onSelectionChange(newSelection);
  };

  const getLanguageIcon = () => {
    const lang = question.code_language.toLowerCase();
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚡',
      'c++': '⚡',
      csharp: '🎯',
      'c#': '🎯',
      go: '🔵',
      rust: '🦀',
      ruby: '💎',
      php: '🐘',
      swift: '🍎',
      kotlin: '🟣',
      sql: '🗄️',
      html: '📄',
      css: '🎨',
    };
    return icons[lang] || '💻';
  };

  const isDarkTheme =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Code Evaluation</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getLanguageIcon()} {question.code_language}
                  </Badge>
                  {question.metadata?.concepts && question.metadata.concepts.length > 0 && (
                    <div className="flex gap-1">
                      {question.metadata.concepts.slice(0, 3).map((concept, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Snippet */}
          <div className="relative rounded-lg overflow-hidden border">
            <SyntaxHighlighter
              language={question.code_language.toLowerCase()}
              style={isDarkTheme ? vscDarkPlus : vs}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '0.875rem',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                },
              }}
            >
              {question.code_snippet}
            </SyntaxHighlighter>
          </div>

          {/* Additional Info Tabs */}
          {(question.metadata?.expected_output ||
            question.metadata?.time_complexity ||
            question.metadata?.space_complexity) && (
            <Tabs defaultValue="output" className="w-full">
              <TabsList>
                {question.metadata.expected_output && (
                  <TabsTrigger value="output">
                    <Terminal className="h-4 w-4 mr-2" />
                    Expected Output
                  </TabsTrigger>
                )}
                {(question.metadata.time_complexity || question.metadata.space_complexity) && (
                  <TabsTrigger value="complexity">
                    <Code className="h-4 w-4 mr-2" />
                    Complexity
                  </TabsTrigger>
                )}
              </TabsList>
              {question.metadata.expected_output && (
                <TabsContent value="output">
                  <Card>
                    <CardContent className="pt-4">
                      <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                        <code>{question.metadata.expected_output}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              {(question.metadata.time_complexity || question.metadata.space_complexity) && (
                <TabsContent value="complexity">
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      {question.metadata.time_complexity && (
                        <div className="flex items-center gap-2">
                          <Badge>Time</Badge>
                          <code className="text-sm font-mono">
                            {question.metadata.time_complexity}
                          </code>
                        </div>
                      )}
                      {question.metadata.space_complexity && (
                        <div className="flex items-center gap-2">
                          <Badge>Space</Badge>
                          <code className="text-sm font-mono">
                            {question.metadata.space_complexity}
                          </code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question_text}</CardTitle>
          {question.help_text && (
            <CardDescription className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
              <span>{question.help_text}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          {question.question_type === 'single_choice' ||
          question.question_type === 'code_evaluation' ? (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onValueChange={handleSingleChoice}
              className="space-y-3"
            >
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map(option => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground font-normal">
                          {option.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select all that apply:</p>
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map(option => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleMultipleChoice(option.id)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground font-normal">
                          {option.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
