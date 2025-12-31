/**
 * React Hook for RAG-powered AI Chat
 * Provides easy interface for components to use the RAG system
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RAGService, ChatMessage, RAGChatResponse } from '@/services/rag/RAGService';
import { useToast } from '@/hooks/use-toast';

export interface UseRAGChatOptions {
  audience?: 'primary' | 'secondary' | 'professional' | 'business';
  enable_rag?: boolean;
  onResponse?: (response: RAGChatResponse) => void;
}

export function useRAGChat(options: UseRAGChatOptions = {}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      // Add user message
      const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];

      setMessages(newMessages);
      setIsTyping(true);

      try {
        const response = await RAGService.chat({
          messages: newMessages,
          audience: options.audience,
          enable_rag: options.enable_rag,
        });

        // Add AI response
        const updatedMessages: ChatMessage[] = [
          ...newMessages,
          { role: 'assistant', content: response.response },
        ];

        setMessages(updatedMessages);
        setIsTyping(false);

        // Call callback if provided
        if (options.onResponse) {
          options.onResponse(response);
        }

        return response;
      } catch (_error) {
        setIsTyping(false);
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isTyping,
    sendMessage: sendMessage.mutate,
    sendMessageAsync: sendMessage.mutateAsync,
    isLoading: sendMessage.isPending,
    clearMessages,
  };
}

/**
 * Hook for generating embeddings (admin only)
 */
export function useGenerateEmbeddings() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: RAGService.generateEmbeddings,
    onSuccess: data => {
      toast({
        title: 'Success',
        description: `Generated ${data.processed} embeddings`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate embeddings',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for RAG analytics (admin only)
 */
export function useRAGAnalytics(options?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return useMutation({
    mutationFn: () => RAGService.getAnalytics(options),
  });
}
