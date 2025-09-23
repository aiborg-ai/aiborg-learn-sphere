import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// ============================================
// COMMON SCHEMAS
// ============================================

// Date validation - accepts YYYY-MM-DD format or flexible strings
export const DateStringSchema = z.string().refine(
  (val) => {
    if (val === 'Flexible' || val === 'Coming Soon' || val === 'TBD') {
      return true
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      return false
    }
    const date = new Date(val)
    return date instanceof Date && !isNaN(date.getTime())
  },
  {
    message: 'Date must be in YYYY-MM-DD format or "Flexible", "Coming Soon", "TBD"'
  }
)

// Email validation
export const EmailSchema = z.string().email('Invalid email address')

// URL validation
export const URLSchema = z.string().url('Invalid URL format')

// Price validation
export const PriceSchema = z.string().refine(
  (val) => {
    if (val.toLowerCase() === 'free') {
      return true
    }
    const priceRegex = /^[₹$€£¥]?\s*\d+(\.\d{1,2})?(\s*[-/]\s*[₹$€£¥]?\s*\d+(\.\d{1,2})?)?$/
    return priceRegex.test(val.replace(/,/g, ''))
  },
  {
    message: 'Price must be "Free" or a valid amount (e.g., ₹5000, $99, €50)'
  }
)

// Phone validation
export const PhoneSchema = z.string().refine(
  (val) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/
    return phoneRegex.test(val.replace(/\s/g, ''))
  },
  {
    message: 'Invalid phone number format'
  }
)

// Time validation
export const TimeStringSchema = z.string().refine(
  (val) => {
    const timePatterns = [
      /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\s*(-\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?)?/,
      /^\d{1,2}\s*(AM|PM|am|pm)\s*(-\s*\d{1,2}\s*(AM|PM|am|pm)?)?/,
      /^.+\s+(IST|EST|PST|UTC|GMT|CST|MST|CET|CEST|JST|AEST|AEDT)$/
    ]
    return timePatterns.some(pattern => pattern.test(val))
  },
  {
    message: 'Time must include hours and timezone (e.g., "6:00 PM IST", "3 PM - 5 PM EST")'
  }
)

// Duration validation
export const DurationSchema = z.string().refine(
  (val) => {
    const durationPatterns = [
      /^\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i,
      /^\d+\s*-\s*\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i,
      /^(Half|Full)\s+day$/i,
      /^\d+\s*\/\s*\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?)$/i
    ]
    return durationPatterns.some(pattern => pattern.test(val))
  },
  {
    message: 'Duration must be in a valid format (e.g., "2 hours", "4 weeks", "3-6 months", "Full day")'
  }
)

// Enums
export const AudienceEnum = z.enum(['Primary', 'Secondary', 'Professional', 'Business'])
export const CourseModeEnum = z.enum(['Online', 'Offline', 'Hybrid'])
export const CourseLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced'])
export const EventTypeEnum = z.enum([
  'workshop',
  'webinar',
  'seminar',
  'conference',
  'meetup',
  'hackathon',
  'bootcamp',
  'training'
])
export const MaterialTypeEnum = z.enum([
  'video',
  'document',
  'assignment',
  'quiz',
  'live_session',
  'resource',
  'presentation'
])

// Nested schemas
export const InstructorSchema = z.object({
  name: z.string().min(1, 'Instructor name is required'),
  email: EmailSchema,
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  linkedin: URLSchema.optional(),
  photo_url: URLSchema.optional()
})

export const SpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name is required'),
  designation: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  linkedin: URLSchema.optional(),
  photo_url: URLSchema.optional()
})

export const CourseMaterialSchema = z.object({
  title: z.string().min(1, 'Material title is required'),
  type: MaterialTypeEnum,
  url: URLSchema,
  description: z.string().optional(),
  duration: DurationSchema.optional(),
  order_index: z.number().int().min(1),
  is_preview: z.boolean().default(false),
  is_mandatory: z.boolean().default(true)
})

