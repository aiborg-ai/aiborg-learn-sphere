import { Ollama } from 'ollama';
import { logger } from '@/utils/logger';

// Configuration
const OLLAMA_HOST = import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b';

// Initialize Ollama client
const ollama = new Ollama({ host: OLLAMA_HOST });

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
}

/**
 * Chat with Ollama using a conversational interface
 */
export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  try {
    const model = options.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;

    logger.info('Sending chat request to Ollama', {
      model,
      messageCount: messages.length,
    });

    const response = await ollama.chat({
      model,
      messages,
      options: {
        temperature,
      },
      stream: false,
    });

    if (!response || !response.message || !response.message.content) {
      throw new Error('Invalid response from Ollama');
    }

    logger.info('Received response from Ollama', {
      responseLength: response.message.content.length,
    });

    return response.message.content;
  } catch (error) {
    logger.error('Error in Ollama chat:', error);
    throw new Error(
      `Failed to get response from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stream chat responses from Ollama
 */
export async function* chatStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  try {
    const model = options.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;

    logger.info('Starting streaming chat with Ollama', {
      model,
      messageCount: messages.length,
    });

    const stream = await ollama.chat({
      model,
      messages,
      options: {
        temperature,
      },
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.message && chunk.message.content) {
        yield chunk.message.content;
      }
    }

    logger.info('Completed streaming response from Ollama');
  } catch (error) {
    logger.error('Error in Ollama streaming chat:', error);
    throw new Error(
      `Failed to stream response from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for text using Ollama
 */
export async function generateEmbeddings(text: string, model = 'nomic-embed-text:latest') {
  try {
    logger.info('Generating embeddings with Ollama', { model });

    const response = await ollama.embeddings({
      model,
      prompt: text,
    });

    if (!response || !response.embedding) {
      throw new Error('Invalid embedding response from Ollama');
    }

    logger.info('Generated embeddings successfully');
    return response.embedding;
  } catch (error) {
    logger.error('Error generating embeddings:', error);
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Ollama is available and responsive
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    logger.info('Checking Ollama health');
    await ollama.list();
    logger.info('Ollama is healthy');
    return true;
  } catch (error) {
    logger.error('Ollama health check failed:', error);
    return false;
  }
}

/**
 * List available models
 */
export async function listModels() {
  try {
    logger.info('Fetching available Ollama models');
    const response = await ollama.list();
    logger.info('Available models fetched', { count: response.models?.length || 0 });
    return response.models || [];
  } catch (error) {
    logger.error('Error listing models:', error);
    throw new Error(
      `Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a system prompt for the chatbot based on audience
 */
export function createChatbotSystemPrompt(
  audience: string,
  coursesData?: Array<{
    title: string;
    price: string;
    duration: string;
    level: string;
    audience: string;
    description: string;
    category?: string;
  }>
): string {
  let basePrompt = `You are "aiborg chat", a friendly and helpful AI learning assistant for aiborg AI education platform. Your role is to:

1. Help users discover appropriate AI courses based on their needs
2. Answer questions about courses, pricing, and programs
3. Provide information about AI learning paths
4. Engage users in a conversational and supportive manner
5. Always encourage users to contact WhatsApp (+44 7404568207) for detailed information or enrollment

IMPORTANT GUIDELINES:
- Be concise and clear in your responses
- Use the provided course data to give accurate recommendations
- Match your tone to the audience type: ${audience}
- Do NOT make up course information - only use the provided data
- If unsure, direct users to WhatsApp for human support
`;

  // Add audience-specific guidance
  switch (audience) {
    case 'primary':
      basePrompt += `\nAUDIENCE: Primary school students (ages 7-11)
- Use simple, fun language
- Include emojis to make it engaging
- Focus on creativity and exploration
- Keep explanations very simple`;
      break;

    case 'secondary':
      basePrompt += `\nAUDIENCE: Secondary school students (ages 11-18)
- Use relatable, encouraging language
- Focus on future careers and college applications
- Emphasize practical skills and projects
- Be enthusiastic about AI possibilities`;
      break;

    case 'professional':
      basePrompt += `\nAUDIENCE: Working professionals
- Use professional, clear language
- Focus on career advancement and practical applications
- Emphasize ROI and time efficiency
- Discuss real-world implementation`;
      break;

    case 'business':
      basePrompt += `\nAUDIENCE: Business executives and leaders
- Use strategic, high-level language
- Focus on business transformation and competitive advantage
- Emphasize organizational impact and ROI
- Discuss implementation strategies`;
      break;

    default:
      basePrompt += `\nAUDIENCE: General
- Use clear, accessible language
- Be helpful and informative
- Adapt to the user's questions`;
  }

  // Add course data if provided
  if (coursesData && coursesData.length > 0) {
    basePrompt += '\n\nAVAILABLE COURSES:\n';
    coursesData.forEach(course => {
      basePrompt += `\n**${course.title}**
- Price: ${course.price}
- Duration: ${course.duration}
- Level: ${course.level}
- Audience: ${course.audience}
- Description: ${course.description}
${course.category ? `- Category: ${course.category}` : ''}
`;
    });
  }

  return basePrompt;
}

/**
 * Create a system prompt for the study assistant
 */
export function createStudyAssistantSystemPrompt(): string {
  return `You are an AI Study Assistant designed to help students learn effectively and manage their coursework. Your role is to:

1. Help students create effective study plans
2. Explain concepts and guide understanding (without doing their work for them)
3. Prioritize assignments and manage deadlines
4. Suggest evidence-based learning strategies
5. Track learning progress and provide encouragement

IMPORTANT GUIDELINES:
- NEVER do homework or assignments for students
- Focus on teaching how to learn and think critically
- Use the Socratic method: ask questions to guide understanding
- Provide hints and strategies, not direct answers
- Be encouraging and supportive
- Adapt to the student's level and learning style

LEARNING STRATEGIES YOU CAN SUGGEST:
- Spaced repetition for memorization
- Active recall techniques
- The Feynman Technique for understanding
- Pomodoro Technique for time management
- Mind mapping for visual learners
- Practice testing for exam preparation

Always maintain academic integrity while being helpful and supportive.`;
}

export default ollama;
