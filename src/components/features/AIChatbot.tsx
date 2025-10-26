import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useCourses } from '@/hooks/useCourses';
import { useChatHistory } from '@/hooks/useChatHistory';
import { generateFallbackResponse } from '@/utils/chatbotFallback';
import { logger } from '@/utils/logger';
import { MessageCircle, Send, X, Bot, User, Phone, History, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationContext {
  askedAboutExperience: boolean;
  askedAboutGoals: boolean;
  userExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  userRole?: string;
  userGoals?: string[];
  recommendedCourses?: string[];
  lastTopic?: string;
  followUpQuestions: string[];
}

// Course data for accurate recommendations
const professionalCourses = [
  {
    title: 'AI Fundamentals for Professionals',
    price: '£89',
    duration: '8 weeks',
    level: 'Intermediate',
  },
  { title: 'Advanced Prompt Engineering', price: '£129', duration: '6 weeks', level: 'Advanced' },
  { title: 'AI Strategy & Implementation', price: '£199', duration: '10 weeks', level: 'Advanced' },
  {
    title: 'Machine Learning for Business',
    price: '£159',
    duration: '8 weeks',
    level: 'Intermediate',
  },
];

const businessCourses = [
  { title: 'AI Leadership & Strategy', price: '£299', duration: '12 weeks', level: 'Executive' },
  {
    title: 'Enterprise AI Implementation',
    price: '£499',
    duration: '16 weeks',
    level: 'Executive',
  },
  { title: 'AI ROI & Analytics', price: '£199', duration: '8 weeks', level: 'Advanced' },
];

const secondaryCourses = [
  {
    title: 'Ultimate Academic Advantage by AI',
    price: '£39',
    duration: '6 weeks',
    level: 'Intermediate',
  },
  {
    title: 'Teen Machine Learning Bootcamp',
    price: '£39',
    duration: '6 weeks',
    level: 'Intermediate',
  },
  { title: 'Code Your Own ChatGPT', price: '£39', duration: '6 weeks', level: 'Intermediate' },
];

const primaryCourses = [
  { title: 'Kickstarter AI Adventures', price: '£25', duration: '4 weeks', level: 'Beginner' },
  { title: 'Creative Robots Coding Jam', price: '£25', duration: '4 weeks', level: 'Beginner' },
  { title: "AI Storytellers' Studio", price: '£25', duration: '4 weeks', level: 'Beginner' },
];

const initialConversationContext: ConversationContext = {
  askedAboutExperience: false,
  askedAboutGoals: false,
  followUpQuestions: [],
};

export function AIChatbot() {
  const { selectedAudience, getPersonalizedContent } = usePersonalization();
  const { courses, loading: coursesLoading } = useCourses();
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
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [_conversationContext, setConversationContext] = useState<ConversationContext>(
    initialConversationContext
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages from current conversation
  const messages = currentConversation?.messages || [];

  // Initialize conversation when chatbot opens
  useEffect(() => {
    if (isOpen && !currentConversation) {
      startNewConversation(selectedAudience).then(conversation => {
        // Add welcome message
        const welcomeContent = getPersonalizedContent({
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
          content: welcomeContent,
          sender: 'ai',
          type: 'text',
        });
      });
    }
  }, [
    isOpen,
    currentConversation,
    selectedAudience,
    startNewConversation,
    addMessage,
    getPersonalizedContent,
  ]);

  const updateConversationContext = (updates: Partial<ConversationContext>) => {
    setConversationContext(prev => ({ ...prev, ...updates }));
  };

  const getCourseRecommendations = () => {
    if (coursesLoading || !courses.length) {
      // Fallback to static data if courses are loading or unavailable
      switch (selectedAudience) {
        case 'professional':
          return professionalCourses;
        case 'business':
          return businessCourses;
        case 'secondary':
          return secondaryCourses;
        case 'primary':
          return primaryCourses;
        default:
          return professionalCourses;
      }
    }

    // Filter actual courses by audience
    return courses
      .filter(
        course =>
          !selectedAudience ||
          selectedAudience === 'All' ||
          course.audience.toLowerCase() === selectedAudience.toLowerCase()
      )
      .slice(0, 4); // Limit to 4 recommendations
  };

  const getPriceRange = (): string => {
    switch (selectedAudience) {
      case 'business':
        return '£199 to £499';
      case 'professional':
        return '£89 to £199';
      case 'secondary':
        return '£39';
      case 'primary':
        return '£25';
      default:
        return '£25 to £499';
    }
  };

  const _detectUserExperience = (
    userMessage: string
  ): 'beginner' | 'intermediate' | 'advanced' | undefined => {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes('no experience') ||
      lowerMessage.includes('beginner') ||
      lowerMessage.includes('new to') ||
      lowerMessage.includes('never used')
    ) {
      return 'beginner';
    }

    if (
      lowerMessage.includes('some experience') ||
      lowerMessage.includes('intermediate') ||
      lowerMessage.includes('used before') ||
      lowerMessage.includes('familiar')
    ) {
      return 'intermediate';
    }

    if (
      lowerMessage.includes('advanced') ||
      lowerMessage.includes('expert') ||
      lowerMessage.includes('professional experience') ||
      lowerMessage.includes('years of')
    ) {
      return 'advanced';
    }

    return undefined;
  };

  const _detectUserRole = (userMessage: string): string | undefined => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('developer') || lowerMessage.includes('programmer'))
      return 'developer';
    if (lowerMessage.includes('manager') || lowerMessage.includes('lead')) return 'manager';
    if (lowerMessage.includes('analyst') || lowerMessage.includes('data')) return 'analyst';
    if (lowerMessage.includes('teacher') || lowerMessage.includes('educator')) return 'educator';
    if (lowerMessage.includes('student')) return 'student';
    if (lowerMessage.includes('ceo') || lowerMessage.includes('executive')) return 'executive';

    return undefined;
  };

  const _getContextualFollowUp = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (selectedAudience === 'primary') {
      if (lowerMessage.includes('game') || lowerMessage.includes('play')) {
        return "I love that you like games! 🎮 Our AI courses are designed like fun games with challenges, rewards, and cool projects. What's your favorite type of game?";
      }
      if (lowerMessage.includes('draw') || lowerMessage.includes('art')) {
        return "That's amazing! 🎨 We have AI courses where you can teach computers to make art, create stories with pictures, and even design your own characters! Would you like to hear about our AI art adventures?";
      }
      return 'That sounds really cool! 🌟 What other things do you like to do for fun?';
    }

    if (selectedAudience === 'secondary') {
      if (lowerMessage.includes('college') || lowerMessage.includes('university')) {
        return 'Smart thinking! 🎓 AI skills are becoming essential for almost every field. Which subjects or careers are you considering? I can show you how AI applies to everything from medicine to gaming!';
      }
      if (lowerMessage.includes('project') || lowerMessage.includes('code')) {
        return 'Perfect! 💻 Our courses include portfolio-worthy projects that really impress colleges and employers. Are you interested in web development, data science, or maybe AI game development?';
      }
      return "That's a great direction! 🚀 How do you see AI fitting into your future plans?";
    }

    if (selectedAudience === 'professional') {
      if (lowerMessage.includes('manager') || lowerMessage.includes('lead')) {
        return "Excellent! As a leader, you'll benefit from understanding both technical implementation and team management aspects of AI. Are you looking to upskill your team or integrate AI into existing workflows?";
      }
      if (lowerMessage.includes('developer') || lowerMessage.includes('engineer')) {
        return 'Perfect! With your technical background, we can focus on advanced AI applications and implementation strategies. Are you interested in LLMs, machine learning, or AI system architecture?';
      }
      return "That's valuable context! How do you envision AI enhancing your current role or opening new opportunities?";
    }

    if (selectedAudience === 'business') {
      if (lowerMessage.includes('ceo') || lowerMessage.includes('executive')) {
        return 'Strategic AI leadership is crucial for competitive advantage. Are you focused on operational efficiency, new product development, or market positioning with AI?';
      }
      if (lowerMessage.includes('transform') || lowerMessage.includes('strategy')) {
        return 'Digital transformation requires the right approach. Are you looking to transform customer experience, internal operations, or create new AI-powered revenue streams?';
      }
      updateConversationContext({ lastTopic: 'business_objectives' });
      return 'Understanding the business impact is key. What are your primary objectives for AI implementation in your organization?';
    }

    return "That's helpful to know! What specific aspects of AI interest you most?";
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Call the ai-chat-with-analytics edge function with conversation tracking
      const coursesData = getCourseRecommendations().map(course => ({
        title: course.title,
        price: course.price,
        duration: course.duration,
        level: course.level || 'beginner',
        audience: selectedAudience,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat-with-analytics', {
        body: {
          messages: [{ role: 'user', content: userMessage }],
          audience: selectedAudience,
          coursesData: coursesData,
          sessionId: currentConversation?.sessionId,
          conversationId: currentConversation?.id,
        },
      });

      if (error) throw error;

      // Return the AI response
      if (data && data.response) {
        logger.log('AI response generated successfully', {
          tokens: data.usage?.total_tokens,
          cost: data.cost?.usd,
        });
        return data.response;
      }

      throw new Error('No response from AI');
    } catch (error) {
      logger.error('Error generating AI response:', error);

      // Use sophisticated fallback system
      const fallback = generateFallbackResponse(
        userMessage,
        selectedAudience,
        getCourseRecommendations()
      );

      // Show WhatsApp if suggested
      if (fallback.showWhatsApp) {
        setShowWhatsApp(true);
      }

      return fallback.message;
    }
  };

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

    setInputValue('');
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await generateAIResponse(content);

      // Simulate typing delay
      setTimeout(
        () => {
          addMessage({
            content: aiResponse,
            sender: 'ai',
            type: 'text',
          });
          setIsTyping(false);
        },
        1000 + Math.random() * 1000
      ); // Random delay between 1-2 seconds
    } catch (error) {
      logger.error('Error sending message:', error);
      setIsTyping(false);

      // Use sophisticated fallback
      const fallback = generateFallbackResponse(
        content,
        selectedAudience,
        getCourseRecommendations()
      );

      addMessage({
        content: fallback.message,
        sender: 'ai',
        type: 'text',
      });

      if (fallback.showWhatsApp) {
        setShowWhatsApp(true);
      }
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Get personalized quick suggestions
  const getQuickSuggestions = () => {
    return getPersonalizedContent({
      primary: ['What fun AI games can I play?', 'How do I start learning?', 'What will I build?'],
      secondary: [
        'What courses help with college?',
        'How much do courses cost?',
        'What coding will I learn?',
      ],
      professional: [
        'Which courses fit my career?',
        'What are the time commitments?',
        'Do you offer CPE credits?',
      ],
      business: [
        "What's the ROI on AI training?",
        'How do you measure success?',
        'What about team training?',
      ],
      default: [
        'What courses are best for beginners?',
        'How much do courses cost?',
        "What's included?",
      ],
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
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
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="h-[600px] flex flex-col shadow-2xl border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-primary rounded-t-lg">
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
              onClick={() => setShowHistory(!showHistory)}
              className="text-white hover:bg-white/10"
              title="Conversation History"
            >
              <History className="h-4 w-4" />
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

        {/* Conversation History Panel */}
        {showHistory && (
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
                      <div
                        className="flex-1"
                        onClick={() => {
                          loadConversation(conv.id);
                          setShowHistory(false);
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
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {message.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-ai text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 opacity-70 ${
                      message.sender === 'user' ? 'text-white' : 'text-primary'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-ai text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="chat-bubble-ai">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
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
        {showWhatsApp && (
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
                    <img
                      src="/lovable-uploads/062b8b8d-3c09-41cf-92a4-d274f73d56d7.png"
                      alt="WhatsApp QR Code"
                      className="h-16 w-16 object-contain"
                    />
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
                onClick={() => setShowWhatsApp(false)}
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
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about courses, pricing, or anything..."
              onKeyPress={e => e.key === 'Enter' && sendMessage(inputValue)}
              className="flex-1"
            />
            <Button
              onClick={() => setShowWhatsApp(!showWhatsApp)}
              variant="outline"
              className="px-3 text-green-600 border-green-200 hover:bg-green-50"
              title="WhatsApp Support"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
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