export const BatchInfoSchema = z.object({
  batch_size: z.number().int().positive().optional(),
  min_students: z.number().int().positive().optional(),
  max_students: z.number().int().positive().optional(),
  start_date: DateStringSchema.optional(),
  end_date: DateStringSchema.optional()
}).refine(
  (data) => {
    if (data.min_students && data.max_students) {
      return data.min_students <= data.max_students
    }
    return true
  },
  {
    message: 'Minimum students must be less than or equal to maximum students'
  }
)

export const ScheduleSchema = z.object({
  days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  time: TimeStringSchema.optional(),
  timezone: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'one-time']).optional()
})

export const VenueDetailsSchema = z.object({
  platform: z.string().optional(),
  meeting_link: URLSchema.optional(),
  address: z.string().optional(),
  room: z.string().optional(),
  parking: z.string().optional(),
  accessibility: z.string().optional(),
  map_url: URLSchema.optional()
})

export const AgendaItemSchema = z.object({
  time: TimeStringSchema,
  topic: z.string().min(1, 'Topic is required'),
  description: z.string().optional(),
  speaker: z.string().optional(),
  duration: DurationSchema.optional()
})

export const CertificateSchema = z.object({
  provided: z.boolean().default(false),
  type: z.enum(['Digital', 'Physical', 'Both']).optional(),
  criteria: z.string().optional()
})

export const SponsorSchema = z.object({
  name: z.string().min(1, 'Sponsor name is required'),
  logo_url: URLSchema.optional(),
  website: URLSchema.optional(),
  type: z.enum(['Gold', 'Silver', 'Bronze', 'Partner', 'Community']).optional()
})

// ============================================
// COURSE TEMPLATE SCHEMA
// ============================================

export const CourseTemplateSchema = z.object({
  title: z.string()
    .min(1, 'Course title is required')
    .max(200, 'Course title must be less than 200 characters')
    .transform(val => val.trim()),

  description: z.string()
    .min(10, 'Course description must be at least 10 characters')
    .max(5000, 'Course description must be less than 5000 characters')
    .transform(val => val.trim()),

  audiences: z.array(AudienceEnum)
    .min(1, 'At least one audience type is required')
    .max(4, 'Maximum 4 audience types allowed'),

  mode: CourseModeEnum,
  duration: DurationSchema,
  price: PriceSchema,
  level: CourseLevelEnum,
  start_date: DateStringSchema,

  features: z.array(z.string().min(1))
    .min(1, 'At least one feature is required')
    .max(20, 'Maximum 20 features allowed')
    .transform(features => features.map(f => f.trim()).filter(f => f.length > 0)),

  keywords: z.array(z.string().min(1))
    .min(1, 'At least one keyword is required')
    .max(30, 'Maximum 30 keywords allowed')
    .transform(keywords => keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)),

  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .transform(val => val.trim()),

  prerequisites: z.string()
    .max(1000, 'Prerequisites must be less than 1000 characters')
    .default('None')
    .transform(val => val.trim()),

  is_active: z.boolean().default(true),
  currently_enrolling: z.boolean().default(true),
  display: z.boolean().default(true),
  sort_order: z.number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be non-negative')
    .default(0),

  course_materials: z.array(CourseMaterialSchema).optional(),
  instructor_info: InstructorSchema.optional(),
  batch_info: BatchInfoSchema.optional(),
  schedule: ScheduleSchema.optional(),

  max_students: z.number().int().positive().optional(),
  min_students: z.number().int().positive().optional(),
  enrollment_deadline: DateStringSchema.optional(),
  certification_available: z.boolean().optional(),
  completion_criteria: z.string().max(500).optional(),
  refund_policy: z.string().max(1000).optional(),
  support_email: z.string().email().optional(),
  support_phone: z.string().optional(),
  tags: z.array(z.string()).max(20).optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  custom_fields: z.record(z.unknown()).optional()
}).refine(
  (data) => {
    if (data.min_students && data.max_students) {
      return data.min_students <= data.max_students
    }
    return true
  },
  {
    message: 'Minimum students must be less than or equal to maximum students',
    path: ['min_students']
  }
)

