import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePersonalization } from "@/contexts/PersonalizationContext";
import { ChatProvider, useChatContext, Message } from "@/components/chat/ChatContext";
import { ChatResponseGenerator } from "@/components/chat/ChatResponseGenerator";
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

// Chatbot implementation with context awareness
function AIChatbotContent() {
  const { selectedAudience, getPersonalizedContent } = usePersonalization();
  const { 
    messages, 
    setMessages, 
    conversationContext, 
    updateConversationContext 
  } = useChatContext();
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message based on audience
  useEffect(() => {
    const responseGenerator = new ChatResponseGenerator(
      selectedAudience,
      getPersonalizedContent,
      conversationContext,
      updateConversationContext
    );
    
    const welcomeContent = responseGenerator.generateResponse("", true);
    
    setMessages([{
      id: "1",
      content: welcomeContent,
      sender: "ai",
      timestamp: new Date(),
      type: "text"
    }]);
  }, [selectedAudience]); // Re-initialize when audience changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const responseGenerator = new ChatResponseGenerator(
        selectedAudience,
        getPersonalizedContent,
        conversationContext,
        updateConversationContext
      );

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseGenerator.generateResponse(content),
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

  // Get personalized quick suggestions
  const getQuickSuggestions = () => {
    return getPersonalizedContent({
      primary: ["What fun AI games can I play?", "How do I start learning?", "What will I build?"],
      secondary: ["What courses help with college?", "How much do courses cost?", "What coding will I learn?"],
      professional: ["Which courses fit my career?", "What are the time commitments?", "Do you offer CPE credits?"],
      business: ["What's the ROI on AI training?", "How do you measure success?", "What about team training?"],
      default: ["What courses are best for beginners?", "How much do courses cost?", "What's included?"]
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
              {getQuickSuggestions().slice(0, 3).map((suggestion: string, index: number) => (
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

// Main component with ChatProvider wrapper
export function AIChatbot() {
  return (
    <ChatProvider>
      <AIChatbotContent />
    </ChatProvider>
  );
}