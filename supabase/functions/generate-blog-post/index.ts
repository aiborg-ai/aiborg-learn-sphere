import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogGenerationRequest {
  topic: string;
  audience: 'primary' | 'secondary' | 'professional' | 'business';
  tone: 'professional' | 'casual' | 'technical' | 'friendly';
  length: 'short' | 'medium' | 'long';
  keywords?: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { topic, audience, tone, length, keywords }: BlogGenerationRequest = await req.json();

    // Validate input
    if (!topic || topic.length < 10) {
      return new Response(JSON.stringify({ error: 'Topic must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define word count based on length
    const wordCounts = {
      short: '500-800',
      medium: '800-1500',
      long: '1500-2500',
    };
    const targetWordCount = wordCounts[length];

    // Build system prompt based on audience
    const audienceDescriptions = {
      primary: 'young learners (ages 5-11), using simple language and fun examples',
      secondary: 'teenagers (ages 12-18), using engaging language with real-world applications',
      professional: 'working professionals, using industry terminology and practical insights',
      business: 'business owners and SME leaders, focusing on ROI and business value',
    };

    const toneDescriptions = {
      professional: 'professional and authoritative',
      casual: 'conversational and approachable',
      technical: 'detailed and technical',
      friendly: 'warm and encouraging',
    };

    const systemPrompt = `You are an expert content writer specializing in AI and technology education.

Your task is to write a comprehensive, engaging blog post for ${audienceDescriptions[audience]}.

Requirements:
- Writing tone: ${toneDescriptions[tone]}
- Target length: ${targetWordCount} words
- Format: Markdown with proper headings (##, ###), lists, and emphasis
- Include an engaging introduction that hooks the reader
- Use clear section headings
- Include practical examples and actionable insights
- End with a strong conclusion and call-to-action
${keywords ? `- Incorporate these keywords naturally: ${keywords}` : ''}

Structure your response as follows:
1. Start with a compelling title (60-80 characters, SEO-optimized)
2. Write an excerpt/summary (150-200 characters)
3. Write the full blog post content in Markdown format
4. Provide 5-7 relevant tags
5. Suggest a category
6. Create an SEO meta title (max 160 characters)
7. Create an SEO meta description (max 320 characters)`;

    const userPrompt = `Write a blog post about: ${topic}`;

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;
    const elapsedTime = Date.now() - startTime;

    // Parse the AI response
    const parsed = parseAIResponse(generatedContent);

    // Calculate reading time (assuming 200 words per minute)
    const wordCount = parsed.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Fetch categories to suggest
    const { data: categories } = await supabaseClient
      .from('blog_categories')
      .select('id, name')
      .order('name');

    // Find matching category or use first one
    const matchedCategory = categories?.find(cat =>
      cat.name.toLowerCase().includes(parsed.suggestedCategory.toLowerCase())
    );
    const categoryId = matchedCategory?.id || categories?.[0]?.id || null;

    // Log AI usage
    const promptTokens = aiResponse.usage?.prompt_tokens || 0;
    const completionTokens = aiResponse.usage?.completion_tokens || 0;
    const totalTokens = aiResponse.usage?.total_tokens || 0;

    // GPT-4 Turbo pricing: $0.01 per 1K prompt tokens, $0.03 per 1K completion tokens
    const cost = (promptTokens / 1000) * 0.01 + (completionTokens / 1000) * 0.03;

    await supabaseClient.from('ai_generation_logs').insert({
      user_id: user.id,
      generation_type: 'blog_post',
      input_data: { topic, audience, tone, length, keywords },
      output_data: parsed,
      model: 'gpt-4-turbo-preview',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: cost,
      generation_time_ms: elapsedTime,
    });

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: parsed.title,
          content: parsed.content,
          excerpt: parsed.excerpt,
          metaTitle: parsed.metaTitle,
          metaDescription: parsed.metaDescription,
          suggestedTags: parsed.tags,
          suggestedCategory: categoryId,
          readingTime,
        },
        meta: {
          wordCount,
          tokens: totalTokens,
          cost: `$${cost.toFixed(4)}`,
          generationTime: `${(elapsedTime / 1000).toFixed(2)}s`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating blog post:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate blog post',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse AI response into structured data
 */
function parseAIResponse(content: string): {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  suggestedCategory: string;
  metaTitle: string;
  metaDescription: string;
} {
  // Try to extract structured sections from AI response
  // AI should provide content in a structured format

  const lines = content.split('\n');
  let title = '';
  let excerpt = '';
  let mainContent = '';
  let tags: string[] = [];
  let suggestedCategory = 'General';
  let metaTitle = '';
  let metaDescription = '';

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') || (trimmed.startsWith('**Title:**') && !title)) {
      title = trimmed
        .replace(/^#\s*/, '')
        .replace(/^\*\*Title:\*\*\s*/i, '')
        .trim();
    } else if (trimmed.match(/^\*\*(Excerpt|Summary):\*\*/i)) {
      currentSection = 'excerpt';
    } else if (trimmed.match(/^\*\*Tags:\*\*/i)) {
      currentSection = 'tags';
    } else if (trimmed.match(/^\*\*Category:\*\*/i)) {
      currentSection = 'category';
    } else if (trimmed.match(/^\*\*Meta Title:\*\*/i)) {
      currentSection = 'meta_title';
    } else if (trimmed.match(/^\*\*Meta Description:\*\*/i)) {
      currentSection = 'meta_description';
    } else if (trimmed.match(/^##\s/)) {
      // Start of actual content
      currentSection = 'content';
      mainContent += line + '\n';
    } else if (currentSection === 'excerpt' && trimmed) {
      excerpt += trimmed + ' ';
    } else if (currentSection === 'tags' && trimmed) {
      const extractedTags = trimmed
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(Boolean);
      tags = [...tags, ...extractedTags];
    } else if (currentSection === 'category' && trimmed) {
      suggestedCategory = trimmed;
    } else if (currentSection === 'meta_title' && trimmed) {
      metaTitle += trimmed + ' ';
    } else if (currentSection === 'meta_description' && trimmed) {
      metaDescription += trimmed + ' ';
    } else if (currentSection === 'content') {
      mainContent += line + '\n';
    }
  }

  // Fallbacks
  if (!title) {
    const firstHeading = lines.find(l => l.trim().startsWith('#'));
    title = firstHeading?.replace(/^#+\s*/, '').trim() || 'Untitled Blog Post';
  }

  if (!excerpt) {
    // Extract first paragraph
    const paragraphs = mainContent.split('\n\n').filter(p => p.trim() && !p.trim().startsWith('#'));
    excerpt = paragraphs[0]?.substring(0, 200) || title;
  }

  if (tags.length === 0) {
    tags = ['AI', 'Technology', 'Education'];
  }

  if (!metaTitle) {
    metaTitle = title.substring(0, 160);
  }

  if (!metaDescription) {
    metaDescription = excerpt.substring(0, 320);
  }

  return {
    title: title.trim(),
    excerpt: excerpt.trim().substring(0, 500),
    content: mainContent.trim() || content,
    tags: tags.slice(0, 7),
    suggestedCategory,
    metaTitle: metaTitle.trim().substring(0, 160),
    metaDescription: metaDescription.trim().substring(0, 320),
  };
}
