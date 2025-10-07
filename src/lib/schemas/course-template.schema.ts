import { z } from 'zod';
import {
  AudienceEnum,
  CourseModeEnum,
  CourseLevelEnum,
  DateStringSchema,
  DurationSchema,
  PriceSchema,
  CourseMaterialSchema,
  InstructorSchema,
  BatchInfoSchema,
  ScheduleSchema,
} from './common.schema';

/**
 * Schema for validating course templates for bulk import
 */

// Main course template schema
export const CourseTemplateSchema = z
  .object({
    // Required fields
    title: z
      .string()
      .min(1, 'Course title is required')
      .max(200, 'Course title must be less than 200 characters')
      .transform(val => val.trim()),

    description: z
      .string()
      .min(10, 'Course description must be at least 10 characters')
      .max(5000, 'Course description must be less than 5000 characters')
      .transform(val => val.trim()),

    audiences: z
      .array(AudienceEnum)
      .min(1, 'At least one audience type is required')
      .max(4, 'Maximum 4 audience types allowed'),

    mode: CourseModeEnum,

    duration: DurationSchema,

    price: PriceSchema,

    level: CourseLevelEnum,

    start_date: DateStringSchema,

    // Required arrays
    features: z
      .array(z.string().min(1))
      .min(1, 'At least one feature is required')
      .max(20, 'Maximum 20 features allowed')
      .transform(features => features.map(f => f.trim()).filter(f => f.length > 0)),

    keywords: z
      .array(z.string().min(1))
      .min(1, 'At least one keyword is required')
      .max(30, 'Maximum 30 keywords allowed')
      .transform(keywords => keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)),

    // Required with defaults
    category: z
      .string()
      .min(1, 'Category is required')
      .max(100, 'Category must be less than 100 characters')
      .transform(val => val.trim()),

    prerequisites: z
      .string()
      .max(1000, 'Prerequisites must be less than 1000 characters')
      .default('None')
      .transform(val => val.trim()),

    is_active: z.boolean().default(true),

    currently_enrolling: z.boolean().default(true),

    display: z.boolean().default(true),

    sort_order: z
      .number()
      .int('Sort order must be an integer')
      .min(0, 'Sort order must be non-negative')
      .default(0),

    // Optional nested objects
    course_materials: z
      .array(CourseMaterialSchema)
      .optional()
      .refine(
        materials => {
          if (!materials || materials.length === 0) return true;
          // Check for unique order indexes
          const orderIndexes = materials.map(m => m.order_index);
          return orderIndexes.length === new Set(orderIndexes).size;
        },
        {
          message: 'Course materials must have unique order indexes',
        }
      ),

    instructor_info: InstructorSchema.optional(),

    batch_info: BatchInfoSchema.optional(),

    schedule: ScheduleSchema.optional(),

    // Optional metadata fields
    max_students: z.number().int().positive('Maximum students must be positive').optional(),

    min_students: z.number().int().positive('Minimum students must be positive').optional(),

    enrollment_deadline: DateStringSchema.optional(),

    certification_available: z.boolean().optional(),

    completion_criteria: z.string().max(500).optional(),

    refund_policy: z.string().max(1000).optional(),

    // Optional contact information
    support_email: z.string().email().optional(),

    support_phone: z.string().optional(),

    // Tags for additional categorization
    tags: z.array(z.string()).max(20).optional(),

    // SEO fields
    meta_title: z.string().max(60).optional(),

    meta_description: z.string().max(160).optional(),

    // Custom fields for extensibility
    custom_fields: z.record(z.unknown()).optional(),
  })
  .refine(
    data => {
      // Validate min/max students relationship
      if (data.min_students && data.max_students) {
        return data.min_students <= data.max_students;
      }
      return true;
    },
    {
      message: 'Minimum students must be less than or equal to maximum students',
      path: ['min_students'],
    }
  )
  .refine(
    data => {
      // Validate enrollment deadline is before start date
      if (data.enrollment_deadline && data.start_date) {
        // Skip validation for flexible dates
        if (
          data.start_date === 'Flexible' ||
          data.start_date === 'Coming Soon' ||
          data.start_date === 'TBD'
        ) {
          return true;
        }
        if (
          data.enrollment_deadline === 'Flexible' ||
          data.enrollment_deadline === 'Coming Soon' ||
          data.enrollment_deadline === 'TBD'
        ) {
          return true;
        }
        // Compare dates
        const enrollmentDate = new Date(data.enrollment_deadline);
        const startDate = new Date(data.start_date);
        return enrollmentDate <= startDate;
      }
      return true;
    },
    {
      message: 'Enrollment deadline must be before or on the start date',
      path: ['enrollment_deadline'],
    }
  );

// Type inference for TypeScript
export type CourseTemplate = z.infer<typeof CourseTemplateSchema>;

// Schema for batch course import
export const CourseBatchTemplateSchema = z.object({
  courses: z
    .array(CourseTemplateSchema)
    .min(1, 'At least one course is required')
    .max(1000, 'Maximum 1000 courses can be imported at once'),

  import_options: z
    .object({
      skip_duplicates: z.boolean().default(false),
      update_existing: z.boolean().default(false),
      dry_run: z.boolean().default(false),
      send_notifications: z.boolean().default(false),
    })
    .optional(),
});

export type CourseBatchTemplate = z.infer<typeof CourseBatchTemplateSchema>;

// Validation helper functions
export function validateCourseTemplate(data: unknown): {
  success: boolean;
  data?: CourseTemplate;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
} {
  try {
    const validated = CourseTemplateSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
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

export function validateCourseBatch(data: unknown): {
  success: boolean;
  data?: CourseBatchTemplate;
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
    const validated = CourseBatchTemplateSchema.parse(data);
    return {
      success: true,
      data: validated,
      summary: {
        total: validated.courses.length,
        valid: validated.courses.length,
        invalid: 0,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        const match = path.match(/courses\[(\d+)\]\.(.*)/);
        if (match) {
          return {
            index: parseInt(match[1]),
            field: match[2] || 'course',
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
      const batchData = data as { courses?: unknown[] };
      const totalCourses = batchData?.courses?.length || 0;

      return {
        success: false,
        errors,
        summary: {
          total: totalCourses,
          valid: totalCourses - invalidIndexes.size,
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

// Check for duplicate courses
export function checkCourseDuplicates(courses: CourseTemplate[]): {
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

  // Check for duplicate titles
  const titleMap = new Map<string, number[]>();
  courses.forEach((course, index) => {
    const key = course.title.toLowerCase();
    if (!titleMap.has(key)) {
      titleMap.set(key, []);
    }
    titleMap.get(key)!.push(index);
  });

  titleMap.forEach((indices, title) => {
    if (indices.length > 1) {
      duplicates.push({
        indices,
        field: 'title',
        value: title,
      });
    }
  });

  // Check for duplicate title + start_date combination
  const combinationMap = new Map<string, number[]>();
  courses.forEach((course, index) => {
    const key = `${course.title.toLowerCase()}::${course.start_date}`;
    if (!combinationMap.has(key)) {
      combinationMap.set(key, []);
    }
    combinationMap.get(key)!.push(index);
  });

  combinationMap.forEach((indices, combination) => {
    if (indices.length > 1) {
      const [title, start_date] = combination.split('::');
      duplicates.push({
        indices,
        field: 'title + start_date',
        value: `${title} starting on ${start_date}`,
      });
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}
