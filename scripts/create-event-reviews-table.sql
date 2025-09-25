-- Create Event Reviews Table
-- This will allow users to review events they've attended

-- 1. Create event_reviews table (similar to reviews table for courses)
CREATE TABLE IF NOT EXISTS event_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    event_date_attended DATE,
    event_mode TEXT CHECK (event_mode IN ('online', 'in-person', 'hybrid')),
    display_preference TEXT DEFAULT 'show_name' CHECK (display_preference IN ('show_name', 'anonymous')),
    display BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 2. Create event_registrations table if it doesn't exist (to track who attended)
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'attended', 'cancelled', 'no-show')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    UNIQUE(user_id, event_id)
);

-- 3. Enable Row Level Security
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for event_reviews

-- Users can view approved and displayed reviews
CREATE POLICY "Public can view approved event reviews" ON event_reviews
    FOR SELECT USING (approved = true AND display = true);

-- Users can view their own reviews
CREATE POLICY "Users can view own event reviews" ON event_reviews
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create reviews for events they've attended
CREATE POLICY "Users can create event reviews" ON event_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM event_registrations
            WHERE user_id = auth.uid()
            AND event_id = event_reviews.event_id
            AND registration_status = 'attended'
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update own event reviews" ON event_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own event reviews" ON event_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all event reviews" ON event_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Create RLS policies for event_registrations

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON event_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can register for events
CREATE POLICY "Users can register for events" ON event_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations" ON event_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all registrations" ON event_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Create indexes for better performance
CREATE INDEX idx_event_reviews_event_id ON event_reviews(event_id);
CREATE INDEX idx_event_reviews_user_id ON event_reviews(user_id);
CREATE INDEX idx_event_reviews_approved_display ON event_reviews(approved, display);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_reviews_updated_at
    BEFORE UPDATE ON event_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert sample event review (optional, for testing)
DO $$
DECLARE
    sample_user_id UUID;
    sample_event_id UUID;
BEGIN
    -- Get a user and event for sample
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    SELECT id INTO sample_event_id FROM events WHERE is_active = true LIMIT 1;

    IF sample_user_id IS NOT NULL AND sample_event_id IS NOT NULL THEN
        -- First register the user for the event
        INSERT INTO event_registrations (user_id, event_id, registration_status)
        VALUES (sample_user_id, sample_event_id, 'attended')
        ON CONFLICT DO NOTHING;

        -- Then create a review
        INSERT INTO event_reviews (
            user_id, event_id, rating, comment,
            event_mode, display, approved
        )
        VALUES (
            sample_user_id, sample_event_id, 5,
            'Excellent workshop! The hands-on exercises were very helpful and the instructor was knowledgeable.',
            'online', true, true
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 9. Verify tables were created
SELECT 'Event Reviews System Created Successfully!' as status;
SELECT COUNT(*) as event_reviews_count FROM event_reviews;
SELECT COUNT(*) as event_registrations_count FROM event_registrations;