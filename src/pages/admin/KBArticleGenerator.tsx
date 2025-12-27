/**
 * Knowledge Base Article Generator (Admin Only)
 * AI-powered article generation for the public knowledge base
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, FileText, Loader2, CheckCircle, BookOpen, Zap } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

interface OutlineItem {
  id: string;
  content: string;
}

interface GeneratedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  difficulty: string;
  status: string;
  reading_time_minutes: number;
  word_count: number;
  tags: string[];
}

const KB_CATEGORIES = [
  { value: 'ai_fundamentals', label: 'AI/ML Fundamentals', icon: '🧠' },
  { value: 'ml_algorithms', label: 'ML Algorithms', icon: '📊' },
  { value: 'practical_tools', label: 'Practical Tools & Frameworks', icon: '🛠️' },
  { value: 'prompt_engineering', label: 'Prompt Engineering', icon: '✍️' },
  { value: 'business_ai', label: 'Business AI Applications', icon: '💼' },
  { value: 'ai_ethics', label: 'AI Ethics & Safety', icon: '⚖️' },
  { value: 'deployment', label: 'MLOps & Deployment', icon: '🚀' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to AI/ML' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some AI/ML experience' },
  { value: 'advanced', label: 'Advanced', description: 'Expert level' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (500-800 words)', duration: '~2 min read' },
  { value: 'medium', label: 'Medium (1500-2000 words)', duration: '~7 min read' },
  { value: 'long', label: 'Long (3000-4000 words)', duration: '~15 min read' },
];

export default function KBArticleGenerator() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('ai_fundamentals');
  const [difficulty, setDifficulty] = useState('beginner');
  const [targetLength, setTargetLength] = useState('medium');
  const [customInstructions, setCustomInstructions] = useState('');
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();

  const addOutlineItem = () => {
    setOutline([...outline, { id: crypto.randomUUID(), content: '' }]);
  };

  const updateOutlineItem = (id: string, content: string) => {
    setOutline(outline.map(item => (item.id === id ? { ...item, content } : item)));
  };

  const removeOutlineItem = (id: string) => {
    setOutline(outline.filter(item => item.id !== id));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Missing topic',
        description: 'Please enter an article topic',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 1500);

      const outlineContent = outline.map(item => item.content).filter(c => c.trim());

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('generate-kb-article', {
        body: {
          topic,
          category,
          difficulty,
          outline: outlineContent.length > 0 ? outlineContent : undefined,
          target_length: targetLength,
          custom_instructions: customInstructions.trim() || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate article');
      }

      setGeneratedArticle(data.article);

      toast({
        title: 'Article generated successfully!',
        description: `"${data.article.title}" is ready for review`,
      });
    } catch (error: any) {
      logger.error('Generation error', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate article. Please try again.',
        variant: 'destructive',
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewArticle = () => {
    if (generatedArticle) {
      navigate(`/admin/kb/edit/${generatedArticle.id}`);
    }
  };

  const handleReset = () => {
    setTopic('');
    setCustomInstructions('');
    setOutline([]);
    setGeneratedArticle(null);
    setGenerationProgress(0);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Knowledge Base Article Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate comprehensive, AI-powered knowledge base articles on any AI/ML topic
        </p>
      </div>

      {/* Feature Highlight */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>🎯 AI-Powered Content Creation</AlertTitle>
        <AlertDescription>
          GPT-4 generates structured, educational articles with automatic TOC extraction, embedding
          generation for RAG integration, and reading time calculation. All articles start as drafts
          for admin review before publishing.
        </AlertDescription>
      </Alert>

      {/* Success State */}
      {generatedArticle && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Article Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{generatedArticle.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{generatedArticle.excerpt}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{generatedArticle.category}</Badge>
              <Badge variant="outline">{generatedArticle.difficulty}</Badge>
              <Badge variant="outline">{generatedArticle.reading_time_minutes} min read</Badge>
              <Badge variant="outline">{generatedArticle.word_count} words</Badge>
              <Badge className="bg-yellow-100 text-yellow-800">Draft - Needs Review</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {generatedArticle.tags.slice(0, 5).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleViewArticle} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Edit & Review Article
              </Button>
              <Button onClick={handleReset} variant="outline">
                Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Form */}
      {!generatedArticle && (
        <Card>
          <CardHeader>
            <CardTitle>Article Configuration</CardTitle>
            <CardDescription>
              Configure the article parameters and let AI do the rest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-base font-semibold">
                Article Topic <span className="text-red-500">*</span>
              </Label>
              <Input
                id="topic"
                placeholder="e.g., How Transformer Neural Networks Work"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={isGenerating}
                className="text-base"
              />
              <p className="text-sm text-muted-foreground">
                Be specific and descriptive. This will be used to guide the AI generation.
              </p>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KB_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Determines the focus and writing style of the article
              </p>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Difficulty Level <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      difficulty === level.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-semibold">{level.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Length */}
            <div className="space-y-2">
              <Label htmlFor="length" className="text-base font-semibold">
                Target Length
              </Label>
              <Select value={targetLength} onValueChange={setTargetLength} disabled={isGenerating}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} - {opt.duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Outline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Article Outline (Optional)</Label>
                <Button
                  onClick={addOutlineItem}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                >
                  + Add Section
                </Button>
              </div>
              {outline.length > 0 && (
                <div className="space-y-2">
                  {outline.map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <span className="text-sm text-muted-foreground mt-2 w-8">{index + 1}.</span>
                      <Input
                        placeholder="Section title"
                        value={item.content}
                        onChange={e => updateOutlineItem(item.id, e.target.value)}
                        disabled={isGenerating}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeOutlineItem(item.id)}
                        variant="ghost"
                        size="sm"
                        disabled={isGenerating}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Define specific sections you want included. Leave empty for AI to create the
                outline.
              </p>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-base font-semibold">
                Custom Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="e.g., Include code examples in Python, Focus on practical applications, Compare with traditional approaches"
                value={customInstructions}
                onChange={e => setCustomInstructions(e.target.value)}
                disabled={isGenerating}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Additional guidance for the AI (examples, comparisons, specific focus areas)
              </p>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generating article...</span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Article...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Article with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your article topic and select category/difficulty level</li>
            <li>Optionally provide an outline or custom instructions</li>
            <li>
              Click "Generate Article" - AI will create a comprehensive draft (~30-60 seconds)
            </li>
            <li>Review and edit the generated article in the editor</li>
            <li>Publish to make it public on the knowledge base</li>
          </ol>
          <p className="mt-3 pt-3 border-t border-blue-300">
            <strong>Note:</strong> All articles start as drafts and require admin approval before
            appearing on the public knowledge base.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