export type CourseTemplate = z.infer<typeof CourseTemplateSchema>

// ============================================
// EVENT TEMPLATE SCHEMA
// ============================================

export const EventTemplateSchema = z.object({
  title: z.string()
    .min(1, 'Event title is required')
    .max(200, 'Event title must be less than 200 characters')
    .transform(val => val.trim()),

  description: z.string()
    .min(10, 'Event description must be at least 10 characters')
    .max(5000, 'Event description must be less than 5000 characters')
    .transform(val => val.trim()),

  event_type: EventTypeEnum,
  date: DateStringSchema,
  time: TimeStringSchema,
  duration: DurationSchema,

  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .transform(val => val.trim()),

  max_attendees: z.number()
    .int('Max attendees must be an integer')
    .positive('Max attendees must be positive')
    .nullable()
    .optional(),

  registration_deadline: DateStringSchema,
  price: PriceSchema,

  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display: z.boolean().default(true),

  tags: z.array(z.string().min(1))
    .min(1, 'At least one tag is required')
    .max(20, 'Maximum 20 tags allowed')
    .transform(tags => tags.map(t => t.toLowerCase().trim()).filter(t => t.length > 0)),

  venue_details: VenueDetailsSchema.optional(),
  speaker_info: SpeakerSchema.optional(),
  agenda: z.array(AgendaItemSchema).optional(),
  prerequisites: z.string().max(1000).optional(),
  what_to_bring: z.array(z.string()).max(10).optional(),
  benefits: z.array(z.string()).max(15).optional(),
  target_audience: z.array(z.string()).max(10).optional(),
  certificates: CertificateSchema.optional(),
  sponsors: z.array(SponsorSchema).max(20).optional(),

  min_attendees: z.number().int().positive().optional(),
  early_bird_price: PriceSchema.optional(),
  early_bird_deadline: DateStringSchema.optional(),
  cancellation_policy: z.string().max(1000).optional(),
  refund_policy: z.string().max(1000).optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  hashtags: z.array(z.string()).max(10).optional(),
  custom_fields: z.record(z.unknown()).optional()
}).refine(
  (data) => {
    if (data.min_attendees && data.max_attendees) {
      return data.min_attendees <= data.max_attendees
    }
    return true
  },
  {
    message: 'Minimum attendees must be less than or equal to maximum attendees',
    path: ['min_attendees']
  }
)

export type EventTemplate = z.infer<typeof EventTemplateSchema>

// ============================================
// BATCH SCHEMAS
// ============================================

export const CourseBatchTemplateSchema = z.object({
  courses: z.array(CourseTemplateSchema)
    .min(1, 'At least one course is required')
    .max(1000, 'Maximum 1000 courses can be imported at once'),

  import_options: z.object({
    skip_duplicates: z.boolean().default(false),
    update_existing: z.boolean().default(false),
    dry_run: z.boolean().default(false),
    send_notifications: z.boolean().default(false)
  }).optional()
})

export const EventBatchTemplateSchema = z.object({
  events: z.array(EventTemplateSchema)
    .min(1, 'At least one event is required')
    .max(500, 'Maximum 500 events can be imported at once'),

  import_options: z.object({
    skip_duplicates: z.boolean().default(false),
    update_existing: z.boolean().default(false),
    dry_run: z.boolean().default(false),
    send_notifications: z.boolean().default(false),
    auto_publish: z.boolean().default(false)
  }).optional()
})

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

export function validateCourseTemplate(data: unknown) {
  try {
    const validated = CourseTemplateSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'UNKNOWN_ERROR'
      }]
    }
  }
}

export function validateEventTemplate(data: unknown) {
  try {
    const validated = EventTemplateSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'UNKNOWN_ERROR'
      }]
    }
  }
}

