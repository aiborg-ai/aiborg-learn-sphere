/**
 * Generate Knowledge Base Article with AI
 *
 * Uses GPT-4 to generate comprehensive, structured KB articles on AI/ML topics
 * Features:
 * - Category-specific prompts (AI fundamentals, practical tools, business AI)
 * - Difficulty-level adaptation (beginner, intermediate, advanced)
 * - Automatic TOC extraction and reading time calculation
 * - Embedding generation for RAG integration
 * - Draft workflow (admin review before publishing)
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4-turbo-preview';

interface GenerateArticleRequest {
  topic: string;
  category:
    | 'ai_fundamentals'
    | 'ml_algorithms'
    | 'practical_tools'
    | 'prompt_engineering'
    | 'business_ai'
    | 'ai_ethics'
    | 'deployment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  outline?: string[];
  target_length?: 'short' | 'medium' | 'long';
  custom_instructions?: string;
}

interface ParsedArticle {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  difficulty: string;
  readingTimeMinutes: number;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const {
      topic,
      category,
      difficulty,
      outline,
      target_length = 'medium',
      custom_instructions,
    }: GenerateArticleRequest = await req.json();

    // Validate required fields
    if (!topic || !category || !difficulty) {
      throw new Error('Missing required fields: topic, category, difficulty');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get authenticated user (admin only)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can generate articles

    console.log(`Generating article: "${topic}" (${category}, ${difficulty})`);

    // STEP 1: Generate article with GPT-4
    const systemPrompt = buildSystemPrompt(category, difficulty);
    const userPrompt = buildUserPrompt(topic, outline, target_length, custom_instructions);

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(target_length),
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const gptData = await gptResponse.json();
    const rawArticle = gptData.choices[0].message.content;

    console.log(`Article generated (${gptData.usage.total_tokens} tokens)`);

    // STEP 2: Parse article into structured format
    const parsed = parseArticle(rawArticle, category, difficulty);

    console.log(`Parsed article: ${parsed.title} (${parsed.readingTimeMinutes} min read)`);

    // STEP 3: Generate URL-safe slug
    const slug = generateSlug(parsed.title);

    // STEP 4: Generate embedding for RAG
    console.log('Generating embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: `${parsed.title}\n\n${parsed.excerpt}\n\n${parsed.content.substring(0, 2000)}`,
        encoding_format: 'float',
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log('Embedding generated');

    // STEP 5: Save article to database (as draft)
    const { data: article, error: insertError } = await supabase
      .from('vault_content')
      .insert({
        title: parsed.title,
        slug,
        description: parsed.excerpt,
        content_type: 'article',
        content: parsed.content,
        is_knowledge_base: true,
        kb_category: category,
        kb_difficulty: difficulty,
        status: 'draft', // Admin must review before publishing
        tags: parsed.tags,
        excerpt: parsed.excerpt,
        is_premium: false, // KB articles are free
        is_published: false, // Not published until admin approves
        author_name: 'AI Generated',
        metadata: {
          ai_generated: true,
          generation_prompt: topic,
          generation_model: CHAT_MODEL,
          generated_at: new Date().toISOString(),
          tokens_used: gptData.usage.total_tokens,
          custom_instructions: custom_instructions || null,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save article: ${insertError.message}`);
    }

    console.log(`Article saved with ID: ${article.id}`);

    // STEP 6: Save embedding to vector database
    const { error: embeddingError } = await supabase.from('content_embeddings').insert({
      content_type: 'knowledge_base',
      content_id: article.id,
      title: parsed.title,
      content: parsed.content,
      embedding,
      metadata: {
        category,
        difficulty,
        kb_category: category,
        tags: parsed.tags,
      },
    });

    if (embeddingError) {
      console.error('Embedding insert error:', embeddingError);
      // Non-fatal - article is saved, embedding can be regenerated later
    } else {
      console.log('Embedding indexed for RAG');
    }

    const totalLatency = Date.now() - startTime;

    // STEP 7: Log generation analytics
    try {
      await supabase.from('kb_generation_analytics').insert({
        article_id: article.id,
        topic,
        category,
        difficulty,
        target_length,
        tokens_used: gptData.usage.total_tokens,
        generation_time_ms: totalLatency,
        generated_by: user.id,
      });
    } catch (error) {
      console.error('Failed to log analytics:', error);
    }

    // STEP 8: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          title: parsed.title,
          slug,
          excerpt: parsed.excerpt,
          category,
          difficulty,
          status: 'draft',
          reading_time_minutes: parsed.readingTimeMinutes,
          word_count: estimateWordCount(parsed.content),
          tags: parsed.tags,
        },
        metadata: {
          tokens_used: gptData.usage.total_tokens,
          generation_time_ms: totalLatency,
          model: CHAT_MODEL,
        },
        next_steps: {
          edit_url: `/admin/kb/edit/${article.id}`,
          preview_url: `/kb/preview/${slug}`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-kb-article function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Build system prompt based on category and difficulty
 */
