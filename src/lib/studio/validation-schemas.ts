/**
 * Validation Schemas
 * Zod schemas for validating wizard step data
 */

import { z } from 'zod';
import { logger } from '@/utils/logger';

// ========== Common Schemas ==========

const urlSchema = z.string().url().optional().or(z.literal(''));

const tagSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().optional(),
  color: z.string().optional(),
});

const scheduleSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional().nullable(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  recurring: z
    .object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      endType: z.enum(['never', 'after', 'on']).optional(),
      endAfterOccurrences: z.number().optional(),
      endOnDate: z.date().optional(),
    })
    .optional(),
  timezone: z.string(),
});

// ========== Course Validation Schemas ==========

export const courseBasicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  image_url: urlSchema,
  category: z.string().min(1, 'Category is required'),
});

export const courseContentSchema = z.object({
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  prerequisites: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  mode: z.enum(['online', 'in-person', 'hybrid']),
  duration: z.string().min(1, 'Duration is required'),
});

export const courseSchedulingSchema = z.object({
  start_date: z.string().optional(),
  schedule: scheduleSchema.optional(),
});

export const courseAudienceSchema = z.object({
  audiences: z.array(z.string()).min(1, 'At least one target audience is required'),
  target_description: z.string().optional(),
});

export const coursePricingSchema = z.object({
  price: z.string().min(1, 'Price is required'),
  payment_options: z.array(z.string()).optional(),
  early_bird_price: z.string().optional(),
  group_discount: z.string().optional(),
  currently_enrolling: z.boolean(),
});

export const courseTagsSchema = z.object({
  tags: z.array(tagSchema).optional(),
  keywords: z.array(z.string()).optional(),
});

// ========== Event Validation Schemas ==========

export const eventBasicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  image_url: urlSchema,
  event_type: z.string().min(1, 'Event type is required'),
});

export const eventDetailsSchema = z.object({
  format: z.enum(['online', 'in-person', 'hybrid']),
  special_requirements: z.string().optional(),
});

export const eventSchedulingSchema = z.object({
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().min(1, 'Event time is required'),
  duration: z.string().optional(),
  schedule: scheduleSchema.optional(),
});

export const eventLocationSchema = z
  .object({
    location: z.string().optional(),
    online_link: urlSchema,
    venue_details: z.string().optional(),
  })
  .refine(
    data => {
      // At least one of location or online_link should be provided
      return !!data.location || !!data.online_link;
    },
    {
      message: 'Either location or online link must be provided',
      path: ['location'],
    }
  );

export const eventCapacitySchema = z.object({
  max_capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  allow_waitlist: z.boolean(),
  registration_deadline: z.string().optional(),
});

export const eventTagsSchema = z.object({
  tags: z.array(tagSchema).optional(),
});

// ========== Blog Validation Schemas ==========

export const blogBasicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase, hyphens only)'),
  excerpt: z
    .string()
    .min(20, 'Excerpt must be at least 20 characters')
    .max(300, 'Excerpt too long'),
});

export const blogContentSchema = z.object({
  content: z.string().min(100, 'Content must be at least 100 characters'),
  featured_image: urlSchema,
});

export const blogSEOSchema = z.object({
  meta_title: z.string().max(60, 'Meta title should be under 60 characters').optional(),
  meta_description: z
    .string()
    .max(160, 'Meta description should be under 160 characters')
    .optional(),
  focus_keywords: z.array(z.string()).optional(),
});

export const blogSchedulingSchema = z.object({
  publish_date: z.string().optional(),
  expiry_date: z.string().optional(),
  schedule: scheduleSchema.optional(),
});

export const blogTagsSchema = z.object({
  category_id: z.string().optional(),
  tags: z.array(tagSchema).optional(),
});

// ========== Announcement Validation Schemas ==========

export const announcementBasicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

export const announcementAudienceSchema = z.object({
  target_audience: z.string().optional(),
  priority: z.number().min(1).max(10, 'Priority must be between 1 and 10'),
});

export const announcementSchedulingSchema = z.object({
  schedule: scheduleSchema.optional(),
});

// ========== Export All Schemas by Asset Type ==========

export const courseSchemas = {
  'basic-info': courseBasicInfoSchema,
  content: courseContentSchema,
  scheduling: courseSchedulingSchema,
  audience: courseAudienceSchema,
  pricing: coursePricingSchema,
  tags: courseTagsSchema,
};

export const eventSchemas = {
  'basic-info': eventBasicInfoSchema,
  details: eventDetailsSchema,
  scheduling: eventSchedulingSchema,
  location: eventLocationSchema,
  capacity: eventCapacitySchema,
  tags: eventTagsSchema,
};

export const blogSchemas = {
  'basic-info': blogBasicInfoSchema,
  content: blogContentSchema,
  seo: blogSEOSchema,
  scheduling: blogSchedulingSchema,
  tags: blogTagsSchema,
};

export const announcementSchemas = {
  'basic-info': announcementBasicInfoSchema,
  audience: announcementAudienceSchema,
  scheduling: announcementSchedulingSchema,
};

// ========== Validation Helper Functions ==========

export function validateStep(
  assetType: string,
  stepId: string,
  data: Record<string, unknown>
): { success: boolean; errors?: Record<string, string> } {
  let schema: z.ZodSchema | undefined;

  // Get the appropriate schema
  switch (assetType) {
    case 'course':
      schema = courseSchemas[stepId as keyof typeof courseSchemas];
      break;
    case 'event':
      schema = eventSchemas[stepId as keyof typeof eventSchemas];
      break;
    case 'blog':
      schema = blogSchemas[stepId as keyof typeof blogSchemas];
      break;
    case 'announcement':
      schema = announcementSchemas[stepId as keyof typeof announcementSchemas];
      break;
  }

  if (!schema) {
    logger.warn(`No schema found for ${assetType}:${stepId}`);
    return { success: true }; // No validation if schema not found
  }

  try {
    schema.parse(data);
    return { success: true };
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      _error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _general: 'Validation failed' } };
  }
}

export function validateFullAsset(
  assetType: string,
  data: Record<string, unknown>
): { success: boolean; errors?: Record<string, string> } {
  const allSchemas =
    assetType === 'course'
      ? Object.values(courseSchemas)
      : assetType === 'event'
        ? Object.values(eventSchemas)
        : assetType === 'blog'
          ? Object.values(blogSchemas)
          : Object.values(announcementSchemas);

  const allErrors: Record<string, string> = {};
  let hasErrors = false;

  allSchemas.forEach((schema, _index) => {
    try {
      schema.parse(data);
    } catch (_error) {
      if (_error instanceof z.ZodError) {
        hasErrors = true;
        _error.errors.forEach(err => {
          const path = err.path.join('.');
          allErrors[path] = err.message;
        });
      }
    }
  });

  return hasErrors ? { success: false, errors: allErrors } : { success: true };
}
