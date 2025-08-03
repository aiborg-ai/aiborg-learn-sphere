-- Create events table for networking events
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  activities TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Networking',
  max_capacity INTEGER,
  current_registrations INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Anyone can view active events" 
ON public.events 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage events" 
ON public.events 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS for event registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for event registrations
CREATE POLICY "Users can view their own registrations" 
ON public.event_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registrations" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registrations" 
ON public.event_registrations 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Create trigger for updating event registration count
CREATE OR REPLACE FUNCTION update_event_registrations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET current_registrations = current_registrations + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET current_registrations = current_registrations - 1 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_registrations_count
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_count();

-- Insert the first event
INSERT INTO public.events (
  title, 
  description, 
  location, 
  event_date, 
  start_time, 
  end_time, 
  price, 
  activities, 
  category,
  max_capacity
) VALUES (
  'AI Innovation Networking Evening',
  'Join us for an exciting networking evening where AI enthusiasts, entrepreneurs, and industry professionals come together. Experience inspiring startup pitches, meaningful connections, and insights into the future of AI innovation.',
  'Level 39, One Canada Square, Canary Wharf, London',
  '2025-09-25',
  '17:00',
  '19:00',
  9.00,
  ARRAY['Networking', 'Startup Pitches', 'Industry Insights', 'Professional Connections'],
  'Networking',
  100
);