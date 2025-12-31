/**
 * Embedding Update Queue Enhancements
 * Creates the missing queue table and adds retry logic with exponential backoff
 */

-- Create embedding_update_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.embedding_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,

  -- Action type
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),

  -- Processing status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Retry logic
  retry_count INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Error tracking
  error TEXT,

  UNIQUE(content_type, content_id, action)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_pending
ON public.embedding_update_queue(created_at)
WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_queue_pending_retry
ON public.embedding_update_queue(next_retry_at)
WHERE processed_at IS NULL AND retry_count < 3;

CREATE INDEX IF NOT EXISTS idx_queue_type
ON public.embedding_update_queue(content_type);

-- Function to calculate next retry time with exponential backoff
CREATE OR REPLACE FUNCTION public.calculate_next_retry(retry_count INT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- 0 retries: 5 min, 1: 15 min, 2: 60 min
  RETURN NOW() + (POWER(3, retry_count) * INTERVAL '5 minutes');
END;
$$ LANGUAGE plpgsql;

-- Function to queue embedding update
CREATE OR REPLACE FUNCTION public.queue_embedding_update(p_content_type TEXT)
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Queue deletion
    INSERT INTO public.embedding_update_queue (content_type, content_id, action)
    VALUES (p_content_type, OLD.id::text, 'delete')
    ON CONFLICT (content_type, content_id, action) DO NOTHING;

    RETURN OLD;
  ELSE
    -- Queue create or update
    INSERT INTO public.embedding_update_queue (content_type, content_id, action)
    VALUES (
      p_content_type,
      NEW.id::text,
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
    )
    ON CONFLICT (content_type, content_id, action) DO UPDATE
    SET created_at = NOW(), retry_count = 0, next_retry_at = NULL;

    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE public.embedding_update_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view queue
CREATE POLICY "Admins can view queue"
ON public.embedding_update_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- System can insert/update queue
CREATE POLICY "System can manage queue"
ON public.embedding_update_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION public.get_embedding_queue_status()
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  failed_count BIGINT,
  last_successful_run TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE processed_at IS NULL AND retry_count < 3) AS pending_count,
    COUNT(*) FILTER (WHERE processed_at IS NULL AND retry_count >= 3) AS failed_count,
    COUNT(*) FILTER (WHERE last_attempt_at IS NOT NULL AND processed_at IS NULL) AS processing_count,
    MAX(processed_at) AS last_successful_run
  FROM public.embedding_update_queue;
END;
$$ LANGUAGE plpgsql;

-- Function to process embedding queue (will be called by cron or edge function)
CREATE OR REPLACE FUNCTION public.process_embedding_queue()
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_processed INT := 0;
  v_errors INT := 0;
BEGIN
  -- Process up to 100 pending items
  FOR v_item IN
    SELECT *
    FROM public.embedding_update_queue
    WHERE processed_at IS NULL
      AND retry_count < 3
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at
    LIMIT 100
  LOOP
    BEGIN
      -- For delete actions, remove from embeddings
      IF v_item.action = 'delete' THEN
        DELETE FROM public.content_embeddings
        WHERE content_type = v_item.content_type
          AND content_id = v_item.content_id;

        -- Mark as processed
        UPDATE public.embedding_update_queue
        SET processed_at = NOW()
        WHERE id = v_item.id;

        v_processed := v_processed + 1;

      ELSE
        -- For create/update, the edge function will handle embedding generation
        -- Just mark as needing processing (next_retry_at set to allow edge function to pick it up)
        UPDATE public.embedding_update_queue
        SET next_retry_at = NOW() + INTERVAL '1 minute'
        WHERE id = v_item.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Increment retry count and set next retry time
      UPDATE public.embedding_update_queue
      SET
        retry_count = retry_count + 1,
        last_attempt_at = NOW(),
        next_retry_at = calculate_next_retry(retry_count + 1),
        error = SQLERRM
      WHERE id = v_item.id;

      v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'errors', v_errors,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE public.embedding_update_queue IS 'Queue for content changes that need embedding updates. Processed by scheduled job.';
COMMENT ON FUNCTION public.process_embedding_queue IS 'Processes pending embedding updates. Called by cron job every 15 minutes.';
