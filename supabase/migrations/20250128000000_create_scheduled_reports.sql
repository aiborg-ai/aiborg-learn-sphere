-- Create scheduled_reports table for automated analytics report generation
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Report Configuration
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('overview', 'performance', 'goals', 'full')),
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),

  -- Delivery Settings
  delivery_method VARCHAR(50) NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'download')),
  delivery_email VARCHAR(255),

  -- Report Options
  include_overview BOOLEAN DEFAULT true,
  include_performance BOOLEAN DEFAULT true,
  include_goals BOOLEAN DEFAULT true,
  include_charts BOOLEAN DEFAULT false,

  -- Date Range Configuration
  date_range_type VARCHAR(50) DEFAULT 'last_30_days' CHECK (
    date_range_type IN ('last_7_days', 'last_30_days', 'last_90_days', 'current_month', 'last_month', 'custom')
  ),
  custom_start_date TIMESTAMPTZ,
  custom_end_date TIMESTAMPTZ,

  -- Schedule Configuration
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_custom_dates CHECK (
    (date_range_type != 'custom') OR
    (custom_start_date IS NOT NULL AND custom_end_date IS NOT NULL)
  ),
  CONSTRAINT valid_email CHECK (
    (delivery_method != 'email') OR
    (delivery_email IS NOT NULL AND delivery_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
  )
);

-- Create index on user_id for faster queries
CREATE INDEX idx_scheduled_reports_user_id ON public.scheduled_reports(user_id);

-- Create index on next_run_at for cron job queries
CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;

-- Create report_executions table to track report generation history
CREATE TABLE IF NOT EXISTS public.report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID NOT NULL REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,

  -- Execution Details
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Results
  file_url TEXT,
  file_size_bytes INTEGER,
  error_message TEXT,

  -- Delivery
  delivered_at TIMESTAMPTZ,
  delivery_status VARCHAR(50) CHECK (delivery_status IN ('pending', 'sent', 'failed')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index on scheduled_report_id
CREATE INDEX idx_report_executions_scheduled_report ON public.report_executions(scheduled_report_id);

-- Create index on status and created_at for monitoring
CREATE INDEX idx_report_executions_status_created ON public.report_executions(status, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_reports
CREATE POLICY "Users can view their own scheduled reports"
  ON public.scheduled_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled reports"
  ON public.scheduled_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports"
  ON public.scheduled_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports"
  ON public.scheduled_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for report_executions
CREATE POLICY "Users can view their own report executions"
  ON public.report_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_reports
      WHERE scheduled_reports.id = report_executions.scheduled_report_id
      AND scheduled_reports.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_reports_updated_at();

-- Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency VARCHAR,
  p_from_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'daily' THEN p_from_date + INTERVAL '1 day'
    WHEN 'weekly' THEN p_from_date + INTERVAL '1 week'
    WHEN 'monthly' THEN p_from_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN p_from_date + INTERVAL '3 months'
    ELSE p_from_date + INTERVAL '1 week'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for documentation
COMMENT ON TABLE public.scheduled_reports IS 'Stores user-configured scheduled analytics reports';
COMMENT ON TABLE public.report_executions IS 'Tracks the execution history of scheduled reports';
COMMENT ON COLUMN public.scheduled_reports.report_type IS 'Type of report: overview, performance, goals, or full analytics';
COMMENT ON COLUMN public.scheduled_reports.frequency IS 'How often the report should be generated';
COMMENT ON COLUMN public.scheduled_reports.delivery_method IS 'How the report should be delivered to the user';
COMMENT ON COLUMN public.scheduled_reports.next_run_at IS 'When the report should next be generated';
COMMENT ON COLUMN public.report_executions.status IS 'Current status of the report execution';
COMMENT ON COLUMN public.report_executions.file_url IS 'URL to the generated report file (if applicable)';
