/**
 * Lingo Types
 * Type definitions for AIBORGLingo user-facing features
 */

import type { LingoQuestionType, LingoSkillCategory } from './lingo-import-export.types';

// Re-export for convenience
export type { LingoQuestionType, LingoSkillCategory };

// Lesson with questions
export interface LingoLesson {
  id: string;
  lesson_id: string;
  title: string;
  skill: LingoSkillCategory;
  duration: string;
  xp_reward: number;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  question_count?: number;
}

// Question from database
export interface LingoQuestion {
  id: string;
  lesson_id: string;
  type: LingoQuestionType;
  prompt: string;
  sort_order: number;
  explanation?: string;
  // Multiple choice
  options?: string[];
  answer?: string;
  // Fill blank
  answers?: string[];
  // Matching
  pairs?: Array<{ left: string; right: string }>;
  // Ordering
  steps?: string[];
  // Free response
  ideal_answer?: string;
  rubric?: string;
  strictness?: number;
  pass_score?: number;
}

// User progress from lingo_user_progress table
export interface LingoUserProgress {
  id: string;
  user_id: string;
  xp_today: number;
  daily_goal: number;
  hearts: number;
  streak: number;
  total_xp: number;
  last_session_date: string;
  lesson_progress: Record<string, LessonProgress>;
  created_at: string;
  updated_at: string;
}

// Progress for a single lesson
export interface LessonProgress {
  completed: boolean;
  completed_at?: string;
  best_score: number;
  attempts: number;
  perfect: boolean;
}

// Answer result for a question
export interface AnswerResult {
  correct: boolean;
  score: number; // 0-1 for partial credit
  feedback?: string;
}

// Lesson stats after completion
export interface LessonStats {
  lesson_id: string;
  skill: LingoSkillCategory;
  questions_total: number;
  questions_correct: number;
  accuracy: number; // 0-100
  xp_earned: number;
  hearts_lost: number;
  time_spent_seconds: number;
  perfect: boolean;
}

// Analytics event types
export type LingoEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'question_answered'
  | 'xp_earned'
  | 'heart_lost'
  | 'streak_updated';

// Analytics event
export interface LingoAnalyticsEvent {
  user_id?: string;
  session_id?: string;
  lesson_id?: string;
  question_id?: string;
  event_type: LingoEventType;
  event_data?: Record<string, unknown>;
}

// Leaderboard entry for Lingo
export interface LingoLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_xp: number;
  streak: number;
  lessons_completed: number;
}

// Achievement progress for Lingo
export interface LingoAchievementProgress {
  achievement_id: string;
  name: string;
  description: string;
  icon_emoji: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number; // 0-1 for in-progress achievements
  target?: number;
  current?: number;
}

// Anonymous progress stored in localStorage
export interface LingoAnonymousProgress {
  session_id: string;
  xp_today: number;
  hearts: number;
  streak: number;
  total_xp: number;
  last_session_date: string;
  lesson_progress: Record<string, LessonProgress>;
  lessons_completed_count: number;
}

// State for the current lesson being played
export interface LingoLessonState {
  lesson: LingoLesson;
  questions: LingoQuestion[];
  current_question_index: number;
  answers: Record<string, AnswerResult>;
  hearts_remaining: number;
  start_time: number;
  completed: boolean;
}
