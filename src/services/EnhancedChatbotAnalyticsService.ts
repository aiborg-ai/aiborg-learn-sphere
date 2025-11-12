/**
 * Enhanced Chatbot Analytics Service
 * Handles session tracking, topic categorization, sentiment analysis, and feedback
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ChatbotSession,
  ChatbotTopic,
  ChatbotFeedback,
  ChatbotSessionAnalytics,
  ChatbotTopicAnalytics,
  ChatbotSentimentAnalytics,
  ChatbotFeedbackSummary,
} from '@/types';

export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

export interface SessionParams {
  userId?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  minDuration?: number;
  maxDuration?: number;
}

export interface TopicParams {
  parentTopicId?: string;
  includeChildren?: boolean;
}

export interface FeedbackParams {
  minRating?: number;
  maxRating?: number;
  feedbackType?: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
}

export class EnhancedChatbotAnalyticsService {
  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Create a new chatbot session
   */
  static async createSession(
    userId: string,
    deviceType?: 'mobile' | 'tablet' | 'desktop',
    userAgent?: string
  ): Promise<ChatbotSession> {
    const { data, error } = await supabase
      .from('chatbot_sessions')
      .insert({
        user_id: userId,
        device_type: deviceType,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update session with message and token counts
   */
  static async updateSession(
    sessionId: string,
    updates: {
      messageCount?: number;
      totalTokens?: number;
      totalCost?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('chatbot_sessions')
      .update({
        message_count: updates.messageCount,
        total_tokens: updates.totalTokens,
        total_cost: updates.totalCost,
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Close a session
   */
  static async closeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chatbot_sessions')
      .update({
        session_end: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Get user's active session or create new one
   */
  static async getOrCreateSession(
    userId: string,
    deviceType?: 'mobile' | 'tablet' | 'desktop',
    userAgent?: string
  ): Promise<ChatbotSession> {
    // Check for active session (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: activeSessions } = await supabase
      .from('chatbot_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('session_end', null)
      .gte('updated_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      return activeSessions[0];
    }

    // Create new session
    return this.createSession(userId, deviceType, userAgent);
  }

  /**
   * Get session analytics by date range
   */
  static async getSessionAnalytics(
    params: DateRangeParams = {}
  ): Promise<ChatbotSessionAnalytics[]> {
    let query = supabase.from('chatbot_session_analytics').select('*');

    if (params.startDate) {
      query = query.gte('date', params.startDate.toISOString().split('T')[0]);
    }

    if (params.endDate) {
      query = query.lte('date', params.endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user sessions with filters
   */
  static async getUserSessions(
    userId: string,
    params: SessionParams & DateRangeParams = {}
  ): Promise<ChatbotSession[]> {
    let query = supabase.from('chatbot_sessions').select('*').eq('user_id', userId);

    if (params.deviceType) {
      query = query.eq('device_type', params.deviceType);
    }

    if (params.minDuration) {
      query = query.gte('duration_seconds', params.minDuration);
    }

    if (params.maxDuration) {
      query = query.lte('duration_seconds', params.maxDuration);
    }

    if (params.startDate) {
      query = query.gte('session_start', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('session_start', params.endDate.toISOString());
    }

    const { data, error } = await query.order('session_start', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Close all inactive sessions
   */
  static async closeInactiveSessions(): Promise<number> {
    const { data, error } = await supabase.rpc('close_inactive_sessions');

    if (error) throw error;
    return data || 0;
  }

  // ============================================================================
  // Topic Management
  // ============================================================================

  /**
   * Get all topics
   */
  static async getTopics(params: TopicParams = {}): Promise<ChatbotTopic[]> {
    let query = supabase.from('chatbot_topics').select('*');

    if (params.parentTopicId !== undefined) {
      if (params.parentTopicId === null) {
        query = query.is('parent_topic_id', null);
      } else {
        query = query.eq('parent_topic_id', params.parentTopicId);
      }
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new topic
   */
  static async createTopic(topic: {
    name: string;
    description?: string;
    keywords?: string[];
    parentTopicId?: string;
    color?: string;
  }): Promise<ChatbotTopic> {
    const { data, error } = await supabase
      .from('chatbot_topics')
      .insert({
        name: topic.name,
        description: topic.description,
        keywords: topic.keywords,
        parent_topic_id: topic.parentTopicId,
        color: topic.color,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a topic
   */
  static async updateTopic(
    topicId: string,
    updates: Partial<Omit<ChatbotTopic, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ChatbotTopic> {
    const { data, error } = await supabase
      .from('chatbot_topics')
      .update(updates)
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a topic
   */
  static async deleteTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from('chatbot_topics').delete().eq('id', topicId);

    if (error) throw error;
  }

  /**
   * Auto-categorize a message
   */
  static async autoCategorizeMessage(messageText: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('auto_categorize_chatbot_message', {
      message_text: messageText,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get topic analytics
   */
  static async getTopicAnalytics(params: DateRangeParams = {}): Promise<ChatbotTopicAnalytics[]> {
    const { data, error } = await supabase
      .from('chatbot_topic_analytics')
      .select('*')
      .order('message_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Sentiment Analysis
  // ============================================================================

  /**
   * Get sentiment analytics by date range
   */
  static async getSentimentAnalytics(
    params: DateRangeParams = {}
  ): Promise<ChatbotSentimentAnalytics[]> {
    let query = supabase.from('chatbot_sentiment_analytics').select('*');

    if (params.startDate) {
      query = query.gte('date', params.startDate.toISOString().split('T')[0]);
    }

    if (params.endDate) {
      query = query.lte('date', params.endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update message sentiment
   */
  static async updateMessageSentiment(messageId: string, sentimentScore: number): Promise<void> {
    if (sentimentScore < -1 || sentimentScore > 1) {
      throw new Error('Sentiment score must be between -1 and 1');
    }

    const { error } = await supabase
      .from('chatbot_analytics')
      .update({ sentiment_score: sentimentScore })
      .eq('id', messageId);

    if (error) throw error;
  }

  /**
   * Analyze sentiment for text (basic implementation)
   * In production, this would call an external sentiment analysis API
   */
  static analyzeSentiment(text: string): number {
    // Simple keyword-based sentiment analysis
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'thanks',
      'helpful',
      'perfect',
      'love',
      'awesome',
      'amazing',
    ];
    const negativeWords = [
      'bad',
      'poor',
      'terrible',
      'useless',
      'hate',
      'awful',
      'wrong',
      'broken',
      'error',
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.2;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.2;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }

  // ============================================================================
  // Feedback Management
  // ============================================================================

  /**
   * Submit feedback for a message
   */
  static async submitMessageFeedback(feedback: {
    messageId?: string;
    sessionId?: string;
    userId: string;
    rating: number;
    feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
    comment?: string;
  }): Promise<ChatbotFeedback> {
    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!feedback.messageId && !feedback.sessionId) {
      throw new Error('Either messageId or sessionId must be provided');
    }

    const { data, error } = await supabase
      .from('chatbot_feedback')
      .insert({
        message_id: feedback.messageId,
        session_id: feedback.sessionId,
        user_id: feedback.userId,
        rating: feedback.rating,
        feedback_type: feedback.feedbackType,
        comment: feedback.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update feedback
   */
  static async updateFeedback(
    feedbackId: string,
    updates: {
      rating?: number;
      feedbackType?: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
      comment?: string;
    }
  ): Promise<ChatbotFeedback> {
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data, error } = await supabase
      .from('chatbot_feedback')
      .update({
        rating: updates.rating,
        feedback_type: updates.feedbackType,
        comment: updates.comment,
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get feedback for a message
   */
  static async getMessageFeedback(messageId: string): Promise<ChatbotFeedback[]> {
    const { data, error } = await supabase
      .from('chatbot_feedback')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get feedback for a session
   */
  static async getSessionFeedback(sessionId: string): Promise<ChatbotFeedback[]> {
    const { data, error } = await supabase
      .from('chatbot_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get feedback summary
   */
  static async getFeedbackSummary(params: DateRangeParams = {}): Promise<ChatbotFeedbackSummary[]> {
    let query = supabase.from('chatbot_feedback_summary').select('*');

    if (params.startDate) {
      query = query.gte('date', params.startDate.toISOString().split('T')[0]);
    }

    if (params.endDate) {
      query = query.lte('date', params.endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's feedback history
   */
  static async getUserFeedback(
    userId: string,
    params: FeedbackParams & DateRangeParams = {}
  ): Promise<ChatbotFeedback[]> {
    let query = supabase.from('chatbot_feedback').select('*').eq('user_id', userId);

    if (params.minRating) {
      query = query.gte('rating', params.minRating);
    }

    if (params.maxRating) {
      query = query.lte('rating', params.maxRating);
    }

    if (params.feedbackType) {
      query = query.eq('feedback_type', params.feedbackType);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // Combined Analytics
  // ============================================================================

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardData(params: DateRangeParams = {}) {
    const [sessions, topics, sentiment, feedback] = await Promise.all([
      this.getSessionAnalytics(params),
      this.getTopicAnalytics(params),
      this.getSentimentAnalytics(params),
      this.getFeedbackSummary(params),
    ]);

    return {
      sessions,
      topics,
      sentiment,
      feedback,
    };
  }

  /**
   * Get summary statistics
   */
  static async getSummaryStats(params: DateRangeParams = {}) {
    const dashboardData = await this.getDashboardData(params);

    const totalSessions = dashboardData.sessions.reduce((sum, day) => sum + day.total_sessions, 0);
    const totalMessages = dashboardData.sessions.reduce((sum, day) => sum + day.total_messages, 0);
    const totalCost = dashboardData.sessions.reduce((sum, day) => sum + day.total_cost, 0);
    const avgSentiment =
      dashboardData.sentiment.reduce((sum, day) => sum + day.avg_sentiment, 0) /
      (dashboardData.sentiment.length || 1);
    const avgRating =
      dashboardData.feedback.reduce((sum, day) => sum + day.avg_rating, 0) /
      (dashboardData.feedback.length || 1);

    return {
      totalSessions,
      totalMessages,
      totalCost,
      avgSentiment,
      avgRating,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
      topTopics: dashboardData.topics.slice(0, 5),
    };
  }
}
