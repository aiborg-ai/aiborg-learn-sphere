/**
 * AI Blog Workflow Page
 *
 * Main orchestrator for the 4-step AI-powered blog creation workflow
 * Similar pattern to ClaimFreePass.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { BlogProgressIndicator } from '@/components/ai-blog-workflow/BlogProgressIndicator';
import { TopicStep } from '@/components/ai-blog-workflow/TopicStep';
import { GenerationStep } from '@/components/ai-blog-workflow/GenerationStep';
import { EditStep } from '@/components/ai-blog-workflow/EditStep';
import { ReviewStep } from '@/components/ai-blog-workflow/ReviewStep';
import { PublishSuccessModal } from '@/components/ai-blog-workflow/PublishSuccessModal';
import type { TopicStepData, EditStepData, ReviewStepData } from '@/schemas/aiBlogWorkflow';
import type { StockImage } from '@/utils/imageSearch';

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  suggestedCategory?: string;
  suggestedTags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

interface WorkflowData {
  topic?: TopicStepData;
  generation?: {
    generatedContent: GeneratedContent;
    selectedImage: StockImage;
  };
  edit?: EditStepData;
  review?: ReviewStepData;
}

export default function AIBlogWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [publishedPost, setPublishedPost] = useState<{
    id: string;
    slug: string;
    status: 'draft' | 'published' | 'scheduled';
    scheduledFor?: string;
  } | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Step 1: Topic & Audience
  const handleTopicNext = (data: TopicStepData) => {
    setWorkflowData(prev => ({ ...prev, topic: data }));
    setCurrentStep(2);
  };

  // Step 2: Generation & Image Selection
  const handleGenerationNext = (data: {
    generatedContent: GeneratedContent;
    selectedImage: StockImage;
  }) => {
    setWorkflowData(prev => ({ ...prev, generation: data }));
    setCurrentStep(3);
  };

  const handleGenerationBack = () => {
    setCurrentStep(1);
  };

  // Step 3: Edit Content
  const handleEditNext = (data: EditStepData) => {
    setWorkflowData(prev => ({ ...prev, edit: data }));
    setCurrentStep(4);
  };

  const handleEditBack = () => {
    setCurrentStep(2);
  };

  // Step 4: Review & Publish
  const handleReviewBack = () => {
    setCurrentStep(3);
  };

  const handleReviewEdit = () => {
    setCurrentStep(3);
  };

  const handlePublish = async (reviewData: ReviewStepData) => {
    try {
      const editData = workflowData.edit!;
      const _generationData = workflowData.generation!;

      // Generate slug if not provided
      const slug =
        editData.slug ||
        editData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      // Calculate reading time
      const wordCount = editData.content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // Determine status
      let status: 'draft' | 'published' | 'scheduled' = 'draft';
      let publishedAt = null;
      let scheduledFor = null;

      if (reviewData.publishOption === 'publish') {
        status = 'published';
        publishedAt = new Date().toISOString();
      } else if (reviewData.publishOption === 'schedule') {
        status = 'scheduled';
        scheduledFor = reviewData.scheduledFor;
      }

      // Insert blog post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .insert({
          slug,
          title: editData.title,
          excerpt: editData.excerpt,
          content: editData.content,
          featured_image: editData.featuredImage,
          author_id: user.id,
          category_id: editData.categoryId,
          status,
          published_at: publishedAt,
          scheduled_for: scheduledFor,
          meta_title: editData.metaTitle || editData.title,
          meta_description: editData.metaDescription || editData.excerpt,
          reading_time: readingTime,
          is_featured: reviewData.isFeatured,
          allow_comments: reviewData.allowComments,
          view_count: 0,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Insert tags
      if (editData.tags && editData.tags.length > 0) {
        // Find or create tags
        const { data: existingTags } = await supabase
          .from('blog_tags')
          .select('id, name')
          .in('name', editData.tags);

        const existingTagNames = existingTags?.map(t => t.name) || [];
        const newTagNames = editData.tags.filter(t => !existingTagNames.includes(t));

        // Create new tags if needed
        let allTagIds = existingTags?.map(t => t.id) || [];

        if (newTagNames.length > 0) {
          const { data: newTags } = await supabase
            .from('blog_tags')
            .insert(
              newTagNames.map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }))
            )
            .select('id');

          if (newTags) {
            allTagIds = [...allTagIds, ...newTags.map(t => t.id)];
          }
        }

        // Link tags to post
        await supabase
          .from('blog_post_tags')
          .insert(allTagIds.map(tag_id => ({ post_id: post.id, tag_id })));
      }

      // Show success modal
      setPublishedPost({
        id: post.id,
        slug: post.slug,
        status,
        scheduledFor,
      });

      toast({
        title: '✨ Success!',
        description: `Blog post ${status === 'draft' ? 'saved as draft' : status === 'published' ? 'published' : 'scheduled'} successfully!`,
      });
    } catch (error) {
      logger.error('Error publishing blog post:', error);
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'Failed to publish blog post',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">AI Blog Post Generator</h1>
          <p className="text-muted-foreground mt-1">
            Create professional blog posts with AI assistance in 4 easy steps
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <BlogProgressIndicator currentStep={currentStep} />

      {/* Step Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <TopicStep initialData={workflowData.topic} onNext={handleTopicNext} />
        )}

        {currentStep === 2 && workflowData.topic && (
          <GenerationStep
            topicData={workflowData.topic}
            onNext={handleGenerationNext}
            onBack={handleGenerationBack}
          />
        )}

        {currentStep === 3 && workflowData.generation && (
          <EditStep
            generatedContent={workflowData.generation.generatedContent}
            selectedImage={workflowData.generation.selectedImage}
            initialData={workflowData.edit}
            onNext={handleEditNext}
            onBack={handleEditBack}
          />
        )}

        {currentStep === 4 && workflowData.edit && (
          <ReviewStep
            editData={workflowData.edit}
            onBack={handleReviewBack}
            onEdit={handleReviewEdit}
            onPublish={handlePublish}
          />
        )}
      </div>

      {/* Success Modal */}
      {publishedPost && (
        <PublishSuccessModal
          isOpen={!!publishedPost}
          onClose={() => setPublishedPost(null)}
          postId={publishedPost.id}
          postSlug={publishedPost.slug}
          status={publishedPost.status}
          scheduledFor={publishedPost.scheduledFor}
        />
      )}
    </div>
  );
}
