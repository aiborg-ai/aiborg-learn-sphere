-- AI Opportunity Assessment Tables

-- Main assessment table
CREATE TABLE IF NOT EXISTS ai_opportunity_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_mission TEXT,
    ai_enhancement_description TEXT,
    strategic_alignment_rating INTEGER CHECK (strategic_alignment_rating >= 1 AND strategic_alignment_rating <= 5),

    -- AI Capabilities
    current_ai_adoption_level TEXT CHECK (current_ai_adoption_level IN ('none', 'experimentation', 'partial', 'full-scale')),
    internal_ai_expertise INTEGER CHECK (internal_ai_expertise >= 1 AND internal_ai_expertise <= 5),
    data_availability_rating INTEGER CHECK (data_availability_rating >= 1 AND data_availability_rating <= 5),
    additional_ai_capabilities TEXT,

    -- Overall ratings and summary
    overall_opportunity_rating DECIMAL(3,1) CHECK (overall_opportunity_rating >= 1 AND overall_opportunity_rating <= 5),
    ai_adoption_benefit_summary TEXT,

    -- Metadata
    completed_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    is_completed BOOLEAN DEFAULT false
);

-- Pain Points and AI Opportunities
CREATE TABLE IF NOT EXISTS assessment_pain_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    pain_point TEXT NOT NULL,
    current_impact INTEGER CHECK (current_impact >= 1 AND current_impact <= 5),
    ai_capability_to_address TEXT NOT NULL,
    impact_after_ai INTEGER CHECK (impact_after_ai >= 1 AND impact_after_ai <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Impact and AI Benefits
CREATE TABLE IF NOT EXISTS assessment_user_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    user_group TEXT NOT NULL,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    user_pain_points TEXT NOT NULL,
    ai_improvements TEXT NOT NULL,
    impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benefits Analysis
CREATE TABLE IF NOT EXISTS assessment_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    benefit_area TEXT NOT NULL,
    current_status TEXT NOT NULL,
    ai_improvement TEXT NOT NULL,
    impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Analysis
CREATE TABLE IF NOT EXISTS assessment_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    risk_factor TEXT NOT NULL,
    specific_risk TEXT NOT NULL,
    likelihood INTEGER CHECK (likelihood >= 1 AND likelihood <= 5),
    impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
    mitigation_strategy TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource Requirements
CREATE TABLE IF NOT EXISTS assessment_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    is_available BOOLEAN NOT NULL,
    additional_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive Analysis
CREATE TABLE IF NOT EXISTS assessment_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    ai_use_case TEXT NOT NULL,
    advantage TEXT NOT NULL,
    threat_level INTEGER CHECK (threat_level >= 1 AND threat_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Implementation Decision and Action Plan
CREATE TABLE IF NOT EXISTS assessment_action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    recommended_next_steps TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stakeholder Approvals
CREATE TABLE IF NOT EXISTS assessment_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES ai_opportunity_assessments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    signature_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE ai_opportunity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_user_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_stakeholders ENABLE ROW LEVEL SECURITY;

-- Policies for ai_opportunity_assessments
CREATE POLICY "Users can view their own assessments"
    ON ai_opportunity_assessments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments"
    ON ai_opportunity_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
    ON ai_opportunity_assessments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments"
    ON ai_opportunity_assessments FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for related tables (cascade from main assessment)
CREATE POLICY "Users can view assessment pain points"
    ON assessment_pain_points FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment pain points"
    ON assessment_pain_points FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment user impacts"
    ON assessment_user_impacts FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment user impacts"
    ON assessment_user_impacts FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment benefits"
    ON assessment_benefits FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment benefits"
    ON assessment_benefits FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment risks"
    ON assessment_risks FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment risks"
    ON assessment_risks FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment resources"
    ON assessment_resources FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment resources"
    ON assessment_resources FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment competitors"
    ON assessment_competitors FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment competitors"
    ON assessment_competitors FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment action plans"
    ON assessment_action_plans FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment action plans"
    ON assessment_action_plans FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can view assessment stakeholders"
    ON assessment_stakeholders FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

CREATE POLICY "Users can manage assessment stakeholders"
    ON assessment_stakeholders FOR ALL
    USING (assessment_id IN (
        SELECT id FROM ai_opportunity_assessments WHERE auth.uid() = user_id
    ));

-- Indexes for performance
CREATE INDEX idx_assessments_user_id ON ai_opportunity_assessments(user_id);
CREATE INDEX idx_assessments_created_at ON ai_opportunity_assessments(created_at DESC);
CREATE INDEX idx_pain_points_assessment_id ON assessment_pain_points(assessment_id);
CREATE INDEX idx_user_impacts_assessment_id ON assessment_user_impacts(assessment_id);
CREATE INDEX idx_benefits_assessment_id ON assessment_benefits(assessment_id);
CREATE INDEX idx_risks_assessment_id ON assessment_risks(assessment_id);
CREATE INDEX idx_resources_assessment_id ON assessment_resources(assessment_id);
CREATE INDEX idx_competitors_assessment_id ON assessment_competitors(assessment_id);
CREATE INDEX idx_action_plans_assessment_id ON assessment_action_plans(assessment_id);
CREATE INDEX idx_stakeholders_assessment_id ON assessment_stakeholders(assessment_id);
