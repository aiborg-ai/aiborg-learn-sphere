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
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .refine(pwd => !/(.)\1{2,}/.test(pwd), 'Password cannot contain repeated characters')
    .refine(
      pwd =>
        !/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
          pwd
        ),
      'Password cannot contain sequential characters'
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
 * } catch (_error) {
 *   if (_error instanceof z.ZodError) {
 *     const errors = getValidationErrors(_error);
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
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return { success: false, errors: getValidationErrors(_error) };
    }
    throw error;
  }
}

/**
 * Security-focused validation schemas
 * @const securitySchemas
 * @description Enhanced validation for security-critical operations
 */
export const securitySchemas = {
  // URL validation with protocol and hostname restrictions
  safeUrl: z
    .string()
    .url('Invalid URL format')
    .refine(url => url.startsWith('https://'), {
      message: 'URL must use HTTPS protocol',
    })
    .refine(
      url => {
        try {
          const parsed = new URL(url);
          // Block private/local networks
          const blockedPatterns = [
            /^localhost$/i,
            /^127\.\d+\.\d+\.\d+$/,
            /^0\.0\.0\.0$/,
            /^10\.\d+\.\d+\.\d+$/,
            /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
            /^192\.168\.\d+\.\d+$/,
            /^169\.254\.\d+\.\d+$/,
            /\.local$/i,
          ];
          return !blockedPatterns.some(pattern => pattern.test(parsed.hostname));
        } catch {
          return false;
        }
      },
      {
        message: 'Access to private/local networks is prohibited',
      }
    ),

  // File upload validation
  fileUpload: z.object({
    file: z
      .instanceof(File)
      .refine(file => file.size <= 10 * 1024 * 1024, {
        message: 'File size must be less than 10MB',
      })
      .refine(
        file => {
          const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ];
          return allowedTypes.includes(file.type);
        },
        {
          message: 'Invalid file type. Allowed: images, PDF, Word documents',
        }
      )
      .refine(
        file => {
          // Check for null bytes (security risk)
          return !file.name.includes('\0');
        },
        {
          message: 'Invalid filename',
        }
      ),
  }),

  // Sanitized text input (prevents XSS)
  sanitizedText: z
    .string()
    .max(5000, 'Text is too long')
    .refine(
      text => {
        // Block common XSS patterns
        const xssPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i, // Event handlers like onclick=
          /<iframe/i,
          /<object/i,
          /<embed/i,
          /vbscript:/i,
          /data:text\/html/i,
        ];
        return !xssPatterns.some(pattern => pattern.test(text));
      },
      {
        message: 'Text contains potentially dangerous content',
      }
    ),

  // SQL injection prevention for search queries
  searchQuery: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long')
    .refine(
      query => {
        // Block SQL injection patterns
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
          /(--|#|\/\*|\*\/)/,
          /('|";|";--)/,
          /(\bOR\b.*=.*)/i,
          /(\bAND\b.*=.*)/i,
          /(UNION.*SELECT)/i,
        ];
        return !sqlPatterns.some(pattern => pattern.test(query));
      },
      {
        message: 'Invalid search query',
      }
    ),

  // API key validation
  apiKey: z
    .string()
    .length(32, 'API key must be exactly 32 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'API key contains invalid characters'),

  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Pagination parameters
  pagination: z.object({
    page: z.number().int().min(1, 'Page must be at least 1').max(1000, 'Page too large'),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
  }),

  // Rate limit token
  rateLimitToken: z.object({
    identifier: z.string().min(1).max(100),
    timestamp: z.number().int().positive(),
  }),
};

/**
 * Input sanitization utilities
 * @const sanitizers
 * @description Functions to sanitize various types of user input
 */
export const sanitizers = {
  /**
   * Remove potentially dangerous HTML tags and attributes
   */
  stripHtml: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  },

  /**
   * Sanitize filename to prevent directory traversal
   */
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+/, '')
      .substring(0, 255);
  },

  /**
   * Sanitize SQL LIKE pattern
   */
  sanitizeLikePattern: (pattern: string): string => {
    return pattern.replace(/[%_\\]/g, '\\$&').substring(0, 100);
  },

  /**
   * Sanitize user-provided regular expression
   */
  sanitizeRegex: (pattern: string): string | null => {
    try {
      // Test if it's a valid regex
      new RegExp(pattern);
      // Limit length to prevent ReDoS
      if (pattern.length > 100) return null;
      return pattern;
    } catch {
      return null;
    }
  },

  /**
   * Normalize and validate email address
   */
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
};

/**
 * Common blocked patterns for security
 * @const blockedPatterns
 */
export const blockedPatterns = {
  disposableEmailDomains: [
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
    'trashmail.com',
  ],

  suspiciousUsernames: ['admin', 'administrator', 'root', 'system', 'test', 'user', 'default'],

  commonPasswords: [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
  ],
};

/**
 * Validate email against disposable domains
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return blockedPatterns.disposableEmailDomains.some(blocked => domain?.includes(blocked));
}

/**
 * Validate username against suspicious patterns
 */
export function isSuspiciousUsername(username: string): boolean {
  const lower = username.toLowerCase();
  return blockedPatterns.suspiciousUsernames.some(
    blocked => lower === blocked || lower.startsWith(blocked)
  );
}