function buildSystemPrompt(
  category: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const basePrompt = `You are an expert AI educator writing knowledge base articles for learners. Your goal is to create clear, accurate, engaging, and comprehensive educational content.`;

  const categoryGuides: Record<string, string> = {
    ai_fundamentals: `Focus on foundational AI/ML concepts, theory, and intuitive explanations. Use analogies and visual descriptions to make abstract concepts concrete. Include mathematical notation when necessary but always explain it in plain language. Cover the "what" and "why" before the "how".`,

    ml_algorithms: `Provide deep-dives into specific machine learning algorithms. Explain the mathematics, intuition, implementation considerations, strengths, limitations, and use cases. Include pseudocode or algorithm steps. Compare with related algorithms.`,

    practical_tools: `Focus on hands-on tutorials and real-world implementation using specific tools and frameworks (PyTorch, TensorFlow, LangChain, HuggingFace, etc.). Include working code examples with explanations. Cover setup, common patterns, best practices, and troubleshooting. Assume readers have basic programming knowledge.`,

    prompt_engineering: `Cover prompt design, optimization techniques, chain-of-thought reasoning, few-shot learning, and advanced prompting strategies. Include concrete examples showing prompt evolution from basic to optimized. Discuss model-specific considerations.`,

    business_ai: `Focus on strategic insights, ROI analysis, implementation roadmaps, change management, and business value realization. Use case studies and real-world examples from various industries. Minimize technical jargon. Address stakeholder concerns and risk mitigation.`,

    ai_ethics: `Discuss ethical considerations, bias detection and mitigation, fairness, transparency, accountability, privacy, and responsible AI development. Present multiple perspectives. Include frameworks and actionable guidelines. Reference relevant regulations (GDPR, AI Act, etc.).`,

    deployment: `Cover MLOps, model deployment, monitoring, scaling, CI/CD for ML, infrastructure, containerization, API design, performance optimization, and production best practices. Include architecture diagrams (described textually). Discuss trade-offs.`,
  };

  const difficultyGuides: Record<string, string> = {
    beginner: `Write for someone completely new to this topic. Define all technical terms on first use. Use simple language and everyday analogies. Break complex concepts into digestible steps. Include lots of concrete examples. Avoid assuming prior knowledge.`,

    intermediate: `Write for practitioners with some AI/ML experience. Assume familiarity with basic concepts (neural networks, supervised learning, etc.). Go deeper into implementation details, edge cases, and optimization strategies. Include code examples and architectural considerations.`,

    advanced: `Write for experts and researchers. Include cutting-edge techniques, recent research findings, mathematical derivations, performance benchmarks, and nuanced discussions of trade-offs. Cite academic papers and advanced resources. Assume strong technical background.`,
  };

  return `${basePrompt}

**CATEGORY FOCUS**: ${categoryGuides[category] || categoryGuides.ai_fundamentals}

**DIFFICULTY LEVEL**: ${difficultyGuides[difficulty]}

**ARTICLE STRUCTURE**:
Your article MUST follow this exact structure:

# [Article Title]
Clear, descriptive title (60-80 characters)

## Excerpt
2-3 sentence summary of what readers will learn (150-200 characters)

## Introduction
Engaging hook and overview of the topic (2-3 paragraphs)

## [Main Content Sections]
Well-organized sections with H2 (##) and H3 (###) headings
Include examples, code blocks, diagrams (described), and clear explanations

## Key Takeaways
- Bullet-point summary of main concepts (5-7 points)

## Further Reading
- 3-5 recommended resources with titles and brief descriptions

## Tags
Comma-separated list of 5-10 relevant tags (e.g., machine-learning, neural-networks, pytorch)

**FORMATTING RULES**:
- Use Markdown formatting
- Code blocks with language specified: \`\`\`python
- Bold for emphasis: **important concept**
- Inline code: \`variable_name\`
- Lists for steps or options
- Block quotes for important notes: > Note: ...

**QUALITY STANDARDS**:
- Accurate and up-to-date information
- Clear explanations with examples
- Proper citations for claims
- Balanced perspective (pros/cons)
- Actionable takeaways
- SEO-friendly without keyword stuffing`;
}

