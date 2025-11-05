/**
 * Zod validation schemas for AI Blog Workflow
 */

import { z } from 'zod';

/**
 * Step 1: Topic & Audience Input
 */
export const topicStepSchema = z.object({
  topic: z
    .string()
    .min(10, 'Topic must be at least 10 characters')
    .max(500, 'Topic must be less than 500 characters'),
  audience: z.enum(['primary', 'secondary', 'professional', 'business'], {
    required_error: 'Please select a target audience',
  }),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly'], {
    required_error: 'Please select a tone',
  }),
  length: z.enum(['short', 'medium', 'long'], {
    required_error: 'Please select a content length',
  }),
  keywords: z.string().optional(),
});

export type TopicStepData = z.infer<typeof topicStepSchema>;

/**
 * Step 2: Generation (Image Selection)
 */
export const generationStepSchema = z.object({
  selectedImage: z.object({
    url: z.string().url(),
    thumbnail: z.string().url(),
    photographer: z.string(),
    photographerUrl: z.string().url().optional(),
  }),
});

export type GenerationStepData = z.infer<typeof generationStepSchema>;

/**
 * Step 3: Edit Content
 */
export const editStepSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(50, 'Excerpt must be at least 50 characters')
    .max(500, 'Excerpt must be less than 500 characters'),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content is too long'),
  categoryId: z.string().uuid('Invalid category'),
  tags: z.array(z.string()).min(1, 'Select at least one tag').max(10, 'Maximum 10 tags allowed'),
  metaTitle: z
    .string()
    .max(160, 'Meta title must be less than 160 characters')
    .optional()
    .or(z.literal('')),
  metaDescription: z
    .string()
    .max(320, 'Meta description must be less than 320 characters')
    .optional()
    .or(z.literal('')),
  featuredImage: z.string().url('Invalid image URL'),
});

export type EditStepData = z.infer<typeof editStepSchema>;

/**
 * Step 4: Review & Publish
 */
export const reviewStepSchema = z.object({
  publishOption: z.enum(['draft', 'publish', 'schedule'], {
    required_error: 'Please select a publishing option',
  }),
  scheduledFor: z.string().datetime().optional(),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
});

export type ReviewStepData = z.infer<typeof reviewStepSchema>;

/**
 * Complete workflow data
 */
export const completeWorkflowSchema = topicStepSchema
  .merge(generationStepSchema)
  .merge(editStepSchema)
  .merge(reviewStepSchema);

export type CompleteWorkflowData = z.infer<typeof completeWorkflowSchema>;

/**
 * AI Generation Response (from Edge Function)
 */
export const aiGenerationResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  suggestedTags: z.array(z.string()),
  suggestedCategory: z.string(),
  suggestedImages: z.array(
    z.object({
      url: z.string().url(),
      thumbnail: z.string().url(),
      photographer: z.string(),
      photographerUrl: z.string().url().optional(),
    })
  ),
  readingTime: z.number(),
});

export type AIGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
