import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface ImportRequest {
  type: 'course' | 'event'
  data: any | any[]
  options?: {
    skip_duplicates?: boolean
    update_existing?: boolean
    dry_run?: boolean
    send_notifications?: boolean
    auto_publish?: boolean
    validate_first?: boolean
  }
}

interface ImportResponse {
  success: boolean
  import_id?: string
  summary?: {
    total: number
    imported: number
    skipped: number
    failed: number
    updated: number
  }
  results?: ImportResult[]
  errors?: ImportError[]
}

interface ImportResult {
  index?: number
  id: number
  type: 'course' | 'event'
  title: string
  status: 'imported' | 'updated' | 'skipped' | 'failed'
  message?: string
}

interface ImportError {
  index?: number
  field?: string
  message: string
  code: string
}

// Helper function to create import record
async function createImportRecord(
  supabase: any,
  userId: string,
  type: string,
  fileName: string,
  totalCount: number,
  options: any
): Promise<string> {
  const { data, error } = await supabase
    .from('template_imports')
    .insert({
      user_id: userId,
      import_type: type,
      file_name: fileName,
      status: 'processing',
      total_count: totalCount,
      options: options || {},
      metadata: {
        started_at: new Date().toISOString(),
        source: 'api'
      }
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create import record: ${error.message}`)
  }

  return data.id
}

// Helper function to log import item
async function logImportItem(
  supabase: any,
  importId: string,
  index: number,
  type: string,
  data: any,
  status: string,
  resultId?: number,
  error?: string
) {
  await supabase
    .from('template_import_items')
    .insert({
      import_id: importId,
      item_index: index,
      item_type: type,
      item_data: data,
      status: status,
      result_id: resultId,
      result_type: type,
      error_message: error,
      imported_at: status === 'imported' ? new Date().toISOString() : null
    })
}

// Helper function to import a course
async function importCourse(
  supabase: any,
  course: any,
  options: any
): Promise<ImportResult> {
  try {
    // Check for duplicates
    if (!options.update_existing) {
      const { data: existing } = await supabase.rpc(
        'check_course_duplicate',
        {
          p_title: course.title,
          p_start_date: course.start_date
        }
      )

      if (existing && options.skip_duplicates) {
        return {
          id: existing,
          type: 'course',
          title: course.title,
          status: 'skipped',
          message: 'Duplicate course found'
        }
      }

      if (existing && options.update_existing) {
        // Update existing course
        const { data: updated, error } = await supabase
          .from('courses')
          .update({
            description: course.description,
            audiences: course.audiences,
            mode: course.mode,
            duration: course.duration,
            price: course.price,
            level: course.level,
            features: course.features,
            keywords: course.keywords,
            category: course.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing)
          .select('id, title')
          .single()

        if (error) throw error

        return {
          id: updated.id,
          type: 'course',
          title: updated.title,
          status: 'updated',
          message: 'Course updated successfully'
        }
      }
    }

    // Ensure category exists
    if (course.category) {
      await supabase
        .from('course_categories')
        .upsert(
          { name: course.category },
          { onConflict: 'name' }
        )
    }

    // Import new course using the function
    const { data: result, error } = await supabase.rpc(
      'import_course_from_template',
      {
        p_template: course,
        p_created_by: (await supabase.auth.getUser()).data.user?.id
      }
    )

    if (error) throw error

    return {
      id: result.course_id,
      type: 'course',
      title: course.title,
      status: 'imported',
      message: 'Course imported successfully'
    }

  } catch (error) {
    return {
      id: 0,
      type: 'course',
      title: course.title,
      status: 'failed',
      message: error.message || 'Import failed'
    }
  }
}

// Helper function to import an event
async function importEvent(
  supabase: any,
  event: any,
  options: any
): Promise<ImportResult> {
  try {
    // Check for duplicates
    if (!options.update_existing) {
      const { data: existing } = await supabase.rpc(
        'check_event_duplicate',
        {
          p_title: event.title,
          p_date: event.date,
          p_time: event.time
        }
      )

      if (existing && options.skip_duplicates) {
        return {
          id: existing,
          type: 'event',
          title: event.title,
          status: 'skipped',
          message: 'Duplicate event found'
        }
      }

      if (existing && options.update_existing) {
        // Update existing event
        const { data: updated, error } = await supabase
          .from('events')
          .update({
            description: event.description,
            event_type: event.event_type,
            location: event.location,
            max_attendees: event.max_attendees,
            price: event.price,
            tags: event.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing)
          .select('id, title')
          .single()

        if (error) throw error

        return {
          id: updated.id,
          type: 'event',
          title: updated.title,
          status: 'updated',
          message: 'Event updated successfully'
        }
      }
    }

    // Import new event using the function
    const { data: result, error } = await supabase.rpc(
      'import_event_from_template',
      {
        p_template: event,
        p_created_by: (await supabase.auth.getUser()).data.user?.id
      }
    )

    if (error) throw error

    return {
      id: result.event_id,
      type: 'event',
      title: event.title,
      status: 'imported',
      message: 'Event imported successfully'
    }

  } catch (error) {
    return {
      id: 0,
      type: 'event',
      title: event.title,
      status: 'failed',
      message: error.message || 'Import failed'
    }
  }
}

// Main import function
async function processImport(
  request: ImportRequest,
  supabase: any,
  userId: string
): Promise<ImportResponse> {
  const { type, data, options = {} } = request
  const isBatch = Array.isArray(data)
  const items = isBatch ? data : [data]

  // Initialize summary
  const summary = {
    total: items.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  }

  const results: ImportResult[] = []
  const errors: ImportError[] = []

  // Dry run mode - don't actually import
  if (options.dry_run) {
    return {
      success: true,
      summary,
      results: items.map((item, index) => ({
        index,
        id: 0,
        type,
        title: item.title,
        status: 'skipped' as const,
        message: 'Dry run - no changes made'
      }))
    }
  }

  // Create import record
  let importId: string | null = null
  try {
    importId = await createImportRecord(
      supabase,
      userId,
      type,
      `API Import - ${new Date().toISOString()}`,
      items.length,
      options
    )
  } catch (error) {
    return {
      success: false,
      errors: [{
        message: 'Failed to create import record',
        code: 'IMPORT_INIT_FAILED'
      }]
    }
  }

  // Process each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let result: ImportResult

    try {
      if (type === 'course') {
        result = await importCourse(supabase, item, options)
      } else if (type === 'event') {
        result = await importEvent(supabase, item, options)
      } else {
        result = {
          index: i,
          id: 0,
          type,
          title: item.title || 'Unknown',
          status: 'failed',
          message: 'Invalid import type'
        }
      }

      // Update summary
      switch (result.status) {
        case 'imported':
          summary.imported++
          break
        case 'updated':
          summary.updated++
          break
        case 'skipped':
          summary.skipped++
          break
        case 'failed':
          summary.failed++
          break
      }

      // Add index for batch imports
      if (isBatch) {
        result.index = i
      }

      results.push(result)

      // Log to import items table
      if (importId) {
        await logImportItem(
          supabase,
          importId,
          i,
          type,
          item,
          result.status,
          result.id > 0 ? result.id : undefined,
          result.status === 'failed' ? result.message : undefined
        )
      }

    } catch (error) {
      summary.failed++
      const errorResult = {
        index: i,
        id: 0,
        type,
        title: item.title || 'Unknown',
        status: 'failed' as const,
        message: error.message || 'Unknown error'
      }
      results.push(errorResult)
      errors.push({
        index: i,
        message: error.message || 'Import failed',
        code: 'IMPORT_ERROR'
      })

      // Log error
      if (importId) {
        await logImportItem(
          supabase,
          importId,
          i,
          type,
          item,
          'failed',
          undefined,
          error.message
        )
      }
    }
  }

  // Update import record status
  if (importId) {
    const finalStatus = summary.failed === summary.total ? 'failed' :
                       summary.failed > 0 ? 'completed_with_errors' : 'completed'

    await supabase
      .from('template_imports')
      .update({
        status: finalStatus,
        success_count: summary.imported + summary.updated,
        error_count: summary.failed,
        skipped_count: summary.skipped,
        completed_at: new Date().toISOString(),
        errors: errors.length > 0 ? errors : null
      })
      .eq('id', importId)
  }

  // Send notifications if requested
  if (options.send_notifications && summary.imported > 0) {
    // Queue notification job (implement based on your notification system)
    console.log('Notifications would be sent for', summary.imported, 'new items')
  }

  return {
    success: summary.failed === 0,
    import_id: importId,
    summary,
    results,
    ...(errors.length > 0 && { errors })
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json() as ImportRequest

    // Validate request
    if (!body.type || !body.data) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{
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

    // Create Supabase client with auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{
            message: 'Authorization required',
            code: 'UNAUTHORIZED'
          }]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    const supabase = createClient(
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
            message: 'Authentication failed',
            code: 'UNAUTHORIZED'
          }]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Check admin role
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

    // Validate first if requested
    if (body.options?.validate_first) {
      const validateUrl = new URL('/validate-template', Deno.env.get('SUPABASE_URL') + '/functions/v1')
      const validateResponse = await fetch(validateUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: body.type,
          data: body.data,
          options: {
            checkDuplicates: true,
            validateDependencies: true
          }
        })
      })

      if (!validateResponse.ok) {
        const validateError = await validateResponse.json()
        return new Response(
          JSON.stringify({
            success: false,
            errors: [{
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: validateError
            }]
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
    }

    // Process import
    const result = await processImport(body, supabase, user.id)

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Import error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        errors: [{
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