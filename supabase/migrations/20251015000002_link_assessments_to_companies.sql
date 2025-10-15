-- Link AI opportunity assessments to company profiles
-- This migration adds company_id to assessments and updates RLS policies

-- ============================================================================
-- ADD COMPANY_ID TO ASSESSMENTS
-- ============================================================================

-- Add company_id column to ai_opportunity_assessments
ALTER TABLE public.ai_opportunity_assessments
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_company_id
    ON public.ai_opportunity_assessments(company_id);

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies to recreate them with company awareness
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.ai_opportunity_assessments;
DROP POLICY IF EXISTS "Users can create their own assessments" ON public.ai_opportunity_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON public.ai_opportunity_assessments;
DROP POLICY IF EXISTS "Users can delete their own assessments" ON public.ai_opportunity_assessments;

-- New policies that consider both user_id and company_id

-- Users can view their own assessments OR assessments from their company
CREATE POLICY "Users can view own or company assessments"
    ON public.ai_opportunity_assessments FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        company_id IN (
            SELECT id FROM public.company_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Users can create assessments for themselves or their company
CREATE POLICY "Users can create own or company assessments"
    ON public.ai_opportunity_assessments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            company_id IS NULL
            OR
            company_id IN (
                SELECT id FROM public.company_profiles
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update their own assessments or their company's assessments
CREATE POLICY "Users can update own or company assessments"
    ON public.ai_opportunity_assessments FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        company_id IN (
            SELECT id FROM public.company_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own assessments or their company's assessments
CREATE POLICY "Users can delete own or company assessments"
    ON public.ai_opportunity_assessments FOR DELETE
    USING (
        auth.uid() = user_id
        OR
        company_id IN (
            SELECT id FROM public.company_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
    ON public.ai_opportunity_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to get company_id for a user
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id
    FROM public.company_profiles
    WHERE user_id = p_user_id
    LIMIT 1;

    RETURN v_company_id;
END;
$$;

-- ============================================================================
-- MIGRATION OF EXISTING DATA
-- ============================================================================

-- If there are existing assessments, we can optionally link them to companies
-- based on company_name field matching
-- This is optional and can be run manually if needed

-- UPDATE public.ai_opportunity_assessments a
-- SET company_id = (
--     SELECT cp.id
--     FROM public.company_profiles cp
--     WHERE cp.company_name = a.company_name
--     AND cp.user_id = a.user_id
--     LIMIT 1
-- )
-- WHERE company_id IS NULL
-- AND company_name IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.ai_opportunity_assessments.company_id IS 'Link to company profile for company admin assessments';
COMMENT ON FUNCTION public.get_user_company_id IS 'Get the company_id for a given user if they have a company profile';
