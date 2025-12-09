/**
 * AI Personalized Rationale Edge Function
 *
 * Generates LLM-powered explanations for study plans and recommendations.
 * Uses GPT-4 Turbo with user context to create personalized rationales.
 *
 * Features:
 * - Study plan rationale generation
 * - Recommendation explanations
 * - Daily study advice
 * - Feedback explanations
 * - 7-day caching to reduce API costs
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHash } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token budgets by rationale type
const TOKEN_BUDGETS: Record<string, number> = {
  study_plan: 300,
  recommendation: 150,
  advice: 200,
  feedback: 150,
};

// Prompts for different rationale types
const SYSTEM_PROMPTS: Record<string, string> = {
  study_plan: `You are an expert learning coach creating personalized study plan explanations.
Your explanations should:
- Be encouraging and motivating
- Reference the learner's specific goals and learning style
- Explain WHY the plan is structured the way it is
- Highlight key milestones and what to expect
- Be concise but comprehensive (max 3-4 paragraphs)`,

  recommendation: `You are a personalized learning advisor explaining course and content recommendations.
Your explanations should:
- Connect the recommendation to the user's learning goals
- Explain what skills they'll gain
- Reference their current progress and ability level
- Be brief and actionable (2-3 sentences)`,

  advice: `You are a supportive study coach providing daily learning advice.
Your advice should:
- Be specific to the user's current situation
- Reference their recent performance and patterns
- Provide 1-2 actionable tips
- Be encouraging but realistic`,

  feedback: `You are an educational mentor providing assessment feedback.
Your feedback should:
- Acknowledge what the user did well
- Identify specific areas for improvement
- Suggest concrete next steps
- Be constructive and encouraging`,
};

interface RationaleRequest {
  type: 'study_plan' | 'recommendation' | 'advice' | 'feedback';
  context: {
    learner_profile?: {
      learning_style?: string;
      preferred_difficulty?: string;
      goals?: string[];
      strengths?: string[];
      weaknesses?: string[];
    };
    assessment_data?: {
      recent_scores?: number[];
      ability_estimate?: number;
      topic_performance?: Record<string, number>;
    };
    study_plan_data?: {
      total_weeks?: number;
      weekly_hours?: number;
      focus_topics?: string[];
      current_progress?: number;
    };
    recommendation_data?: {
      item_title?: string;
      item_type?: string;
      match_reason?: string;
    };
    additional_context?: Record<string, unknown>;
  };
}

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request
    const body: RationaleRequest = await req.json();
    const { type, context } = body;

    if (!type || !SYSTEM_PROMPTS[type]) {
      throw new Error(`Invalid rationale type: ${type}`);
    }

    // Generate context hash for caching
    const contextHash = await generateContextHash(user.id, type, context);

    // Check cache
    const { data: cached } = await supabase
      .from('llm_rationale_cache')
      .select('generated_rationale, expires_at')
      .eq('user_id', user.id)
      .eq('context_hash', contextHash)
      .eq('rationale_type', type)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('Returning cached rationale');
      return new Response(
        JSON.stringify({
          rationale: cached.generated_rationale,
          cached: true,
          type,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build user context message
    const userMessage = buildUserMessage(type, context);

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[type] },
          { role: 'user', content: userMessage },
        ],
        max_tokens: TOKEN_BUDGETS[type],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const completion = await response.json();
    const rationale = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Cache the result (7-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('llm_rationale_cache').upsert({
      user_id: user.id,
      context_hash: contextHash,
      rationale_type: type,
      generated_rationale: rationale,
      model_version: 'gpt-4-turbo-preview',
      expires_at: expiresAt.toISOString(),
    });

    return new Response(
      JSON.stringify({
        rationale,
        cached: false,
        type,
        tokens_used: tokensUsed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating rationale:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Generate a hash for the context to use as cache key
 */
