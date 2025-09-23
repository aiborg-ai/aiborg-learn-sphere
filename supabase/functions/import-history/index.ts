import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface HistoryRequest {
  import_id?: string
  page?: number
  limit?: number
  status?: string
  type?: 'course' | 'event' | 'mixed'
  date_from?: string
  date_to?: string
  sort_by?: 'created_at' | 'completed_at' | 'total_count' | 'success_count'
  sort_order?: 'asc' | 'desc'
}

interface HistoryResponse {
  success: boolean
  imports?: ImportRecord[]
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  error?: string
}

interface ImportRecord {
  id: string
  import_type: string
  file_name: string
  file_size?: number
  status: string
  started_at: string
  completed_at?: string
  total_count: number
  success_count: number
  error_count: number
  warning_count: number
  skipped_count: number
  errors?: any[]
  warnings?: any[]
  options?: any
  items?: ImportItem[]
  audit_logs?: AuditLog[]
}

interface ImportItem {
  id: string
  item_index: number
  item_type: string
  item_data: any
  status: string
  validation_errors?: any[]
  validation_warnings?: any[]
  result_id?: number
  result_type?: string
  error_message?: string
  is_duplicate: boolean
  duplicate_of_id?: number
  imported_at?: string
}

interface AuditLog {
  id: string
  action: string
  details: any
  created_at: string
}

// Helper function to get import list
async function getImportList(
  supabase: any,
  request: HistoryRequest,
  userId: string,
  isAdmin: boolean
): Promise<HistoryResponse> {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    date_from,
    date_to,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = request

  try {
    // Build query
    let query = supabase
      .from('template_imports')
      .select('*', { count: 'exact' })

    // Filter by user if not admin
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('import_type', type)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      success: true,
      imports: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch import history'
    }
  }
}

// Helper function to get import details
async function getImportDetails(
  supabase: any,
  importId: string,
  userId: string,
  isAdmin: boolean
): Promise<HistoryResponse> {
  try {
    // Get import record
    let query = supabase
      .from('template_imports')
      .select('*')
      .eq('id', importId)

    // Filter by user if not admin
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data: importRecord, error: importError } = await query.single()

    if (importError) {
      if (importError.code === 'PGRST116') {
        return {
          success: false,
          error: 'Import not found or access denied'
        }
      }
      throw importError
    }

    // Get import items
    const { data: items, error: itemsError } = await supabase
      .from('template_import_items')
      .select('*')
      .eq('import_id', importId)
      .order('item_index', { ascending: true })

    if (itemsError) {
      throw itemsError
    }

    // Get audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('template_import_audit')
      .select('*')
      .eq('import_id', importId)
      .order('created_at', { ascending: true })

    if (auditError) {
      throw auditError
    }

    return {
      success: true,
      imports: [{
        ...importRecord,
        items: items || [],
        audit_logs: auditLogs || []
      }]
    }

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch import details'
    }
  }
}

// Helper function to get import statistics
async function getImportStatistics(
  supabase: any,
  userId: string,
  isAdmin: boolean
): Promise<any> {
  try {
    let baseQuery = supabase
      .from('template_imports')

    // Filter by user if not admin
    if (!isAdmin) {
      baseQuery = baseQuery.eq('user_id', userId)
    }

    // Get total imports
    const { count: totalImports } = await baseQuery
      .select('*', { count: 'exact', head: true })

    // Get successful imports
    const { count: successfulImports } = await baseQuery
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get failed imports
    const { count: failedImports } = await baseQuery
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    // Get total items imported
    const { data: totals } = await supabase
      .from('template_imports')
      .select('success_count, error_count, skipped_count')

    let totalSuccess = 0
    let totalErrors = 0
    let totalSkipped = 0

    if (totals) {
      totals.forEach((record: any) => {
        totalSuccess += record.success_count || 0
        totalErrors += record.error_count || 0
        totalSkipped += record.skipped_count || 0
      })
    }

    // Get recent imports
    const { data: recentImports } = await baseQuery
      .select('id, file_name, status, created_at, total_count, success_count')
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      total_imports: totalImports || 0,
      successful_imports: successfulImports || 0,
      failed_imports: failedImports || 0,
      total_items_imported: totalSuccess,
      total_items_failed: totalErrors,
      total_items_skipped: totalSkipped,
      recent_imports: recentImports || []
    }

  } catch (error) {
    console.error('Error fetching statistics:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Verify user
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

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole.role)

    // Parse request
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    const lastPart = pathParts[pathParts.length - 1]

    // Handle different endpoints
    let response: HistoryResponse

    if (lastPart === 'statistics') {
      // Get import statistics
      const stats = await getImportStatistics(supabase, user.id, isAdmin)
      response = {
        success: true,
        imports: [],
        statistics: stats
      }

    } else if (lastPart && lastPart.match(/^[0-9a-f-]{36}$/)) {
      // Get specific import details (UUID format)
      response = await getImportDetails(supabase, lastPart, user.id, isAdmin)

    } else {
      // Get import list
      const params: HistoryRequest = {
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: parseInt(url.searchParams.get('limit') || '10'),
        status: url.searchParams.get('status') || undefined,
        type: url.searchParams.get('type') as any || undefined,
        date_from: url.searchParams.get('date_from') || undefined,
        date_to: url.searchParams.get('date_to') || undefined,
        sort_by: url.searchParams.get('sort_by') as any || 'created_at',
        sort_order: url.searchParams.get('sort_order') as any || 'desc'
      }

      response = await getImportList(supabase, params, user.id, isAdmin)
    }

    // Return response
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('History error:', error)

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