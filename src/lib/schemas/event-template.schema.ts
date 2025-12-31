import { z } from 'zod';
import {
  EventTypeEnum,
  DateStringSchema,
  TimeStringSchema,
  DurationSchema,
  PriceSchema,
  VenueDetailsSchema,
  SpeakerSchema,
  AgendaItemSchema,
  CertificateSchema,
  SponsorSchema,
  ContactInfoSchema,
  RegistrationFieldsSchema,
  RecordingSchema,
} from './common.schema';

/**
 * Schema for validating event templates for bulk import
 */

// Main event template schema
export const EventTemplateSchema = z
  .object({
    // Required fields
    title: z
      .string()
      .min(1, 'Event title is required')
      .max(200, 'Event title must be less than 200 characters')
      .transform(val => val.trim()),

    description: z
      .string()
      .min(10, 'Event description must be at least 10 characters')
      .max(5000, 'Event description must be less than 5000 characters')
      .transform(val => val.trim()),

    event_type: EventTypeEnum,

    date: DateStringSchema,

    time: TimeStringSchema,

    duration: DurationSchema,

    location: z
      .string()
      .min(1, 'Location is required')
      .max(200, 'Location must be less than 200 characters')
      .transform(val => val.trim()),

    max_attendees: z
      .number()
      .int('Max attendees must be an integer')
      .positive('Max attendees must be positive')
      .nullable()
      .optional(),

    registration_deadline: DateStringSchema,

    price: PriceSchema,

    // Required with defaults
    is_featured: z.boolean().default(false),

    is_active: z.boolean().default(true),

    display: z.boolean().default(true),

    // Required arrays
    tags: z
      .array(z.string().min(1))
      .min(1, 'At least one tag is required')
      .max(20, 'Maximum 20 tags allowed')
      .transform(tags => tags.map(t => t.toLowerCase().trim()).filter(t => t.length > 0)),

    // Optional nested objects
    venue_details: VenueDetailsSchema.optional(),

    speaker_info: SpeakerSchema.optional(),

    agenda: z
      .array(AgendaItemSchema)
      .optional()
      .refine(
        agenda => {
          if (!agenda || agenda.length === 0) return true;
          // Check if agenda times are in chronological order
          // This is a simplified check - you might want more sophisticated validation
          return true;
        },
        {
          message: 'Agenda items should be in chronological order',
        }
      ),

    prerequisites: z
      .string()
      .max(1000, 'Prerequisites must be less than 1000 characters')
      .optional(),

    what_to_bring: z.array(z.string()).max(10, 'Maximum 10 items in what to bring list').optional(),

    benefits: z.array(z.string()).max(15, 'Maximum 15 benefits allowed').optional(),

    target_audience: z.array(z.string()).max(10, 'Maximum 10 target audience groups').optional(),

    registration_form_fields: RegistrationFieldsSchema.optional(),

    certificates: CertificateSchema.optional(),

    recording: RecordingSchema.optional(),

    sponsors: z.array(SponsorSchema).max(20, 'Maximum 20 sponsors allowed').optional(),

    contact_info: ContactInfoSchema.optional(),

    // Optional metadata fields
    min_attendees: z.number().int().positive('Minimum attendees must be positive').optional(),

    early_bird_price: PriceSchema.optional(),

    early_bird_deadline: DateStringSchema.optional(),

    group_discount: z
      .object({
        min_group_size: z.number().int().positive(),
        discount_percentage: z.number().min(0).max(100),
        discount_amount: z.string().optional(),
      })
      .optional(),

    cancellation_policy: z.string().max(1000).optional(),

    refund_policy: z.string().max(1000).optional(),

    // SEO fields
    meta_title: z.string().max(60).optional(),

    meta_description: z.string().max(160).optional(),

    // Social media
    hashtags: z.array(z.string()).max(10).optional(),

    social_media_links: z
      .object({
        facebook: z.string().url().optional(),
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        instagram: z.string().url().optional(),
      })
      .optional(),

    // Custom fields for extensibility
    custom_fields: z.record(z.unknown()).optional(),
  })
  .refine(
    data => {
      // Validate min/max attendees relationship
      if (data.min_attendees && data.max_attendees) {
        return data.min_attendees <= data.max_attendees;
      }
      return true;
    },
    {
      message: 'Minimum attendees must be less than or equal to maximum attendees',
      path: ['min_attendees'],
    }
  )
  .refine(
    data => {
      // Validate registration deadline is before event date
      if (data.registration_deadline && data.date) {
        // Skip validation for flexible dates
        if (data.date === 'Flexible' || data.date === 'Coming Soon' || data.date === 'TBD') {
          return true;
        }
        if (
          data.registration_deadline === 'Flexible' ||
          data.registration_deadline === 'Coming Soon' ||
          data.registration_deadline === 'TBD'
        ) {
          return true;
        }
        // Compare dates
        const regDate = new Date(data.registration_deadline);
        const eventDate = new Date(data.date);
        return regDate <= eventDate;
      }
      return true;
    },
    {
      message: 'Registration deadline must be before or on the event date',
      path: ['registration_deadline'],
    }
  )
  .refine(
    data => {
      // Validate early bird deadline is before registration deadline
      if (data.early_bird_deadline && data.registration_deadline) {
        // Skip validation for flexible dates
        if (data.registration_deadline === 'Flexible' || data.early_bird_deadline === 'Flexible') {
          return true;
        }
        // Compare dates
        const earlyBirdDate = new Date(data.early_bird_deadline);
        const regDate = new Date(data.registration_deadline);
        return earlyBirdDate <= regDate;
      }
      return true;
    },
    {
      message: 'Early bird deadline must be before registration deadline',
      path: ['early_bird_deadline'],
    }
  );

