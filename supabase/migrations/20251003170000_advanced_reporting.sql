-- Advanced Reporting System Schema

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_type TEXT CHECK (certificate_type IN ('course_completion', 'assessment', 'skill_achievement', 'program_completion')) NOT NULL,
    reference_id UUID NOT NULL, -- course_id, assessment_id, etc.
    title TEXT NOT NULL,
    description TEXT,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_code TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    pdf_url TEXT,
    metadata JSONB,
    is_verified BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagnostic Reports
CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT CHECK (report_type IN ('learner_progress', 'skill_analysis', 'team_performance', 'organization_overview')) NOT NULL,
    generated_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    summary TEXT,

    -- Key metrics
    overall_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),

    -- Detailed data
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT[],
    skill_breakdown JSONB,
    progress_timeline JSONB,
    comparative_analysis JSONB,

    -- Report metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    report_data JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competency Matrices
CREATE TABLE IF NOT EXISTS competency_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    job_role TEXT NOT NULL,
    experience_level TEXT CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'expert')),
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competency_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id UUID REFERENCES competency_matrices(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    required_level INTEGER CHECK (required_level >= 1 AND required_level <= 5),
    importance TEXT CHECK (importance IN ('required', 'preferred', 'nice_to_have')) DEFAULT 'required',
    description TEXT,
    assessment_criteria TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Competency Assessments
CREATE TABLE IF NOT EXISTS user_competency_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    matrix_id UUID REFERENCES competency_matrices(id) ON DELETE CASCADE,
    overall_match_score DECIMAL(5,2),
    assessed_by UUID REFERENCES auth.users(id),
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('draft', 'completed', 'verified')) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skill_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES user_competency_assessments(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES competency_skills(id) ON DELETE CASCADE,
    current_level INTEGER CHECK (current_level >= 0 AND current_level <= 5),
    evidence TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys for Third-party Integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    permissions JSONB NOT NULL, -- {read: true, write: false, admin: false}
    allowed_endpoints TEXT[],
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- milliseconds
    ip_address INET,
    user_agent TEXT,
    request_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    template_type TEXT CHECK (template_type IN ('certificate', 'diagnostic', 'competency', 'custom')) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificate Verification Log
CREATE TABLE IF NOT EXISTS certificate_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
    verified_by TEXT, -- IP or organization name
    verification_method TEXT CHECK (verification_method IN ('qr_code', 'verification_code', 'api')) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Certificates
CREATE POLICY "Users can view their own certificates"
    ON certificates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Anyone can verify certificates"
    ON certificates FOR SELECT
    USING (is_verified = true);

-- Diagnostic Reports
CREATE POLICY "Users can view their own reports"
    ON diagnostic_reports FOR SELECT
    USING (user_id = auth.uid() OR generated_by = auth.uid());

CREATE POLICY "Instructors can create reports"
    ON diagnostic_reports FOR INSERT
    WITH CHECK (auth.uid() = generated_by);

-- Competency Matrices
CREATE POLICY "Public matrices are viewable by everyone"
    ON competency_matrices FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create competency matrices"
    ON competency_matrices FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- User Competency Assessments
CREATE POLICY "Users can view their assessments"
    ON user_competency_assessments FOR SELECT
    USING (user_id = auth.uid() OR assessed_by = auth.uid());

-- API Keys
CREATE POLICY "Users can manage their API keys"
    ON api_keys FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX idx_certificates_type ON certificates(certificate_type);
CREATE INDEX idx_diagnostic_reports_user ON diagnostic_reports(user_id);
CREATE INDEX idx_diagnostic_reports_type ON diagnostic_reports(report_type);
CREATE INDEX idx_competency_matrices_role ON competency_matrices(job_role);
CREATE INDEX idx_user_competency_assessments_user ON user_competency_assessments(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_usage_logs_key ON api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created ON api_usage_logs(created_at);

-- Functions

-- Generate unique verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12));
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Verify certificate
CREATE OR REPLACE FUNCTION verify_certificate(verification_code_input TEXT)
RETURNS TABLE (
    certificate_id UUID,
    user_name TEXT,
    title TEXT,
    issued_date TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        COALESCE(up.username, u.email) as user_name,
        c.title,
        c.issued_date,
        (c.is_verified AND (c.expires_at IS NULL OR c.expires_at > NOW())) as is_valid
    FROM certificates c
    JOIN auth.users u ON c.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE c.verification_code = verification_code_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate competency match score
CREATE OR REPLACE FUNCTION calculate_competency_match(
    assessment_uuid UUID
)
RETURNS DECIMAL AS $$
DECLARE
    total_skills INTEGER;
    matched_skills INTEGER;
    weighted_score DECIMAL;
BEGIN
    -- Get total required skills
    SELECT COUNT(*) INTO total_skills
    FROM competency_skills cs
    JOIN user_competency_assessments uca ON cs.matrix_id = uca.matrix_id
    WHERE uca.id = assessment_uuid;

    IF total_skills = 0 THEN
        RETURN 0;
    END IF;

    -- Calculate weighted match
    SELECT SUM(
        CASE cs.importance
            WHEN 'required' THEN
                CASE WHEN usr.current_level >= cs.required_level THEN 3 ELSE 0 END
            WHEN 'preferred' THEN
                CASE WHEN usr.current_level >= cs.required_level THEN 2 ELSE 0 END
            WHEN 'nice_to_have' THEN
                CASE WHEN usr.current_level >= cs.required_level THEN 1 ELSE 0 END
        END
    ) INTO weighted_score
    FROM competency_skills cs
    JOIN user_competency_assessments uca ON cs.matrix_id = uca.matrix_id
    LEFT JOIN user_skill_ratings usr ON cs.id = usr.skill_id AND usr.assessment_id = assessment_uuid
    WHERE uca.id = assessment_uuid;

    -- Normalize to 0-100 scale
    RETURN LEAST(100, (weighted_score / (total_skills * 3)) * 100);
END;
$$ LANGUAGE plpgsql;

-- Generate diagnostic report
CREATE OR REPLACE FUNCTION generate_diagnostic_report(
    target_user_id UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    user_data JSONB;
BEGIN
    -- Gather user data
    SELECT jsonb_build_object(
        'courses_completed', (
            SELECT COUNT(*) FROM course_enrollments
            WHERE user_id = target_user_id AND progress = 100
            AND updated_at BETWEEN start_date AND end_date
        ),
        'assessments_taken', (
            SELECT COUNT(*) FROM ai_assessment_results
            WHERE user_id = target_user_id
            AND created_at BETWEEN start_date AND end_date
        ),
        'avg_score', (
            SELECT AVG(score) FROM ai_assessment_results
            WHERE user_id = target_user_id
            AND created_at BETWEEN start_date AND end_date
        ),
        'study_time_hours', (
            SELECT SUM(duration_minutes) / 60.0 FROM learning_sessions
            WHERE user_id = target_user_id
            AND session_date BETWEEN start_date AND end_date
        )
    ) INTO user_data;

    -- Create report
    INSERT INTO diagnostic_reports (
        user_id,
        report_type,
        generated_by,
        title,
        period_start,
        period_end,
        report_data
    ) VALUES (
        target_user_id,
        'learner_progress',
        auth.uid(),
        'Learner Progress Report',
        start_date,
        end_date,
        user_data
    ) RETURNING id INTO report_id;

    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Auto-generate verification code for certificates
CREATE OR REPLACE FUNCTION auto_generate_verification_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_code IS NULL THEN
        NEW.verification_code := generate_verification_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificates_verification_code
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_verification_code();

-- Log certificate verifications
CREATE OR REPLACE FUNCTION log_certificate_verification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO certificate_verifications (certificate_id, verification_method)
    VALUES (NEW.id, 'qr_code');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update competency matrix timestamp
CREATE OR REPLACE FUNCTION update_competency_matrix_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competency_matrices_updated_at
    BEFORE UPDATE ON competency_matrices
    FOR EACH ROW
    EXECUTE FUNCTION update_competency_matrix_timestamp();
