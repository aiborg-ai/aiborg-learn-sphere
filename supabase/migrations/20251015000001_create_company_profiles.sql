-- Create company profiles table for company admins
-- This table stores information about companies whose admins use the platform

-- ============================================================================
-- COMPANY PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    website TEXT,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one company profile per user
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_company_name ON public.company_profiles(company_name);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Company admins can view their own company profile
CREATE POLICY "Company admins can view own company"
    ON public.company_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Company admins can create their own company profile
CREATE POLICY "Company admins can create own company"
    ON public.company_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Company admins can update their own company profile
CREATE POLICY "Company admins can update own company"
    ON public.company_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Super admins and admins can view all companies
CREATE POLICY "Admins can view all companies"
    ON public.company_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_company_profiles_updated_at
    BEFORE UPDATE ON public.company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTION TO AUTO-CREATE COMPANY PROFILE ON SIGNUP
-- ============================================================================

-- Function to create company profile from user metadata
CREATE OR REPLACE FUNCTION public.handle_company_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only create company profile if user has company_admin metadata
    IF NEW.raw_user_meta_data->>'account_type' = 'company_admin' THEN
        INSERT INTO public.company_profiles (
            user_id,
            company_name,
            industry,
            company_size,
            website,
            description
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
            NEW.raw_user_meta_data->>'industry',
            NEW.raw_user_meta_data->>'company_size',
            NEW.raw_user_meta_data->>'website',
            NEW.raw_user_meta_data->>'description'
        );

        -- Update user's role to company_admin
        UPDATE public.profiles
        SET role = 'company_admin'
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for company profile auto-creation
DROP TRIGGER IF EXISTS on_company_admin_user_created ON auth.users;
CREATE TRIGGER on_company_admin_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_admin_signup();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.company_profiles IS 'Company information for company admin users';
COMMENT ON COLUMN public.company_profiles.user_id IS 'The company admin user who created this company profile';
COMMENT ON COLUMN public.company_profiles.company_size IS 'Number of employees: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+';
