-- Enhanced Team Analytics: Schema Updates
-- Created: 2025-01-08
-- Purpose: Add skills taxonomy, teams structure for comprehensive team analytics

-- ============================================================================
-- TABLE: course_skills
-- Purpose: Skills taxonomy for courses to enable skills gap analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  skill_category TEXT, -- e.g., 'technical', 'soft_skills', 'leadership', 'compliance'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, skill_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_skills_course_id ON public.course_skills(course_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_skill_name ON public.course_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_course_skills_category ON public.course_skills(skill_category);

-- ============================================================================
-- TABLE: teams
-- Purpose: Sub-groups within organizations for collaboration metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id ON public.teams(team_lead_id);

-- ============================================================================
-- TABLE: team_members
-- Purpose: Junction table for team membership
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage all skills
CREATE POLICY "Admin can view all course skills"
  ON public.course_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage course skills"
  ON public.course_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Team policies: Organization members can view their organization's teams
CREATE POLICY "Organization members can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Team leads and admins can manage teams
CREATE POLICY "Team leads and admins can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (
    team_lead_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = teams.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Team members policies
CREATE POLICY "Team members can view team membership"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE t.id = team_members.team_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'owner', 'manager')
    )
  );

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================
COMMENT ON TABLE public.course_skills IS 'Skills taxonomy mapping courses to competencies for skills gap analysis';
COMMENT ON TABLE public.teams IS 'Sub-groups within organizations for collaboration and team-based metrics';
COMMENT ON TABLE public.team_members IS 'Junction table tracking team membership';

COMMENT ON COLUMN public.course_skills.skill_level IS 'Proficiency level: beginner, intermediate, or advanced';
COMMENT ON COLUMN public.course_skills.skill_category IS 'Category: technical, soft_skills, leadership, compliance, etc.';
COMMENT ON COLUMN public.teams.team_lead_id IS 'Optional team lead (manager) for the team';
