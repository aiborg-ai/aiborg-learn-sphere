export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'price' | 'array' | 'boolean' | 'object';
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: any;
  maxItems?: number;
}

export interface TemplateBuilderState {
  templateType: 'course' | 'event';
  formData: Record<string, any>;
  arrayInputs: Record<string, string>;
  errors: Record<string, string>;
  showPreview: boolean;
  expandedSections: Record<string, boolean>;
}

export type TemplateType = 'course' | 'event';
