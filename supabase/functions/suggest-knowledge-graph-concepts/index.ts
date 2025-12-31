import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConceptSuggestionRequest {
  course_id?: number; // Extract concepts from this course
  concept_name?: string; // Suggest related concepts for this concept
  context?: string; // Additional context for suggestions
  aiProvider?: 'ollama' | 'openai'; // Default to ollama
}

interface ConceptSuggestion {
  name: string;
  type: 'skill' | 'topic' | 'technology' | 'technique';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimated_hours?: number;
}

interface RelationshipSuggestion {
  source_concept: string; // Concept name (not ID)
  target_concept: string; // Concept name (not ID)
  relationship_type: 'prerequisite' | 'related_to' | 'part_of' | 'builds_on' | 'alternative_to';
  strength: number; // 0-1
  description?: string;
}

interface CourseMappingSuggestion {
  concept_name: string;
  coverage_level: 'introduces' | 'covers' | 'masters';
  is_primary: boolean;
  weight: number; // 0-1
}

interface SuggestionResponse {
  concepts: ConceptSuggestion[];
  relationships: RelationshipSuggestion[];
  course_mappings?: CourseMappingSuggestion[];
  source_data?: any; // The course or concept that was analyzed
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
    const {
      course_id,
      concept_name,
      context,
      aiProvider = 'ollama',
    }: ConceptSuggestionRequest = await req.json();

    // Validate input
    if (!course_id && !concept_name) {
      return new Response(
        JSON.stringify({ error: 'Either course_id or concept_name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    let systemPrompt = '';
    let userPrompt = '';
    let sourceData: any = null;

    // Build prompts based on input type
    if (course_id) {
      // Extract concepts from course
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('id, title, description, category, keywords, prerequisites, level')
        .eq('id', course_id)
        .single();

      if (courseError || !course) {
        return new Response(JSON.stringify({ error: 'Course not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      sourceData = course;

      systemPrompt = `You are an AI educational assistant specializing in knowledge graph construction for learning platforms.

Your task is to analyze a course and extract learning concepts, relationships, and mappings.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON.

Response format (JSON only):
{
  "concepts": [
    {
      "name": "Concept name (clear, descriptive)",
      "type": "skill" | "topic" | "technology" | "technique",
      "difficulty_level": "beginner" | "intermediate" | "advanced",
      "description": "Brief description of what this concept covers (1-2 sentences)",
      "estimated_hours": number (optional, hours to learn this concept)
    }
  ],
  "relationships": [
    {
      "source_concept": "Source concept name (exact match from concepts array)",
      "target_concept": "Target concept name (exact match from concepts array)",
      "relationship_type": "prerequisite" | "related_to" | "part_of" | "builds_on" | "alternative_to",
      "strength": number (0-1, how strong the relationship is),
      "description": "Optional description of the relationship"
    }
  ],
  "course_mappings": [
    {
      "concept_name": "Concept name (exact match from concepts array)",
      "coverage_level": "introduces" | "covers" | "masters",
      "is_primary": boolean (true if this is a main topic of the course),
      "weight": number (0-1, importance in the course)
    }
  ]
}

Guidelines:
- Extract 5-15 concepts depending on course complexity
- Use existing keywords as a starting point but expand beyond them
- Create prerequisite relationships for concepts that build on each other
- Mark 2-3 concepts as primary (main topics)
- Difficulty should match course level: "${course.level}"
- Ensure all concept names in relationships and course_mappings exactly match names in concepts array`;

      userPrompt = `Analyze this course and extract learning concepts:

Title: ${course.title}
Category: ${course.category}
Level: ${course.level}
Description: ${course.description}
Keywords: ${course.keywords?.join(', ') || 'None'}
Prerequisites: ${course.prerequisites || 'None'}
${context ? `\nAdditional context: ${context}` : ''}

Return JSON with concepts, relationships, and course_mappings arrays.`;
    } else if (concept_name) {
      // Suggest related concepts for an existing concept
      systemPrompt = `You are an AI educational assistant specializing in knowledge graph expansion.

Your task is to suggest related concepts and relationships for a given learning concept.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON.

Response format (JSON only):
{
  "concepts": [
    {
      "name": "Related concept name (clear, descriptive)",
      "type": "skill" | "topic" | "technology" | "technique",
      "difficulty_level": "beginner" | "intermediate" | "advanced",
      "description": "Brief description of what this concept covers (1-2 sentences)",
      "estimated_hours": number (optional, hours to learn this concept)
    }
  ],
  "relationships": [
    {
      "source_concept": "Source concept name",
      "target_concept": "Target concept name (can be the input concept or a suggested concept)",
      "relationship_type": "prerequisite" | "related_to" | "part_of" | "builds_on" | "alternative_to",
      "strength": number (0-1, how strong the relationship is),
      "description": "Optional description of the relationship"
    }
  ]
}

Guidelines:
- Suggest 3-8 related concepts
- Include prerequisites (concepts that should be learned before)
- Include follow-up concepts (concepts that build on this one)
- Include related concepts (similar or complementary topics)
- Create appropriate relationships between suggested concepts
- Ensure concept names are clear and descriptive`;

      userPrompt = `Suggest related learning concepts for: "${concept_name}"
${context ? `\nAdditional context: ${context}` : ''}

Return JSON with concepts and relationships arrays.`;
    }

    const startTime = Date.now();
    let generatedContent: string;
    let model: string;

    // Generate suggestions based on selected AI provider
    if (aiProvider === 'ollama') {
      // Use local Ollama (free, runs on your machine)
      const ollamaUrl = Deno.env.get('OLLAMA_URL') || 'http://172.17.0.1:11434';
      const ollamaModel = Deno.env.get('OLLAMA_MODEL') || 'llama3.1:8b';

      model = ollamaModel;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'Supabase-Edge-Function',
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: {
            temperature: 0.5, // Lower temperature for more consistent JSON
            num_predict: 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const ollamaResponse = await response.json();
      generatedContent = ollamaResponse.response;
    } else {
      // Use OpenAI as fallback
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      model = 'gpt-4o-mini';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const openaiResponse = await response.json();
      generatedContent = openaiResponse.choices[0].message.content;
    }

    const generationTime = Date.now() - startTime;

    // Parse JSON response
    let suggestionData: SuggestionResponse;
    try {
      // Extract JSON from response (in case AI added explanatory text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      suggestionData = {
        concepts: parsedData.concepts || [],
        relationships: parsedData.relationships || [],
        course_mappings: parsedData.course_mappings,
        source_data: sourceData,
      };

      // Validate data structure
      if (!Array.isArray(suggestionData.concepts)) {
        throw new Error('Invalid concepts array');
      }
      if (!Array.isArray(suggestionData.relationships)) {
        throw new Error('Invalid relationships array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI suggestions',
          details: parseError.message,
          raw_response: generatedContent,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return suggestions
    return new Response(
      JSON.stringify({
        success: true,
        data: suggestionData,
        metadata: {
          model,
          provider: aiProvider,
          generation_time_ms: generationTime,
          concepts_count: suggestionData.concepts.length,
          relationships_count: suggestionData.relationships.length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in suggest-knowledge-graph-concepts:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
