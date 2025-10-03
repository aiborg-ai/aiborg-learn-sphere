import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's study context
    const { data: contextData } = await supabase
      .rpc('get_user_study_context', { p_user_id: userId });

    const studyContext = contextData || {};

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build enhanced system prompt with user context
    const systemPrompt = `You are an AI Study Assistant for the AIborg Learn Sphere platform. Your role is to help students learn effectively by:

1. **Personalized Guidance**: Provide study recommendations based on the student's current courses, progress, and learning style
2. **Assignment Help**: Guide students through assignments without giving direct answers - teach them how to think through problems
3. **Study Planning**: Help create effective study schedules considering deadlines and workload
4. **Learning Insights**: Identify patterns in their learning and suggest improvements

**Current Student Context:**

Enrolled Courses: ${studyContext.enrolled_courses ? JSON.stringify(studyContext.enrolled_courses, null, 2) : 'None'}

Upcoming Assignments: ${studyContext.upcoming_assignments ? JSON.stringify(studyContext.upcoming_assignments, null, 2) : 'None'}

Recent Activity: ${studyContext.recent_activity ? JSON.stringify(studyContext.recent_activity, null, 2) : 'None'}

Learning Profile: ${studyContext.learning_profile ? JSON.stringify(studyContext.learning_profile, null, 2) : 'Not set'}

Active Recommendations: ${studyContext.active_recommendations ? JSON.stringify(studyContext.active_recommendations, null, 2) : 'None'}

**Guidelines:**
- Be encouraging and supportive
- Use the Socratic method - ask guiding questions instead of giving answers
- Reference their actual courses and assignments in your responses
- Suggest specific resources from their enrolled courses
- Prioritize urgent deadlines in your recommendations
- Adapt to their learning style (visual, auditory, kinesthetic)
- Keep responses concise but thorough
- Use emojis sparingly to make it friendly

**Security & Academic Integrity:**
- NEVER provide direct answers to assignments
- Guide students to find answers themselves
- Encourage original thinking and work
- If asked to write assignments, refuse politely and explain why
- Focus on teaching concepts, not doing the work

**Capabilities:**
- Study schedule generation
- Assignment breakdown and planning
- Concept explanation and clarification
- Resource recommendations
- Progress tracking insights
- Time management advice
- Exam preparation strategies`;

    // Sanitize messages
    const sanitizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content.slice(0, 2000) : ''
    }));

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save conversation to database if sessionId provided
    if (sessionId) {
      // Save user message
      await supabase.from('ai_conversations').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: sanitizedMessages[sanitizedMessages.length - 1].content
      });

      // Save AI response
      await supabase.from('ai_conversations').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: aiResponse
      });
    }

    // Analyze the conversation for insights (async, don't wait)
    analyzeConversationForInsights(supabase, userId, sanitizedMessages, aiResponse);

    return new Response(JSON.stringify({
      response: aiResponse,
      context: {
        has_upcoming_deadlines: studyContext.upcoming_assignments?.length > 0,
        courses_count: studyContext.enrolled_courses?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-study-assistant:', error);
    return new Response(JSON.stringify({
      error: error.message,
      fallback: "I'm having trouble right now. Please try again in a moment, or contact support if the issue persists."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Analyze conversation for patterns and generate insights
async function analyzeConversationForInsights(
  supabase: any,
  userId: string,
  messages: any[],
  aiResponse: string
) {
  try {
    // Simple keyword-based analysis (can be enhanced with more sophisticated NLP)
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');

    const insights: any[] = [];

    // Detect if student is struggling
    if (allText.includes('stuck') || allText.includes('confused') || allText.includes('don\'t understand')) {
      insights.push({
        user_id: userId,
        insight_type: 'weakness',
        category: 'comprehension',
        title: 'Difficulty Understanding Concepts',
        description: 'Student expressed confusion or being stuck on course material',
        confidence_score: 0.7
      });
    }

    // Detect time management issues
    if (allText.includes('deadline') || allText.includes('running out of time') || allText.includes('behind')) {
      insights.push({
        user_id: userId,
        insight_type: 'pattern',
        category: 'time_management',
        title: 'Time Management Concerns',
        description: 'Student mentioned deadlines or time pressure',
        confidence_score: 0.8
      });
    }

    // Detect engagement patterns
    if (messages.length >= 5) {
      insights.push({
        user_id: userId,
        insight_type: 'pattern',
        category: 'engagement',
        title: 'Active Learning Session',
        description: 'Student engaged in extended conversation with AI assistant',
        confidence_score: 0.9
      });
    }

    // Save insights
    if (insights.length > 0) {
      await supabase.from('ai_learning_insights').insert(insights);
    }
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    // Don't throw - this is a background task
  }
}
