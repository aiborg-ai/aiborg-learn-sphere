-- Social & Collaborative Features Schema

-- Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_level_range INT4RANGE NOT NULL, -- e.g., [40, 60]
    topics TEXT[] NOT NULL,
    max_members INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_group_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT CHECK (activity_type IN ('message', 'achievement', 'course_completed', 'challenge', 'resource_shared')) NOT NULL,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges & Competitions
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_type TEXT CHECK (challenge_type IN ('assessment', 'quiz', 'course_completion', 'skill_race', 'study_streak')) NOT NULL,
    assessment_id UUID,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    max_participants INTEGER,
    prize_description TEXT,
    rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('invited', 'accepted', 'declined', 'in_progress', 'completed', 'forfeited')) DEFAULT 'accepted',
    score DECIMAL(5,2),
    completion_time INTEGER, -- seconds
    rank INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Team/Organization Assessments
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    industry TEXT,
    size_range TEXT CHECK (size_range IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'manager', 'admin', 'owner')) DEFAULT 'member',
    department TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_mandatory BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    team_average_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_assessment_id UUID REFERENCES team_assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    individual_score DECIMAL(5,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    results_data JSONB,
    UNIQUE(team_assessment_id, user_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leaderboard_type TEXT CHECK (leaderboard_type IN ('global', 'category', 'organization', 'challenge', 'study_group')) NOT NULL,
    category TEXT,
    reference_id UUID, -- organization_id, challenge_id, or study_group_id
    timeframe TEXT CHECK (timeframe IN ('daily', 'weekly', 'monthly', 'all_time')) DEFAULT 'all_time',
    metric TEXT CHECK (metric IN ('total_score', 'courses_completed', 'assessments_taken', 'study_streak', 'skill_level')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leaderboard_id, user_id, period_start)
);

-- User Privacy Settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    show_on_leaderboards BOOLEAN DEFAULT true,
    show_profile_publicly BOOLEAN DEFAULT true,
    allow_study_group_invites BOOLEAN DEFAULT true,
    allow_challenge_invites BOOLEAN DEFAULT true,
    show_achievements_publicly BOOLEAN DEFAULT true,
    show_courses_publicly BOOLEAN DEFAULT true,
    show_real_name BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer Connections (Following/Followers)
CREATE TABLE IF NOT EXISTS peer_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Achievements & Badges
CREATE TABLE IF NOT EXISTS social_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    achievement_type TEXT CHECK (achievement_type IN ('study_group', 'challenge', 'social', 'collaboration')) NOT NULL,
    criteria JSONB NOT NULL,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_social_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES social_achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT true,
    UNIQUE(user_id, achievement_id)
);

-- Row Level Security
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_achievements ENABLE ROW LEVEL SECURITY;

-- Policies

-- Study Groups
CREATE POLICY "Public study groups are viewable by everyone"
    ON study_groups FOR SELECT
    USING (is_public = true OR creator_id = auth.uid() OR id IN (
        SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create study groups"
    ON study_groups FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group creators can update their groups"
    ON study_groups FOR UPDATE
    USING (creator_id = auth.uid());

CREATE POLICY "Users can view study group memberships"
    ON study_group_members FOR SELECT
    USING (true);

CREATE POLICY "Users can join public study groups"
    ON study_group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id AND (
        SELECT is_public FROM study_groups WHERE id = group_id
    ));

-- Challenges
CREATE POLICY "Public challenges are viewable by everyone"
    ON challenges FOR SELECT
    USING (is_public = true OR creator_id = auth.uid() OR id IN (
        SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create challenges"
    ON challenges FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view their challenge participations"
    ON challenge_participants FOR SELECT
    USING (user_id = auth.uid() OR challenge_id IN (
        SELECT id FROM challenges WHERE creator_id = auth.uid()
    ));

CREATE POLICY "Users can join challenges"
    ON challenge_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Challenge Invitations
CREATE POLICY "Users can view their invitations"
    ON challenge_invitations FOR SELECT
    USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Users can send invitations"
    ON challenge_invitations FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can respond to invitations"
    ON challenge_invitations FOR UPDATE
    USING (to_user_id = auth.uid());

-- Organizations
CREATE POLICY "Users can view organizations they're part of"
    ON organizations FOR SELECT
    USING (owner_id = auth.uid() OR id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Leaderboards
CREATE POLICY "Users can view public leaderboards"
    ON leaderboards FOR SELECT
    USING (true);

CREATE POLICY "Users can view leaderboard entries with privacy"
    ON leaderboard_entries FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_id IN (SELECT user_id FROM user_privacy_settings WHERE show_on_leaderboards = true)
    );

-- Privacy Settings
CREATE POLICY "Users can manage their privacy settings"
    ON user_privacy_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Peer Connections
CREATE POLICY "Users can view peer connections"
    ON peer_connections FOR SELECT
    USING (true);

CREATE POLICY "Users can create peer connections"
    ON peer_connections FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their peer connections"
    ON peer_connections FOR DELETE
    USING (auth.uid() = follower_id);

-- Achievements
CREATE POLICY "Everyone can view achievements"
    ON social_achievements FOR SELECT
    USING (true);

CREATE POLICY "Users can view their earned achievements"
    ON user_social_achievements FOR SELECT
    USING (user_id = auth.uid() OR (
        SELECT show_achievements_publicly FROM user_privacy_settings WHERE user_id = user_social_achievements.user_id
    ) = true);

-- Indexes for performance
CREATE INDEX idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX idx_study_groups_skill_level ON study_groups USING GIST (skill_level_range);
CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX idx_challenges_creator ON challenges(creator_id);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX idx_peer_connections_follower ON peer_connections(follower_id);
CREATE INDEX idx_peer_connections_following ON peer_connections(following_id);

-- Functions

-- Function to find compatible study group matches
CREATE OR REPLACE FUNCTION find_compatible_study_groups(
    user_skill_level INTEGER,
    user_topics TEXT[]
)
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    compatibility_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sg.id,
        sg.name,
        (
            -- Skill level match (40%)
            CASE
                WHEN user_skill_level <@ sg.skill_level_range THEN 40.0
                ELSE 40.0 - ABS(user_skill_level - LOWER(sg.skill_level_range)) * 2
            END +
            -- Topic overlap (60%)
            (ARRAY_LENGTH(ARRAY(SELECT UNNEST(sg.topics) INTERSECT SELECT UNNEST(user_topics)), 1)::DECIMAL /
             GREATEST(ARRAY_LENGTH(sg.topics, 1), 1)) * 60.0
        ) as compatibility_score
    FROM study_groups sg
    WHERE
        sg.is_public = true
        AND (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) < sg.max_members
    ORDER BY compatibility_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(leaderboard_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE leaderboard_entries
    SET rank = ranked.new_rank
    FROM (
        SELECT
            id,
            RANK() OVER (PARTITION BY leaderboard_id ORDER BY score DESC) as new_rank
        FROM leaderboard_entries
        WHERE leaderboard_id = leaderboard_uuid
    ) ranked
    WHERE leaderboard_entries.id = ranked.id
    AND leaderboard_entries.leaderboard_id = leaderboard_uuid;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Update study group updated_at
CREATE OR REPLACE FUNCTION update_study_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER study_groups_updated_at
    BEFORE UPDATE ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_study_group_timestamp();

-- Create default privacy settings for new users
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_privacy_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_privacy_settings();
