/**
 * AI Content Service
 *
 * Manages AI-powered content generation including:
 * - Course generation
 * - Quiz/assessment generation
 * - Content translation
 * - Video scripts
 * - Slide decks
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface AIContentJob {
  id: string;
  user_id: string;
  job_type:
    | 'course'
    | 'lesson'
    | 'quiz'
    | 'assessment'
    | 'flashcards'
    | 'slide_deck'
    | 'video_script'
    | 'translation';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input_params: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  output_content_id?: string;
  output_content_type?: string;
  model_used?: string;
  total_tokens?: number;
  cost_usd?: number;
  generation_time_ms?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface CourseTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  audience: string;
  default_modules: number;
  default_lessons_per_module: number;
  default_duration_hours: number;
  include_quizzes: boolean;
  include_exercises: boolean;
  learning_objectives_template: string[];
  module_structure: Array<{
    title_template: string;
    lessons: string[];
  }>;
}

export interface GeneratedCourse {
  id: string;
  job_id?: string;
  user_id: string;
  title: string;
  description?: string;
  short_description?: string;
  audience: string;
  difficulty: string;
  estimated_duration_hours?: number;
  learning_objectives: string[];
  prerequisites: string[];
  modules: CourseModule[];
  tags: string[];
  category?: string;
  status: 'draft' | 'reviewing' | 'approved' | 'published' | 'archived';
  published_course_id?: string;
  created_at: string;
}

export interface CourseModule {
  title: string;
  description?: string;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  title: string;
  content: string;
  duration_minutes: number;
  quiz_questions?: GeneratedQuestion[];
  exercises?: Array<{
    title: string;
    description: string;
    type: string;
  }>;
}

export interface GeneratedQuestion {
  id?: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'fill_blank';
  question_text: string;
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  explanation?: string;
  difficulty: string;
  points: number;
  tags?: string[];
}

export interface Translation {
  id: string;
  source_content_id: string;
  source_content_type: string;
  source_language: string;
  target_language: string;
  translated_content: Record<string, unknown>;
  quality_score?: number;
  is_reviewed: boolean;
  is_approved: boolean;
  status: string;
  created_at: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  translation_quality: 'basic' | 'standard' | 'premium';
}

export interface GenerationStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_tokens: number;
  total_cost: number;
  jobs_by_type: Record<string, number>;
}

// Course generation input
export interface CourseGenerationInput {
  topic: string;
  audience?: 'primary' | 'secondary' | 'professional' | 'business';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_hours?: number;
  num_modules?: number;
  lessons_per_module?: number;
  include_quizzes?: boolean;
  include_exercises?: boolean;
  include_flashcards?: boolean;
  template_id?: string;
  keywords?: string[];
  learning_objectives?: string[];
}

// Quiz generation input
export interface QuizGenerationInput {
  source_content: string;
  source_type?: 'course' | 'lesson' | 'text' | 'topic';
  num_questions?: number;
  question_types?: Array<'multiple_choice' | 'true_false' | 'short_answer'>;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  include_explanations?: boolean;
}

// Translation input
export interface TranslationInput {
  content_id: string;
  content_type: string;
  source_language?: string;
  target_language: string;
  content_to_translate?: Record<string, unknown>;
}

// =============================================================================
// SERVICE
// =============================================================================

class AIContentServiceClass {
  // ===========================================================================
  // CONTENT JOBS
  // ===========================================================================

  async getJobs(options?: {
    status?: AIContentJob['status'];
    jobType?: AIContentJob['job_type'];
    limit?: number;
  }): Promise<AIContentJob[]> {
    let query = supabase
      .from('ai_content_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.jobType) {
      query = query.eq('job_type', options.jobType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getJob(jobId: string): Promise<AIContentJob | null> {
    const { data, error } = await supabase
      .from('ai_content_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getGenerationStats(): Promise<GenerationStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_user_generation_stats', {
      p_user_id: user.id,
    });

    if (error) throw error;
    return (
      data?.[0] || {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        total_tokens: 0,
        total_cost: 0,
        jobs_by_type: {},
      }
    );
  }

  // ===========================================================================
  // COURSE TEMPLATES
  // ===========================================================================

  async getTemplates(): Promise<CourseTemplate[]> {
    const { data, error } = await supabase
      .from('ai_course_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTemplate(id: string): Promise<CourseTemplate | null> {
    const { data, error } = await supabase
      .from('ai_course_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================================================
  // COURSE GENERATION
  // ===========================================================================

  async generateCourse(input: CourseGenerationInput): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'course',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function to generate course
    const { data: _data, error } = await supabase.functions.invoke('generate-course', {
      body: {
        jobId,
        ...input,
      },
    });

    if (error) throw error;
    return jobId;
  }

  async getGeneratedCourses(options?: {
    status?: GeneratedCourse['status'];
    limit?: number;
  }): Promise<GeneratedCourse[]> {
    let query = supabase
      .from('ai_generated_courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getGeneratedCourse(id: string): Promise<GeneratedCourse | null> {
    const { data, error } = await supabase
      .from('ai_generated_courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateGeneratedCourse(
    id: string,
    updates: Partial<GeneratedCourse>
  ): Promise<GeneratedCourse> {
    const { data, error } = await supabase
      .from('ai_generated_courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async approveCourse(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('ai_generated_courses')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async publishCourse(id: string): Promise<string> {
    // This would create an actual course from the generated content
    // For now, we'll just update the status
    const generatedCourse = await this.getGeneratedCourse(id);
    if (!generatedCourse) throw new Error('Generated course not found');

    // TODO: Create actual course from generated content
    // const courseId = await CourseService.createCourse(...)

    const { error } = await supabase
      .from('ai_generated_courses')
      .update({
        status: 'published',
        // published_course_id: courseId,
      })
      .eq('id', id);

    if (error) throw error;
    return id; // Return actual course ID when implemented
  }

  // ===========================================================================
  // QUIZ GENERATION
  // ===========================================================================

  async generateQuiz(input: QuizGenerationInput): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'quiz',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function to generate quiz
    const { error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        jobId,
        ...input,
      },
    });

    if (error) throw error;
    return jobId;
  }

  async getGeneratedQuestions(options?: {
    isApproved?: boolean;
    questionType?: string;
    limit?: number;
  }): Promise<GeneratedQuestion[]> {
    let query = supabase
      .from('ai_generated_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.isApproved !== undefined) {
      query = query.eq('is_approved', options.isApproved);
    }

    if (options?.questionType) {
      query = query.eq('question_type', options.questionType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async approveQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_generated_questions')
      .update({
        is_reviewed: true,
        is_approved: true,
      })
      .eq('id', id);

    if (error) throw error;
  }

  async rejectQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_generated_questions')
      .update({
        is_reviewed: true,
        is_approved: false,
      })
      .eq('id', id);

    if (error) throw error;
  }

  // ===========================================================================
  // TRANSLATION
  // ===========================================================================

  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    const { data, error } = await supabase
      .from('supported_languages')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async translateContent(input: TranslationInput): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'translation',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function to translate
    const { error } = await supabase.functions.invoke('translate-content', {
      body: {
        jobId,
        ...input,
      },
    });

    if (error) throw error;
    return jobId;
  }

  async getTranslations(options?: {
    contentId?: string;
    targetLanguage?: string;
    limit?: number;
  }): Promise<Translation[]> {
    let query = supabase
      .from('ai_translations')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.contentId) {
      query = query.eq('source_content_id', options.contentId);
    }

    if (options?.targetLanguage) {
      query = query.eq('target_language', options.targetLanguage);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async approveTranslation(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_translations')
      .update({
        is_reviewed: true,
        is_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  // ===========================================================================
  // VIDEO SCRIPTS
  // ===========================================================================

  async generateVideoScript(input: {
    topic: string;
    duration_minutes?: number;
    tone?: string;
    target_audience?: string;
  }): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'video_script',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function
    const { error } = await supabase.functions.invoke('generate-video-script', {
      body: {
        jobId,
        ...input,
      },
    });

    if (error) throw error;
    return jobId;
  }

  async getVideoScripts(limit = 20): Promise<
    Array<{
      id: string;
      title: string;
      topic?: string;
      duration_minutes?: number;
      script_content: Record<string, unknown>;
      created_at: string;
    }>
  > {
    const { data, error } = await supabase
      .from('ai_video_scripts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // SLIDE DECKS
  // ===========================================================================

  async generateSlideDeck(input: {
    topic: string;
    num_slides?: number;
    style?: string;
  }): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'slide_deck',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function
    const { error } = await supabase.functions.invoke('generate-slide-deck', {
      body: {
        jobId,
        ...input,
      },
    });

    if (error) throw error;
    return jobId;
  }

  async getSlideDecks(limit = 20): Promise<
    Array<{
      id: string;
      title: string;
      topic?: string;
      num_slides?: number;
      slides: Array<Record<string, unknown>>;
      created_at: string;
    }>
  > {
    const { data, error } = await supabase
      .from('ai_slide_decks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const AIContentService = new AIContentServiceClass();
export default AIContentService;
