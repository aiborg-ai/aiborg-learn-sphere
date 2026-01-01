// =============================================================================
// Generate Lesson Edge Function
// =============================================================================
// AI-powered lesson generation using Ollama llama3.3:70b
// Creates comprehensive lessons with objectives, content, exercises, and quizzes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// Types
// =============================================================================

interface LessonGenerationRequest {
  jobId: string;
  topic: string;
  audience: 'primary' | 'secondary' | 'professional' | 'business';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_minutes?: number;
  curriculum_type?: string;
  grade_level?: string;
  include_exercises?: boolean;
  include_quiz?: boolean;
  num_quiz_questions?: number;
  learning_objectives?: string[];
}

interface GeneratedLesson {
  title: string;
  description: string;
  learning_objectives: string[];
  prerequisites: string[];
  content_sections: ContentSection[];
  practice_exercises: Exercise[];
  quiz_questions: QuizQuestion[];
  additional_resources: Resources;
  tags: string[];
  estimated_duration_minutes: number;
}

interface ContentSection {
  section_type: string;
  title: string;
  content: string;
  duration_minutes: number;
  key_points?: string[];
  examples?: Array<{
    title: string;
    description: string;
    code_snippet?: string;
  }>;
}

interface Exercise {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_minutes: number;
  solution_hints: string[];
  success_criteria: string[];
}

interface QuizQuestion {
  question_type: string;
  question_text: string;
  options?: Array<{ text: string; is_correct: boolean }>;
  explanation: string;
  difficulty: string;
  points: number;
  bloom_taxonomy_level?: string;
}

interface Resources {
  reading_materials?: Array<{
    title: string;
    url: string;
    type: string;
    reading_time_minutes?: number;
  }>;
  videos?: Array<{
    title: string;
    url: string;
    duration: string;
    platform?: string;
  }>;
  interactive_tools?: Array<{
    title: string;
    url: string;
    description: string;
    type?: string;
  }>;
}

// =============================================================================
// Audience Descriptions
// =============================================================================

const audienceDescriptions = {
  primary:
    'primary school children (ages 5-11) with simple vocabulary, visual examples, and fun activities',
  secondary:
    'secondary school students (ages 12-18) with age-appropriate complexity and relatable scenarios',
  professional:
    'working professionals with industry terminology, practical applications, and career relevance',
  business:
    'business leaders and executives with ROI focus, business scenarios, and leadership context',
};

const difficultyDescriptions = {
  beginner: 'beginners with no prior knowledge, focusing on fundamentals and basic concepts',
  intermediate:
    'learners with some background, building on existing knowledge with moderate complexity',
  advanced: 'experienced learners seeking deep understanding and complex applications',
  expert: 'subject matter experts looking for cutting-edge insights and advanced techniques',
};

// =============================================================================
// Prompt Engineering
// =============================================================================

