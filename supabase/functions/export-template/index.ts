import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { parse } from 'https://deno.land/std@0.168.0/encoding/csv.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface ExportRequest {
  type: 'course' | 'event' | 'both'
  format: 'json' | 'csv'
  filters?: {
    category?: string
    is_active?: boolean
    display?: boolean
    date_from?: string
    date_to?: string
    ids?: number[]
  }
  options?: {
    include_inactive?: boolean
    include_hidden?: boolean
    include_materials?: boolean
    include_metadata?: boolean
  }
}

interface ExportResponse {
  success: boolean
  data?: any
  filename?: string
  format?: string
  count?: number
  error?: string
}

// Helper function to fetch courses
async function fetchCourses(supabase: any, filters: any, options: any) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      course_categories(name),
      course_materials(*)
    `)

  // Apply filters
  if (!options.include_inactive) {
    query = query.eq('is_active', true)
  }

  if (!options.include_hidden) {
    query = query.eq('display', true)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  if (filters.ids && filters.ids.length > 0) {
    query = query.in('id', filters.ids)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error

  // Transform data to match import format
  return data?.map(course => {
    const transformed: any = {
      title: course.title,
      description: course.description,
      audiences: course.audiences || [],
      mode: course.mode,
      duration: course.duration,
      price: course.price,
      level: course.level,
      start_date: course.start_date,
      end_date: course.end_date,
      enrollment_deadline: course.enrollment_deadline,
      features: course.features || [],
      keywords: course.keywords || [],
      category: course.category,
      prerequisites: course.prerequisites,
      max_students: course.max_students,
      min_students: course.min_students,
      certification_available: course.certification_available,
      completion_criteria: course.completion_criteria,
      is_featured: course.is_featured,
      is_active: course.is_active,
      display: course.display,
      sort_order: course.sort_order
    }

    // Include instructor info if available
    if (course.instructor_info) {
      transformed.instructor_info = course.instructor_info
    }

    // Include course materials if requested
    if (options.include_materials && course.course_materials) {
      transformed.course_materials = course.course_materials.map((material: any) => ({
        title: material.title,
        type: material.type,
        url: material.url,
        description: material.description,
        duration: material.duration,
        order_index: material.order_index,
        is_preview: material.is_preview
      }))
    }

    // Include metadata if requested
    if (options.include_metadata) {
      transformed._metadata = {
        id: course.id,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by: course.created_by
      }
    }

    return transformed
  }) || []
}

// Helper function to fetch events
async function fetchEvents(supabase: any, filters: any, options: any) {
  let query = supabase
    .from('events')
    .select('*')

  // Apply filters
  if (!options.include_inactive) {
    query = query.eq('is_active', true)
  }

  if (!options.include_hidden) {
    query = query.eq('display', true)
  }

  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  if (filters.ids && filters.ids.length > 0) {
    query = query.in('id', filters.ids)
  }

  const { data, error } = await query.order('date', { ascending: true })

  if (error) throw error

  // Transform data to match import format
  return data?.map(event => {
    const transformed: any = {
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      audiences: event.audiences || [],
      date: event.date,
      time: event.time,
      duration: event.duration,
      mode: event.mode,
      location: event.location,
      max_attendees: event.max_attendees,
      min_attendees: event.min_attendees,
      registration_deadline: event.registration_deadline,
      registration_required: event.registration_required,
      registration_link: event.registration_link,
      price: event.price,
      tags: event.tags || [],
      is_featured: event.is_featured,
      is_active: event.is_active,
      display: event.display
    }

    // Include venue details if available
    if (event.venue_details) {
      transformed.venue_details = event.venue_details
    }

    // Include speaker info if available
    if (event.speaker_info) {
      transformed.speaker_info = event.speaker_info
    }

    // Include agenda if available
    if (event.agenda) {
      transformed.agenda = event.agenda
    }

    // Include metadata if requested
    if (options.include_metadata) {
      transformed._metadata = {
        id: event.id,
        created_at: event.created_at,
        updated_at: event.updated_at,
        created_by: event.created_by
      }
    }

    return transformed
  }) || []
}

// Helper function to convert to CSV
function convertToCSV(data: any[], type: 'course' | 'event'): string {
  if (data.length === 0) return ''

  // Flatten nested objects for CSV
  const flattened = data.map(item => {
    const flat: any = {}

    // Basic fields
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'object' && item[key] !== null) {
        if (Array.isArray(item[key])) {
          flat[key] = item[key].join('|') // Use pipe separator for arrays
        } else {
          // Flatten nested objects
          Object.keys(item[key]).forEach(subKey => {
            flat[`${key}_${subKey}`] = item[key][subKey]
          })
        }
      } else {
        flat[key] = item[key]
      }
    })

    return flat
  })

  // Get all unique keys for headers
  const headers = new Set<string>()
  flattened.forEach(item => {
    Object.keys(item).forEach(key => headers.add(key))
  })

  // Create CSV rows
  const headerRow = Array.from(headers).join(',')
  const rows = flattened.map(item => {
    return Array.from(headers).map(header => {
      const value = item[header] || ''
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""')
      return escaped.includes(',') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped
    }).join(',')
  })

  return [headerRow, ...rows].join('\n')
}

// Main export function
async function exportData(
  request: ExportRequest,
  supabase: any
): Promise<ExportResponse> {
  try {
    const { type, format, filters = {}, options = {} } = request

    let courses: any[] = []
    let events: any[] = []

    // Fetch data based on type
    if (type === 'course' || type === 'both') {
      courses = await fetchCourses(supabase, filters, options)
    }

    if (type === 'event' || type === 'both') {
      events = await fetchEvents(supabase, filters, options)
    }

    // Format response based on format type
    let responseData: any
    let filename: string

    if (format === 'json') {
      if (type === 'both') {
        responseData = {
          courses,
          events
        }
        filename = `export_all_${new Date().toISOString().split('T')[0]}.json`
      } else if (type === 'course') {
        responseData = { courses }
        filename = `export_courses_${new Date().toISOString().split('T')[0]}.json`
      } else {
        responseData = { events }
        filename = `export_events_${new Date().toISOString().split('T')[0]}.json`
      }
    } else if (format === 'csv') {
      if (type === 'both') {
        // For CSV, we need to create separate files or sheets
        // For now, we'll return an error suggesting separate exports
        return {
          success: false,
          error: 'CSV format does not support mixed exports. Please export courses and events separately.'
        }
      } else if (type === 'course') {
        responseData = convertToCSV(courses, 'course')
        filename = `export_courses_${new Date().toISOString().split('T')[0]}.csv`
      } else {
        responseData = convertToCSV(events, 'event')
        filename = `export_events_${new Date().toISOString().split('T')[0]}.csv`
      }
    } else {
      return {
        success: false,
        error: 'Invalid format. Use "json" or "csv"'
      }
    }

    return {
      success: true,
      data: responseData,
      filename,
      format,
      count: courses.length + events.length
    }

  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      error: error.message || 'Export failed'
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json() as ExportRequest

    // Validate request
    if (!body.type || !body.format) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: type and format'
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
          error: 'Authorization required'
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
          error: 'Authentication failed'
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
          error: 'Admin access required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Export data
    const result = await exportData(body, supabase)

    // Set appropriate content type based on format
    const contentType = body.format === 'csv'
      ? 'text/csv'
      : 'application/json'

    // If CSV, return as downloadable file
    if (body.format === 'csv' && result.success) {
      return new Response(
        result.data,
        {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${result.filename}"`
          },
          status: 200
        }
      )
    }

    // Return JSON response
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Export error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})