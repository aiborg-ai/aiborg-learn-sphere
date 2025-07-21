import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle,
  BookOpen,
  Clock,
  ArrowUp
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  type?: "text" | "suggestion" | "course_recommendation";
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm aiborg chat, your AI learning assistant. I can help you find the perfect course, answer questions about our programs, or guide you through your learning journey. What would you like to know?",
    sender: "ai",
    timestamp: new Date(),
    type: "text"
  }
];

const quickSuggestions = [
  "What courses are best for beginners?",
  "How much do courses cost?",
  "What's included in the programs?",
  "How do I get started?",
  "Tell me about certifications",
  "What are the learning objectives?"
];

const courseRecommendations = [
  {
    title: "AI Fundamentals: Understanding LLMs",
    price: "£49",
    duration: "6 weeks",
    level: "Beginner"
  },
  {
    title: "Boost Productivity with AI Tools", 
    price: "£29",
    duration: "3 weeks",
    level: "Beginner"
  }
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      return "Our courses range from £25 to £199, with most programs around £49. This includes full access to materials, live sessions, certificates, and community support. We also offer flexible payment options and group discounts for businesses.";
    }
    
    if (lowerMessage.includes("beginner") || lowerMessage.includes("start")) {
      return "For beginners, I recommend starting with 'AI Fundamentals: Understanding LLMs' (£49) or 'Boost Productivity with AI Tools' (£29). Both are designed for newcomers and include hands-on projects. Would you like me to show you more details about these courses?";
    }
    
    if (lowerMessage.includes("certificate") || lowerMessage.includes("certification")) {
      return "Yes! All our programs include industry-recognized certificates upon completion. You'll also gain practical skills through real projects and can showcase your achievements on LinkedIn. Professional courses offer CPE credits too.";
    }
    
    if (lowerMessage.includes("objective") || lowerMessage.includes("learn")) {
      return "Our core learning objectives include: 1) Master AI Fundamentals (LLMs, agents, prompt engineering), 2) Immediate Academic Impact (apply AI to homework and research), 3) Boost Productivity (hands-on AI tools), and 4) Ethical AI Usage (responsible practices). Which area interests you most?";
    }
    
    if (lowerMessage.includes("include") || lowerMessage.includes("what")) {
      return "Each program includes: Live interactive sessions, practical hands-on projects, downloadable resources, community access, instructor support, completion certificates, and lifetime access to materials. Premium courses also include 1-on-1 mentoring sessions.";
    }
    
    if (lowerMessage.includes("business") || lowerMessage.includes("enterprise")) {
      return "Our business programs offer team training, custom curriculum development, ROI tracking, and dedicated support. We work with companies to implement AI strategies and upskill teams. Interested in a consultation for your organization?";
    }
    
    return "I'd be happy to help you with that! Our AI education programs are designed to be practical and immediately applicable. You can browse our course catalog above, or I can recommend specific programs based on your background and goals. What's your current experience with AI?";
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(content),
        sender: "ai", 
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-ai text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-ai"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.sender === "user" ? "text-white" : "text-primary"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.sender === "user" && (
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
              {quickSuggestions.slice(0, 3).map((suggestion, index) => (
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
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about courses, pricing, or anything..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage(inputValue)}
              className="flex-1"
            />
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