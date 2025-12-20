/**
 * Generation Step (Step 2)
 *
 * Shows AI generation progress and image selection
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
} from '@/components/ui/icons';
import { CardImage } from '@/components/shared/OptimizedImage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { TopicStepData } from '@/schemas/aiBlogWorkflow';
import { searchImages, extractImageSearchKeywords, type StockImage } from '@/utils/imageSearch';
import { logger } from '@/utils/logger';

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  suggestedCategory?: string;
  suggestedTags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

interface GenerationStepProps {
  topicData: TopicStepData;
  onNext: (data: { generatedContent: GeneratedContent; selectedImage: StockImage }) => void;
  onBack: () => void;
}

export function GenerationStep({ topicData, onNext, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [suggestedImages, setSuggestedImages] = useState<StockImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<StockImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    generateBlogPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBlogPost = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Call Edge Function to generate blog post
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog-post`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: topicData.topic,
            audience: topicData.audience,
            tone: topicData.tone,
            length: topicData.length,
            keywords: topicData.keywords,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate blog post');
      }

      const result = await response.json();
      setGeneratedContent(result.data);

      toast({
        title: '✨ Blog Post Generated!',
        description: `Generated ${result.meta.wordCount} words in ${result.meta.generationTime}`,
      });

      // Search for images
      const searchQuery = extractImageSearchKeywords(topicData.topic);
      const images = await searchImages(searchQuery, 5);
      setSuggestedImages(images);

      // Auto-select first image
      if (images.length > 0) {
        setSelectedImage(images[0]);
      }
    } catch (err) {
      logger.error('Error generating blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate blog post');
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (!selectedImage) {
      toast({
        title: 'Select an Image',
        description: 'Please select a featured image for your blog post',
        variant: 'destructive',
      });
      return;
    }

    onNext({
      generatedContent,
      selectedImage,
    });
  };

  if (error && !isGenerating) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onBack}>
                Go Back
              </Button>
              <Button onClick={generateBlogPost}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Generating Your Blog Post...</h3>
            <p className="text-muted-foreground mb-4">
              Our AI is crafting a {topicData.length} blog post about "
              {topicData.topic.substring(0, 100)}..."
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>Analyzing topic</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                <span>Generating content</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
                <span>Optimizing SEO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Complete - Image Selection */}
      {!isGenerating && generatedContent && (
        <>
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Blog Post Generated!</h3>
                  <p className="text-sm text-green-700">
                    Your blog post has been created. Now select a featured image to complete the
                    generation.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {generatedContent.title.substring(0, 50)}...
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Image Selection */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Select Featured Image</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.url === image.url
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CardImage
                      src={image.thumbnail}
                      alt={`Option ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    {selectedImage?.url === image.url && (
                      <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-xs text-white">Photo by {image.photographer}</p>
                    </div>
                  </button>
                ))}
              </div>

              {suggestedImages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No images found. You can add a custom image URL in the next step.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={!selectedImage} className="group">
              Continue to Edit
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
