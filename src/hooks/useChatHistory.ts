/**
 * useChatHistory Hook
 * Manages conversation history with persistence to both database and localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'course_recommendation';
}

export interface Conversation {
  id: string;
  sessionId: string;
  userId?: string;
  audience: string;
  messages: ChatMessage[];
  startedAt: Date;
  updatedAt: Date;
  totalTokens?: number;
  totalCost?: number;
}

const STORAGE_KEY = 'aiborg_chat_history';
const MAX_STORED_CONVERSATIONS = 10;

export function useChatHistory() {
  const { user } = useAuth();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }, []);

  // Load conversations from localStorage
  const loadFromLocalStorage = useCallback((): Conversation[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          startedAt: string;
          updatedAt: string;
          messages: Array<{ timestamp: string }>;
        }>;
        // Convert date strings back to Date objects
        return parsed.map(conv => ({
          ...conv,
          startedAt: new Date(conv.startedAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
    } catch (error) {
      logger.error('Failed to load chat history from localStorage:', error);
    }
    return [];
  }, []);

  // Save conversations to localStorage
  const saveToLocalStorage = useCallback((conversations: Conversation[]) => {
    try {
      // Keep only the most recent conversations
      const limited = conversations.slice(0, MAX_STORED_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      logger.error('Failed to save chat history to localStorage:', error);
    }
  }, []);

  // Load conversations from database (for logged-in users)
  const loadFromDatabase = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: conversations, error } = await supabase
        .from('chatbot_conversations')
        .select(
          `
          id,
          session_id,
          user_id,
          audience,
          started_at,
          updated_at,
          total_tokens,
          total_cost_usd
        `
        )
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(MAX_STORED_CONVERSATIONS);

      if (error) throw error;

      // Load messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversations || []).map(async conv => {
          const { data: messages } = await supabase
            .from('chatbot_messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          return {
            id: conv.id,
            sessionId: conv.session_id,
            userId: conv.user_id,
            audience: conv.audience,
            startedAt: new Date(conv.started_at),
            updatedAt: new Date(conv.updated_at),
            totalTokens: conv.total_tokens,
            totalCost: conv.total_cost_usd,
            messages:
              messages?.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.role === 'user' ? ('user' as const) : ('ai' as const),
                timestamp: new Date(msg.created_at),
              })) || [],
          };
        })
      );

      return conversationsWithMessages;
    } catch (error) {
      logger.error('Failed to load chat history from database:', error);
      return [];
    }
  }, [user?.id]);

  // Initialize: Load conversations on mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      // Load from localStorage first (immediate)
      const localConversations = loadFromLocalStorage();
      setConversationHistory(localConversations);

      // Load from database if user is logged in (async)
      if (user?.id) {
        const dbConversations = await loadFromDatabase();
        if (dbConversations.length > 0) {
          setConversationHistory(dbConversations);
          // Sync to localStorage
          saveToLocalStorage(dbConversations);
        }
      }

      setIsLoading(false);
    };

    initialize();
  }, [user?.id, loadFromLocalStorage, loadFromDatabase, saveToLocalStorage]);

  // Start a new conversation
  const startNewConversation = useCallback(
    async (audience: string): Promise<Conversation> => {
      const sessionId = generateSessionId();
      const newConversation: Conversation = {
        id: '', // Will be set after DB insert
        sessionId,
        userId: user?.id,
        audience,
        messages: [],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database if user is logged in
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('chatbot_conversations')
            .insert({
              session_id: sessionId,
              user_id: user.id,
              audience,
            })
            .select()
            .single();

          if (error) throw error;
          newConversation.id = data.id;
        } catch (error) {
          logger.error('Failed to create conversation in database:', error);
          // Continue with local-only conversation
          newConversation.id = sessionId;
        }
      } else {
        newConversation.id = sessionId;
      }

      setCurrentConversation(newConversation);

      // Add to history
      const updatedHistory = [newConversation, ...conversationHistory];
      setConversationHistory(updatedHistory);
      saveToLocalStorage(updatedHistory);

      return newConversation;
    },
    [user?.id, generateSessionId, conversationHistory, saveToLocalStorage]
  );

  // Add message to current conversation
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      if (!currentConversation) return;

      const newMessage: ChatMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date(),
      };

      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, newMessage],
        updatedAt: new Date(),
      };

      setCurrentConversation(updatedConversation);

      // Update in history
      const updatedHistory = conversationHistory.map(conv =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      setConversationHistory(updatedHistory);
      saveToLocalStorage(updatedHistory);
    },
    [currentConversation, conversationHistory, saveToLocalStorage]
  );

  // Load a previous conversation
  const loadConversation = useCallback(
    (conversationId: string) => {
      const conversation = conversationHistory.find(conv => conv.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    },
    [conversationHistory]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      // Delete from database if user is logged in
      if (user?.id) {
        try {
          await supabase.from('chatbot_conversations').delete().eq('id', conversationId);
        } catch (error) {
          logger.error('Failed to delete conversation from database:', error);
        }
      }

      // Remove from local state
      const updatedHistory = conversationHistory.filter(conv => conv.id !== conversationId);
      setConversationHistory(updatedHistory);
      saveToLocalStorage(updatedHistory);

      // Clear current if it was deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    },
    [user?.id, conversationHistory, currentConversation, saveToLocalStorage]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(async () => {
    // Delete from database if user is logged in
    if (user?.id) {
      try {
        await supabase.from('chatbot_conversations').delete().eq('user_id', user.id);
      } catch (error) {
        logger.error('Failed to clear conversations from database:', error);
      }
    }

    // Clear local state
    setConversationHistory([]);
    setCurrentConversation(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [user?.id]);

  // Export conversations as JSON
  const exportConversations = useCallback(() => {
    const dataStr = JSON.stringify(conversationHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aiborg-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [conversationHistory]);

  return {
    currentConversation,
    conversationHistory,
    isLoading,
    startNewConversation,
    addMessage,
    loadConversation,
    deleteConversation,
    clearAllConversations,
    exportConversations,
  };
}
