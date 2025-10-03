import { supabase } from '@/integrations/supabase/client';
import { CourseTemplateSchema } from '@/lib/schemas/course-template.schema';
import { EventTemplateSchema } from '@/lib/schemas/event-template.schema';
import { z } from 'zod';

import { logger } from '@/utils/logger';
export interface ValidationRequest {
  type: 'course' | 'event';
  data: Record<string, unknown> | Record<string, unknown>[];
  options?: {
    checkDuplicates?: boolean;
    validateDependencies?: boolean;
    batchMode?: boolean;
  };
}

export interface ValidationResponse {
  success: boolean;
  data?: Record<string, unknown> | Record<string, unknown>[];
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  summary?: ValidationSummary;
  duplicates?: DuplicateInfo[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
  index?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: string;
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  duplicates?: number;
}

export interface DuplicateInfo {
  indices?: number[];
  field: string;
  value: string;
  existingId?: number;
}

export interface ImportRequest {
  type: 'course' | 'event';
  data: Record<string, unknown> | Record<string, unknown>[];
  options?: {
    skip_duplicates?: boolean;
    update_existing?: boolean;
    dry_run?: boolean;
    send_notifications?: boolean;
    auto_publish?: boolean;
    validate_first?: boolean;
  };
}

export interface ImportResponse {
  success: boolean;
  import_id?: string;
  summary?: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    updated: number;
  };
  results?: ImportResult[];
  errors?: ImportError[];
}

export interface ImportResult {
  index?: number;
  id: number;
  type: 'course' | 'event';
  title: string;
  status: 'imported' | 'updated' | 'skipped' | 'failed';
  message?: string;
}

export interface ImportError {
  index?: number;
  field?: string;
  message: string;
  code: string;
}

export interface ImportHistoryRequest {
  page?: number;
  limit?: number;
  status?: string;
  type?: 'course' | 'event' | 'mixed';
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'completed_at' | 'total_count' | 'success_count';
  sort_order?: 'asc' | 'desc';
}

export interface ImportRecord {
  id: string;
  import_type: string;
  file_name: string;
  file_size?: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_count: number;
  success_count: number;
  error_count: number;
  warning_count: number;
  skipped_count: number;
  errors?: ImportError[];
  warnings?: ValidationWarning[];
  options?: Record<string, unknown>;
  items?: ImportResult[];
  audit_logs?: Record<string, unknown>[];
}

class TemplateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
  }

  /**
   * Validate templates before import
   */
  async validateTemplates(request: ValidationRequest): Promise<ValidationResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/validate-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Validation failed');
      }

      return await response.json();
    } catch (error) {
      logger.error('Validation error:', error);
      throw error;
    }
  }

  /**
   * Import templates into the database
   */
  async importTemplates(request: ImportRequest): Promise<ImportResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/import-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Import failed');
      }

      return await response.json();
    } catch (error) {
      logger.error('Import error:', error);
      throw error;
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(params?: ImportHistoryRequest): Promise<{
    success: boolean;
    imports?: ImportRecord[];
    pagination?: {
      page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `${this.baseUrl}/import-history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch history');
      }

      return await response.json();
    } catch (error) {
      logger.error('History error:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific import
   */
  async getImportDetails(importId: string): Promise<ImportRecord> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/import-history/${importId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch import details');
      }

      const result = await response.json();
      return result.imports?.[0];
    } catch (error) {
      logger.error('Import details error:', error);
      throw error;
    }
  }

  /**
   * Get import statistics
   */
  async getImportStatistics(): Promise<{
    total_imports: number;
    successful_imports: number;
    failed_imports: number;
    imports_by_type: Record<string, number>;
    imports_by_date: Record<string, number>;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/import-history/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch statistics');
      }

      const result = await response.json();
      return result.statistics;
    } catch (error) {
      logger.error('Statistics error:', error);
      throw error;
    }
  }

  /**
   * Parse JSON file content
   */
  async parseJSONFile(file: File): Promise<Record<string, unknown> | Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON format'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Download template example
   */
  downloadTemplateExample(type: 'course' | 'event') {
    const examples = {
      course: {
        title: "Advanced Machine Learning",
        description: "Comprehensive course on machine learning algorithms and applications",
        audiences: ["Professional", "Student"],
        mode: "Online",
        duration: "8 weeks",
        price: "₹5000",
        level: "Advanced",
        start_date: "2025-03-01",
        features: ["Live sessions", "Hands-on projects", "Certificate"],
        keywords: ["ML", "AI", "Deep Learning"],
        category: "Technology"
      },
      event: {
        title: "AI Workshop",
        description: "Hands-on workshop on practical AI applications",
        event_type: "workshop",
        audiences: ["Professional"],
        date: "2025-02-15",
        time: "2:00 PM IST",
        duration: "3 hours",
        mode: "online",
        price: "Free",
        keywords: ["AI", "Workshop"],
        category: "Technology"
      }
    };

    const template = type === 'course'
      ? { courses: [examples.course] }
      : { events: [examples.event] };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template_example.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const templateService = new TemplateService();

// Local validation functions for the Template Builder
export function validateCourseTemplate(data: any[]): ValidationResponse {
  try {
    const validatedData = data.map((item, index) => {
      try {
        const result = CourseTemplateSchema.parse(item);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              index
            }))
          };
        }
        throw error;
      }
    });

    const errors = validatedData.flatMap((v) => (v as { errors?: ValidationError[] }).errors || []);
    const valid = validatedData.filter((v) => (v as { success: boolean }).success).length;

    return {
      success: errors.length === 0,
      data: validatedData.filter((v) => (v as { success: boolean }).success).map((v) => (v as { data: Record<string, unknown> }).data),
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: data.length,
        valid,
        invalid: data.length - valid,
        warnings: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'VALIDATION_ERROR'
      }]
    };
  }
}

export function validateEventTemplate(data: Record<string, unknown>[]): ValidationResponse {
  try {
    const validatedData = data.map((item, index) => {
      try {
        const result = EventTemplateSchema.parse(item);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              index
            }))
          };
        }
        throw error;
      }
    });

    const errors = validatedData.flatMap((v) => (v as { errors?: ValidationError[] }).errors || []);
    const valid = validatedData.filter((v) => (v as { success: boolean }).success).length;

    return {
      success: errors.length === 0,
      data: validatedData.filter((v) => (v as { success: boolean }).success).map((v) => (v as { data: Record<string, unknown> }).data),
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: data.length,
        valid,
        invalid: data.length - valid,
        warnings: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'VALIDATION_ERROR'
      }]
    };
  }
}