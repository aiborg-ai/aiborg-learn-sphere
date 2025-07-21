import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePersonalization } from "@/contexts/PersonalizationContext";
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

// Course data for accurate recommendations
const professionalCourses = [
  { title: "AI Fundamentals for Professionals", price: "£89", duration: "8 weeks", level: "Intermediate" },
  { title: "Advanced Prompt Engineering", price: "£129", duration: "6 weeks", level: "Advanced" },
  { title: "AI Strategy & Implementation", price: "£199", duration: "10 weeks", level: "Advanced" },
  { title: "Machine Learning for Business", price: "£159", duration: "8 weeks", level: "Intermediate" }
];

const businessCourses = [
  { title: "AI Leadership & Strategy", price: "£299", duration: "12 weeks", level: "Executive" },
  { title: "Enterprise AI Implementation", price: "£499", duration: "16 weeks", level: "Executive" },
  { title: "AI ROI & Analytics", price: "£199", duration: "8 weeks", level: "Advanced" }
];

const secondaryCourses = [
  { title: "Ultimate Academic Advantage by AI", price: "£39", duration: "6 weeks", level: "Intermediate" },
  { title: "Teen Machine Learning Bootcamp", price: "£39", duration: "6 weeks", level: "Intermediate" },
  { title: "Code Your Own ChatGPT", price: "£39", duration: "6 weeks", level: "Intermediate" }
];

const primaryCourses = [
  { title: "Kickstarter AI Adventures", price: "£25", duration: "4 weeks", level: "Beginner" },
  { title: "Creative Robots Coding Jam", price: "£25", duration: "4 weeks", level: "Beginner" },
  { title: "AI Storytellers' Studio", price: "£25", duration: "4 weeks", level: "Beginner" }
];

export function AIChatbot() {
  const { selectedAudience, getPersonalizedContent } = usePersonalization();
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
    
    // Get audience-specific content
    const getCourseRecommendations = () => {
      switch (selectedAudience) {
        case "professional":
          return professionalCourses;
        case "business": 
          return businessCourses;
        case "secondary":
          return secondaryCourses;
        case "primary":
          return primaryCourses;
        default:
          return professionalCourses; // Default to professional if no audience selected
      }
    };

    const courses = getCourseRecommendations();
    
    if (lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      const priceRange = selectedAudience === "business" ? "£199 to £499" :
                        selectedAudience === "professional" ? "£89 to £199" :
                        selectedAudience === "secondary" ? "£39" :
                        selectedAudience === "primary" ? "£25" : "£25 to £499";
      
      return getPersonalizedContent({
        primary: `Our fun AI courses are just ${priceRange}! Each course includes games, projects, and certificates. Parents love our affordable pricing!`,
        secondary: `Our courses are ${priceRange} and include everything you need: live sessions, coding projects, certificates, and access to our teen community. Perfect for college prep!`,
        professional: `Our professional courses range from ${priceRange}. This includes CPE credits, industry certificates, networking opportunities, and practical skills you can use immediately at work.`,
        business: `Our enterprise programs range from ${priceRange} and include custom training, team analytics, ROI tracking, and dedicated support for implementation across your organization.`,
        default: `Our courses range from ${priceRange} and include comprehensive materials, certificates, and ongoing support.`
      });
    }
    
    if (lowerMessage.includes("professional") || (lowerMessage.includes("software") && lowerMessage.includes("recommend"))) {
      return `As a software professional, I recommend these courses based on your background:\n\n1. **${courses[0].title}** (${courses[0].price}, ${courses[0].duration}) - Perfect for your technical background\n2. **${courses[1].title}** (${courses[1].price}, ${courses[1].duration}) - Advanced skills for immediate application\n3. **${courses[2].title}** (${courses[2].price}, ${courses[2].duration}) - Strategic implementation\n\nAll include CPE credits and industry certificates. Which interests you most?`;
    }

    if (lowerMessage.includes("intermediate") && selectedAudience === "professional") {
      return `For intermediate-level professionals, I specifically recommend:\n\n**${courses[0].title}** (${courses[0].price}, ${courses[0].duration})\n- Advanced prompt engineering techniques\n- Real-world implementation scenarios\n- Industry best practices\n- CPE credits included\n\nThis builds perfectly on your existing technical foundation. Would you like more details about the curriculum?`;
    }
    
    if (lowerMessage.includes("beginner") || lowerMessage.includes("start")) {
      const beginnerCourse = courses[0];
      return getPersonalizedContent({
        primary: `Perfect! Start with "${beginnerCourse.title}" - it's super fun and easy! You'll learn through games and creative projects. No experience needed!`,
        secondary: `Great choice! "${beginnerCourse.title}" is perfect for beginners. You'll build real projects and get ready for advanced studies. No coding experience required!`,
        professional: `I recommend "${beginnerCourse.title}" (${beginnerCourse.price}, ${beginnerCourse.duration}). It's designed for professionals new to AI and includes practical applications you can use at work immediately.`,
        business: `For executives new to AI, "${beginnerCourse.title}" provides strategic foundations without technical complexity. Focus on implementation and ROI.`,
        default: `Start with "${beginnerCourse.title}" - it's designed for beginners with hands-on projects and comprehensive support.`
      });
    }
    
    if (lowerMessage.includes("certificate") || lowerMessage.includes("certification")) {
      return getPersonalizedContent({
        primary: "Yes! You'll get awesome certificates to show your family and friends how smart you are with AI!",
        secondary: "Absolutely! Our certificates are recognized by universities and look great on college applications. Perfect for your academic portfolio!",
        professional: "Yes! All courses include industry-recognized certificates with CPE credits. Showcase your AI expertise on LinkedIn and advance your career.",
        business: "Our executive certificates demonstrate strategic AI leadership to stakeholders and boards. Includes completion verification for HR systems.",
        default: "Yes, all programs include certificates upon completion with practical skills verification."
      });
    }
    
    return getPersonalizedContent({
      primary: "I'm here to help you learn AI in a fun way! What would you like to know about our exciting AI adventures?",
      secondary: "I can help you find the perfect AI course for your academic goals and college prep. What's your experience level?",
      professional: "I can recommend AI courses tailored to your professional needs. Our programs focus on practical skills you can implement immediately. What's your current role?",
      business: "I help executives understand AI implementation strategies and ROI. Our programs focus on leadership and organizational transformation. What are your business goals?",
      default: "I'm here to help you find the perfect AI course! What's your background and what would you like to achieve?"
    });
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