function buildSystemPrompt(request: LessonGenerationRequest): string {
  const {
    audience,
    difficulty,
    duration_minutes = 45,
    curriculum_type,
    grade_level,
    include_exercises = true,
    include_quiz = true,
    num_quiz_questions = 5,
  } = request;

  return `You are an expert educational content creator specializing in creating comprehensive, engaging lessons.

Your task is to create a complete lesson for ${audienceDescriptions[audience]} at ${difficultyDescriptions[difficulty]}.

CRITICAL INSTRUCTIONS:
1. Structure your response as valid JSON matching the exact schema provided below
2. Include ALL required fields
3. Create engaging, age-appropriate content for ${audience} audience
4. Ensure learning objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
5. Include practical examples and real-world applications
6. Generate diverse question types (multiple choice, true/false, short answer)
7. Provide clear explanations for all quiz answers
8. Make content accessible and inclusive
9. Use proper markdown formatting in content fields (**bold**, *italic*, lists, code blocks)

TARGET AUDIENCE CONTEXT:
- Primary (Ages 5-11): Simple vocabulary, visual examples, fun activities, colorful descriptions
- Secondary (Ages 12-18): Age-appropriate complexity, relatable scenarios, peer examples
- Professional: Industry terminology, practical applications, career relevance, ROI focus
- Business: Business scenarios, leadership context, strategic thinking, executive perspective

LESSON DURATION: Target ${duration_minutes} minutes total
- Introduction: ~10% of time (${Math.round(duration_minutes * 0.1)} mins)
- Main Content: ~60% of time (${Math.round(duration_minutes * 0.6)} mins)
- Practice: ~20% of time (${Math.round(duration_minutes * 0.2)} mins)
- Quiz: ~10% of time (${Math.round(duration_minutes * 0.1)} mins)

${curriculum_type ? `CURRICULUM ALIGNMENT: Align to ${curriculum_type} standards for ${grade_level}` : ''}

OUTPUT FORMAT - Return ONLY valid JSON with this EXACT structure:
{
  "title": "Clear, engaging lesson title (60-80 characters)",
  "description": "Brief lesson overview (150-200 characters)",
  "learning_objectives": [
    "Students will be able to... (SMART format)",
    "Students will understand...",
    "Students will apply..."
  ],
  "prerequisites": [
    "Prerequisite knowledge or skill 1",
    "Prerequisite knowledge or skill 2"
  ],
  "content_sections": [
    {
      "section_type": "introduction",
      "title": "Engaging Introduction Title",
      "content": "# Introduction\\n\\nMarkdown-formatted content with **bold**, *italic*, lists\\n\\n- Point 1\\n- Point 2",
      "duration_minutes": ${Math.round(duration_minutes * 0.1)},
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "section_type": "main_content",
      "title": "Core Concepts and Theory",
      "content": "# Main Content\\n\\nDetailed explanation with examples...\\n\\n## Subtopic 1\\nExplanation...\\n\\n## Subtopic 2\\nExplanation...",
      "duration_minutes": ${Math.round(duration_minutes * 0.6)},
      "key_points": ["Concept 1", "Concept 2", "Concept 3"],
      "examples": [
        {
          "title": "Example 1: Real-World Application",
          "description": "Detailed explanation of the example",
          "code_snippet": "// Optional code if applicable\\nconst example = 'code';"
        }
      ]
    },
    {
      "section_type": "practice",
      "title": "Guided Practice Activities",
      "content": "# Practice\\n\\nHands-on activities and guided practice...",
      "duration_minutes": ${Math.round(duration_minutes * 0.2)},
      "key_points": ["Practice skill 1", "Practice skill 2"]
    },
    {
      "section_type": "summary",
      "title": "Key Takeaways and Review",
      "content": "# Summary\\n\\nRecap of main points...\\n\\n## What We Learned\\n- Takeaway 1\\n- Takeaway 2",
      "duration_minutes": 5,
      "key_points": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
    }
  ],
  ${
    include_exercises
      ? `"practice_exercises": [
    {
      "title": "Exercise 1: Apply What You Learned",
      "description": "Complete this hands-on activity to reinforce the concepts",
      "type": "hands_on",
      "difficulty": "${difficulty}",
      "estimated_minutes": 10,
      "solution_hints": ["Start by...", "Remember to...", "Check that..."],
      "success_criteria": ["Successfully demonstrates...", "Correctly applies...", "Shows understanding of..."]
    },
    {
      "title": "Exercise 2: Problem Solving Challenge",
      "description": "Apply the concepts to solve this real-world problem",
      "type": "problem_solving",
      "difficulty": "${difficulty}",
      "estimated_minutes": 15,
      "solution_hints": ["Consider...", "Think about...", "Review..."],
      "success_criteria": ["Identifies the problem", "Applies appropriate method", "Reaches correct solution"]
    }
  ],`
      : '"practice_exercises": [],'
  }
  ${
    include_quiz
      ? `"quiz_questions": [
    ${Array.from(
      { length: num_quiz_questions },
      (_, i) => `{
      "question_type": "${i % 3 === 0 ? 'multiple_choice' : i % 3 === 1 ? 'true_false' : 'short_answer'}",
      "question_text": "Clear, specific question about key concept ${i + 1}?",
      ${
        i % 3 === 0
          ? `"options": [
        {"text": "Option A - plausible distractor", "is_correct": false},
        {"text": "Option B - correct answer", "is_correct": true},
        {"text": "Option C - plausible distractor", "is_correct": false},
        {"text": "Option D - plausible distractor", "is_correct": false}
      ],`
          : i % 3 === 1
            ? `"options": [
        {"text": "True", "is_correct": true},
        {"text": "False", "is_correct": false}
      ],`
            : ''
      }
      "explanation": "Detailed explanation of why this answer is correct and others are wrong",
      "difficulty": "${difficulty}",
      "points": ${i < num_quiz_questions / 2 ? '1' : '2'},
      "bloom_taxonomy_level": "${i < num_quiz_questions / 3 ? 'remembering' : i < (2 * num_quiz_questions) / 3 ? 'understanding' : 'applying'}"
    }`
    ).join(',\n    ')}
  ],`
      : '"quiz_questions": [],'
  }
  "additional_resources": {
    "reading_materials": [
      {
        "title": "Recommended article or book chapter",
        "url": "https://example.com/resource",
        "type": "article",
        "reading_time_minutes": 5
      }
    ],
    "videos": [
      {
        "title": "Helpful video tutorial",
        "url": "https://youtube.com/watch?v=example",
        "duration": "10:30",
        "platform": "youtube"
      }
    ],
    "interactive_tools": [
      {
        "title": "Interactive simulation or tool",
        "url": "https://example.com/tool",
        "description": "What this tool helps you practice",
        "type": "simulation"
      }
    ]
  },
  "tags": ["relevant_tag1", "relevant_tag2", "relevant_tag3", "topic_keyword", "skill_area"],
  "estimated_duration_minutes": ${duration_minutes}
}

IMPORTANT: Return ONLY the JSON object, no explanatory text before or after.`;
}