export function validateCourseBatch(data: unknown) {
  try {
    const validated = CourseBatchTemplateSchema.parse(data)
    return {
      success: true,
      data: validated,
      summary: {
        total: validated.courses.length,
        valid: validated.courses.length,
        invalid: 0
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.')
        const match = path.match(/courses\[(\d+)\]\.(.*)/)
        if (match) {
          return {
            index: parseInt(match[1]),
            field: match[2] || 'course',
            message: err.message,
            code: err.code
          }
        }
        return {
          index: -1,
          field: path,
          message: err.message,
          code: err.code
        }
      })

      const invalidIndexes = new Set(errors.filter(e => e.index >= 0).map(e => e.index))
      const batchData = data as any
      const totalCourses = batchData?.courses?.length || 0

      return {
        success: false,
        errors,
        summary: {
          total: totalCourses,
          valid: totalCourses - invalidIndexes.size,
          invalid: invalidIndexes.size
        }
      }
    }
    return {
      success: false,
      errors: [{
        index: -1,
        field: 'unknown',
        message: 'Validation failed',
        code: 'UNKNOWN_ERROR'
      }]
    }
  }
}

export function validateEventBatch(data: unknown) {
  try {
    const validated = EventBatchTemplateSchema.parse(data)
    return {
      success: true,
      data: validated,
      summary: {
        total: validated.events.length,
        valid: validated.events.length,
        invalid: 0
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.')
        const match = path.match(/events\[(\d+)\]\.(.*)/)
        if (match) {
          return {
            index: parseInt(match[1]),
            field: match[2] || 'event',
            message: err.message,
            code: err.code
          }
        }
        return {
          index: -1,
          field: path,
          message: err.message,
          code: err.code
        }
      })

      const invalidIndexes = new Set(errors.filter(e => e.index >= 0).map(e => e.index))
      const batchData = data as any
      const totalEvents = batchData?.events?.length || 0

      return {
        success: false,
        errors,
        summary: {
          total: totalEvents,
          valid: totalEvents - invalidIndexes.size,
          invalid: invalidIndexes.size
        }
      }
    }
    return {
      success: false,
      errors: [{
        index: -1,
        field: 'unknown',
        message: 'Validation failed',
        code: 'UNKNOWN_ERROR'
      }]
    }
  }
}

export function checkCourseDuplicates(courses: CourseTemplate[]) {
  const duplicates: Array<{
    indices: number[]
    field: string
    value: string
  }> = []

  const titleMap = new Map<string, number[]>()
  courses.forEach((course, index) => {
    const key = course.title.toLowerCase()
    if (!titleMap.has(key)) {
      titleMap.set(key, [])
    }
    titleMap.get(key)!.push(index)
  })

  titleMap.forEach((indices, title) => {
    if (indices.length > 1) {
      duplicates.push({
        indices,
        field: 'title',
        value: title
      })
    }
  })

  const combinationMap = new Map<string, number[]>()
  courses.forEach((course, index) => {
    const key = `${course.title.toLowerCase()}::${course.start_date}`
    if (!combinationMap.has(key)) {
      combinationMap.set(key, [])
    }
    combinationMap.get(key)!.push(index)
  })

  combinationMap.forEach((indices, combination) => {
    if (indices.length > 1) {
      const [title, start_date] = combination.split('::')
      duplicates.push({
        indices,
        field: 'title + start_date',
        value: `${title} starting on ${start_date}`
      })
    }
  })

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  }
}

export function checkEventDuplicates(events: EventTemplate[]) {
  const duplicates: Array<{
    indices: number[]
    field: string
    value: string
  }> = []

  const combinationMap = new Map<string, number[]>()
  events.forEach((event, index) => {
    const key = `${event.title.toLowerCase()}::${event.date}::${event.time}`
    if (!combinationMap.has(key)) {
      combinationMap.set(key, [])
    }
    combinationMap.get(key)!.push(index)
  })

  combinationMap.forEach((indices, combination) => {
    if (indices.length > 1) {
      const [title, date, time] = combination.split('::')
      duplicates.push({
        indices,
        field: 'title + date + time',
        value: `"${title}" on ${date} at ${time}`
      })
    }
  })

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  }
}