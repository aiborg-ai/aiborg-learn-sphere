/**
 * Batch Creator Component
 * Main interface for creating multiple blog posts at once
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { BlogTemplateService } from '@/services/blog/BlogTemplateService';
import { BlogCampaignService } from '@/services/blog/BlogCampaignService';
import { BatchGenerationService } from '@/services/blog/BatchGenerationService';
import type {
  BlogTemplate,
  BlogCampaign,
  BatchGenerationRequest,
  AutoScheduleConfig,
} from '@/types/blog-scheduler';
import { BatchProgressMonitor } from './BatchProgressMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Sparkles, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const batchCreatorSchema = z.object({
  input_method: z.enum(['manual', 'template', 'ai_generate']),
  template_id: z.string().optional(),
  topics_text: z.string().min(1, 'At least one topic is required'),
  audience: z.enum(['primary', 'secondary', 'professional', 'business']),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']),
  length: z.enum(['short', 'medium', 'long']),
  keywords: z.string().optional(),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  auto_schedule_enabled: z.boolean(),
  schedule_start_date: z.date().optional(),
  schedule_frequency: z.enum(['daily', 'weekly', 'biweekly']).optional(),
  schedule_preferred_time: z.string().optional(),
  campaign_id: z.string().optional(),
  new_campaign_name: z.string().optional(),
});

type BatchCreatorFormData = z.infer<typeof batchCreatorSchema>;

export function BatchCreator() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BlogTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<BlogCampaign[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [topicsPreview, setTopicsPreview] = useState<string[]>([]);

  const form = useForm<BatchCreatorFormData>({
    resolver: zodResolver(batchCreatorSchema),
    defaultValues: {
      input_method: 'manual',
      audience: 'professional',
      tone: 'professional',
      length: 'medium',
      auto_schedule_enabled: false,
      schedule_frequency: 'weekly',
      schedule_preferred_time: '09:00',
    },
  });

  const inputMethod = form.watch('input_method');
  const autoScheduleEnabled = form.watch('auto_schedule_enabled');
  const topicsText = form.watch('topics_text');
  const selectedTemplateId = form.watch('template_id');

  // Load data
  useEffect(() => {
    loadTemplates();
    loadCampaigns();
    loadCategories();
  }, []);

  // Update topics preview when text changes
  useEffect(() => {
    if (topicsText) {
      const topics = topicsText
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);
      setTopicsPreview(topics);
    } else {
      setTopicsPreview([]);
    }
  }, [topicsText]);

  // Load template data when selected
  useEffect(() => {
    if (inputMethod === 'template' && selectedTemplateId) {
      loadTemplateData(selectedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, selectedTemplateId]);

  const loadTemplates = async () => {
    try {
      const data = await BlogTemplateService.getTemplates({ is_active: true });
      setTemplates(data);
    } catch (_error) {
      logger.error('Error loading templates:', _error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const data = await BlogCampaignService.getActiveCampaigns();
      setCampaigns(data);
    } catch (_error) {
      logger.error('Error loading campaigns:', _error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase.from('blog_categories').select('*').order('name');
      setCategories(data || []);
    } catch (_error) {
      logger.error('Error loading categories:', _error);
    }
  };

  const loadTemplateData = async (templateId: string) => {
    try {
      const template = await BlogTemplateService.getTemplateById(templateId);
      form.setValue('audience', template.audience);
      form.setValue('tone', template.tone);
      form.setValue('length', template.length);
      form.setValue('keywords', template.keywords || '');
      form.setValue('category_id', template.category_id || undefined);
      form.setValue('tags', template.default_tags?.join(', ') || '');
    } catch (_error) {
      logger.error('Error loading template data:', _error);
    }
  };

  const onSubmit = async (data: BatchCreatorFormData) => {
    try {
      setIsLoading(true);

      // Parse topics
      const topics = data.topics_text
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);

      if (topics.length === 0) {
        toast({
          title: 'No topics',
          description: 'Please enter at least one topic',
          variant: 'destructive',
        });
        return;
      }

      if (topics.length > 50) {
        toast({
          title: 'Too many topics',
          description: 'Maximum 50 posts per batch',
          variant: 'destructive',
        });
        return;
      }

      // Build auto-schedule config
      let autoScheduleConfig: AutoScheduleConfig | undefined;
      if (
        data.auto_schedule_enabled &&
        data.schedule_start_date &&
        data.schedule_frequency &&
        data.schedule_preferred_time
      ) {
        autoScheduleConfig = {
          enabled: true,
          start_date: data.schedule_start_date.toISOString(),
          frequency: data.schedule_frequency,
          preferred_time: data.schedule_preferred_time,
        };
      }

      // Parse tags
      const tags = data.tags
        ? data.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : [];

      // Build batch request
      const request: BatchGenerationRequest = {
        campaign_id: data.campaign_id,
        template_id: data.template_id,
        topics: topics.map(topic => ({
          topic,
          audience: data.audience,
          tone: data.tone,
          length: data.length,
          keywords: data.keywords,
        })),
        auto_schedule: autoScheduleConfig,
        category_id: data.category_id,
        default_tags: tags.length > 0 ? tags : undefined,
      };

      // Create batch job
      const response = await BatchGenerationService.createBatchJob(request);

      if (response.success) {
        setCurrentJobId(response.job_id);
        setShowProgressModal(true);

        toast({
          title: '✨ Batch generation started!',
          description: `Generating ${response.total_posts} blog posts...`,
        });
      }
    } catch (_error) {
      logger.error('Error creating batch:', _error);
      toast({
        title: 'Batch generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressComplete = (jobId: string) => {
    toast({
      title: '🎉 Batch generation complete!',
      description: 'View the results in the History tab',
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Input Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Choose Input Method</CardTitle>
              <CardDescription>
                How would you like to provide the topics for your blog posts?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="input_method"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid gap-4 md:grid-cols-3"
                      >
                        <Label
                          htmlFor="manual"
                          className={cn(
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                            field.value === 'manual' && 'border-primary'
                          )}
                        >
                          <RadioGroupItem value="manual" id="manual" className="sr-only" />
                          <FileText className="mb-3 h-6 w-6" />
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-medium leading-none">Manual Entry</p>
                            <p className="text-xs text-muted-foreground">Type one topic per line</p>
                          </div>
                        </Label>
                        <Label
                          htmlFor="template"
                          className={cn(
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                            field.value === 'template' && 'border-primary'
                          )}
                        >
                          <RadioGroupItem value="template" id="template" className="sr-only" />
                          <Sparkles className="mb-3 h-6 w-6" />
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-medium leading-none">Use Template</p>
                            <p className="text-xs text-muted-foreground">
                              Select from pre-made templates
                            </p>
                          </div>
                        </Label>
                        <Label
                          htmlFor="ai_generate"
                          className={cn(
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer opacity-50 cursor-not-allowed',
                            field.value === 'ai_generate' && 'border-primary'
                          )}
                        >
                          <RadioGroupItem
                            value="ai_generate"
                            id="ai_generate"
                            className="sr-only"
                            disabled
                          />
                          <Sparkles className="mb-3 h-6 w-6" />
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-medium leading-none">AI Generate</p>
                            <p className="text-xs text-muted-foreground">Coming soon</p>
                          </div>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Template Selection */}
              {inputMethod === 'template' && (
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Template</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Template parameters will auto-fill below</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Topics Input */}
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="topics_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics (one per line, max 50)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="AI in Healthcare&#10;Machine Learning Basics&#10;Future of Automation"
                          className="min-h-[150px] font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        {topicsPreview.length} topic{topicsPreview.length !== 1 ? 's' : ''} entered
                        {topicsPreview.length > 50 && (
                          <span className="text-red-600 ml-2">(exceeds 50 limit)</span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bulk Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>2. Configure Parameters</CardTitle>
              <CardDescription>These settings will apply to all generated posts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Primary (Ages 5-11)</SelectItem>
                        <SelectItem value="secondary">Secondary (Ages 12-18)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="short">Short (500-800 words)</SelectItem>
                        <SelectItem value="medium">Medium (800-1500 words)</SelectItem>
                        <SelectItem value="long">Long (1500-2500 words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AI, machine learning, automation" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (optional, comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AI, Tutorial, Beginner" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Scheduling Options */}
          <Card>
            <CardHeader>
              <CardTitle>3. Schedule Publishing</CardTitle>
              <CardDescription>Automatically schedule posts or create as drafts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auto_schedule_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Schedule Posts</FormLabel>
                      <FormDescription>Automatically distribute posts across dates</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {autoScheduleEnabled && (
                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="schedule_start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={date => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schedule_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schedule_preferred_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>4. Campaign (Optional)</CardTitle>
              <CardDescription>Group posts into a campaign for better organization</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="campaign_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Campaign</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None (no campaign)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Create new campaigns in the Campaigns tab</FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preview & Generate */}
          <Card>
            <CardHeader>
              <CardTitle>5. Review & Generate</CardTitle>
              <CardDescription>Review your batch and start generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topicsPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({topicsPreview.length} posts)</Label>
                  <ScrollArea className="h-[150px] rounded-md border">
                    <div className="p-4 space-y-1">
                      {topicsPreview.map((topic, index) => (
                        <div key={index} className="text-sm flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Estimated time: {Math.round((topicsPreview.length * 15) / 60)} -{' '}
                  {Math.round((topicsPreview.length * 30) / 60)} minutes
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || topicsPreview.length === 0 || topicsPreview.length > 50}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Batch
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Progress Modal */}
      <BatchProgressMonitor
        isOpen={showProgressModal}
        jobId={currentJobId}
        onClose={() => setShowProgressModal(false)}
        onComplete={handleProgressComplete}
      />
    </>
  );
}
