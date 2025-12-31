/**
 * Shared Types for AIChatbot
 */

import { KBSource } from '@/components/chatbot/KBSourceCitations';

export interface ConversationContext {
  askedAboutExperience: boolean;
  askedAboutGoals: boolean;
  userExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  userRole?: string;
  userGoals?: string[];
  recommendedCourses?: string[];
  lastTopic?: string;
  followUpQuestions: string[];
}

export interface MessageMetadata {
  model?: string;
  cost?: { usd: number };
  cache_hit?: boolean;
  cache_source?: 'memory' | 'database-exact' | 'database-fuzzy';
  response_time_ms?: number;
  sources?: KBSource[];
  sources_used?: number;
}

export interface MessageRating {
  messageId: string;
  rating: 'positive' | 'negative';
  feedback?: string;
}

export const initialConversationContext: ConversationContext = {
  askedAboutExperience: false,
  askedAboutGoals: false,
  followUpQuestions: [],
};
