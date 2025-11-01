import { z } from 'zod';

/**
 * Common validation patterns for reuse across schemas
 * @const validationPatterns
 * @description Collection of reusable Zod validation patterns for common fields
 */
export const validationPatterns = {
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  currency: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid currency format'),
};

/**
 * Authentication-related validation schemas
 * @const authSchemas
 * @description Validation schemas for authentication flows (sign in, sign up, password reset)
 */
export const authSchemas = {
  signIn: z.object({
    email: validationPatterns.email,
    password: z.string().min(1, 'Password is required'),
  }),

  signUp: z
    .object({
      email: validationPatterns.email,
      password: validationPatterns.password,
      confirmPassword: z.string(),
      displayName: validationPatterns.displayName.optional(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  forgotPassword: z.object({
    email: validationPatterns.email,
  }),

  resetPassword: z
    .object({
      password: validationPatterns.password,
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
};

/**
 * Course management validation schemas
 * @const courseSchemas
 * @description Validation schemas for course creation and enrollment
 */
export const courseSchemas = {
  create: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    duration: z.string().min(1, 'Duration is required'),
    price: validationPatterns.currency,
    startDate: validationPatterns.date,
    mode: z.enum(['Online', 'In-Person', 'Hybrid']),
    features: z.string().optional(),
    keywords: z.string().optional(),
    prerequisites: z.string().optional(),
    audiences: z.array(z.string()).min(1, 'At least one audience is required'),
    sortOrder: z.number().optional(),
  }),

  enroll: z.object({
    courseId: z.number().positive('Invalid course ID'),
    paymentMethod: z.enum(['card', 'upi', 'netbanking']).optional(),
  }),
};

/**
 * User profile validation schemas
 * @const profileSchemas
 * @description Validation schemas for user profile updates and preferences
 */
export const profileSchemas = {
  update: z.object({
    displayName: validationPatterns.displayName,
    email: validationPatterns.email,
    phone: validationPatterns.phone.optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatarUrl: validationPatterns.url.optional(),
  }),

  preferences: z.object({
    notifications: z.boolean(),
    emailUpdates: z.boolean(),
    darkMode: z.boolean(),
    language: z.enum(['en', 'es', 'fr', 'de']),
  }),
};

/**
 * Assignment management validation schemas
 * @const assignmentSchemas
 * @description Validation schemas for assignment creation, submission, and grading
 */
export const assignmentSchemas = {
  create: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
    dueDate: validationPatterns.date,
    maxScore: z.number().positive('Max score must be positive'),
    allowedFileTypes: z.array(z.string()).min(1, 'At least one file type is required'),
    maxFileSizeMb: z
      .number()
      .positive('File size must be positive')
      .max(100, 'Max file size is 100MB'),
    allowLateSubmission: z.boolean(),
  }),

  submit: z.object({
    submissionText: z.string().min(1, 'Submission text is required'),
    fileUrls: z.array(validationPatterns.url).optional(),
  }),

  grade: z.object({
    score: z.number().min(0, 'Score must be non-negative'),
    feedback: z.string().optional(),
  }),
};

/**
 * Blog content validation schemas
 * @const blogSchemas
 * @description Validation schemas for blog posts and comments
 */
export const blogSchemas = {
  createPost: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(100, 'Content must be at least 100 characters'),
    excerpt: z.string().max(200, 'Excerpt must be less than 200 characters').optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    categoryId: z.string().uuid('Invalid category'),
    tags: z.array(z.string()).optional(),
    published: z.boolean(),
    featuredImage: validationPatterns.url.optional(),
  }),

  createComment: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
    parentId: z.string().uuid().optional(),
  }),
};

/**
 * Event management validation schemas
 * @const eventSchemas
 * @description Validation schemas for event creation and registration
 */
export const eventSchemas = {
  create: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    eventDate: validationPatterns.date,
    eventTime: validationPatterns.time,
    location: z.string().min(3, 'Location must be at least 3 characters'),
    maxAttendees: z.number().positive('Max attendees must be positive').optional(),
    registrationDeadline: validationPatterns.date.optional(),
    eventType: z.enum(['workshop', 'seminar', 'conference', 'webinar']),
    isActive: z.boolean(),
  }),

  register: z.object({
    eventId: z.string().uuid('Invalid event ID'),
    attendeeName: validationPatterns.displayName,
    attendeeEmail: validationPatterns.email,
    attendeePhone: validationPatterns.phone.optional(),
  }),
};

/**
 * Course review validation schemas
 * @const reviewSchemas
 * @description Validation schemas for creating course reviews
 */
export const reviewSchemas = {
  create: z.object({
    courseId: z.number().positive('Invalid course ID'),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z
      .string()
      .min(10, 'Review must be at least 10 characters')
      .max(500, 'Review is too long'),
  }),
};

/**
 * Contact form validation schemas
 * @const contactSchemas
 * @description Validation schemas for contact form submissions
 */
export const contactSchemas = {
  form: z.object({
    name: validationPatterns.displayName,
    email: validationPatterns.email,
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    message: z
      .string()
      .min(10, 'Message must be at least 10 characters')
      .max(1000, 'Message is too long'),
    phone: validationPatterns.phone.optional(),
  }),
};

/**
 * Extract error messages from Zod validation errors
 * @param {z.ZodError} error - Zod validation error object
 * @returns {Record<string, string>} Object mapping field paths to error messages
 * @example
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const errors = getValidationErrors(error);
 *     // { "email": "Invalid email address", "password": "Password is required" }
 *   }
 * }
 */
export function getValidationErrors(error: z.ZodError) {
  return error.errors.reduce(
    (acc, curr) => {
      const path = curr.path.join('.');
      acc[path] = curr.message;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Validate data against a Zod schema asynchronously
 * @template T - Expected type after validation
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {Promise<{success: boolean, data?: T, errors?: Record<string, string>}>} Validation result
 * @example
 * const result = await validateData(authSchemas.signIn, formData);
 * if (result.success) {
 *   // result.data is typed and validated
 *   await signIn(result.data);
 * } else {
 *   // result.errors contains field-specific error messages
 *   showErrors(result.errors);
 * }
 */
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; errors?: Record<string, string> }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: getValidationErrors(error) };
    }
    throw error;
  }
}
