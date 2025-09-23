import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface URLImportRequest {
  url: string
  type?: 'course' | 'event' | 'auto'
  format?: 'json' | 'csv'
  options?: {
    skip_duplicates?: boolean
    update_existing?: boolean
    dry_run?: boolean
    validate_first?: boolean
    headers?: Record<string, string>
  }
}

interface URLImportResponse {
  success: boolean
  import_id?: string
  data?: any
  summary?: any
  error?: string
}

// Helper function to detect content type
function detectContentType(url: string, contentType?: string): 'json' | 'csv' | null {
  // Check Content-Type header
  if (contentType) {
    if (contentType.includes('json')) return 'json'
    if (contentType.includes('csv')) return 'csv'
  }

  // Check file extension
  const extension = url.split('.').pop()?.toLowerCase()
  if (extension === 'json') return 'json'
  if (extension === 'csv') return 'csv'

  return null
}

// Helper function to parse CSV to JSON
function parseCSV(csvText: string, type: 'course' | 'event'): any {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV file is empty or invalid')

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const items = []

  for (let i = 1; i < lines.length; i++) {
    const values = []
    let current = ''
    let insideQuotes = false

    // Parse CSV line handling quoted values
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j]

      if (char === '"') {
        if (insideQuotes && lines[i][j + 1] === '"') {
          current += '"'
          j++ // Skip next quote
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    // Create object from headers and values
    const item: any = {}
    headers.forEach((header, index) => {
      let value = values[index] || ''

      // Remove quotes
      value = value.replace(/^"|"$/g, '')

      // Handle array fields (separated by pipe |)
      if (header === 'audiences' || header === 'features' || header === 'keywords' ||
          header === 'tags' || header === 'what_to_bring' || header === 'benefits') {
        item[header] = value ? value.split('|').map(v => v.trim()) : []
      }
      // Handle boolean fields
      else if (header === 'is_active' || header === 'display' || header === 'is_featured' ||
               header === 'certification_available' || header === 'registration_required') {
        item[header] = value.toLowerCase() === 'true'
      }
      // Handle number fields
      else if (header === 'max_students' || header === 'min_students' ||
               header === 'max_attendees' || header === 'min_attendees' ||
               header === 'sort_order') {
        item[header] = value ? parseInt(value) : undefined
      }
      // Handle nested objects (flattened in CSV)
      else if (header.includes('_')) {
        const parts = header.split('_')
        const mainKey = parts[0]
        const subKey = parts.slice(1).join('_')

        if (!item[mainKey]) {
          item[mainKey] = {}
        }
        if (value) {
          item[mainKey][subKey] = value
        }
      }
      // Regular fields
      else if (value) {
        item[header] = value
      }
    })

    // Remove empty nested objects
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'object' && !Array.isArray(item[key]) &&
          Object.keys(item[key]).length === 0) {
        delete item[key]
      }
    })

    items.push(item)
  }

  // Return in the expected format
  return type === 'course' ? { courses: items } : { events: items }
}

// Helper function to fetch and parse URL content
async function fetchAndParseURL(
  url: string,
  format?: 'json' | 'csv',
  type?: 'course' | 'event' | 'auto',
  headers?: Record<string, string>
): Promise<any> {
  try {
    // Validate URL
    const urlObj = new URL(url)

    // Only allow HTTPS for security
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      throw new Error('Only HTTP/HTTPS URLs are supported')
    }

    // Fetch the content
    const response = await fetch(url, {
      headers: headers || {},
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    // Check file size (max 10MB for URL imports)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB')
    }

    const contentType = response.headers.get('content-type')
    const text = await response.text()

    // Detect format if not specified
    const detectedFormat = format || detectContentType(url, contentType)

    if (!detectedFormat) {
      throw new Error('Unable to detect file format. Please specify format as "json" or "csv"')
    }

    // Parse based on format
    let data
    if (detectedFormat === 'json') {
      data = JSON.parse(text)
    } else if (detectedFormat === 'csv') {
      // Need to know the type for CSV parsing
      if (!type || type === 'auto') {
        // Try to detect from URL or default to course
        if (url.toLowerCase().includes('event')) {
          type = 'event'
        } else {
          type = 'course'
        }
      }
      data = parseCSV(text, type)
    } else {
      throw new Error('Unsupported format')
    }

    // Auto-detect type from data structure
    if (type === 'auto' || !type) {
      if (data.courses && Array.isArray(data.courses)) {
        type = 'course'
      } else if (data.events && Array.isArray(data.events)) {
        type = 'event'
      } else {
        throw new Error('Unable to detect template type. Data must contain "courses" or "events" array')
      }
    }

    return { data, type }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. URL took too long to respond')
    }
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json() as URLImportRequest

    // Validate request
    if (!body.url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'URL is required'
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

    // Fetch and parse URL content
    const { data, type } = await fetchAndParseURL(
      body.url,
      body.format,
      body.type,
      body.options?.headers
    )

    // If validate_first is true, validate the data
    if (body.options?.validate_first) {
      const validateUrl = new URL('/validate-template', Deno.env.get('SUPABASE_URL') + '/functions/v1')
      const validateResponse = await fetch(validateUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data: type === 'course' ? data.courses : data.events,
          options: {
            checkDuplicates: true,
            validateDependencies: true,
            batchMode: true
          }
        })
      })

      const validateResult = await validateResponse.json()

      if (!validateResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation failed',
            validation_errors: validateResult.errors
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
    }

    // If dry_run, return the parsed data without importing
    if (body.options?.dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          data,
          summary: {
            type,
            total: type === 'course' ? data.courses?.length : data.events?.length,
            url: body.url,
            dry_run: true
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Import the data
    const importUrl = new URL('/import-template', Deno.env.get('SUPABASE_URL') + '/functions/v1')
    const importResponse = await fetch(importUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        data: type === 'course' ? data.courses : data.events,
        options: {
          skip_duplicates: body.options?.skip_duplicates ?? true,
          update_existing: body.options?.update_existing ?? false,
          validate_first: false // Already validated if requested
        }
      })
    })

    const importResult = await importResponse.json()

    // Return import result
    return new Response(
      JSON.stringify({
        ...importResult,
        source_url: body.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: importResult.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('URL import error:', error)

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