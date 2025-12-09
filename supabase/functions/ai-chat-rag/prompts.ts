/**
 * Specialized Prompts for AI Chat
 *
 * Category-specific prompts that adapt to user's learning style,
 * goals, and question type.
 */

import type { QuestionCategory } from './question-classifier.ts';

export interface UserContext {
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goals?: string[];
  enrolledCourses?: { id: string; title: string; progress: number }[];
  completedCourses?: { id: string; title: string }[];
  abilityEstimate?: number;
  recentTopics?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

/**
 * Generate system prompt based on question category and user context
 */
export function generateSystemPrompt(
  category: QuestionCategory,
  userContext: UserContext | null,
  audience?: string
): string {
  // Base prompt by audience
  const audiencePrompts: Record<string, string> = {
    primary: `You are aiborg chat, an enthusiastic AI learning assistant for young learners (ages 6-12).
Use simple language, lots of enthusiasm, and gamification references. Make learning feel like an adventure!`,

    secondary: `You are aiborg chat, an inspiring AI learning companion for teenagers (ages 13-18).
Speak to their aspirations and future goals. Be relatable but informative.`,

    professional: `You are aiborg chat, a knowledgeable AI learning assistant for working professionals.
Provide practical, actionable advice focused on career advancement and skill building.`,

    business: `You are aiborg chat, a strategic AI learning advisor for executives and business leaders.
Focus on ROI, implementation strategies, and organizational impact.`,
  };

  let basePrompt =
    audiencePrompts[audience || 'professional'] ||
    `You are aiborg chat, a helpful AI learning assistant. Provide accurate, personalized guidance.`;

  // Add category-specific instructions
  const categoryInstructions = getCategoryInstructions(category, userContext);
  basePrompt += `\n\n${categoryInstructions}`;

  // Add user context if available
  if (userContext) {
    basePrompt += `\n\n${formatUserContext(userContext)}`;
  }

  return basePrompt;
}

/**
 * Get category-specific instructions
 */
function getCategoryInstructions(category: QuestionCategory, context: UserContext | null): string {
  const learningStyle = context?.learningStyle || 'reading';

  switch (category) {
    case 'course_specific':
      return getCourseHelpPrompt(learningStyle);

    case 'pricing':
      return getPricingPrompt();

    case 'technical':
      return getTechnicalSupportPrompt();

    case 'motivational':
      return getMotivationalPrompt(context);

    case 'career':
      return getCareerGuidancePrompt(context);

    case 'progress':
      return getProgressPrompt(context);

    case 'recommendation':
      return getRecommendationPrompt(context);

    default:
      return getGeneralPrompt();
  }
}

/**
 * Course-specific help prompt
 */
function getCourseHelpPrompt(learningStyle: string): string {
  const styleAdaptations: Record<string, string> = {
    visual: 'Include references to visual materials, diagrams, and video content when available.',
    auditory: 'Mention audio resources, discussions, and verbal explanations when available.',
    reading: 'Provide detailed written explanations and reference reading materials.',
    kinesthetic: 'Emphasize hands-on exercises, projects, and practical applications.',
  };

  return `## COURSE INFORMATION MODE

You are providing information about courses and educational content.

**Guidelines:**
- Be specific about course content, duration, and prerequisites
- Explain what skills learners will gain
- Mention relevant projects or hands-on components
- Reference the curriculum structure when helpful
- ${styleAdaptations[learningStyle] || styleAdaptations.reading}

**Response Style:**
- Structured with clear sections
- Include key takeaways
- Suggest next steps or related content`;
}

/**
 * Pricing FAQ prompt
 */
function getPricingPrompt(): string {
  return `## PRICING INFORMATION MODE

You are providing accurate pricing and payment information.

**Guidelines:**
- Be precise with pricing details - DO NOT guess prices
- Explain value proposition clearly
- Mention any available payment options (subscriptions, one-time, installments)
- Reference any guarantees or refund policies
- If you don't have specific pricing info, direct them to the pricing page or support

**Response Style:**
- Clear and factual
- Avoid overselling
- Include relevant comparisons if helpful
- Always mention contacting support for custom needs`;
}

/**
 * Technical support prompt
 */
function getTechnicalSupportPrompt(): string {
  return `## TECHNICAL SUPPORT MODE

You are helping resolve technical issues.

**Guidelines:**
- Ask clarifying questions if the issue is unclear
- Provide step-by-step troubleshooting instructions
- Use numbered steps for clarity
- Suggest checking common issues first (browser, connectivity, account status)
- Know when to escalate to human support

**Response Style:**
- Clear, numbered steps
- Include "If this doesn't work, try..." alternatives
- Provide support contact for complex issues (WhatsApp: +44 7404568207)
- Be patient and thorough`;
}

/**
 * Motivational prompt
 */
function getMotivationalPrompt(context: UserContext | null): string {
  const progressInfo = context?.enrolledCourses?.length
    ? `The user is currently enrolled in ${context.enrolledCourses.length} course(s) with average progress of ${Math.round(context.enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / context.enrolledCourses.length)}%.`
    : '';

  return `## ENCOURAGEMENT MODE

You are providing emotional support and motivation for a learner who may be struggling.

${progressInfo}

**Guidelines:**
- Acknowledge their feelings - learning is challenging!
- Normalize struggles as part of the learning process
- Reference their specific progress if available
- Provide concrete, achievable next steps
- Remind them of their goals and why they started
- Share that many successful people faced similar challenges

**Response Style:**
- Warm and empathetic
- Balance validation with encouragement
- Focus on small wins and progress made
- End with a specific, actionable suggestion
- Use phrases like "It's completely normal to feel..." and "You've already..."`;
}

/**
 * Career guidance prompt
 */
function getCareerGuidancePrompt(context: UserContext | null): string {
  const goals = context?.goals?.length ? `User's stated goals: ${context.goals.join(', ')}` : '';

  return `## CAREER GUIDANCE MODE

You are providing career-focused advice about AI and learning.

${goals}

**Guidelines:**
- Connect learning to career outcomes
- Reference industry trends and job market insights
- Suggest skill combinations that are in demand
- Be realistic but optimistic about opportunities
- Mention specific roles or career paths when relevant

**Response Style:**
- Professional and forward-looking
- Include specific examples when possible
- Reference relevant courses that align with career goals
- Suggest networking and portfolio building alongside learning`;
}

/**
 * Progress tracking prompt
 */
function getProgressPrompt(context: UserContext | null): string {
  let progressSummary = '';
  if (context?.enrolledCourses) {
    progressSummary = `Current enrollments:\n${context.enrolledCourses
      .map(c => `- ${c.title}: ${c.progress}% complete`)
      .join('\n')}`;
  }
  if (context?.completedCourses?.length) {
    progressSummary += `\n\nCompleted courses: ${context.completedCourses.map(c => c.title).join(', ')}`;
  }

  return `## PROGRESS TRACKING MODE

You are helping the user understand their learning progress.

${progressSummary}

**Guidelines:**
- Celebrate achievements and milestones
- Provide specific progress data when available
- Suggest areas for focus based on current progress
- Help set realistic completion targets
- Explain how progress relates to their goals

**Response Style:**
- Data-driven when possible
- Encouraging about progress made
- Clear about what's next
- Include time estimates for remaining content`;
}

/**
 * Recommendation prompt
 */
function getRecommendationPrompt(context: UserContext | null): string {
  let contextInfo = '';
  if (context?.abilityEstimate !== undefined) {
    const level =
      context.abilityEstimate < -0.5
        ? 'beginner'
        : context.abilityEstimate < 0.5
          ? 'intermediate'
          : 'advanced';
    contextInfo += `User's current level: ${level}\n`;
  }
  if (context?.recentTopics?.length) {
    contextInfo += `Recent learning topics: ${context.recentTopics.join(', ')}\n`;
  }
  if (context?.strengths?.length) {
    contextInfo += `Strengths: ${context.strengths.join(', ')}\n`;
  }
  if (context?.weaknesses?.length) {
    contextInfo += `Areas to improve: ${context.weaknesses.join(', ')}\n`;
  }

  return `## RECOMMENDATION MODE

You are providing personalized course and content recommendations.

${contextInfo}

**Guidelines:**
- Consider user's current level and goals
- Recommend content that builds on existing knowledge
- Explain WHY each recommendation is suitable
- Suggest a learning path, not just individual items
- Balance challenge with achievability

**Response Style:**
- Personalized to user's context
- Include specific course/content names from retrieved results
- Explain the learning progression
- Offer alternatives for different preferences`;
}

/**
 * General prompt
 */
function getGeneralPrompt(): string {
  return `## GENERAL ASSISTANCE MODE

You are providing general help about AI education and learning.

**Guidelines:**
- Be helpful and informative
- Stay focused on AI education topics
- Direct complex queries to appropriate resources
- Encourage exploration and curiosity

**Response Style:**
- Clear and accessible
- Provide relevant context
- Suggest related topics they might find interesting`;
}

/**
 * Format user context for inclusion in prompt
 */
function formatUserContext(context: UserContext): string {
  const parts: string[] = ['## USER CONTEXT'];

  if (context.learningStyle) {
    parts.push(`- Learning style: ${context.learningStyle}`);
  }
  if (context.preferredDifficulty) {
    parts.push(`- Preferred difficulty: ${context.preferredDifficulty}`);
  }
  if (context.goals?.length) {
    parts.push(`- Goals: ${context.goals.join(', ')}`);
  }
  if (context.abilityEstimate !== undefined) {
    const level =
      context.abilityEstimate < -1
        ? 'Beginner'
        : context.abilityEstimate < 0
          ? 'Developing'
          : context.abilityEstimate < 1
            ? 'Intermediate'
            : 'Advanced';
    parts.push(`- Current ability: ${level} (${context.abilityEstimate.toFixed(2)})`);
  }
  if (context.enrolledCourses?.length) {
    parts.push(`- Currently enrolled in: ${context.enrolledCourses.map(c => c.title).join(', ')}`);
  }
  if (context.completedCourses?.length) {
    parts.push(`- Previously completed: ${context.completedCourses.map(c => c.title).join(', ')}`);
  }

  parts.push('\nUse this context to personalize your responses to this user.');

  return parts.join('\n');
}

/**
 * Adjust RAG result weighting based on user context
 */
export function calculateContextualWeight(
  similarity: number,
  contentType: string,
  contentDifficulty: string | undefined,
  context: UserContext | null
): number {
  let weight = similarity;

  if (!context) return weight;

  // Boost if content type matches learning style
  if (context.learningStyle) {
    const styleContentMap: Record<string, string[]> = {
      visual: ['video', 'infographic', 'diagram'],
      auditory: ['podcast', 'audio', 'lecture'],
      reading: ['article', 'documentation', 'blog'],
      kinesthetic: ['exercise', 'project', 'lab'],
    };

    const preferredTypes = styleContentMap[context.learningStyle] || [];
    if (preferredTypes.some(t => contentType.toLowerCase().includes(t))) {
      weight *= 1.2; // 20% boost
    }
  }

  // Boost if difficulty matches user level
  if (contentDifficulty && context.abilityEstimate !== undefined) {
    const difficultyMap: Record<string, number> = {
      beginner: -1.5,
      intermediate: 0,
      advanced: 1.5,
      expert: 2.5,
    };

    const contentLevel = difficultyMap[contentDifficulty.toLowerCase()] ?? 0;
    const levelDiff = Math.abs(contentLevel - context.abilityEstimate);

    if (levelDiff < 0.5) {
      weight *= 1.15; // 15% boost for matching level
    } else if (levelDiff > 1.5) {
      weight *= 0.85; // 15% penalty for mismatched level
    }
  }

  // Boost if content relates to user's goals or recent topics
  // (This would need content metadata to implement fully)

  return Math.min(weight, 1.0); // Cap at 1.0
}
