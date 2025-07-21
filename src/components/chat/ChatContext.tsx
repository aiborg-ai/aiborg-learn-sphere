import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  type?: "text" | "suggestion" | "course_recommendation";
}

export interface ConversationContext {
  askedAboutExperience: boolean;
  askedAboutGoals: boolean;
  userExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  userRole?: string;
  userGoals?: string[];
  recommendedCourses?: string[];
  lastTopic?: string;
  followUpQuestions: string[];
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  conversationContext: ConversationContext;
  updateConversationContext: (updates: Partial<ConversationContext>) => void;
  resetConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

const initialMessages: Message[] = [
  {
    id: "1",
    content: "",
    sender: "ai",
    timestamp: new Date(),
    type: "text"
  }
];

const initialConversationContext: ConversationContext = {
  askedAboutExperience: false,
  askedAboutGoals: false,
  followUpQuestions: []
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationContext, setConversationContext] = useState<ConversationContext>(initialConversationContext);

  const updateConversationContext = (updates: Partial<ConversationContext>) => {
    setConversationContext(prev => ({ ...prev, ...updates }));
  };

  const resetConversation = () => {
    setMessages(initialMessages);
    setConversationContext(initialConversationContext);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        conversationContext,
        updateConversationContext,
        resetConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};