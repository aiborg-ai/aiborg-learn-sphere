/**
 * Chatbot Ratings Hook
 *
 * Manages message ratings and feedback for chatbot responses.
 * Handles both local state (for immediate UI feedback) and database persistence.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { MessageRating, MessageMetadata } from '../types';

interface Message {
  id: string;
  content: string;
  metadata?: {
    messageId?: string;
    [key: string]: any;
  };
}

interface RatingData {
  conversationId?: string;
  sessionId?: string;
  selectedAudience: string;
  messages: Message[];
  messageMetadata: Record<string, MessageMetadata>;
}

export function useChatbotRatings() {
  const [messageRatings, setMessageRatings] = useState<Record<string, MessageRating>>({});

  const handleRating = async (
    messageId: string,
    rating: 'positive' | 'negative',
    data: RatingData
  ) => {
    // Update local state immediately for UI feedback
    setMessageRatings(prev => ({
      ...prev,
      [messageId]: { messageId, rating },
    }));

    // Get metadata and message for this rating
    const metadata = data.messageMetadata[messageId];
    const message = data.messages.find(
      m => m.metadata?.messageId === messageId || m.id === messageId
    );
    const userMessage = data.messages[data.messages.indexOf(message!) - 1]; // Get the user's question

    // Log rating for analytics
    logger.log('Message rated', {
      messageId,
      rating,
      model: metadata?.model,
      cache_hit: metadata?.cache_hit,
      response_time: metadata?.response_time_ms,
    });

    // Persist rating to database
    try {
      // Get current user ID (if authenticated)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('chatbot_ratings').insert({
        conversation_id: data.conversationId,
        message_id: messageId,
        user_id: user?.id || null,
        session_id: data.sessionId,
        rating,
        model: metadata?.model,
        cache_hit: metadata?.cache_hit || false,
        cache_source: metadata?.cache_source,
        response_time_ms: metadata?.response_time_ms,
        cost_usd: metadata?.cost?.usd,
        query_type: undefined, // TODO: Extract from message metadata if available
        audience: data.selectedAudience,
        user_query: userMessage?.content,
        ai_response_length: message?.content.length,
      });

      if (error) {
        logger.error('Failed to save rating to database:', error);
      } else {
        logger.log('Rating saved to database successfully');
      }
    } catch (error) {
      logger.error('Error saving rating:', error);
      // Don't show error to user - rating was saved locally
    }
  };

  return {
    messageRatings,
    handleRating,
  };
}
