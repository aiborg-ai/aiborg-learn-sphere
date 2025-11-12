/**
 * Analytics Preferences Migration
 *
 * Creates user preferences table for analytics real-time and auto-refresh settings
 * Allows users to customize their analytics experience
 */

-- Create analytics_preferences table
CREATE TABLE IF NOT EXISTS public.analytics_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Global settings
    real_time_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_refresh_interval INTEGER NOT NULL DEFAULT 180000 CHECK (auto_refresh_interval >= 120000 AND auto_refresh_interval <= 300000),

    -- Per-page settings
    chatbot_analytics_refresh BOOLEAN NOT NULL DEFAULT true,
    learner_analytics_refresh BOOLEAN NOT NULL DEFAULT true,
    manager_dashboard_refresh BOOLEAN NOT NULL DEFAULT true,

    -- UI preferences
    show_refresh_indicator BOOLEAN NOT NULL DEFAULT true,
    show_real_time_notifications BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one preferences row per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_preferences_user_id
    ON public.analytics_preferences(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_analytics_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_preferences_updated_at
    BEFORE UPDATE ON public.analytics_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_analytics_preferences_updated_at();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_analytics_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics_preferences (
        user_id,
        real_time_enabled,
        auto_refresh_interval,
        chatbot_analytics_refresh,
        learner_analytics_refresh,
        manager_dashboard_refresh,
        show_refresh_indicator,
        show_real_time_notifications
    ) VALUES (
        NEW.id,
        true,
        180000, -- 3 minutes default
        true,
        true,
        true,
        true,
        false
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user is created
CREATE TRIGGER create_analytics_preferences_on_user_creation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_analytics_preferences();

-- Row Level Security Policies
ALTER TABLE public.analytics_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own analytics preferences"
    ON public.analytics_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own analytics preferences"
    ON public.analytics_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own analytics preferences"
    ON public.analytics_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own analytics preferences"
    ON public.analytics_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create default preferences for existing users
INSERT INTO public.analytics_preferences (
    user_id,
    real_time_enabled,
    auto_refresh_interval,
    chatbot_analytics_refresh,
    learner_analytics_refresh,
    manager_dashboard_refresh,
    show_refresh_indicator,
    show_real_time_notifications
)
SELECT
    id,
    true,
    180000,
    true,
    true,
    true,
    true,
    false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.analytics_preferences WHERE user_id = auth.users.id
);

-- Add helpful comments
COMMENT ON TABLE public.analytics_preferences IS 'User preferences for analytics dashboards auto-refresh and real-time updates';
COMMENT ON COLUMN public.analytics_preferences.real_time_enabled IS 'Enable real-time WebSocket subscriptions for immediate updates';
COMMENT ON COLUMN public.analytics_preferences.auto_refresh_interval IS 'Auto-refresh interval in milliseconds (2-5 minutes: 120000-300000)';
COMMENT ON COLUMN public.analytics_preferences.chatbot_analytics_refresh IS 'Enable auto-refresh for chatbot analytics page';
COMMENT ON COLUMN public.analytics_preferences.learner_analytics_refresh IS 'Enable auto-refresh for individual learner analytics page';
COMMENT ON COLUMN public.analytics_preferences.manager_dashboard_refresh IS 'Enable auto-refresh for manager dashboard page';
COMMENT ON COLUMN public.analytics_preferences.show_refresh_indicator IS 'Show refresh status indicator in analytics pages';
COMMENT ON COLUMN public.analytics_preferences.show_real_time_notifications IS 'Show toast notifications when real-time updates occur';
