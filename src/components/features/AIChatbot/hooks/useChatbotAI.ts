/**
 * Chatbot AI Hook
 *
 * Manages AI response generation using Ollama (local) or cloud API with RAG.
 * Handles model selection, fallback logic, and response metadata tracking.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { OllamaService } from '@/services/ai/OllamaService';
import { AIContentService } from '@/services/ai/AIContentService';
import { generateFallbackResponse } from '@/utils/chatbotFallback';
import { KBSource } from '@/components/chatbot/KBSourceCitations';
import type { MessageMetadata } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
}

interface Course {
  title: string;
  price: string;
  duration: string;
  level?: string;
}

interface GenerateResponseParams {
  userMessage: string;
  messages: Message[];
  coursesData: Course[];
  selectedAudience: string;
  useOllama: boolean;
  selectedOllamaModel: string;
  onShowWhatsApp?: () => void;
}

interface GenerateResponseResult {
  response: string;
  metadata: MessageMetadata;
  messageId: string;
}

export function useChatbotAI() {
  const [messageMetadata, setMessageMetadata] = useState<Record<string, MessageMetadata>>({});

  const generateAIResponse = async (
    params: GenerateResponseParams
  ): Promise<GenerateResponseResult> => {
    const {
      userMessage,
      messages,
      coursesData,
      selectedAudience,
      useOllama,
      selectedOllamaModel,
      onShowWhatsApp,
    } = params;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Try Ollama first if enabled
    if (useOllama) {
      try {
        const isHealthy = await OllamaService.checkHealth();

        if (isHealthy) {
          const result = await generateOllamaResponse({
            userMessage,
            messages,
            coursesData,
            selectedAudience,
            selectedOllamaModel,
            messageId,
            startTime,
          });

          setMessageMetadata(prev => ({
            ...prev,
            [messageId]: result.metadata,
          }));

          return result;
        }
      } catch (error) {
        logger.warn('Ollama failed, falling back to cloud API:', error);
      }
    }

    // Fallback to cloud API with RAG
    try {
      const result = await generateCloudRAGResponse({
        userMessage,
        messages,
        selectedAudience,
        messageId,
        startTime,
      });

      setMessageMetadata(prev => ({
        ...prev,
        [messageId]: result.metadata,
      }));

      return result;
    } catch (error) {
      logger.error('Error generating AI response:', error);

      // Use sophisticated fallback system
      const result = generateFallbackResponseWithMetadata({
        userMessage,
        selectedAudience,
        coursesData,
        messageId,
        startTime,
        onShowWhatsApp,
      });

      setMessageMetadata(prev => ({
        ...prev,
        [messageId]: result.metadata,
      }));

      return result;
    }
  };

  return {
    messageMetadata,
    generateAIResponse,
  };
}

// Helper: Generate Ollama response
async function generateOllamaResponse(params: {
  userMessage: string;
  messages: Message[];
  coursesData: Course[];
  selectedAudience: string;
  selectedOllamaModel: string;
  messageId: string;
  startTime: number;
}): Promise<GenerateResponseResult> {
  const {
    userMessage,
    messages,
    coursesData,
    selectedAudience,
    selectedOllamaModel,
    messageId,
    startTime,
  } = params;

  // Get tone modifier based on audience
  const toneModifier =
    selectedAudience === 'primary'
      ? 'use simple language with fun emojis 🎮🌟'
      : selectedAudience === 'secondary'
        ? 'be relatable and encouraging'
        : selectedAudience === 'business'
          ? 'be professional and focus on ROI/business value'
          : 'be professional and helpful';

  // Format courses list for prompt
  const coursesList =
    coursesData.length > 0
      ? coursesData.map(c => `- ${c.title} (${c.price}, ${c.duration}, ${c.level})`).join('\n')
      : 'No courses currently available for this audience. Please check our website for updates.';

  // Get system prompt from database with filled variables
  const systemPrompt =
    (await AIContentService.getFilledSystemPrompt(
      'chatbot_main',
      {
        tone_modifier: toneModifier,
        audience: selectedAudience || 'all audiences',
        courses_list: coursesList,
      },
      selectedAudience
    )) ||
    `You are aiborg chat, a friendly and helpful AI learning assistant. Available courses: ${coursesList}`;

  // Build conversation history
  const conversationMessages = messages.slice(-6).map(msg => ({
    role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
    content: msg.content,
  }));

  const ollamaMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationMessages,
    { role: 'user' as const, content: userMessage },
  ];

  const response = await OllamaService.chat(ollamaMessages, {
    model: selectedOllamaModel,
    temperature: 0.7,
    maxTokens: 512,
  });

  const responseTime = Date.now() - startTime;

  const metadata: MessageMetadata = {
    model: selectedOllamaModel,
    cost: { usd: 0 }, // Ollama is free!
    cache_hit: false,
    response_time_ms: responseTime,
  };

  logger.log('Ollama response generated successfully', {
    model: selectedOllamaModel,
    response_time: responseTime,
    eval_count: response.eval_count,
  });

  return { response: response.message.content, metadata, messageId };
}

// Helper: Generate cloud RAG response
async function generateCloudRAGResponse(params: {
  userMessage: string;
  messages: Message[];
  selectedAudience: string;
  messageId: string;
  startTime: number;
}): Promise<GenerateResponseResult> {
  const { userMessage, messages, selectedAudience, messageId, startTime } = params;

  // Build conversation history for RAG
  const conversationMessages = messages.slice(-6).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  conversationMessages.push({
    role: 'user',
    content: userMessage,
  });

  const { data, error } = await supabase.functions.invoke('ai-chat-rag', {
    body: {
      messages: conversationMessages,
      audience: selectedAudience,
      enable_rag: true, // Enable RAG for KB search
      include_user_context: true, // Include user personalization
    },
  });

  if (error) throw error;

  const responseTime = Date.now() - startTime;

  if (data && data.response) {
    // Map sources to include slug for KB articles
    const kbSources: KBSource[] = (data.sources || []).map((source: any) => ({
      type: source.type,
      title: source.title,
      similarity: source.similarity,
      content_id: source.content_id,
      slug: source.slug,
      metadata: source.metadata,
    }));

    const metadata: MessageMetadata = {
      model: data.model || 'gpt-4-turbo-preview',
      cost: data.cost || { usd: 0 },
      cache_hit: false,
      response_time_ms: responseTime,
      sources: kbSources,
      sources_used: kbSources.length,
    };

    logger.log('RAG AI response generated successfully', {
      tokens: data.usage?.total_tokens,
      sources_used: kbSources.length,
      kb_articles: kbSources.filter(s => s.type === 'knowledge_base').length,
      response_time: responseTime,
    });

    return { response: data.response, metadata, messageId };
  }

  throw new Error('No response from cloud AI');
}

// Helper: Generate fallback response
function generateFallbackResponseWithMetadata(params: {
  userMessage: string;
  selectedAudience: string;
  coursesData: Course[];
  messageId: string;
  startTime: number;
  onShowWhatsApp?: () => void;
}): GenerateResponseResult {
  const { userMessage, selectedAudience, coursesData, messageId, startTime, onShowWhatsApp } =
    params;

  const fallback = generateFallbackResponse(userMessage, selectedAudience, coursesData as any);

  if (fallback.showWhatsApp && onShowWhatsApp) {
    onShowWhatsApp();
  }

  const responseTime = Date.now() - startTime;
  const metadata: MessageMetadata = {
    model: 'fallback',
    cost: { usd: 0 },
    cache_hit: false,
    response_time_ms: responseTime,
  };

  return { response: fallback.message, metadata, messageId };
}