async function generateContextHash(
  userId: string,
  type: string,
  context: RationaleRequest['context']
): Promise<string> {
  const data = JSON.stringify({ userId, type, context });
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build user message based on rationale type and context
 */
function buildUserMessage(type: string, context: RationaleRequest['context']): string {
  const {
    learner_profile,
    assessment_data,
    study_plan_data,
    recommendation_data,
    additional_context,
  } = context;

  let message = '';

  // Add learner profile context
  if (learner_profile) {
    message += '**About the Learner:**\n';
    if (learner_profile.learning_style) {
      message += `- Learning style: ${learner_profile.learning_style}\n`;
    }
    if (learner_profile.preferred_difficulty) {
      message += `- Preferred difficulty: ${learner_profile.preferred_difficulty}\n`;
    }
    if (learner_profile.goals?.length) {
      message += `- Goals: ${learner_profile.goals.join(', ')}\n`;
    }
    if (learner_profile.strengths?.length) {
      message += `- Strengths: ${learner_profile.strengths.join(', ')}\n`;
    }
    if (learner_profile.weaknesses?.length) {
      message += `- Areas to improve: ${learner_profile.weaknesses.join(', ')}\n`;
    }
    message += '\n';
  }

  // Add assessment context
  if (assessment_data) {
    message += '**Recent Performance:**\n';
    if (assessment_data.ability_estimate !== undefined) {
      const level = getAbilityLevel(assessment_data.ability_estimate);
      message += `- Current ability level: ${level} (${assessment_data.ability_estimate.toFixed(2)})\n`;
    }
    if (assessment_data.recent_scores?.length) {
      const avgScore =
        assessment_data.recent_scores.reduce((a, b) => a + b, 0) /
        assessment_data.recent_scores.length;
      message += `- Recent scores: ${assessment_data.recent_scores.join('%, ')}% (avg: ${avgScore.toFixed(0)}%)\n`;
    }
    if (assessment_data.topic_performance) {
      const topics = Object.entries(assessment_data.topic_performance)
        .map(([topic, score]) => `${topic}: ${(score * 100).toFixed(0)}%`)
        .join(', ');
      message += `- Topic performance: ${topics}\n`;
    }
    message += '\n';
  }

  // Add study plan context
  if (study_plan_data) {
    message += '**Study Plan Details:**\n';
    if (study_plan_data.total_weeks) {
      message += `- Duration: ${study_plan_data.total_weeks} weeks\n`;
    }
    if (study_plan_data.weekly_hours) {
      message += `- Weekly commitment: ${study_plan_data.weekly_hours} hours\n`;
    }
    if (study_plan_data.focus_topics?.length) {
      message += `- Focus areas: ${study_plan_data.focus_topics.join(', ')}\n`;
    }
    if (study_plan_data.current_progress !== undefined) {
      message += `- Current progress: ${study_plan_data.current_progress}%\n`;
    }
    message += '\n';
  }

  // Add recommendation context
  if (recommendation_data) {
    message += '**Recommendation:**\n';
    if (recommendation_data.item_title) {
      message += `- Item: ${recommendation_data.item_title}\n`;
    }
    if (recommendation_data.item_type) {
      message += `- Type: ${recommendation_data.item_type}\n`;
    }
    if (recommendation_data.match_reason) {
      message += `- Match reason: ${recommendation_data.match_reason}\n`;
    }
    message += '\n';
  }

  // Add any additional context
  if (additional_context) {
    message += '**Additional Context:**\n';
    for (const [key, value] of Object.entries(additional_context)) {
      message += `- ${key}: ${JSON.stringify(value)}\n`;
    }
    message += '\n';
  }

  // Add type-specific prompts
  switch (type) {
    case 'study_plan':
      message +=
        'Please generate a personalized explanation of why this study plan was designed this way and what the learner can expect.';
      break;
    case 'recommendation':
      message += 'Please explain why this item is being recommended to this learner specifically.';
      break;
    case 'advice':
      message +=
        'Please provide personalized daily study advice for this learner based on their current situation.';
      break;
    case 'feedback':
      message +=
        "Please provide constructive feedback on the learner's recent performance with specific suggestions for improvement.";
      break;
  }

  return message;
}

/**
 * Convert ability estimate to human-readable level
 */
function getAbilityLevel(ability: number): string {
  if (ability < -1.5) return 'Beginner';
  if (ability < -0.5) return 'Developing';
  if (ability < 0.5) return 'Intermediate';
  if (ability < 1.5) return 'Advanced';
  return 'Expert';
}
