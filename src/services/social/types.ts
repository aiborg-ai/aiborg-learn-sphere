/**
 * Shared types for social features
 */

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  skill_level_range: [number, number];
  topics: string[];
  max_members: number;
  is_public: boolean;
  member_count?: number;
  compatibility_score?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  challenge_type: 'assessment' | 'quiz' | 'course_completion' | 'skill_race' | 'study_streak';
  assessment_id?: string;
  start_date: Date;
  end_date: Date;
  is_public: boolean;
  max_participants?: number;
  prize_description?: string;
  participant_count?: number;
}

export interface ChallengeParticipant {
  user_id: string;
  username?: string;
  score?: number;
  completion_time?: number;
  rank?: number;
  status: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  industry?: string;
  size_range?: string;
  member_count?: number;
}

export interface TeamAssessment {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  is_mandatory: boolean;
  due_date?: Date;
  team_average_score?: number;
  completion_rate?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  score: number;
  metadata?: Record<string, unknown>;
  is_current_user?: boolean;
}

export interface PrivacySettings {
  show_on_leaderboards: boolean;
  show_profile_publicly: boolean;
  allow_study_group_invites: boolean;
  allow_challenge_invites: boolean;
  show_achievements_publicly: boolean;
  show_courses_publicly: boolean;
  show_real_name: boolean;
}