// Type inference for TypeScript
export type EventTemplate = z.infer<typeof EventTemplateSchema>;

// Schema for batch event import
export const EventBatchTemplateSchema = z.object({
  events: z
    .array(EventTemplateSchema)
    .min(1, 'At least one event is required')
    .max(500, 'Maximum 500 events can be imported at once'),

  import_options: z
    .object({
      skip_duplicates: z.boolean().default(false),
      update_existing: z.boolean().default(false),
      dry_run: z.boolean().default(false),
      send_notifications: z.boolean().default(false),
      auto_publish: z.boolean().default(false),
    })
    .optional(),
});

export type EventBatchTemplate = z.infer<typeof EventBatchTemplateSchema>;

// Validation helper functions
export function validateEventTemplate(data: unknown): {
  success: boolean;
  data?: EventTemplate;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
} {
  try {
    const validated = EventTemplateSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return {
        success: false,
        errors: _error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
    }
    return {
      success: false,
      errors: [
        {
          field: 'unknown',
          message: 'Validation failed',
          code: 'UNKNOWN_ERROR',
        },
      ],
    };
  }
}

export function validateEventBatch(data: unknown): {
  success: boolean;
  data?: EventBatchTemplate;
  errors?: Array<{
    index: number;
    field: string;
    message: string;
    code: string;
  }>;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
  };
} {
  try {
    const validated = EventBatchTemplateSchema.parse(data);
    return {
      success: true,
      data: validated,
      summary: {
        total: validated.events.length,
        valid: validated.events.length,
        invalid: 0,
      },
    };
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const errors = _error.errors.map(err => {
        const path = err.path.join('.');
        const match = path.match(/events\[(\d+)\]\.(.*)/);
        if (match) {
          return {
            index: parseInt(match[1]),
            field: match[2] || 'event',
            message: err.message,
            code: err.code,
          };
        }
        return {
          index: -1,
          field: path,
          message: err.message,
          code: err.code,
        };
      });

      // Calculate summary
      const invalidIndexes = new Set(errors.filter(e => e.index >= 0).map(e => e.index));
      const batchData = data as { events?: unknown[] };
      const totalEvents = batchData?.events?.length || 0;

      return {
        success: false,
        errors,
        summary: {
          total: totalEvents,
          valid: totalEvents - invalidIndexes.size,
          invalid: invalidIndexes.size,
        },
      };
    }
    return {
      success: false,
      errors: [
        {
          index: -1,
          field: 'unknown',
          message: 'Validation failed',
          code: 'UNKNOWN_ERROR',
        },
      ],
    };
  }
}