function buildUserPrompt(request: LessonGenerationRequest): string {
  const { topic, learning_objectives } = request;

  let prompt = `Create a comprehensive, engaging lesson on: "${topic}"`;

  if (learning_objectives && learning_objectives.length > 0) {
    prompt += `\n\nUse these specific learning objectives:\n${learning_objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}`;
  }

  prompt +=
    '\n\nEnsure the lesson is well-structured, includes practical examples, and follows best pedagogical practices.';

  return prompt;
}

// =============================================================================
// JSON Parsing & Validation
// =============================================================================

function parseAndValidateLessonJSON(content: string): GeneratedLesson {
  // Extract JSON from markdown code blocks if present
  let jsonText = content.trim();

  // Remove markdown code fences
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
  }

  // Parse JSON
  let parsed: GeneratedLesson;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('JSON parse error:', e);
    console.error('Content:', jsonText.substring(0, 500));
    throw new Error('Generated content is not valid JSON. Please try again.');
  }

  // Validate required fields
  const requiredFields = [
    'title',
    'learning_objectives',
    'content_sections',
    'estimated_duration_minutes',
  ];
  for (const field of requiredFields) {
    if (!parsed[field as keyof GeneratedLesson]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate array fields
  if (!Array.isArray(parsed.learning_objectives) || parsed.learning_objectives.length === 0) {
    throw new Error('learning_objectives must be a non-empty array');
  }

  if (!Array.isArray(parsed.content_sections) || parsed.content_sections.length === 0) {
    throw new Error('content_sections must be a non-empty array');
  }

  // Set defaults for optional fields
  return {
    ...parsed,
    description: parsed.description || parsed.title,
    prerequisites: parsed.prerequisites || [],
    practice_exercises: parsed.practice_exercises || [],
    quiz_questions: parsed.quiz_questions || [],
    additional_resources: parsed.additional_resources || {},
    tags: parsed.tags || [],
  };
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Parse request body
    const request: LessonGenerationRequest = await req.json();
    const {
      jobId,
      topic,
      audience,
      difficulty,
      duration_minutes = 45,
      curriculum_type,
      grade_level,
    } = request;

    // Validate input
    if (!jobId) throw new Error('Job ID is required');
    if (!topic || topic.length < 10) {
      throw new Error('Topic must be at least 10 characters');
    }

    console.log(`Generating lesson for user ${user.id}, topic: "${topic}"`);

    // Update job status to processing
    await supabase
      .from('ai_content_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Get Ollama configuration
    const ollamaUrl = Deno.env.get('OLLAMA_URL') || 'http://172.17.0.1:11434';
    const ollamaModel = Deno.env.get('OLLAMA_MODEL') || 'llama3.3:70b';

    console.log(`Calling Ollama at ${ollamaUrl} with model ${ollamaModel}`);

    // Build prompts
    const systemPrompt = buildSystemPrompt(request);
    const userPrompt = buildUserPrompt(request);
    const fullPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`;

    // Call Ollama API
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4096,
          top_p: 0.9,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama API error:', errorText);
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }

    const ollamaData = await ollamaResponse.json();
    const generatedContent = ollamaData.response;

    console.log('Ollama response received, parsing JSON...');

    // Parse and validate generated lesson
    const lessonData = parseAndValidateLessonJSON(generatedContent);

    console.log(`Lesson generated: "${lessonData.title}"`);

    // Calculate word count
    const wordCount = lessonData.content_sections
      .map(section => section.content.split(/\s+/).length)
      .reduce((a, b) => a + b, 0);

    // Save to database
    const { data: lesson, error: lessonError } = await supabase
      .from('ai_generated_lessons')
      .insert({
        job_id: jobId,
        user_id: user.id,
        title: lessonData.title,
        topic,
        description: lessonData.description,
        audience,
        difficulty,
        curriculum_type,
        grade_level,
        learning_objectives: lessonData.learning_objectives,
        prerequisites: lessonData.prerequisites,
        content_sections: lessonData.content_sections,
        practice_exercises: lessonData.practice_exercises,
        quiz_questions: lessonData.quiz_questions,
        additional_resources: lessonData.additional_resources,
        estimated_duration_minutes: lessonData.estimated_duration_minutes,
        word_count: wordCount,
        tags: lessonData.tags,
        status: 'draft',
      })
      .select()
      .single();

    if (lessonError) {
      console.error('Database error:', lessonError);
      throw lessonError;
    }

    console.log(`Lesson saved to database with ID: ${lesson.id}`);

    // Update job as completed
    await supabase.rpc('complete_ai_content_job', {
      p_job_id: jobId,
      p_output_data: lessonData,
      p_content_id: lesson.id,
      p_content_type: 'lesson',
      p_tokens: estimateTokens(generatedContent),
      p_cost: 0, // Ollama is free
    });

    console.log('Job marked as completed');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        lessonId: lesson.id,
        data: lessonData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating lesson:', error);

    // Try to fail the job if we have the jobId
    try {
      const { jobId } = await req.json();
      if (jobId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.rpc('fail_ai_content_job', {
          p_job_id: jobId,
          p_error_message: error.message,
        });
      }
    } catch (failError) {
      console.error('Error failing job:', failError);
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while generating the lesson',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
