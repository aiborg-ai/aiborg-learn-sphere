import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z, ZodError } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Import schemas (these would be shared with the frontend in a real implementation)
import {
  CourseTemplateSchema,
  EventTemplateSchema,
  CourseBatchTemplateSchema,
  EventBatchTemplateSchema,
  validateCourseTemplate,
  validateEventTemplate,
  validateCourseBatch,
  validateEventBatch,
  checkCourseDuplicates,
  checkEventDuplicates
} from './schemas.ts'

// Types
interface ValidationRequest {
  type: 'course' | 'event'
  data: any | any[]
  options?: {
    checkDuplicates?: boolean
    validateDependencies?: boolean
    batchMode?: boolean
  }
}

interface ValidationResponse {
  success: boolean
  data?: any
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  summary?: ValidationSummary
  duplicates?: DuplicateInfo[]
}

interface ValidationError {
  field: string
  message: string
  code: string
  suggestion?: string
  index?: number
}

interface ValidationWarning {
  field: string
  message: string
  type: string
}

interface ValidationSummary {
  total: number
  valid: number
  invalid: number
  warnings: number
  duplicates?: number
}

interface DuplicateInfo {
  indices?: number[]
  field: string
  value: string
  existingId?: number
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to format Zod errors
function formatZodError(error: ZodError, itemIndex?: number): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    suggestion: getSuggestion(err.code, err.path),
    ...(itemIndex !== undefined && { index: itemIndex })
  }))
}

// Get helpful suggestions based on error code
function getSuggestion(code: string, path: (string | number)[]): string {
  const field = path[path.length - 1]?.toString() || ''

  const suggestions: Record<string, string> = {
    'invalid_type': `Please ensure ${field} is the correct data type`,
    'too_small': `This field requires a minimum value or length`,
    'too_big': `This field exceeds the maximum allowed value or length`,
    'invalid_enum_value': `Please select from the available options`,
    'invalid_date': `Use YYYY-MM-DD format or "Flexible", "Coming Soon"`,
    'custom': `Please check the validation rules for ${field}`,
    'required': `This field is required and cannot be empty`
  }

  return suggestions[code] || 'Please check the field value and try again'
}

// Check for existing duplicates in database
async function checkDatabaseDuplicates(
  supabase: any,
  type: 'course' | 'event',
  items: any[]
): Promise<DuplicateInfo[]> {
  const duplicates: DuplicateInfo[] = []

  if (type === 'course') {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // Check for duplicate title + start_date
      const { data: existing } = await supabase
        .from('courses')
        .select('id, title, start_date')
        .ilike('title', item.title)
        .eq('start_date', item.start_date)
        .single()

      if (existing) {
        duplicates.push({
          indices: [i],
          field: 'title + start_date',
          value: `${item.title} starting on ${item.start_date}`,
          existingId: existing.id
        })
      }
    }
  } else if (type === 'event') {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // Check for duplicate title + date + time
      const { data: existing } = await supabase
        .from('events')
        .select('id, title, date, time')
        .ilike('title', item.title)
        .eq('date', item.date)
        .eq('time', item.time)
        .single()

      if (existing) {
        duplicates.push({
          indices: [i],
          field: 'title + date + time',
          value: `${item.title} on ${item.date} at ${item.time}`,
          existingId: existing.id
        })
      }
    }
  }

  return duplicates
}

// Validate dependencies (categories, instructors, etc.)
async function validateDependencies(
  supabase: any,
  type: 'course' | 'event',
  items: any[]
): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = []

  if (type === 'course') {
    // Get unique categories
    const categories = [...new Set(items.map(item => item.category))]

    // Check if categories exist
    const { data: existingCategories } = await supabase
      .from('course_categories')
      .select('name')
      .in('name', categories)

    const existingCategoryNames = new Set(existingCategories?.map((c: any) => c.name) || [])

    categories.forEach(category => {
      if (!existingCategoryNames.has(category)) {
        warnings.push({
          field: 'category',
          message: `Category "${category}" does not exist and will be created`,
          type: 'missing_reference'
        })
      }
    })

    // Check instructor emails if provided
    const instructorEmails = items
      .filter(item => item.instructor_info?.email)
      .map(item => item.instructor_info.email)

    if (instructorEmails.length > 0) {
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('email')
        .in('email', instructorEmails)

      const existingEmails = new Set(existingUsers?.map((u: any) => u.email) || [])

      instructorEmails.forEach(email => {
        if (!existingEmails.has(email)) {
          warnings.push({
            field: 'instructor_info.email',
            message: `Instructor email "${email}" not found in system`,
            type: 'missing_reference'
          })
        }
      })
    }
  }

  return warnings
}

