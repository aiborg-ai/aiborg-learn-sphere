/**
 * Workshop Service Types
 * Type definitions for collaborative Workshop system
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type WorkshopStage = 'setup' | 'problem_statement' | 'solving' | 'reporting' | 'completed';
export type ParticipantRole = 'participant' | 'facilitator' | 'observer';
export type AttendanceStatus = 'registered' | 'attended' | 'absent' | 'cancelled';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityType =
  | 'join'
  | 'leave'
  | 'stage_change'
  | 'message'
  | 'file_upload'
  | 'contribution';

export interface Workshop {
  id: string;
  course_id: number;
  title: string;
  description: string;
  objectives?: string[];
  difficulty_level: DifficultyLevel;
  duration_minutes: number;
  min_participants: number;
  max_participants: number;
  points_reward: number;

  // Stage configurations
  setup_instructions?: string;
  setup_duration_minutes: number;
  problem_statement: string;
  problem_duration_minutes: number;
  solving_instructions?: string;
  solving_duration_minutes: number;
  reporting_instructions?: string;
  reporting_duration_minutes: number;

  materials?: WorkshopMaterial[];
  tools_required?: string[];
  prerequisites?: string[];

  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopMaterial {
  type: 'link' | 'file' | 'document';
  title: string;
  url?: string;
  description?: string;
}

export interface WorkshopSession {
  id: string;
  workshop_id: string;
  session_name?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  current_stage: WorkshopStage;
  stage_started_at?: string;

  facilitator_id?: string;
  max_participants: number;
  is_open_enrollment: boolean;
  meeting_link?: string;
  meeting_password?: string;

  workspace?: Record<string, unknown>; // JSONB for real-time collaboration data
  shared_notes?: string;
  deliverables?: Record<string, unknown>; // JSONB for files, links, results

  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkshopParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at?: string;
  left_at?: string;
  contribution_score?: number;
  attendance_status: AttendanceStatus;
  points_earned?: number;
  feedback?: string;
  created_at: string;
}

export interface WorkshopStageSubmission {
  id: string;
  session_id: string;
  stage: WorkshopStage;
  content?: string;
  attachments?: string[];
  submitted_by?: string;
  submitted_at?: string;
  created_at: string;
}

export interface WorkshopActivity {
  id: string;
  session_id: string;
  user_id?: string;
  activity_type: ActivityType;
  activity_data?: Record<string, unknown>;
  created_at: string;
}

export interface WorkshopWithSession extends Workshop {
  sessions?: WorkshopSession[];
  upcoming_session?: WorkshopSession;
  user_participation?: WorkshopParticipant;
}

export interface CreateWorkshopInput {
  course_id: number;
  title: string;
  description: string;
  objectives?: string[];
  difficulty_level?: DifficultyLevel;
  duration_minutes?: number;
  min_participants?: number;
  max_participants?: number;
  points_reward?: number;
  setup_instructions?: string;
  setup_duration_minutes?: number;
  problem_statement: string;
  problem_duration_minutes?: number;
  solving_instructions?: string;
  solving_duration_minutes?: number;
  reporting_instructions?: string;
  reporting_duration_minutes?: number;
  materials?: WorkshopMaterial[];
  tools_required?: string[];
  prerequisites?: string[];
}

export interface UpdateWorkshopInput extends Partial<CreateWorkshopInput> {
  id: string;
  is_published?: boolean;
}

export interface CreateSessionInput {
  workshop_id: string;
  session_name?: string;
  scheduled_start: string;
  scheduled_end: string;
  facilitator_id?: string;
  max_participants?: number;
  is_open_enrollment?: boolean;
  meeting_link?: string;
  meeting_password?: string;
}

export interface UpdateSessionInput {
  id: string;
  session_name?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  meeting_link?: string;
  meeting_password?: string;
  status?: SessionStatus;
}

export interface JoinSessionInput {
  session_id: string;
  user_id: string;
  role?: ParticipantRole;
}

export interface UpdateStageInput {
  session_id: string;
  new_stage: WorkshopStage;
}

export interface SubmitStageInput {
  session_id: string;
  stage: WorkshopStage;
  content?: string;
  attachments?: string[];
  submitted_by: string;
}

export interface LogActivityInput {
  session_id: string;
  user_id?: string;
  activity_type: ActivityType;
  activity_data?: Record<string, unknown>;
}

export interface WorkshopStatistics {
  workshop_id: string;
  total_sessions: number;
  total_participants: number;
  completed_sessions: number;
  average_participants: number;
  average_contribution_score?: number;
}

export interface SessionParticipants {
  session_id: string;
  participants: WorkshopParticipant[];
  total_count: number;
  roles: Record<ParticipantRole, number>;
}
