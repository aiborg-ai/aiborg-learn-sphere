export interface TemplateValidationRule {
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
}

export interface TemplateField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'number'
    | 'date'
    | 'price'
    | 'array'
    | 'boolean'
    | 'object';
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: TemplateValidationRule;
  maxItems?: number;
}

export interface TemplateBuilderState {
  templateType: 'course' | 'event';
  formData: Record<string, unknown>;
  arrayInputs: Record<string, string>;
  errors: Record<string, string>;
  showPreview: boolean;
  expandedSections: Record<string, boolean>;
}

export type TemplateType = 'course' | 'event';
