/**
 * Blog Template Service
 * Handles CRUD operations for blog generation templates
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  BlogTemplate,
  CreateTemplateData,
  UpdateTemplateData,
  GenerationParams,
} from '@/types/blog-scheduler';

export class BlogTemplateService {
  /**
   * Get all templates with optional filtering
   */
  static async getTemplates(filters?: { is_active?: boolean }): Promise<BlogTemplate[]> {
    let query = supabase
      .from('blog_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single template by ID
   */
  static async getTemplateById(id: string): Promise<BlogTemplate> {
    const { data, error } = await supabase.from('blog_templates').select('*').eq('id', id).single();

    if (error) {
      logger.error('Error fetching template:', error);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    if (!data) {
      throw new Error('Template not found');
    }

    return data;
  }

  /**
   * Create a new template
   */
  static async createTemplate(template: CreateTemplateData): Promise<BlogTemplate> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to create templates');
    }

    const { data, error } = await supabase
      .from('blog_templates')
      .insert({
        ...template,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing template
   */
  static async updateTemplate(id: string, updates: UpdateTemplateData): Promise<BlogTemplate> {
    const { data, error } = await supabase
      .from('blog_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a template (set is_active = false)
   */
  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      logger.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Hard delete a template (permanent deletion)
   */
  static async hardDeleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('blog_templates').delete().eq('id', id);

    if (error) {
      logger.error('Error hard deleting template:', error);
      throw new Error(`Failed to permanently delete template: ${error.message}`);
    }
  }

  /**
   * Use a template - returns generation parameters
   */
  static async useTemplate(id: string): Promise<GenerationParams> {
    const template = await this.getTemplateById(id);

    return {
      topic: template.topic_template,
      audience: template.audience,
      tone: template.tone,
      length: template.length,
      keywords: template.keywords || undefined,
      aiProvider: 'ollama', // Default to Ollama as per requirements
    };
  }

  /**
   * Get template usage count (how many batch jobs used this template)
   */
  static async getTemplateUsageCount(id: string): Promise<number> {
    const { count, error } = await supabase
      .from('blog_batch_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', id);

    if (error) {
      logger.error('Error getting template usage count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(id: string, newName?: string): Promise<BlogTemplate> {
    const original = await this.getTemplateById(id);

    const duplicateData: CreateTemplateData = {
      name: newName || `${original.name} (Copy)`,
      description: original.description || undefined,
      topic_template: original.topic_template,
      audience: original.audience,
      tone: original.tone,
      length: original.length,
      keywords: original.keywords || undefined,
      category_id: original.category_id || undefined,
      default_tags: original.default_tags,
      is_active: true,
    };

    return this.createTemplate(duplicateData);
  }

  /**
   * Get most used templates (top 5)
   */
  static async getMostUsedTemplates(): Promise<Array<BlogTemplate & { usage_count: number }>> {
    // First, get all templates
    const templates = await this.getTemplates({ is_active: true });

    // Then, get usage counts for each
    const templatesWithCounts = await Promise.all(
      templates.map(async template => {
        const usage_count = await this.getTemplateUsageCount(template.id);
        return { ...template, usage_count };
      })
    );

    // Sort by usage count and return top 5
    return templatesWithCounts.sort((a, b) => b.usage_count - a.usage_count).slice(0, 5);
  }
}
