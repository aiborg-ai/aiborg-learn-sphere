import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name',
};

/**
 * Rubric criterion for structured grading
 */
interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
}

/**
 * Grading request payload
 */
interface GradingRequest {
  userAnswer: string;
  idealAnswer: string;
  questionText: string;
  rubric?: string | RubricCriterion[];
  passScore?: number;
  strictness?: number;
  context?: string;
  provider?: 'openai' | 'anthropic' | 'openrouter';
}

/**
 * Parse rubric into structured format
 */
function parseRubric(rubric: string | RubricCriterion[] | undefined): RubricCriterion[] {
  if (!rubric) {
    return [
      { name: 'Accuracy', description: 'Correctness of information', weight: 0.4 },
      { name: 'Completeness', description: 'Coverage of key points', weight: 0.3 },
      { name: 'Clarity', description: 'Clear and well-organized response', weight: 0.2 },
      { name: 'Understanding', description: 'Demonstrates understanding of concept', weight: 0.1 },
    ];
  }

  if (Array.isArray(rubric)) {
    return rubric;
  }

  // Parse string rubric
  const lines = rubric.split('\n').filter(line => line.trim());
  const criteria: RubricCriterion[] = [];

  for (const line of lines) {
    const match = line.match(/^[-•*]?\s*(.+?):\s*(.+)$/);
    if (match) {
      criteria.push({
        name: match[1].trim(),
        description: match[2].trim(),
        weight: 1 / lines.length,
      });
    }
  }

  return criteria.length > 0 ? criteria : parseRubric(undefined);
}

/**
 * Build grading prompt
 */
function buildGradingPrompt(request: GradingRequest, rubricCriteria: RubricCriterion[]): string {
  const rubricText = rubricCriteria
    .map((c, i) => `${i + 1}. ${c.name} (${Math.round(c.weight * 100)}%): ${c.description}`)
    .join('\n');

  const strictnessNote =
    request.strictness !== undefined
      ? request.strictness > 0.7
        ? 'Be strict in grading - expect precise and comprehensive answers.'
        : request.strictness < 0.3
          ? 'Be lenient - focus on core understanding rather than perfect answers.'
          : 'Use standard grading expectations.'
      : '';

  return `You are an expert educational assessor. Grade the following free-response answer.

QUESTION:
${request.questionText}

IDEAL ANSWER:
${request.idealAnswer}

STUDENT ANSWER:
${request.userAnswer}

RUBRIC CRITERIA:
${rubricText}

${request.context ? `CONTEXT: ${request.context}` : ''}
${strictnessNote}

Evaluate the student's answer against the ideal answer using the rubric criteria.

Respond ONLY with a valid JSON object in this exact format:
{
  "overallScore": <number 0-100>,
  "confidence": <number 0-100>,
  "rubricScores": [
    {
      "criterion": "<criterion name>",
      "score": <number 0-100>,
      "feedback": "<brief feedback for this criterion>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "missedPoints": ["<key point missed 1>"],
  "overallFeedback": "<2-3 sentence summary>"
}`;
}

/**
 * Parse LLM response into grading result
 */
function parseGradingResponse(
  responseText: string,
  passScore: number,
  provider: string,
  processingTimeMs: number
) {
  try {
    // Extract JSON from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    const score = (parsed.overallScore || 0) / 100;
    const confidence = (parsed.confidence || 70) / 100;

    const rubricScores = (parsed.rubricScores || []).map(
      (rs: { criterion: string; score: number; feedback: string }) => ({
        criterion: rs.criterion,
        score: (rs.score || 0) / 100,
        maxScore: 1,
        feedback: rs.feedback || '',
      })
    );

    return {
      score,
      passed: score >= passScore,
      feedback: parsed.overallFeedback || 'Grading completed.',
      detailedFeedback: {
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        missedPoints: parsed.missedPoints || [],
      },
      rubricScores,
      confidence,
      provider,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Failed to parse grading response:', error);
    return {
      score: 0.5,
      passed: false,
      feedback: 'Unable to fully evaluate response. Please review manually.',
      confidence: 0.2,
      provider,
      processingTimeMs,
    };
  }
}

/**
 * Grade using OpenAI
 */
async function gradeWithOpenAI(
  prompt: string,
  passScore: number,
  startTime: number
): Promise<Record<string, unknown>> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Cost-effective for grading
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessor. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  const processingTimeMs = Date.now() - startTime;

  return parseGradingResponse(content, passScore, 'openai', processingTimeMs);
}

