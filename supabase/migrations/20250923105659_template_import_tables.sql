-- Migration: Create Template Import System Tables
-- Description: Tables for tracking and managing bulk imports of courses and events from JSON templates
-- Author: AIBorg Team
-- Date: 2025-09-23

-- ============================================
-- 1. CREATE TEMPLATE IMPORTS TABLE
-- ============================================
-- This table tracks the overall import operations
CREATE TABLE IF NOT EXISTS public.template_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL CHECK (import_type IN ('course', 'event', 'mixed')),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_hash TEXT, -- For duplicate file detection

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Counts
  total_count INTEGER NOT NULL DEFAULT 0,
  validated_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,

  -- Error and warning details
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,

  -- Import options
  options JSONB DEFAULT '{}'::jsonb,
  -- Options include:
  -- - skip_duplicates: boolean
  -- - update_existing: boolean
  -- - dry_run: boolean
  -- - send_notifications: boolean
  -- - auto_publish: boolean

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE TEMPLATE IMPORT ITEMS TABLE
-- ============================================
-- This table tracks individual items within an import
CREATE TABLE IF NOT EXISTS public.template_import_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.template_imports(id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('course', 'event')),

  -- Original data from template
  item_data JSONB NOT NULL,

  -- Processed/transformed data
  processed_data JSONB,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'validating', 'valid', 'invalid', 'processing', 'imported', 'failed', 'skipped', 'duplicate')
  ),

  -- Validation results
  validation_errors JSONB DEFAULT '[]'::jsonb,
  validation_warnings JSONB DEFAULT '[]'::jsonb,

  -- Result tracking
  result_id INTEGER, -- References courses.id or events.id after successful import
  result_type TEXT CHECK (result_type IN ('course', 'event')),

  -- Error details
  error_message TEXT,
  error_code TEXT,

  -- Duplicate detection
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of_id INTEGER, -- ID of existing course/event this is a duplicate of

  -- Timestamps
  validated_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE IMPORT AUDIT LOG TABLE
