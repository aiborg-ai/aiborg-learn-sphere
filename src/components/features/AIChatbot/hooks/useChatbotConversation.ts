/**
 * Chatbot Conversation Hook
 *
 * Manages conversation context, course recommendations, and quick suggestions.
 * Tracks user experience level, role, and goals to provide personalized responses.
 */

import { useState, useMemo } from 'react';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useCourses } from '@/hooks/useCourses';
import type { ConversationContext, initialConversationContext } from '../types';

interface Course {
  title: string;
  price?: string;
  duration?: string;
  level?: string;
  audience: string;
}

export function useChatbotConversation(selectedAudience: string) {
  const { getPersonalizedContent } = usePersonalization();
  const { courses, loading: coursesLoading } = useCourses();

  const [conversationContext, setConversationContext] = useState<ConversationContext>(
    initialConversationContext
  );

  // Update conversation context
  const updateConversationContext = (updates: Partial<ConversationContext>) => {
    setConversationContext(prev => ({ ...prev, ...updates }));
  };

  // Get course recommendations filtered by audience
  const getCourseRecommendations = useMemo(() => {
    if (coursesLoading || !courses.length) {
      return [];
    }

    return courses
      .filter(
        course =>
          !selectedAudience ||
          selectedAudience === 'All' ||
          course.audience.toLowerCase() === selectedAudience.toLowerCase()
      )
      .slice(0, 6) // Limit to 6 recommendations for better variety
      .map(course => ({
        title: course.title,
        price: course.price || 'Contact for pricing',
        duration: course.duration || 'Self-paced',
        level: course.level || 'All levels',
      }));
  }, [courses, coursesLoading, selectedAudience]);

  // Get price range based on audience
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

  // Detect user experience level from message
  const detectUserExperience = (
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

  // Detect user role from message
  const detectUserRole = (userMessage: string): string | undefined => {
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

  // Get contextual follow-up based on user message and audience
  const getContextualFollowUp = (userMessage: string): string => {
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

  // Get quick suggestions based on audience
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

  return {
    conversationContext,
    updateConversationContext,
    getCourseRecommendations,
    getPriceRange,
    detectUserExperience,
    detectUserRole,
    getContextualFollowUp,
    getQuickSuggestions,
  };
}
