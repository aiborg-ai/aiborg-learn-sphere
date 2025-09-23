-- Migration: Create Template Import Functions
-- Description: Database functions for processing course and event template imports
-- Author: AIBorg Team
-- Date: 2025-09-23

-- ============================================
-- 1. COURSE IMPORT FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION import_course_from_template(
  p_template JSONB,
  p_import_id UUID DEFAULT NULL,
  p_item_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  course_id INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_course_id INTEGER;
  v_audience TEXT;
  v_material JSONB;
  v_error_message TEXT;
BEGIN
  -- Start transaction savepoint
  BEGIN
    -- Insert the course
    INSERT INTO public.courses (
      title,
      description,
      audience, -- Will be deprecated, using first audience for backward compatibility
      mode,
      duration,
      price,
      level,
      start_date,
      features,
      category,
      keywords,
      prerequisites,
      is_active,
      currently_enrolling,
      display,
      sort_order,
      created_at,
      updated_at
    ) VALUES (
      p_template->>'title',
      p_template->>'description',
      (p_template->'audiences'->0)::TEXT, -- First audience for backward compatibility
      p_template->>'mode',
      p_template->>'duration',
      p_template->>'price',
      p_template->>'level',
      p_template->>'start_date',
      ARRAY(SELECT jsonb_array_elements_text(p_template->'features')),
      p_template->>'category',
      ARRAY(SELECT jsonb_array_elements_text(p_template->'keywords')),
      COALESCE(p_template->>'prerequisites', 'None'),
      COALESCE((p_template->>'is_active')::BOOLEAN, true),
      COALESCE((p_template->>'currently_enrolling')::BOOLEAN, true),
      COALESCE((p_template->>'display')::BOOLEAN, true),
      COALESCE((p_template->>'sort_order')::INTEGER, 0),
      NOW(),
      NOW()
    ) RETURNING id INTO v_course_id;

    -- Insert course audiences (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_audiences') THEN
      FOR v_audience IN SELECT jsonb_array_elements_text(p_template->'audiences')
      LOOP
        INSERT INTO public.course_audiences (course_id, audience)
        VALUES (v_course_id, v_audience);
      END LOOP;
    END IF;

    -- Insert course materials if provided
    IF p_template->'course_materials' IS NOT NULL THEN
      FOR v_material IN SELECT jsonb_array_elements(p_template->'course_materials')
      LOOP
        INSERT INTO public.course_materials (
          course_id,
          title,
          type,
          url,
          description,
          duration,
          order_index,
          is_preview,
          is_mandatory,
          created_at
        ) VALUES (
          v_course_id,
          v_material->>'title',
          COALESCE(v_material->>'type', 'document'),
          v_material->>'url',
          v_material->>'description',
          v_material->>'duration',
          COALESCE((v_material->>'order_index')::INTEGER, 1),
          COALESCE((v_material->>'is_preview')::BOOLEAN, false),
          COALESCE((v_material->>'is_mandatory')::BOOLEAN, true),
          NOW()
        );
      END LOOP;
    END IF;

    -- Update import item status if IDs provided
    IF p_item_id IS NOT NULL THEN
      UPDATE public.template_import_items
      SET
        status = 'imported',
        result_id = v_course_id,
        result_type = 'course',
        imported_at = NOW()
      WHERE id = p_item_id;

      -- Log audit event
      PERFORM log_import_audit(p_import_id, p_item_id, 'item_imported',
        jsonb_build_object('course_id', v_course_id, 'title', p_template->>'title')
      );
    END IF;

    RETURN QUERY SELECT true, v_course_id, NULL::TEXT;

  EXCEPTION WHEN OTHERS THEN
    -- Capture error message
    v_error_message := SQLERRM;

    -- Update import item status if IDs provided
    IF p_item_id IS NOT NULL THEN
      UPDATE public.template_import_items
      SET
        status = 'failed',
        error_message = v_error_message,
        error_code = SQLSTATE
      WHERE id = p_item_id;

      -- Log audit event
      PERFORM log_import_audit(p_import_id, p_item_id, 'item_failed',
        jsonb_build_object('error', v_error_message, 'code', SQLSTATE)
      );
    END IF;

    RETURN QUERY SELECT false, NULL::INTEGER, v_error_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. EVENT IMPORT FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION import_event_from_template(
  p_template JSONB,
  p_import_id UUID DEFAULT NULL,
  p_item_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  event_id INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_event_id INTEGER;
  v_error_message TEXT;
BEGIN
  -- Start transaction savepoint
  BEGIN
    -- Insert the event
    INSERT INTO public.events (
      title,
      description,
      event_type,
      date,
      time,
      duration,
      location,
      max_attendees,
      registration_deadline,
      price,
      is_featured,
      is_active,
      display,
      created_at,
      updated_at
    ) VALUES (
      p_template->>'title',
      p_template->>'description',
      p_template->>'event_type',
      p_template->>'date',
      p_template->>'time',
      p_template->>'duration',
      p_template->>'location',
      CASE
        WHEN p_template->>'max_attendees' IS NOT NULL
        THEN (p_template->>'max_attendees')::INTEGER
        ELSE NULL
      END,
      p_template->>'registration_deadline',
      p_template->>'price',
      COALESCE((p_template->>'is_featured')::BOOLEAN, false),
      COALESCE((p_template->>'is_active')::BOOLEAN, true),
      COALESCE((p_template->>'display')::BOOLEAN, true),
      NOW(),
      NOW()
    ) RETURNING id INTO v_event_id;

    -- Store additional data in event_metadata if needed
    IF p_template->'venue_details' IS NOT NULL OR
       p_template->'speaker_info' IS NOT NULL OR
       p_template->'agenda' IS NOT NULL OR
       p_template->'sponsors' IS NOT NULL THEN
      -- Check if event_metadata table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_metadata') THEN
        INSERT INTO public.event_metadata (
          event_id,
          venue_details,
          speaker_info,
          agenda,
          sponsors,
          metadata
        ) VALUES (
          v_event_id,
          p_template->'venue_details',
          p_template->'speaker_info',
          p_template->'agenda',
          p_template->'sponsors',
          jsonb_build_object(
            'benefits', p_template->'benefits',
            'target_audience', p_template->'target_audience',
            'prerequisites', p_template->>'prerequisites',
            'what_to_bring', p_template->'what_to_bring',
            'certificates', p_template->'certificates',
            'recording', p_template->'recording',
            'contact_info', p_template->'contact_info'
          )
        );
      END IF;
    END IF;

    -- Store tags if provided
    IF p_template->'tags' IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_tags') THEN
      INSERT INTO public.event_tags (event_id, tags)
      VALUES (v_event_id, ARRAY(SELECT jsonb_array_elements_text(p_template->'tags')));
    END IF;

    -- Update import item status if IDs provided
    IF p_item_id IS NOT NULL THEN
      UPDATE public.template_import_items
      SET
        status = 'imported',
        result_id = v_event_id,
        result_type = 'event',
        imported_at = NOW()
      WHERE id = p_item_id;

      -- Log audit event
      PERFORM log_import_audit(p_import_id, p_item_id, 'item_imported',
        jsonb_build_object('event_id', v_event_id, 'title', p_template->>'title')
      );
    END IF;

    RETURN QUERY SELECT true, v_event_id, NULL::TEXT;

  EXCEPTION WHEN OTHERS THEN
    -- Capture error message
    v_error_message := SQLERRM;

    -- Update import item status if IDs provided
    IF p_item_id IS NOT NULL THEN
      UPDATE public.template_import_items
      SET
        status = 'failed',
        error_message = v_error_message,
        error_code = SQLSTATE
      WHERE id = p_item_id;

      -- Log audit event
      PERFORM log_import_audit(p_import_id, p_item_id, 'item_failed',
        jsonb_build_object('error', v_error_message, 'code', SQLSTATE)
      );
    END IF;

    RETURN QUERY SELECT false, NULL::INTEGER, v_error_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. BATCH IMPORT ORCHESTRATOR
-- ============================================
CREATE OR REPLACE FUNCTION process_template_import_batch(
  p_import_id UUID
)
RETURNS TABLE (
  total_processed INTEGER,
  successful INTEGER,
  failed INTEGER,
  skipped INTEGER
) AS $$
DECLARE
  v_item RECORD;
  v_result RECORD;
  v_total INTEGER := 0;
  v_success INTEGER := 0;
  v_failed INTEGER := 0;
  v_skipped INTEGER := 0;
  v_duplicate_id INTEGER;
BEGIN
  -- Update import status to processing
  UPDATE public.template_imports
  SET status = 'processing', started_at = NOW()
  WHERE id = p_import_id;

  -- Log audit event
  PERFORM log_import_audit(p_import_id, NULL, 'import_started', '{}'::jsonb);

  -- Process each item
  FOR v_item IN
    SELECT id, item_type, item_data, item_index
    FROM public.template_import_items
    WHERE import_id = p_import_id
    AND status = 'valid'
    ORDER BY item_index
  LOOP
    v_total := v_total + 1;

    -- Check for duplicates if option is set
    IF v_item.item_type = 'course' THEN
      v_duplicate_id := check_course_duplicate(
        v_item.item_data->>'title',
        v_item.item_data->>'start_date'
      );
    ELSIF v_item.item_type = 'event' THEN
      v_duplicate_id := check_event_duplicate(
        v_item.item_data->>'title',
        v_item.item_data->>'date',
        v_item.item_data->>'time'
      );
    END IF;

    -- Handle duplicate
    IF v_duplicate_id IS NOT NULL THEN
      -- Check if we should skip duplicates
      IF (SELECT options->>'skip_duplicates' FROM public.template_imports WHERE id = p_import_id)::BOOLEAN THEN
        UPDATE public.template_import_items
        SET
          status = 'skipped',
          is_duplicate = true,
          duplicate_of_id = v_duplicate_id
        WHERE id = v_item.id;

        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
    END IF;

    -- Import the item
    IF v_item.item_type = 'course' THEN
      SELECT * INTO v_result
      FROM import_course_from_template(v_item.item_data, p_import_id, v_item.id);
    ELSIF v_item.item_type = 'event' THEN
      SELECT * INTO v_result
      FROM import_event_from_template(v_item.item_data, p_import_id, v_item.id);
    END IF;

    -- Update counts
    IF v_result.success THEN
      v_success := v_success + 1;
    ELSE
      v_failed := v_failed + 1;
    END IF;
  END LOOP;

  -- Update import status
  UPDATE public.template_imports
  SET
    status = CASE
      WHEN v_failed = 0 THEN 'completed'
      WHEN v_success = 0 THEN 'failed'
      ELSE 'completed' -- Partial success
    END,
    completed_at = NOW(),
    success_count = v_success,
    error_count = v_failed,
    skipped_count = v_skipped
  WHERE id = p_import_id;

  -- Log audit event
  PERFORM log_import_audit(p_import_id, NULL, 'import_completed',
    jsonb_build_object(
      'total', v_total,
      'success', v_success,
      'failed', v_failed,
      'skipped', v_skipped
    )
  );

  RETURN QUERY SELECT v_total, v_success, v_failed, v_skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. VALIDATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION validate_course_dependencies(
  p_template JSONB
)
RETURNS TABLE (
  is_valid BOOLEAN,
  errors JSONB
) AS $$
DECLARE
  v_errors JSONB := '[]'::jsonb;
  v_category_exists BOOLEAN;
  v_valid BOOLEAN := true;
BEGIN
  -- Check if category exists (if categories table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_categories') THEN
    SELECT EXISTS(
      SELECT 1 FROM public.course_categories
      WHERE name = p_template->>'category'
    ) INTO v_category_exists;

    IF NOT v_category_exists THEN
      v_errors := v_errors || jsonb_build_object(
        'field', 'category',
        'message', 'Category does not exist: ' || p_template->>'category',
        'code', 'INVALID_REFERENCE'
      );
      v_valid := false;
    END IF;
  END IF;

  -- Check instructor email exists (if required)
  IF p_template->'instructor_info' IS NOT NULL THEN
    IF NOT EXISTS(
      SELECT 1 FROM auth.users
      WHERE email = p_template->'instructor_info'->>'email'
    ) THEN
      v_errors := v_errors || jsonb_build_object(
        'field', 'instructor_info.email',
        'message', 'Instructor email not found in system',
        'code', 'INVALID_REFERENCE'
      );
      v_valid := false;
    END IF;
  END IF;

  -- Additional business rule validations can be added here

  RETURN QUERY SELECT v_valid, v_errors;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. ROLLBACK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION rollback_template_import(
  p_import_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
  v_success BOOLEAN := true;
BEGIN
  -- Log audit event
  PERFORM log_import_audit(p_import_id, NULL, 'rollback_started',
    jsonb_build_object('reason', p_reason)
  );

  -- Delete imported courses
  FOR v_item IN
    SELECT result_id, result_type
    FROM public.template_import_items
    WHERE import_id = p_import_id
    AND status = 'imported'
    AND result_id IS NOT NULL
  LOOP
    BEGIN
      IF v_item.result_type = 'course' THEN
        DELETE FROM public.courses WHERE id = v_item.result_id;
      ELSIF v_item.result_type = 'event' THEN
        DELETE FROM public.events WHERE id = v_item.result_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_success := false;
    END;
  END LOOP;

  -- Update import status
  UPDATE public.template_imports
  SET
    status = 'cancelled',
    metadata = metadata || jsonb_build_object(
      'rollback_at', NOW(),
      'rollback_reason', p_reason
    )
  WHERE id = p_import_id;

  -- Update items status
  UPDATE public.template_import_items
  SET status = 'cancelled'
  WHERE import_id = p_import_id;

  -- Log audit event
  PERFORM log_import_audit(p_import_id, NULL, 'rollback_completed',
    jsonb_build_object('success', v_success)
  );

  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. STATISTICS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_import_statistics(
  p_user_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  total_courses_imported BIGINT,
  total_events_imported BIGINT,
  average_items_per_import NUMERIC,
  average_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ti.id) AS total_imports,
    COUNT(DISTINCT ti.id) FILTER (WHERE ti.status = 'completed') AS successful_imports,
    COUNT(DISTINCT ti.id) FILTER (WHERE ti.status = 'failed') AS failed_imports,
    COUNT(tii.id) FILTER (WHERE tii.result_type = 'course' AND tii.status = 'imported') AS total_courses_imported,
    COUNT(tii.id) FILTER (WHERE tii.result_type = 'event' AND tii.status = 'imported') AS total_events_imported,
    AVG(ti.total_count)::NUMERIC AS average_items_per_import,
    CASE
      WHEN SUM(ti.total_count) > 0
      THEN (SUM(ti.success_count)::NUMERIC / SUM(ti.total_count) * 100)
      ELSE 0
    END AS average_success_rate
  FROM public.template_imports ti
  LEFT JOIN public.template_import_items tii ON ti.id = tii.import_id
  WHERE (p_user_id IS NULL OR ti.user_id = p_user_id)
    AND ti.created_at >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION import_course_from_template(JSONB, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION import_event_from_template(JSONB, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_template_import_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_course_dependencies(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_template_import(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_import_statistics(UUID, INTEGER) TO authenticated;

-- ============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION import_course_from_template IS 'Imports a course from a JSON template with full error handling';
COMMENT ON FUNCTION import_event_from_template IS 'Imports an event from a JSON template with full error handling';
COMMENT ON FUNCTION process_template_import_batch IS 'Processes all items in an import batch with transaction management';
COMMENT ON FUNCTION validate_course_dependencies IS 'Validates that all referenced entities exist before import';
COMMENT ON FUNCTION rollback_template_import IS 'Rolls back a completed import, deleting all created records';
COMMENT ON FUNCTION get_import_statistics IS 'Returns import statistics for monitoring and reporting';