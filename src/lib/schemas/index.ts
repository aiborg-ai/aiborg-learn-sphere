/**
 * Central export file for all template validation schemas
 */

// Export all common schemas and types
export {
  // Date and time schemas
  DateStringSchema,
  TimeStringSchema,
  DurationSchema,

  // Contact schemas
  EmailSchema,
  PhoneSchema,
  URLSchema,

  // Price schema
  PriceSchema,

  // Enum schemas
  AudienceEnum,
  CourseModeEnum,
  CourseLevelEnum,
  EventTypeEnum,
  MaterialTypeEnum,

  // Nested object schemas
  InstructorSchema,
  SpeakerSchema,
  CourseMaterialSchema,
  BatchInfoSchema,
  ScheduleSchema,
  VenueDetailsSchema,
  AgendaItemSchema,
  CertificateSchema,
  SponsorSchema,
  ContactInfoSchema,
  RegistrationFieldsSchema,
  RecordingSchema,

  // Types
  type ValidationResult,
  type ValidationError,
  type BatchValidationResult
} from './common.schema';

// Export course schemas and types
export {
  CourseTemplateSchema,
  CourseBatchTemplateSchema,
  type CourseTemplate,
  type CourseBatchTemplate,
  validateCourseTemplate,
  validateCourseBatch,
  checkCourseDuplicates
} from './course-template.schema';

// Export event schemas and types
export {
  EventTemplateSchema,
  EventBatchTemplateSchema,
  type EventTemplate,
  type EventBatchTemplate,
  validateEventTemplate,
  validateEventBatch,
  checkEventDuplicates,
  checkEventConflicts
} from './event-template.schema';

// Combined template type for generic processing
export type Template = import('./course-template.schema').CourseTemplate | import('./event-template.schema').EventTemplate;

export type TemplateType = 'course' | 'event';

// Generic validation function
export function validateTemplate(type: TemplateType, data: unknown): ValidationResult {
  if (type === 'course') {
    return validateCourseTemplate(data);
  } else if (type === 'event') {
    return validateEventTemplate(data);
  }

  return {
    success: false,
    errors: [{
      field: 'type',
      message: `Invalid template type: ${type}`,
      code: 'INVALID_TYPE'
    }]
  };
}

// Generic batch validation function
export function validateBatchTemplate(type: TemplateType, data: unknown): BatchValidationResult {
  if (type === 'course') {
    const result = validateCourseBatch(data);
    return {
      total: result.summary?.total || 0,
      valid: result.summary?.valid || 0,
      invalid: result.summary?.invalid || 0,
      warnings: 0,
      items: result.errors?.map(err => ({
        success: false,
        errors: [{
          field: err.field,
          message: err.message,
          code: err.code
        }]
      })) || []
    };
  } else if (type === 'event') {
    const result = validateEventBatch(data);
    return {
      total: result.summary?.total || 0,
      valid: result.summary?.valid || 0,
      invalid: result.summary?.invalid || 0,
      warnings: 0,
      items: result.errors?.map(err => ({
        success: false,
        errors: [{
          field: err.field,
          message: err.message,
          code: err.code
        }]
      })) || []
    };
  }

  return {
    total: 0,
    valid: 0,
    invalid: 0,
    warnings: 0,
    items: []
  };
}

// Utility to generate template examples
export function getTemplateExample(type: TemplateType): any {
  if (type === 'course') {
    return {
      title: "Introduction to AI and Machine Learning",
      description: "Learn the fundamentals of artificial intelligence and machine learning with hands-on projects",
      audiences: ["Professional", "Business"],
      mode: "Online",
      duration: "8 weeks",
      price: "₹5000",
      level: "Beginner",
      start_date: "2025-02-01",
      features: [
        "Live interactive sessions",
        "Hands-on projects",
        "Certificate of completion"
      ],
      keywords: ["ai", "machine-learning", "python", "deep-learning"],
      category: "Technology",
      prerequisites: "Basic programming knowledge",
      is_active: true,
      currently_enrolling: true,
      display: true,
      sort_order: 0
    };
  } else if (type === 'event') {
    return {
      title: "AI Workshop: Building Your First Chatbot",
      description: "Learn to build and deploy your first AI chatbot using modern tools and frameworks",
      event_type: "workshop",
      date: "2025-02-15",
      time: "6:00 PM - 8:00 PM IST",
      duration: "2 hours",
      location: "Online via Zoom",
      max_attendees: 100,
      registration_deadline: "2025-02-14",
      price: "Free",
      is_featured: true,
      is_active: true,
      display: true,
      tags: ["ai", "chatbot", "workshop", "beginners"]
    };
  }

  return null;
}

// Error code to user-friendly message mapping
export const ERROR_MESSAGES: Record<string, string> = {
  'too_small': 'Value is too short or small',
  'too_big': 'Value is too long or large',
  'invalid_type': 'Invalid data type provided',
  'invalid_enum_value': 'Value must be one of the allowed options',
  'invalid_date': 'Invalid date format',
  'invalid_email': 'Invalid email address',
  'invalid_url': 'Invalid URL format',
  'required': 'This field is required',
  'custom': 'Validation failed for custom rule'
};

// Get user-friendly error message
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || 'Validation failed';
}