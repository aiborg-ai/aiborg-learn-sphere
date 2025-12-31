import { useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useChatHistory } from '@/hooks/useChatHistory';
import { generateFallbackResponse } from '@/utils/chatbotFallback';
import { logger } from '@/utils/logger';
import { OllamaModelSelector } from '@/components/features/OllamaModelSelector';
import { AIContentService } from '@/services/ai/AIContentService';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Phone,
  History,
  Download,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Database,
  Maximize,
  Minimize,
} from '@/components/ui/icons';
import { KBSourceCitations } from '@/components/chatbot/KBSourceCitations';

// Import custom hooks and types
import {
  useChatbotState,
  useChatbotConversation,
  useChatbotAI,
  useChatbotRatings,
} from './AIChatbot/hooks';

// Course data now comes from database via useCourses() hook in useChatbotConversation
// No more hardcoded course arrays!

export function AIChatbot() {
  const { selectedAudience, getPersonalizedContent } = usePersonalization();
  const {
    currentConversation,
    conversationHistory,
    startNewConversation,
    addMessage,
    loadConversation,
    deleteConversation,
    exportConversations,
  } = useChatHistory();

  // Custom hooks for state management
  const { state, actions } = useChatbotState();
  const { messageMetadata, generateAIResponse } = useChatbotAI();
  const { messageRatings, handleRating } = useChatbotRatings();
  const {
    conversationContext,
    updateConversationContext,
    getCourseRecommendations,
    getPriceRange,
    detectUserExperience,
    detectUserRole,
    getContextualFollowUp,
    getQuickSuggestions,
  } = useChatbotConversation(selectedAudience);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages from current conversation
  const messages = useMemo(
    () => currentConversation?.messages || [],
    [currentConversation?.messages]
  );

  // Initialize conversation when chatbot opens
  useEffect(() => {
    if (state.isOpen && !currentConversation) {
      startNewConversation(selectedAudience).then(async _conversation => {
        // Get welcome message from database
        const welcomeContent = await AIContentService.getPersonalizedContent(
          'chatbot_welcome',
          selectedAudience as 'primary' | 'secondary' | 'professional' | 'business' | 'default'
        );

        // Fallback to personalization context if database content not available
        const finalWelcomeContent =
          welcomeContent ||
          getPersonalizedContent({
            primary:
              "Hi there! I'm aiborg chat! 🤖 I'm super excited to help you learn about AI in fun ways! What's your name, and do you like playing games or building things?",
            secondary:
              "Hey! I'm aiborg chat, your AI learning companion! 🚀 I can help you discover awesome AI courses that'll boost your grades and prepare you for the future. What subjects are you most interested in?",
            professional:
              "Hello! I'm aiborg chat, your professional AI learning assistant. I can help you find courses that will enhance your career and provide practical AI skills for your workplace. What's your current role, and what would you like to achieve with AI?",
            business:
              "Welcome! I'm aiborg chat, your strategic AI learning advisor. I help executives and business leaders understand AI implementation, ROI, and organizational transformation. What are your primary business objectives with AI?",
            default:
              "Hello! I'm aiborg chat, your AI learning assistant. I can help you find the perfect course and answer questions about our programs. What would you like to learn about AI?",
          });

        addMessage({
          content: finalWelcomeContent,
          sender: 'ai',
          type: 'text',
        });
      });
    }
  }, [
    state.isOpen,
    currentConversation,
    selectedAudience,
    startNewConversation,
    addMessage,
    getPersonalizedContent,
  ]);

  // ESC key handler to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isFullscreen) {
        actions.setIsFullscreen(false);
      }
    };

    if (state.isOpen && state.isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [state.isOpen, state.isFullscreen, actions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message to conversation history
    addMessage({
      content,
      sender: 'user',
    });

    actions.resetInput();
    actions.setIsTyping(true);

    try {
      // Get course recommendations for AI context
      const coursesData = getCourseRecommendations;

      // Get AI response with metadata using custom hook
      const {
        response: aiResponse,
        metadata,
        messageId,
      } = await generateAIResponse({
        userMessage: content,
        messages,
        coursesData,
        selectedAudience,
        useOllama: state.useOllama,
        selectedOllamaModel: state.selectedOllamaModel,
        onShowWhatsApp: () => actions.setShowWhatsApp(true),
      });

      // Simulate realistic typing delay based on response length
      const typingDelay = Math.min(1000 + aiResponse.length / 10, 3000);

      setTimeout(() => {
        addMessage({
          content: aiResponse,
          sender: 'ai',
          type: 'text',
          metadata: { messageId, ...metadata }, // Store messageId with message for ratings
        });
        actions.setIsTyping(false);
      }, typingDelay);
    } catch (error) {
      logger.error('Error sending message:', error);
      actions.setIsTyping(false);

      // Use sophisticated fallback
      const fallback = generateFallbackResponse(
        content,
        selectedAudience,
        getCourseRecommendations
      );

      addMessage({
        content: fallback.message,
        sender: 'ai',
        type: 'text',
      });

      if (fallback.showWhatsApp) {
        actions.setShowWhatsApp(true);
      }
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleMessageRating = (messageId: string, rating: 'positive' | 'negative') => {
    handleRating(messageId, rating, {
      conversationId: currentConversation?.id,
      sessionId: currentConversation?.sessionId,
      selectedAudience,
      messages,
      messageMetadata,
    });
  };

  // Render model indicator badge
  const renderModelBadge = (metadata?: MessageMetadata) => {
    if (!metadata) return null;

    if (metadata.cache_hit) {
      const cacheIcon =
        metadata.cache_source === 'memory' ? (
          <Zap className="h-3 w-3" />
        ) : (
          <Database className="h-3 w-3" />
        );
      const cacheLabel =
        metadata.cache_source === 'memory'
          ? 'Cache (Memory)'
          : metadata.cache_source === 'database-exact'
            ? 'Cache (Exact)'
            : metadata.cache_source === 'database-fuzzy'
              ? 'Cache (Similar)'
              : 'Cached';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                {cacheIcon}
                {cacheLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Instant response from cache - $0 cost!</p>
              <p className="text-xs opacity-70">{metadata.response_time_ms}ms</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Ollama models (local)
    if (
      metadata.model?.includes(':') ||
      metadata.model?.includes('llama') ||
      metadata.model?.includes('qwen') ||
      metadata.model?.includes('deepseek')
    ) {
      const modelName = metadata.model?.split(':')[0] || metadata.model;
      const getOllamaIcon = () => {
        if (modelName?.includes('llama')) return '🦙';
        if (modelName?.includes('qwen')) return '🌟';
        if (modelName?.includes('deepseek')) return '🔍';
        return '🤖';
      };

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              >
                <span className="text-sm">{getOllamaIcon()}</span>
                {modelName}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Local Ollama Model - Free!</p>
              <p className="text-xs opacity-70">{metadata.response_time_ms}ms</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (metadata.model === 'gpt-4-turbo-preview') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              >
                <Brain className="h-3 w-3" />
                GPT-4
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Advanced AI for complex questions</p>
              <p className="text-xs opacity-70">
                Cost: ${metadata.cost?.usd.toFixed(4)} • {metadata.response_time_ms}ms
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (metadata.model === 'gpt-3.5-turbo') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                <Zap className="h-3 w-3" />
                GPT-3.5
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fast AI for standard questions</p>
              <p className="text-xs opacity-70">
                Cost: ${metadata.cost?.usd.toFixed(4)} • {metadata.response_time_ms}ms
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  if (!state.isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => actions.setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-ai ai-glow bg-gradient-ai hover:scale-110 transition-all duration-300"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Floating notification */}
        <div className="absolute -top-12 -left-20 bg-card border rounded-lg px-3 py-2 shadow-lg animate-bounce">
          <p className="text-sm font-medium">Ask me anything!</p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        state.isFullscreen
          ? 'inset-0 w-screen h-screen'
          : 'bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)]'
      }`}
    >
      <Card
        className={`${state.isFullscreen ? 'h-screen rounded-none' : 'h-[600px]'} flex flex-col shadow-2xl border-primary/20`}
      >
        {/* Header */}
        <div className="flex flex-col border-b bg-gradient-primary rounded-t-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarFallback className="bg-white/10 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">aiborg chat</h3>
                <p className="text-xs text-white/80">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Conversation History Dropdown */}
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.toggleHistory}
                className="text-white hover:bg-white/10"
                title="Conversation History"
              >
                <History className="h-4 w-4" />
              </Button>
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.toggleFullscreen}
                className="text-white hover:bg-white/10"
                title={state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {state.isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setIsOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <OllamaModelSelector
              selectedModel={state.selectedOllamaModel}
              onModelChange={actions.setSelectedOllamaModel}
              compact={!state.isFullscreen}
              className="flex-1"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={state.useOllama ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => actions.setUseOllama(!state.useOllama)}
                    className={`h-8 px-2 text-xs ${state.useOllama ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
                  >
                    {state.useOllama ? '🦙 Local' : '☁️ Cloud'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{state.useOllama ? 'Using local Ollama (Free)' : 'Using cloud API (Paid)'}</p>
                  <p className="text-xs opacity-70">Click to switch</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Conversation History Panel */}
        {state.showHistory && (
          <div className="border-b bg-muted/50 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Conversation History</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportConversations}
                    className="h-7 px-2"
                    title="Export conversations"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startNewConversation(selectedAudience)}
                    className="h-7 px-2 text-xs"
                  >
                    New Chat
                  </Button>
                </div>
              </div>

              {conversationHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No previous conversations
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {conversationHistory.slice(0, 5).map(conv => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                    >
                      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                      <div
                        className="flex-1"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          loadConversation(conv.id);
                          actions.setShowHistory(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            loadConversation(conv.id);
                            actions.setShowHistory(false);
                          }
                        }}
                      >
                        <p className="text-xs font-medium">
                          {conv.startedAt.toLocaleDateString()} • {conv.messages.length} messages
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.messages[conv.messages.length - 1]?.content.substring(0, 40)}...
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => {
            const messageId = message.metadata?.messageId || message.id;
            const metadata = messageMetadata[messageId];
            const rating = messageRatings[messageId];

            return (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-ai text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-xs opacity-70 ${
                            message.sender === 'user' ? 'text-white' : 'text-primary'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {message.sender === 'ai' && renderModelBadge(metadata)}
                      </div>
                    </div>

                    {/* Rating buttons for AI messages */}
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-1 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${rating?.rating === 'positive' ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'}`}
                          onClick={() => handleMessageRating(messageId, 'positive')}
                          title="Good response"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${rating?.rating === 'negative' ? 'text-red-600' : 'text-muted-foreground hover:text-red-600'}`}
                          onClick={() => handleMessageRating(messageId, 'negative')}
                          title="Bad response"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* KB Source Citations */}
                    {message.sender === 'ai' &&
                      metadata?.sources &&
                      metadata.sources.length > 0 && (
                        <div className="px-2 max-w-md">
                          <KBSourceCitations sources={metadata.sources} compact />
                        </div>
                      )}
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            );
          })}

          {/* Enhanced loading skeleton */}
          {state.isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-ai text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="chat-bubble-ai relative overflow-hidden">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                  {/* Content placeholder */}
                  <div className="space-y-2">
                    <div className="h-3 bg-primary/20 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-primary/20 rounded w-24 animate-pulse delay-75"></div>
                  </div>

                  {/* Typing dots */}
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-1">
              {getQuickSuggestions()
                .slice(0, 3)
                .map((suggestion: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* WhatsApp Contact */}
        {state.showWhatsApp && (
          <div className="p-4 border-t bg-green-50 dark:bg-green-900/20">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-700 dark:text-green-400">
                  Connect on WhatsApp
                </h4>
              </div>

              <p className="text-sm text-green-600 dark:text-green-300">
                Get instant support from our team!
              </p>

              <div className="flex items-center justify-center gap-4">
                {/* WhatsApp Direct Link */}
                <Button
                  onClick={() =>
                    window.open(
                      'https://wa.me/447404568207?text=Hi! I need help with AI courses',
                      '_blank'
                    )
                  }
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Chat Now
                </Button>

                {/* QR Code for Group */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border">
                    <picture>
                      <source
                        srcSet="/lovable-uploads/062b8b8d-3c09-41cf-92a4-d274f73d56d7.webp"
                        type="image/webp"
                      />
                      <img
                        src="/lovable-uploads/062b8b8d-3c09-41cf-92a4-d274f73d56d7.png"
                        alt="WhatsApp QR Code"
                        className="h-16 w-16 object-contain"
                      />
                    </picture>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Scan to join group</p>
                </div>
              </div>

              <p className="text-xs text-green-600 dark:text-green-400">
                +44 7404568207 • Available 9 AM - 6 PM GMT
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setShowWhatsApp(false)}
                className="text-green-600 hover:text-green-700"
              >
                Back to Chat
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={state.inputValue}
              onChange={e => actions.setInputValue(e.target.value)}
              placeholder="Ask about courses, pricing, or anything..."
              onKeyPress={e => e.key === 'Enter' && sendMessage(state.inputValue)}
              className="flex-1"
            />
            <Button
              onClick={() => actions.setShowWhatsApp(!state.showWhatsApp)}
              variant="outline"
              className="px-3 text-green-600 border-green-200 hover:bg-green-50"
              title="WhatsApp Support"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => sendMessage(state.inputValue)}
              disabled={!state.inputValue.trim() || state.isTyping}
              className="px-3 bg-gradient-primary hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by AI • Instant responses • Human support available
          </p>
        </div>
      </Card>
    </div>
  );
}
