/**
 * AI Tutor Component (RAG-Powered)
 *
 * An intelligent AI tutor that uses Retrieval Augmented Generation (RAG)
 * to provide accurate, citation-backed answers about courses and content.
 *
 * Features:
 * - Semantic search for relevant content
 * - Citation system with source references
 * - Performance metrics display
 * - Feedback collection
 * - Multi-audience personalization
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useChatHistory } from '@/hooks/useChatHistory';
import { RAGService, type RAGChatResponse, type ChatMessage } from '@/services/rag/RAGService';
import { logger } from '@/utils/logger';
import {
  Send,
  X,
  User,
  History,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Database,
  Maximize,
  Minimize,
  BookOpen,
  FileText,
  HelpCircle,
  Zap,
  Route,
} from '@/components/ui/icons';

interface TutorMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: {
    type: string;
    title: string;
    similarity: number;
  }[];
  performance?: {
    search_ms: number;
    total_ms: number;
  };
  analyticsId?: string;
}

interface MessageRating {
  messageId: string;
  rating: 'positive' | 'negative';
}

const sourceTypeIcons: Record<string, React.ElementType> = {
  course: BookOpen,
  blog_post: FileText,
  faq: HelpCircle,
  learning_path: Route,
  flashcard: Brain,
};

export function AITutor() {
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

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [messageRatings, setMessageRatings] = useState<Record<string, MessageRating>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeContent = getPersonalizedContent({
        primary:
          "Hi there! I'm your AI Tutor! 🎓 I can help you learn about AI by finding exactly what you need from our courses and materials. Ask me anything!",
        secondary:
          "Hey! I'm your AI Tutor! 🚀 I use advanced search to find the best learning resources for you. Ask me about courses, concepts, or career paths!",
        professional:
          "Hello! I'm your AI Tutor, powered by RAG technology. I can find precise answers from our knowledge base and cite my sources. What would you like to learn?",
        business:
          "Welcome! I'm your AI Tutor with enterprise-grade RAG capabilities. I provide accurate, source-cited answers about AI strategy and implementation. How can I assist?",
        default:
          "Hello! I'm your AI Tutor. I use semantic search to find the best answers from our courses, blogs, and FAQs. What would you like to know?",
      });

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          content: welcomeContent,
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, getPersonalizedContent]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isOpen && isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isFullscreen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessageId = `user-${Date.now()}`;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date(),
      },
    ]);

    setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory: ChatMessage[] = messages
        .filter(m => m.sender !== 'ai' || !m.id.startsWith('welcome'))
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      // Add current message
      conversationHistory.push({ role: 'user', content });

      // Call RAG service
      const response: RAGChatResponse = await RAGService.chat({
        messages: conversationHistory,
        audience: selectedAudience,
        enable_rag: true,
      });

      const aiMessageId = `ai-${Date.now()}`;

      // Add AI response with sources
      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          content: response.response,
          sender: 'ai',
          timestamp: new Date(),
          sources: response.sources,
          performance: response.performance,
        },
      ]);

      logger.log('RAG response received', {
        sources_used: response.sources_used,
        search_ms: response.performance.search_ms,
        total_ms: response.performance.total_ms,
      });
    } catch (error) {
      logger.error('Error getting RAG response:', error);

      // Fallback response
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content:
            "I'm having trouble accessing my knowledge base right now. Please try again, or contact us on WhatsApp: +44 7404568207 for immediate help.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRating = async (messageId: string, rating: 'positive' | 'negative') => {
    setMessageRatings(prev => ({
      ...prev,
      [messageId]: { messageId, rating },
    }));

    // Find the message to get analyticsId
    const message = messages.find(m => m.id === messageId);
    if (message?.analyticsId) {
      try {
        await RAGService.submitFeedback(message.analyticsId, rating === 'positive');
        logger.log('Feedback submitted', { messageId, rating });
      } catch (error) {
        logger.error('Error submitting feedback:', error);
      }
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getQuickSuggestions = () => {
    return getPersonalizedContent({
      primary: [
        'What fun AI courses can I take?',
        'How does AI learn?',
        'What projects will I build?',
      ],
      secondary: [
        'Which courses help with college apps?',
        'What programming will I learn?',
        'How long are the courses?',
      ],
      professional: [
        'What courses improve my career?',
        'What certifications do you offer?',
        'How is AI used in my industry?',
      ],
      business: [
        "What's the ROI on AI training?",
        'How do I build an AI strategy?',
        'What are best practices for AI adoption?',
      ],
      default: [
        'What courses are best for beginners?',
        'How much do courses cost?',
        'What topics do you cover?',
      ],
    });
  };

  // Render source badge
  const renderSourceBadge = (source: { type: string; title: string; similarity: number }) => {
    const Icon = sourceTypeIcons[source.type] || FileText;

    return (
      <TooltipProvider key={`${source.type}-${source.title}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs gap-1 cursor-help">
              <Icon className="h-3 w-3" />
              {source.title.length > 20 ? `${source.title.substring(0, 20)}...` : source.title}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{source.title}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {source.type.replace('_', ' ')} • {(source.similarity * 100).toFixed(0)}% match
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-ai ai-glow bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-110 transition-all duration-300"
        >
          <Brain className="h-6 w-6" />
        </Button>

        <div className="absolute -top-12 -left-24 bg-card border rounded-lg px-3 py-2 shadow-lg animate-bounce">
          <p className="text-sm font-medium">AI Tutor (RAG)</p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isFullscreen
          ? 'inset-0 w-screen h-screen'
          : 'bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)]'
      }`}
    >
      <Card
        className={`${isFullscreen ? 'h-screen rounded-none' : 'h-[600px]'} flex flex-col shadow-2xl border-purple-500/20`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  <Brain className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Tutor</h3>
              <p className="text-xs text-white/80">RAG-Powered • Cite Sources</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-white hover:bg-white/10"
              title="Conversation History"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/10"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="border-b bg-muted/50 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Conversation History</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessages([]);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  New Chat
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center py-2">
                Start a new conversation above
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => {
            const rating = messageRatings[message.id];

            return (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <Brain className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Sources */}
                    {message.sender === 'ai' && message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-2">
                        {message.sources.slice(0, 3).map(source => renderSourceBadge(source))}
                        {message.sources.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{message.sources.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Performance & Rating */}
                    {message.sender === 'ai' && !message.id.startsWith('welcome') && (
                      <div className="flex items-center justify-between px-2">
                        {message.performance && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Zap className="h-3 w-3" />
                                  {message.performance.search_ms}ms
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Search: {message.performance.search_ms}ms</p>
                                <p>Total: {message.performance.total_ms}ms</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${
                              rating?.rating === 'positive'
                                ? 'text-green-600'
                                : 'text-muted-foreground hover:text-green-600'
                            }`}
                            onClick={() => handleRating(message.id, 'positive')}
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${
                              rating?.rating === 'negative'
                                ? 'text-red-600'
                                : 'text-muted-foreground hover:text-red-600'
                            }`}
                            onClick={() => handleRating(message.id, 'negative')}
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Searching knowledge base...
                    </span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
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

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about courses, AI concepts, career paths..."
              onKeyPress={e => e.key === 'Enter' && sendMessage(inputValue)}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by RAG • Accurate answers with citations
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AITutor;