/**
 * Grade using Anthropic Claude
 */
async function gradeWithAnthropic(
  prompt: string,
  passScore: number,
  startTime: number
): Promise<Record<string, unknown>> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Cost-effective for grading
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'You are an expert educational assessor. Respond only with valid JSON.',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const processingTimeMs = Date.now() - startTime;

  return parseGradingResponse(content, passScore, 'anthropic', processingTimeMs);
}

/**
 * Grade using OpenRouter (multi-model)
 */
async function gradeWithOpenRouter(
  prompt: string,
  passScore: number,
  startTime: number
): Promise<Record<string, unknown>> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aiborg.ai',
      'X-Title': 'AIBorg Learn Sphere',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku', // Cost-effective
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessor. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const processingTimeMs = Date.now() - startTime;

  return parseGradingResponse(content, passScore, 'openrouter', processingTimeMs);
}

/**
 * Keyword-based fallback grading
 */
function keywordFallbackGrading(
  request: GradingRequest,
  startTime: number
): Record<string, unknown> {
  const stopWords = new Set([
    'a',
    'an',
    'the',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'to',
    'of',
    'in',
    'for',
    'on',
    'with',
    'at',
    'by',
    'from',
    'as',
    'into',
    'through',
    'and',
    'but',
    'if',
    'or',
    'because',
    'this',
    'that',
    'these',
    'those',
    'it',
  ]);

  const extractKeywords = (text: string): string[] =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

  const userWords = extractKeywords(request.userAnswer);
  const idealWords = extractKeywords(request.idealAnswer);

  let matchCount = 0;
  for (const word of userWords) {
    if (idealWords.includes(word)) {
      matchCount++;
    }
  }

  const score = idealWords.length > 0 ? Math.min(1, matchCount / idealWords.length) : 0;
  const passScore = request.passScore ?? 0.65;
  const processingTimeMs = Date.now() - startTime;

  return {
    score,
    passed: score >= passScore,
    feedback:
      score >= passScore
        ? 'Your answer covers key points from the expected response.'
        : 'Consider including more key concepts from the topic.',
    detailedFeedback: {
      strengths: matchCount > 0 ? ['Contains relevant keywords'] : [],
      improvements: score < passScore ? ['Include more key concepts'] : [],
      missedPoints: idealWords.filter(iw => !userWords.includes(iw)).slice(0, 3),
    },
    confidence: 0.4,
    provider: 'fallback',
    processingTimeMs,
  };
}

/**
 * Main handler
 */
serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GradingRequest = await req.json();

    // Validate required fields
    if (!request.userAnswer || !request.idealAnswer || !request.questionText) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: userAnswer, idealAnswer, questionText',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const startTime = Date.now();
    const passScore = request.passScore ?? 0.65;
    const rubricCriteria = parseRubric(request.rubric);
    const prompt = buildGradingPrompt(request, rubricCriteria);
    const provider = request.provider || 'openai';

    let result: Record<string, unknown>;

    // Try requested provider, fall back to others
    try {
      switch (provider) {
        case 'anthropic':
          result = await gradeWithAnthropic(prompt, passScore, startTime);
          break;
        case 'openrouter':
          result = await gradeWithOpenRouter(prompt, passScore, startTime);
          break;
        case 'openai':
        default:
          result = await gradeWithOpenAI(prompt, passScore, startTime);
          break;
      }
    } catch (primaryError) {
      console.error(`Primary provider (${provider}) failed:`, primaryError);

      // Try fallback providers
      const fallbackProviders = ['openai', 'anthropic', 'openrouter'].filter(p => p !== provider);

      for (const fallback of fallbackProviders) {
        try {
          switch (fallback) {
            case 'openai':
              result = await gradeWithOpenAI(prompt, passScore, startTime);
              break;
            case 'anthropic':
              result = await gradeWithAnthropic(prompt, passScore, startTime);
              break;
            case 'openrouter':
              result = await gradeWithOpenRouter(prompt, passScore, startTime);
              break;
          }
          break; // Success - exit fallback loop
        } catch (fallbackError) {
          console.error(`Fallback provider (${fallback}) failed:`, fallbackError);
          continue;
        }
      }

      // If all AI providers failed, use keyword fallback
      if (!result!) {
        console.warn('All AI providers failed, using keyword fallback');
        result = keywordFallbackGrading(request, startTime);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in grade-free-response function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        score: 0,
        passed: false,
        feedback: 'Grading failed. Please try again.',
        provider: 'error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
