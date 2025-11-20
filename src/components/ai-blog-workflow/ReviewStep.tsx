/**
 * Review Step (Step 4)
 *
 * Final review and publishing options
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewStepSchema, type ReviewStepData, type EditStepData } from '@/schemas/aiBlogWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Edit,
  Eye,
  FileText,
  Image as ImageIcon,
  Tag as TagIcon,
  Globe,
  CheckCircle2,
  Loader2,
} from '@/components/ui/icons';
import { useState } from 'react';

interface ReviewStepProps {
  editData: EditStepData;
  onBack: () => void;
  onEdit: () => void;
  onPublish: (data: ReviewStepData) => Promise<void>;
}

export function ReviewStep({ editData, onBack, onEdit, onPublish }: ReviewStepProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewStepData>({
    resolver: zodResolver(reviewStepSchema),
    defaultValues: {
      publishOption: 'draft',
      scheduledFor: '',
      isFeatured: false,
      allowComments: true,
    },
  });

  const publishOption = watch('publishOption');
  const _scheduledFor = watch('scheduledFor');
  const isFeatured = watch('isFeatured');
  const allowComments = watch('allowComments');

  const onSubmit = async (data: ReviewStepData) => {
    try {
      setIsPublishing(true);
      await onPublish(data);
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount = editData.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Content Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Content Review</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Title</div>
              </div>
              <p className="text-lg font-semibold">{editData.title}</p>
            </div>

            {/* Excerpt */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Excerpt</div>
              </div>
              <p className="text-muted-foreground">{editData.excerpt}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{wordCount}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{readingTime}</p>
                <p className="text-xs text-muted-foreground">Min Read</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{editData.tags.length}</p>
                <p className="text-xs text-muted-foreground">Tags</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {editData.content.split('\n##').length - 1}
                </p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Tags</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {editData.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Featured Image</div>
              </div>
              <img
                src={editData.featuredImage}
                alt="Featured"
                className="w-full max-w-md rounded-lg border"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>SEO Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-xs text-blue-600 mb-1">
                {window.location.origin}/blog/{editData.slug || 'post-slug'}
              </p>
              <p className="text-lg text-blue-800 font-medium mb-1">
                {editData.metaTitle || editData.title}
              </p>
              <p className="text-sm text-gray-600">
                {editData.metaDescription || editData.excerpt}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Publish Option */}
            <div>
              <div className="text-sm font-medium mb-3 block">How would you like to publish?</div>
              <RadioGroup
                value={publishOption}
                onValueChange={value => setValue('publishOption', value as any)}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Save as Draft</p>
                      <p className="text-sm text-muted-foreground">
                        Save for review and publish later
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="publish" id="publish" />
                  <Label htmlFor="publish" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Publish Immediately</p>
                      <p className="text-sm text-muted-foreground">Make the post live right away</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Schedule for Later</p>
                      <p className="text-sm text-muted-foreground">
                        Choose a specific date and time
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.publishOption && (
                <p className="text-sm text-destructive mt-2">{errors.publishOption.message}</p>
              )}
            </div>

            {/* Schedule Date/Time */}
            {publishOption === 'schedule' && (
              <div>
                <Label htmlFor="scheduledFor">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  {...register('scheduledFor')}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.scheduledFor && (
                  <p className="text-sm text-destructive mt-1">{errors.scheduledFor.message}</p>
                )}
              </div>
            )}

            {/* Additional Settings */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Feature this post</Label>
                  <p className="text-sm text-muted-foreground">
                    Show in featured section on homepage
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={checked => setValue('isFeatured', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comments">Allow comments</Label>
                  <p className="text-sm text-muted-foreground">Enable readers to leave comments</p>
                </div>
                <Switch
                  id="comments"
                  checked={allowComments}
                  onCheckedChange={checked => setValue('allowComments', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={onBack} disabled={isPublishing}>
            Back
          </Button>
          <Button type="submit" size="lg" disabled={isPublishing} className="min-w-[200px]">
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {publishOption === 'draft' && 'Save Draft'}
                {publishOption === 'publish' && 'Publish Now'}
                {publishOption === 'schedule' && 'Schedule Post'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
