import { z } from 'zod';

/**
 * Common validation schemas and utilities used across template validation
 */

// Date validation - accepts YYYY-MM-DD format or flexible strings
export const DateStringSchema = z.string().refine(
  val => {
    // Allow flexible dates
    if (val === 'Flexible' || val === 'Coming Soon' || val === 'TBD') {
      return true;
    }
    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(val)) {
      return false;
    }
    // Check if it's a valid date
    const date = new Date(val);
    return date instanceof Date && !isNaN(date.getTime());
  },
  {
    message: 'Date must be in YYYY-MM-DD format or "Flexible", "Coming Soon", "TBD"',
  }
);

// Email validation
export const EmailSchema = z.string().email('Invalid email address');

// URL validation
export const URLSchema = z.string().url('Invalid URL format');

// Price validation - accepts various formats
export const PriceSchema = z.string().refine(
  val => {
    // Allow free courses
    if (val.toLowerCase() === 'free') {
      return true;
    }
    // Check for currency symbols and numbers
    const priceRegex = /^[₹$€£¥]?\s*\d+(\.\d{1,2})?(\s*[-/]\s*[₹$€£¥]?\s*\d+(\.\d{1,2})?)?$/;
    return priceRegex.test(val.replace(/,/g, ''));
  },
  {
    message: 'Price must be "Free" or a valid amount (e.g., ₹5000, $99, €50)',
  }
);

// Phone number validation
export const PhoneSchema = z.string().refine(
  val => {
    // Basic international phone validation
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/;
    return phoneRegex.test(val.replace(/\s/g, ''));
  },
  {
    message: 'Invalid phone number format',
  }
);

// Time validation - flexible format
export const TimeStringSchema = z.string().refine(
  val => {
    // Allow various time formats
    const timePatterns = [
      /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\s*(-\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?)?/,
      /^\d{1,2}\s*(AM|PM|am|pm)\s*(-\s*\d{1,2}\s*(AM|PM|am|pm)?)?/,
      /^.+\s+(IST|EST|PST|UTC|GMT|CST|MST|CET|CEST|JST|AEST|AEDT)$/,
    ];
    return timePatterns.some(pattern => pattern.test(val));
  },
  {
    message: 'Time must include hours and timezone (e.g., "6:00 PM IST", "3 PM - 5 PM EST")',
  }
);

// Duration validation
export const DurationSchema = z.string().refine(
  val => {
    // Allow various duration formats
    const durationPatterns = [
      /^\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i,
      /^\d+\s*-\s*\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i,
      /^(Half|Full)\s+day$/i,
      /^\d+\s*\/\s*\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i,
    ];
    return durationPatterns.some(pattern => pattern.test(val));
  },
  {
    message:
      'Duration must be in a valid format (e.g., "2 hours", "4 weeks", "3-6 months", "Full day")',
  }
);

// Audience types enum
export const AudienceEnum = z.enum(['Primary', 'Secondary', 'Professional', 'Business']);

// Course mode enum
export const CourseModeEnum = z.enum(['Online', 'Offline', 'Hybrid']);

// Course level enum
export const CourseLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);

// Event type enum
export const EventTypeEnum = z.enum([
  'workshop',
  'webinar',
  'seminar',
  'conference',
  'meetup',
  'hackathon',
  'bootcamp',
  'training',
]);

// Material type enum
export const MaterialTypeEnum = z.enum([
  'video',
  'document',
  'assignment',
  'quiz',
  'live_session',
  'resource',
  'presentation',
]);

// Instructor info schema
export const InstructorSchema = z.object({
  name: z.string().min(1, 'Instructor name is required'),
  email: EmailSchema,
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  linkedin: URLSchema.optional(),
  photo_url: URLSchema.optional(),
});

// Speaker info schema (for events)
export const SpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name is required'),
  designation: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  linkedin: URLSchema.optional(),
  photo_url: URLSchema.optional(),
});

// Course material schema
export const CourseMaterialSchema = z.object({
  title: z.string().min(1, 'Material title is required'),
  type: MaterialTypeEnum,
  url: URLSchema,
  description: z.string().optional(),
  duration: DurationSchema.optional(),
  order_index: z.number().int().min(1),
  is_preview: z.boolean().default(false),
  is_mandatory: z.boolean().default(true),
});

// Batch info schema
export const BatchInfoSchema = z
  .object({
    batch_size: z.number().int().positive().optional(),
    min_students: z.number().int().positive().optional(),
    max_students: z.number().int().positive().optional(),
    start_date: DateStringSchema.optional(),
    end_date: DateStringSchema.optional(),
  })
  .refine(
    data => {
      if (data.min_students && data.max_students) {
        return data.min_students <= data.max_students;
      }
      return true;
    },
    {
      message: 'Minimum students must be less than or equal to maximum students',
    }
  );

// Schedule schema
export const ScheduleSchema = z.object({
  days: z
    .array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']))
    .optional(),
  time: TimeStringSchema.optional(),
  timezone: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'one-time']).optional(),
});

// Venue details schema (for events)
export const VenueDetailsSchema = z.object({
  platform: z.string().optional(),
  meeting_link: URLSchema.optional(),
  address: z.string().optional(),
  room: z.string().optional(),
  parking: z.string().optional(),
  accessibility: z.string().optional(),
  map_url: URLSchema.optional(),
});

// Agenda item schema (for events)
export const AgendaItemSchema = z.object({
  time: TimeStringSchema,
  topic: z.string().min(1, 'Topic is required'),
  description: z.string().optional(),
  speaker: z.string().optional(),
  duration: DurationSchema.optional(),
});

// Certificate schema
export const CertificateSchema = z.object({
  provided: z.boolean().default(false),
  type: z.enum(['Digital', 'Physical', 'Both']).optional(),
  criteria: z.string().optional(),
});

// Sponsor schema
export const SponsorSchema = z.object({
  name: z.string().min(1, 'Sponsor name is required'),
  logo_url: URLSchema.optional(),
  website: URLSchema.optional(),
  type: z.enum(['Gold', 'Silver', 'Bronze', 'Partner', 'Community']).optional(),
});

// Contact info schema
export const ContactInfoSchema = z.object({
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  whatsapp: PhoneSchema.optional(),
  website: URLSchema.optional(),
});

// Registration form fields schema
export const RegistrationFieldsSchema = z.object({
  collect_phone: z.boolean().default(false),
  collect_organization: z.boolean().default(false),
  collect_designation: z.boolean().default(false),
  collect_experience_level: z.boolean().default(false),
  custom_questions: z.array(z.string()).optional(),
});

// Recording settings schema
export const RecordingSchema = z.object({
  will_be_recorded: z.boolean().default(false),
  available_to_attendees: z.boolean().default(false),
  availability_duration: z.string().optional(),
});

// Common validation result types
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface BatchValidationResult {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  items: ValidationResult[];
}
