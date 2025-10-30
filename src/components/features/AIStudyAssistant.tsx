import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
// Ollama service removed - using ai-chat edge function instead
// import {
//   chat,
//   createStudyAssistantSystemPrompt,
//   checkOllamaHealth,
// } from '@/services/ollamaService';
// import type { ChatMessage } from '@/services/ollamaService';
import {
  Send,
  X,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Target,
  Calendar,
  Brain,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface StudyContext {
  enrolled_courses?: unknown[];
  upcoming_assignments?: unknown[];
  recent_activity?: unknown[];
  active_recommendations?: unknown[];
}

const quickActions = [
  { icon: BookOpen, label: 'Study Plan', prompt: 'Help me create a study plan for this week' },
  {
    icon: Target,
    label: 'Assignment Help',
    prompt: 'I need help understanding my current assignments',
  },
  {
    icon: Calendar,
    label: 'Schedule',
    prompt: 'What should I prioritize today based on my deadlines?',
  },
  {
    icon: Brain,
    label: 'Review Topics',
    prompt: 'What topics should I review based on my progress?',
  },
];

export function AIStudyAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [_studyContext, setStudyContext] = useState<StudyContext>({});
  const [_ollamaAvailable, _setOllamaAvailable] = useState(false); // Ollama disabled - using edge function
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = useCallback(async () => {
    try {
      if (!user) return;

      // Create a new AI study session
      const { data: session, error: sessionError } = await supabase
        .from('ai_study_sessions')
        .insert({
          user_id: user.id,
          session_type: 'chat',
          context: {},
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);

      // Get user's study context
      const { data: context, error: contextError } = await supabase.rpc('get_user_study_context', {
        p_user_id: user.id,
      });

      if (!contextError && context) {
        setStudyContext(context);

        // Add welcome message with context
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          content: getWelcomeMessage(context),
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);
      }
    } catch (error) {
      logger.error('Error initializing AI study session:', error);
      toast({
        title: 'Session Error',
        description: 'Failed to initialize study assistant. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      initializeSession();
    }
  }, [isOpen, user, messages.length, initializeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (context: StudyContext): string => {
    const coursesCount = context.enrolled_courses?.length || 0;
    const upcomingCount = context.upcoming_assignments?.length || 0;

    let message = "👋 Hi! I'm your AI Study Assistant. I'm here to help you learn effectively!\n\n";

    if (coursesCount > 0) {
      message += `📚 You're enrolled in ${coursesCount} course${coursesCount > 1 ? 's' : ''}.\n`;
    }

    if (upcomingCount > 0) {
      message += `⏰ You have ${upcomingCount} upcoming assignment${upcomingCount > 1 ? 's' : ''}.\n`;
    }

    message += '\nHow can I help you today? I can:\n';
    message += '• Create personalized study plans\n';
    message += '• Help you understand concepts (without doing your work!)\n';
    message += '• Prioritize your assignments\n';
    message += '• Suggest study strategies\n';
    message += '• Track your learning progress';

    return message;
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || !user || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: textToSend,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the ai-study-assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-study-assistant', {
        body: {
          messages: [{ role: 'user', content: textToSend }],
          sessionId: sessionId,
          userId: user?.id,
        },
      });

      if (error) throw error;

      // Add AI response to messages
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: data?.response || "I'm here to help! What would you like to work on?",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      logger.log('AI study assistant response generated successfully');
    } catch (error) {
      logger.error('Error sending message to AI:', error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content:
          "I'm having trouble right now. Please try again in a moment, or contact support if the issue persists.",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Message Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    handleSendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = async () => {
    setIsOpen(false);

    // End the session
    if (sessionId) {
      try {
        await supabase
          .from('ai_study_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (error) {
        logger.error('Error ending session:', error);
      }
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 z-50"
        >
          <Brain className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[420px] h-[600px] shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Study Assistant</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Powered by AI
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-3 border-b bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(action => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="justify-start text-xs h-auto py-2"
                    disabled={isLoading}
                  >
                    <action.icon className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-green-500 to-teal-600">
                      <AvatarFallback>
                        <User className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600">
                    <AvatarFallback>
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              I'll help you learn, but won't do your assignments for you!
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