// Main validation function
async function validateTemplate(
  request: ValidationRequest,
  supabase: any
): Promise<ValidationResponse> {
  const { type, data, options = {} } = request
  const isBatch = Array.isArray(data)
  const items = isBatch ? data : [data]

  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const validItems: any[] = []
  let invalidCount = 0

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    try {
      let validatedItem: any

      if (type === 'course') {
        validatedItem = CourseTemplateSchema.parse(item)
      } else if (type === 'event') {
        validatedItem = EventTemplateSchema.parse(item)
      } else {
        throw new Error(`Invalid template type: ${type}`)
      }

      validItems.push(validatedItem)
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...formatZodError(error, isBatch ? i : undefined))
        invalidCount++
      } else {
        errors.push({
          field: 'unknown',
          message: error.message || 'Validation failed',
          code: 'UNKNOWN_ERROR',
          ...(isBatch && { index: i })
        })
        invalidCount++
      }
    }
  }

  // Check for duplicates within the batch
  let duplicates: DuplicateInfo[] = []
  if (options.checkDuplicates && validItems.length > 0) {
    if (type === 'course') {
      const dupResult = checkCourseDuplicates(validItems)
      duplicates = dupResult.duplicates
    } else if (type === 'event') {
      const dupResult = checkEventDuplicates(validItems)
      duplicates = dupResult.duplicates
    }

    // Check for duplicates in database
    if (supabase) {
      const dbDuplicates = await checkDatabaseDuplicates(supabase, type, validItems)
      duplicates.push(...dbDuplicates)
    }
  }

  // Validate dependencies if requested
  if (options.validateDependencies && validItems.length > 0 && supabase) {
    const depWarnings = await validateDependencies(supabase, type, validItems)
    warnings.push(...depWarnings)
  }

  // Build response
  const response: ValidationResponse = {
    success: errors.length === 0,
    ...(errors.length > 0 && { errors }),
    ...(warnings.length > 0 && { warnings }),
    ...(duplicates.length > 0 && { duplicates })
  }

  // Add summary for batch validation
  if (isBatch) {
    response.summary = {
      total: items.length,
      valid: items.length - invalidCount,
      invalid: invalidCount,
      warnings: warnings.length,
      duplicates: duplicates.length
    }
  }

  // Include validated data if successful
  if (response.success) {
    response.data = isBatch ? validItems : validItems[0]
  }

  return response
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json() as ValidationRequest

    // Validate request structure
    if (!body.type || !body.data) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{
            field: 'request',
            message: 'Missing required fields: type and data',
            code: 'INVALID_REQUEST'
          }]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create Supabase client if auth header provided
    let supabase = null
    const authHeader = req.headers.get('Authorization')

    if (authHeader) {
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader }
          }
        }
      )

      // Verify user is admin
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return new Response(
          JSON.stringify({
            success: false,
            errors: [{
              field: 'auth',
              message: 'Authentication required',
              code: 'UNAUTHORIZED'
            }]
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        )
      }

      // Check if user has admin role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
        return new Response(
          JSON.stringify({
            success: false,
            errors: [{
              field: 'auth',
              message: 'Admin access required',
              code: 'FORBIDDEN'
            }]
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403
          }
        )
      }
    }

    // Perform validation
    const result = await validateTemplate(body, supabase)

    // Return validation result
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Validation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        errors: [{
          field: 'server',
          message: error.message || 'Internal server error',
          code: 'SERVER_ERROR'
        }]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})