// Check for duplicate events
export function checkEventDuplicates(events: EventTemplate[]): {
  hasDuplicates: boolean;
  duplicates: Array<{
    indices: number[];
    field: string;
    value: string;
  }>;
} {
  const duplicates: Array<{
    indices: number[];
    field: string;
    value: string;
  }> = [];

  // Check for duplicate title + date + time combination
  const combinationMap = new Map<string, number[]>();
  events.forEach((event, index) => {
    const key = `${event.title.toLowerCase()}::${event.date}::${event.time}`;
    if (!combinationMap.has(key)) {
      combinationMap.set(key, []);
    }
    combinationMap.get(key)!.push(index);
  });

  combinationMap.forEach((indices, combination) => {
    if (indices.length > 1) {
      const [title, date, time] = combination.split('::');
      duplicates.push({
        indices,
        field: 'title + date + time',
        value: `"${title}" on ${date} at ${time}`,
      });
    }
  });

  // Check for same venue at same time
  const venueTimeMap = new Map<string, number[]>();
  events.forEach((event, index) => {
    // Only check for physical venues
    if (
      event.location.toLowerCase() !== 'online' &&
      !event.location.toLowerCase().includes('virtual')
    ) {
      const key = `${event.location.toLowerCase()}::${event.date}::${event.time}`;
      if (!venueTimeMap.has(key)) {
        venueTimeMap.set(key, []);
      }
      venueTimeMap.get(key)!.push(index);
    }
  });

  venueTimeMap.forEach((indices, combination) => {
    if (indices.length > 1) {
      const [location, date, time] = combination.split('::');
      duplicates.push({
        indices,
        field: 'location + date + time',
        value: `Venue conflict at "${location}" on ${date} at ${time}`,
      });
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

// Check for event conflicts
export function checkEventConflicts(events: EventTemplate[]): {
  hasConflicts: boolean;
  conflicts: Array<{
    indices: number[];
    type: string;
    message: string;
  }>;
} {
  const conflicts: Array<{
    indices: number[];
    type: string;
    message: string;
  }> = [];

  // Check for overlapping events at the same venue
  // This would require parsing time and duration to check for actual overlaps
  // Simplified version here

  // Check for speaker conflicts (same speaker at overlapping times)
  const speakerTimeMap = new Map<string, Array<{ index: number; date: string; time: string }>>();

  events.forEach((event, index) => {
    if (event.speaker_info?.name) {
      const speakerName = event.speaker_info.name.toLowerCase();
      if (!speakerTimeMap.has(speakerName)) {
        speakerTimeMap.set(speakerName, []);
      }
      speakerTimeMap.get(speakerName)!.push({
        index,
        date: event.date,
        time: event.time,
      });
    }
  });

  speakerTimeMap.forEach((eventsList, speaker) => {
    if (eventsList.length > 1) {
      // Check for same date
      const dateGroups = new Map<string, number[]>();
      eventsList.forEach(event => {
        if (!dateGroups.has(event.date)) {
          dateGroups.set(event.date, []);
        }
        dateGroups.get(event.date)!.push(event.index);
      });

      dateGroups.forEach((indices, date) => {
        if (indices.length > 1) {
          conflicts.push({
            indices,
            type: 'speaker_conflict',
            message: `Speaker "${speaker}" has multiple events on ${date}`,
          });
        }
      });
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
