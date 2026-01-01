/**
 * AI Content Service
 *
 * Manages system prompts, content templates, and grading rubrics from database.
 * Eliminates hardcoded content and provides centralized management.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AISystemPrompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt_template: string;
  variables: string[];
  audience: string | null;
  category: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContentTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content_type: 'text' | 'html' | 'markdown';
  category: string;
  templates: Record<string, string>; // { primary: "...", secondary: "...", etc. }
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingRubric {
  id: string;
  key: string;
  name: string;
  description: string | null;
  criteria: RubricCriterion[];
  pass_score: number;
  strictness: number;
  is_default: boolean;
  subject_area: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  levels?: {
    score: number;
    description: string;
  }[];
}

// ============================================================================
// In-Memory Cache
// ============================================================================

class AIContentCache {
  private prompts: Map<string, AISystemPrompt> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();
  private rubrics: Map<string, GradingRubric> = new Map();
  private lastFetch: Map<string, number> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetch.get(key);
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.cacheDuration;
  }

  setPrompt(key: string, prompt: AISystemPrompt): void {
    this.prompts.set(key, prompt);
    this.lastFetch.set(`prompt:${key}`, Date.now());
  }

  getPrompt(key: string): AISystemPrompt | undefined {
    if (!this.isCacheValid(`prompt:${key}`)) return undefined;
    return this.prompts.get(key);
  }

  setTemplate(key: string, template: ContentTemplate): void {
    this.templates.set(key, template);
    this.lastFetch.set(`template:${key}`, Date.now());
  }

  getTemplate(key: string): ContentTemplate | undefined {
    if (!this.isCacheValid(`template:${key}`)) return undefined;
    return this.templates.get(key);
  }

  setRubric(key: string, rubric: GradingRubric): void {
    this.rubrics.set(key, rubric);
    this.lastFetch.set(`rubric:${key}`, Date.now());
  }

  getRubric(key: string): GradingRubric | undefined {
    if (!this.isCacheValid(`rubric:${key}`)) return undefined;
    return this.rubrics.get(key);
  }

  clearAll(): void {
    this.prompts.clear();
    this.templates.clear();
    this.rubrics.clear();
    this.lastFetch.clear();
  }
}

const cache = new AIContentCache();

// ============================================================================
// AI System Prompts
// ============================================================================

export class AIContentService {
  /**
   * Get system prompt by key
   */
  static async getSystemPrompt(key: string, audience?: string): Promise<AISystemPrompt | null> {
    try {
      // Check cache first
      const cacheKey = audience ? `${key}_${audience}` : key;
      const cached = cache.getPrompt(cacheKey);
      if (cached) {
        logger.log(`[AIContentService] Cache hit for prompt: ${cacheKey}`);
        return cached;
      }

      // Query database
      const query = supabase
        .from('ai_system_prompts')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      // If audience specified, try to get audience-specific prompt first
      if (audience) {
        const { data: audiencePrompt } = await supabase
          .from('ai_system_prompts')
          .select('*')
          .eq('key', key)
          .eq('audience', audience)
          .eq('is_active', true)
          .single();

        if (audiencePrompt) {
          cache.setPrompt(cacheKey, audiencePrompt);
          return audiencePrompt;
        }
      }

      // Fall back to general prompt (audience = 'all' or null)
      const { data, error } = await query;

      if (error) {
        logger.error(`[AIContentService] Error fetching prompt ${key}:`, error);
        return null;
      }

      if (data) {
        cache.setPrompt(cacheKey, data);
      }

      return data;
    } catch (_error) {
      logger.error(`[AIContentService] Exception fetching prompt:`, _error);
      return null;
    }
  }

  /**
   * Replace variables in prompt template
   */
  static fillPromptTemplate(template: string, variables: Record<string, string | number>): string {
    let filled = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      filled = filled.replace(regex, String(value));
    });

    return filled;
  }

  /**
   * Get filled system prompt with variables replaced
   */
  static async getFilledSystemPrompt(
    key: string,
    variables: Record<string, string | number>,
    audience?: string
  ): Promise<string | null> {
    const prompt = await this.getSystemPrompt(key, audience);
    if (!prompt) return null;

    return this.fillPromptTemplate(prompt.prompt_template, variables);
  }

  /**
   * Get all prompts by category
   */
  static async getPromptsByCategory(category: string): Promise<AISystemPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error(`[AIContentService] Error fetching prompts by category:`, _error);
      return [];
    }
  }

  // ============================================================================
  // Content Templates
  // ============================================================================

  /**
   * Get content template by key
   */
  static async getContentTemplate(key: string): Promise<ContentTemplate | null> {
    try {
      // Check cache
      const cached = cache.getTemplate(key);
      if (cached) {
        logger.log(`[AIContentService] Cache hit for template: ${key}`);
        return cached;
      }

      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error(`[AIContentService] Error fetching template ${key}:`, error);
        return null;
      }

      if (data) {
        cache.setTemplate(key, data);
      }

      return data;
    } catch (_error) {
      logger.error(`[AIContentService] Exception fetching template:`, _error);
      return null;
    }
  }

  /**
   * Get personalized content from template
   */
  static async getPersonalizedContent(
    key: string,
    audience: 'primary' | 'secondary' | 'professional' | 'business' | 'default',
    variables?: Record<string, string | number>
  ): Promise<string | null> {
    const template = await this.getContentTemplate(key);
    if (!template) return null;

    // Get content for audience, fall back to default
    let content = template.templates[audience] || template.templates.default || '';

    // Replace variables if provided
    if (variables) {
      content = this.fillPromptTemplate(content, variables);
    }

    return content;
  }

  /**
   * Get all templates by category
   */
  static async getTemplatesByCategory(category: string): Promise<ContentTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error(`[AIContentService] Error fetching templates by category:`, _error);
      return [];
    }
  }

  // ============================================================================
  // Grading Rubrics
  // ============================================================================

  /**
   * Get grading rubric by key
   */
  static async getGradingRubric(key: string): Promise<GradingRubric | null> {
    try {
      // Check cache
      const cached = cache.getRubric(key);
      if (cached) {
        logger.log(`[AIContentService] Cache hit for rubric: ${key}`);
        return cached;
      }

      const { data, error } = await supabase
        .from('grading_rubrics')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error(`[AIContentService] Error fetching rubric ${key}:`, error);
        return null;
      }

      if (data) {
        cache.setRubric(key, data);
      }

      return data;
    } catch (_error) {
      logger.error(`[AIContentService] Exception fetching rubric:`, _error);
      return null;
    }
  }

  /**
   * Get default rubric for subject area
   */
  static async getDefaultRubric(subjectArea?: string): Promise<GradingRubric | null> {
    try {
      let query = supabase
        .from('grading_rubrics')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true);

      if (subjectArea) {
        query = query.eq('subject_area', subjectArea);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        logger.error('[AIContentService] Error fetching default rubric:', error);
      }

      return data || null;
    } catch (_error) {
      logger.error('[AIContentService] Exception fetching default rubric:', _error);
      return null;
    }
  }

  /**
   * Get all rubrics by subject area
   */
  static async getRubricsBySubject(subjectArea: string): Promise<GradingRubric[]> {
    try {
      const { data, error } = await supabase
        .from('grading_rubrics')
        .select('*')
        .eq('subject_area', subjectArea)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error(`[AIContentService] Error fetching rubrics by subject:`, _error);
      return [];
    }
  }

  // ============================================================================
  // Admin Management Functions
  // ============================================================================

  /**
   * Create new system prompt (admin only)
   */
  static async createSystemPrompt(
    prompt: Omit<AISystemPrompt, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AISystemPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .insert(prompt)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      cache.clearAll();

      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error creating prompt:', _error);
      return null;
    }
  }

  /**
   * Update system prompt (admin only)
   */
  static async updateSystemPrompt(
    id: string,
    updates: Partial<AISystemPrompt>
  ): Promise<AISystemPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('ai_system_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      cache.clearAll();

      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error updating prompt:', _error);
      return null;
    }
  }

  /**
   * Delete system prompt (admin only) - soft delete by setting is_active = false
   */
  static async deleteSystemPrompt(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_system_prompts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      cache.clearAll();

      return true;
    } catch (_error) {
      logger.error('[AIContentService] Error deleting prompt:', _error);
      return false;
    }
  }

  /**
   * Create content template (admin only)
   */
  static async createContentTemplate(
    template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ContentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      cache.clearAll();
      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error creating template:', _error);
      return null;
    }
  }

  /**
   * Update content template (admin only)
   */
  static async updateContentTemplate(
    id: string,
    updates: Partial<ContentTemplate>
  ): Promise<ContentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      cache.clearAll();
      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error updating template:', _error);
      return null;
    }
  }

  /**
   * Create grading rubric (admin only)
   */
  static async createGradingRubric(
    rubric: Omit<GradingRubric, 'id' | 'created_at' | 'updated_at'>
  ): Promise<GradingRubric | null> {
    try {
      const { data, error } = await supabase
        .from('grading_rubrics')
        .insert(rubric)
        .select()
        .single();

      if (error) throw error;

      cache.clearAll();
      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error creating rubric:', _error);
      return null;
    }
  }

  /**
   * Update grading rubric (admin only)
   */
  static async updateGradingRubric(
    id: string,
    updates: Partial<GradingRubric>
  ): Promise<GradingRubric | null> {
    try {
      const { data, error } = await supabase
        .from('grading_rubrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      cache.clearAll();
      return data;
    } catch (_error) {
      logger.error('[AIContentService] Error updating rubric:', _error);
      return null;
    }
  }

  /**
   * Clear all caches (useful after bulk updates)
   */
  static clearCache(): void {
    cache.clearAll();
    logger.log('[AIContentService] Cache cleared');
  }
}
