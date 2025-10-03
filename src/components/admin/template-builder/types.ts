/**
 * Shared types for Template Builder components
 */

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'price' | 'array' | 'boolean' | 'object';
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: unknown;
  maxItems?: number;
}

export type TemplateType = 'course' | 'event';

export interface TemplateFormData {
  [key: string]: unknown;
}

export interface TemplateErrors {
  [key: string]: string;
}

export interface ArrayInputs {
  [key: string]: string;
}
