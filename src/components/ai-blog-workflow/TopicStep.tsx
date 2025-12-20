/**
 * Topic Step (Step 1)
 *
 * Collect topic, audience, tone, length, and optional keywords
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { topicStepSchema, type TopicStepData } from '@/schemas/aiBlogWorkflow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from '@/components/ui/icons';

interface TopicStepProps {
  initialData?: Partial<TopicStepData>;
  onNext: (data: TopicStepData) => void;
}

export function TopicStep({ initialData, onNext }: TopicStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TopicStepData>({
    resolver: zodResolver(topicStepSchema),
    defaultValues: initialData || {
      topic: '',
      audience: 'professional',
      tone: 'professional',
      length: 'medium',
      keywords: '',
    },
  });

  const audience = watch('audience');
  const tone = watch('tone');
  const length = watch('length');

  const onSubmit = (data: TopicStepData) => {
    onNext(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>AI Blog Post Generator</CardTitle>
          </div>
          <CardDescription>
            Tell us about your blog post idea, and our AI will create a comprehensive draft for you
            to review and customize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Blog Post Topic *</Label>
              <Textarea
                id="topic"
                {...register('topic')}
                placeholder="e.g., How AI is transforming education in 2025, Benefits of machine learning for small businesses, Introduction to neural networks for beginners..."
                className="min-h-[100px]"
              />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              <p className="text-xs text-muted-foreground">
                Describe the topic you want to write about. Be as specific as possible.
              </p>
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience *</Label>
              <Select
                value={audience}
                onValueChange={value =>
                  setValue(
                    'audience',
                    value as 'primary' | 'secondary' | 'professional' | 'business'
                  )
                }
              >
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">
                    Young Learners (Ages 5-11) - Simple language, fun examples
                  </SelectItem>
                  <SelectItem value="secondary">
                    Teenagers (Ages 12-18) - Engaging language, real-world applications
                  </SelectItem>
                  <SelectItem value="professional">
                    Professionals - Industry terminology, practical insights
                  </SelectItem>
                  <SelectItem value="business">
                    Business Owners - ROI focus, business value
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.audience && (
                <p className="text-sm text-destructive">{errors.audience.message}</p>
              )}
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label htmlFor="tone">Writing Tone *</Label>
              <Select
                value={tone}
                onValueChange={value =>
                  setValue('tone', value as 'professional' | 'casual' | 'technical' | 'friendly')
                }
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    Professional - Authoritative and formal
                  </SelectItem>
                  <SelectItem value="casual">Casual - Conversational and approachable</SelectItem>
                  <SelectItem value="technical">Technical - Detailed and in-depth</SelectItem>
                  <SelectItem value="friendly">Friendly - Warm and encouraging</SelectItem>
                </SelectContent>
              </Select>
              {errors.tone && <p className="text-sm text-destructive">{errors.tone.message}</p>}
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label htmlFor="length">Content Length *</Label>
              <Select
                value={length}
                onValueChange={value => setValue('length', value as 'short' | 'medium' | 'long')}
              >
                <SelectTrigger id="length">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (500-800 words) - Quick read, ~3 min</SelectItem>
                  <SelectItem value="medium">
                    Medium (800-1500 words) - Standard article, ~5-7 min
                  </SelectItem>
                  <SelectItem value="long">
                    Long (1500-2500 words) - In-depth guide, ~10-12 min
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.length && <p className="text-sm text-destructive">{errors.length.message}</p>}
            </div>

            {/* Keywords (optional) */}
            <div className="space-y-2">
              <Label htmlFor="keywords">SEO Keywords (Optional)</Label>
              <Input
                id="keywords"
                {...register('keywords')}
                placeholder="e.g., AI, machine learning, automation, neural networks"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated keywords to help optimize the content for search engines.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="group">
                Generate Blog Post
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
