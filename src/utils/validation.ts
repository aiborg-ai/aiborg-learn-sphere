/**
 * Validation Utilities
 *
 * Input validation and sanitization for security
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Sanitize user input to prevent XSS
export function sanitizeString(input: string, maxLength = 1000): string {
  if (!input) return '';

  // Remove any HTML/script tags
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Trim and limit length
  return cleaned.trim().substring(0, maxLength);
}

// Sanitize HTML with limited tags
export function sanitizeHTML(input: string, maxLength = 5000): string {
  if (!input) return '';

  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });

  return cleaned.substring(0, maxLength);
}

// Validate widget configuration
export const widgetConfigSchema = z.object({
  title: z.string().max(200).optional(),
  showTitle: z.boolean().optional(),
  refreshInterval: z.number().min(0).max(86400).optional(), // Max 24 hours
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(['date', 'name', 'progress']).optional(),
  showTimestamps: z.boolean().optional(),
  showPercentage: z.boolean().optional(),
  chartType: z.enum(['line', 'bar', 'area']).optional(),
  showEvents: z.boolean().optional(),
  showDeadlines: z.boolean().optional(),
  groupByDate: z.boolean().optional(),
});

// Validate template data
export const templateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['student', 'instructor', 'admin', 'analytics', 'other']),
  tags: z.array(z.string().max(50)).max(10),
});

// Validate dashboard widget
export const dashboardWidgetSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  position: z.object({
    x: z.number().min(0).max(12),
    y: z.number().min(0),
  }),
  size: z.object({
    width: z.number().min(1).max(12),
    height: z.number().min(1).max(20),
  }),
  config: widgetConfigSchema,
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

// Validate dashboard configuration
export const dashboardConfigSchema = z.object({
  widgets: z.array(dashboardWidgetSchema).max(20), // Limit to 20 widgets
  layout: z.enum(['grid', 'freeform']),
  responsiveSettings: z.object({
    mobile: z.object({ columns: z.number() }),
    tablet: z.object({ columns: z.number() }),
    desktop: z.object({ columns: z.number() }),
  }),
  theme: z.object({}).optional(),
});

// Validate share link settings
export const shareLinkSchema = z.object({
  expiresInDays: z.number().min(0).max(365),
  maxUses: z.number().min(0).max(1000),
  requireAuth: z.boolean(),
});

// Validate rating (1-5 stars)
export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// Validate UUID
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Safe parse JSON
export function safeParseJSON<T>(json: string): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export default {
  sanitizeString,
  sanitizeHTML,
  validateRating,
  validateUUID,
  validateEmail,
  safeParseJSON,
  widgetConfigSchema,
  templateSchema,
  dashboardConfigSchema,
  shareLinkSchema,
  dashboardWidgetSchema,
};