-- ============================================
-- Detailed audit trail of all import operations
CREATE TABLE IF NOT EXISTS public.template_import_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES public.template_imports(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.template_import_items(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  action TEXT NOT NULL CHECK (
    action IN ('import_started', 'validation_started', 'validation_completed',
               'item_validated', 'item_imported', 'item_failed', 'item_skipped',
               'import_completed', 'import_failed', 'import_cancelled', 'rollback_started', 'rollback_completed')
  ),

  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for template_imports
CREATE INDEX idx_template_imports_user_id ON public.template_imports(user_id);
CREATE INDEX idx_template_imports_status ON public.template_imports(status);
CREATE INDEX idx_template_imports_import_type ON public.template_imports(import_type);
CREATE INDEX idx_template_imports_created_at ON public.template_imports(created_at DESC);
CREATE INDEX idx_template_imports_file_hash ON public.template_imports(file_hash);

-- Indexes for template_import_items
CREATE INDEX idx_template_import_items_import_id ON public.template_import_items(import_id);
CREATE INDEX idx_template_import_items_status ON public.template_import_items(status);
CREATE INDEX idx_template_import_items_item_type ON public.template_import_items(item_type);
CREATE INDEX idx_template_import_items_result ON public.template_import_items(result_id, result_type);
CREATE INDEX idx_template_import_items_duplicate ON public.template_import_items(is_duplicate, duplicate_of_id);

-- Indexes for template_import_audit
CREATE INDEX idx_template_import_audit_import_id ON public.template_import_audit(import_id);
CREATE INDEX idx_template_import_audit_user_id ON public.template_import_audit(user_id);
CREATE INDEX idx_template_import_audit_action ON public.template_import_audit(action);
CREATE INDEX idx_template_import_audit_created_at ON public.template_import_audit(created_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.template_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_import_audit ENABLE ROW LEVEL SECURITY;

-- Policies for template_imports
-- Admin users can view all imports
CREATE POLICY "Admin users can view all imports"
ON public.template_imports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin users can create imports
CREATE POLICY "Admin users can create imports"
ON public.template_imports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin users can update their own imports
CREATE POLICY "Admin users can update their own imports"
ON public.template_imports
FOR UPDATE
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policies for template_import_items
-- Admin users can view all items
CREATE POLICY "Admin users can view all import items"
ON public.template_import_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.template_imports ti
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ti.id = import_id
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admin users can create items
CREATE POLICY "Admin users can create import items"
ON public.template_import_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.template_imports ti
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ti.id = import_id
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admin users can update items
CREATE POLICY "Admin users can update import items"
ON public.template_import_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.template_imports ti
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ti.id = import_id
    AND ti.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Policies for template_import_audit
-- Admin users can view audit logs
CREATE POLICY "Admin users can view audit logs"
ON public.template_import_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- System can insert audit logs (through functions)
CREATE POLICY "System can insert audit logs"
ON public.template_import_audit
FOR INSERT
WITH CHECK (true); -- Audit logs are inserted via functions with elevated privileges

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to update import counts
CREATE OR REPLACE FUNCTION update_import_counts(p_import_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.template_imports
  SET
    total_count = (SELECT COUNT(*) FROM public.template_import_items WHERE import_id = p_import_id),
    validated_count = (SELECT COUNT(*) FROM public.template_import_items WHERE import_id = p_import_id AND status IN ('valid', 'imported')),
    success_count = (SELECT COUNT(*) FROM public.template_import_items WHERE import_id = p_import_id AND status = 'imported'),
    error_count = (SELECT COUNT(*) FROM public.template_import_items WHERE import_id = p_import_id AND status IN ('invalid', 'failed')),
    skipped_count = (SELECT COUNT(*) FROM public.template_import_items WHERE import_id = p_import_id AND status IN ('skipped', 'duplicate')),
    updated_at = NOW()
  WHERE id = p_import_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_import_audit(
  p_import_id UUID,
  p_item_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.template_import_audit (
    import_id,
    item_id,
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    p_import_id,
    p_item_id,
    auth.uid(),
    p_action,
    p_details,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for duplicate courses
CREATE OR REPLACE FUNCTION check_course_duplicate(
  p_title TEXT,
  p_start_date TEXT
)
RETURNS INTEGER AS $$
DECLARE
  duplicate_id INTEGER;
BEGIN
  SELECT id INTO duplicate_id
  FROM public.courses
  WHERE LOWER(title) = LOWER(p_title)
    AND start_date = p_start_date
  LIMIT 1;

  RETURN duplicate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check for duplicate events
CREATE OR REPLACE FUNCTION check_event_duplicate(
  p_title TEXT,
  p_date TEXT,
  p_time TEXT
)
RETURNS INTEGER AS $$
DECLARE
  duplicate_id INTEGER;
BEGIN
  SELECT id INTO duplicate_id
  FROM public.events
  WHERE LOWER(title) = LOWER(p_title)
    AND date = p_date
    AND time = p_time
  LIMIT 1;

  RETURN duplicate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger to update counts when items change
CREATE OR REPLACE FUNCTION trigger_update_import_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_import_counts(NEW.import_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_import_counts(OLD.import_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.template_import_items
FOR EACH ROW
EXECUTE FUNCTION trigger_update_import_counts();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION trigger_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_imports_updated_at
BEFORE UPDATE ON public.template_imports
FOR EACH ROW
EXECUTE FUNCTION trigger_update_updated_at();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users (filtered by RLS)
GRANT SELECT ON public.template_imports TO authenticated;
GRANT INSERT ON public.template_imports TO authenticated;
GRANT UPDATE ON public.template_imports TO authenticated;

GRANT SELECT ON public.template_import_items TO authenticated;
GRANT INSERT ON public.template_import_items TO authenticated;
GRANT UPDATE ON public.template_import_items TO authenticated;

GRANT SELECT ON public.template_import_audit TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_import_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_import_audit(UUID, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_course_duplicate(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_event_duplicate(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.template_imports IS 'Tracks bulk import operations for courses and events from JSON templates';
COMMENT ON TABLE public.template_import_items IS 'Individual items within a template import operation';
COMMENT ON TABLE public.template_import_audit IS 'Audit trail for all template import operations';

COMMENT ON COLUMN public.template_imports.status IS 'Current status of the import: pending, validating, processing, completed, failed, cancelled';
COMMENT ON COLUMN public.template_imports.options IS 'Import options: skip_duplicates, update_existing, dry_run, send_notifications, auto_publish';
COMMENT ON COLUMN public.template_import_items.status IS 'Status of individual item: pending, validating, valid, invalid, processing, imported, failed, skipped, duplicate';
COMMENT ON COLUMN public.template_import_items.result_id IS 'ID of the created course or event after successful import';