/**
 * Build user prompt with topic and parameters
 */
function buildUserPrompt(
  topic: string,
  outline?: string[],
  targetLength: string = 'medium',
  customInstructions?: string
): string {
  const lengthGuide: Record<string, string> = {
    short: '500-800 words (quick reference guide)',
    medium: '1500-2000 words (comprehensive tutorial)',
    long: '3000-4000 words (deep dive with examples)',
  };

  let prompt = `Write a knowledge base article on: **"${topic}"**

Target length: ${lengthGuide[targetLength]}`;

  if (outline && outline.length > 0) {
    prompt += `\n\nFollow this outline for the main content:\n${outline.map((section, i) => `${i + 1}. ${section}`).join('\n')}`;
  } else {
    prompt += `\n\nCreate a logical outline covering all essential aspects of this topic.`;
  }

  if (customInstructions) {
    prompt += `\n\n**Additional Instructions**:\n${customInstructions}`;
  }

  prompt += `\n\nIMPORTANT: Follow the exact article structure from the system prompt. Include all required sections.`;

  return prompt;
}

/**
 * Parse GPT-4 output into structured article
 */
function parseArticle(rawArticle: string, category: string, difficulty: string): ParsedArticle {
  // Extract title (first H1)
  const titleMatch = rawArticle.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';

  // Extract excerpt (content after ## Excerpt heading)
  const excerptMatch = rawArticle.match(/##\s+Excerpt\s*\n\n(.+?)(?=\n##)/s);
  const excerpt = excerptMatch ? excerptMatch[1].trim().substring(0, 300) : title.substring(0, 200);

  // Extract tags (last section)
  const tagsMatch = rawArticle.match(/##\s+Tags\s*\n\n(.+?)$/s);
  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10);
  }

  // Add category and difficulty as tags
  tags.push(category, difficulty);
  tags = [...new Set(tags)]; // Remove duplicates

  // Full content (entire article)
  const content = rawArticle;

  // Estimate reading time (200 words per minute)
  const readingTimeMinutes = estimateReadingTime(content);

  return {
    title,
    excerpt,
    content,
    tags,
    category,
    difficulty,
    readingTimeMinutes,
  };
}

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
}

/**
 * Estimate reading time based on word count
 */
function estimateReadingTime(content: string): number {
  const wordCount = estimateWordCount(content);
  const wordsPerMinute = 200;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

/**
 * Estimate word count
 */
function estimateWordCount(content: string): number {
  // Remove code blocks and markdown syntax for more accurate count
  const textOnly = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/[#*_~\[\]()]/g, ''); // Remove markdown syntax

  return textOnly.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get max tokens based on target length
 */
function getMaxTokens(targetLength: string): number {
  const tokenLimits: Record<string, number> = {
    short: 1500,
    medium: 3500,
    long: 6000,
  };
  return tokenLimits[targetLength] || 3500;
}
