/**
 * Lesson on Demand Service
 * Handles AI-powered lesson generation using Ollama llama3.3:70b
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// Types
// =============================================================================

export interface LessonGenerationInput {
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

export interface ContentSection {
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

export interface Exercise {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_minutes: number;
  solution_hints: string[];
  success_criteria: string[];
}

export interface QuizQuestion {
  question_type: string;
  question_text: string;
  options?: Array<{ text: string; is_correct: boolean }>;
  explanation: string;
  difficulty: string;
  points: number;
  bloom_taxonomy_level?: string;
}

export interface Resources {
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
  related_courses?: Array<{
    course_id: string;
    course_title: string;
    relevance: string;
  }>;
}

export interface GeneratedLesson {
  id: string;
  job_id?: string;
  user_id: string;
  title: string;
  topic: string;
  description: string;
  audience: string;
  difficulty: string;
  curriculum_type?: string;
  grade_level?: string;
  learning_objectives: string[];
  prerequisites: string[];
  content_sections: ContentSection[];
  practice_exercises: Exercise[];
  quiz_questions: QuizQuestion[];
  additional_resources: Resources;
  estimated_duration_minutes: number;
  word_count?: number;
  tags: string[];
  category?: string;
  status: string;
  published_course_id?: number;
  published_lesson_url?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonFilters {
  status?: string;
  audience?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface LessonStats {
  total_lessons: number;
  draft_lessons: number;
  published_lessons: number;
  archived_lessons: number;
  total_duration_minutes: number;
  avg_duration_minutes: number;
  audiences: string[];
  most_used_tags: string[];
}

// =============================================================================
// Service Class
// =============================================================================

class LessonOnDemandServiceClass {
  /**
   * Generate a new lesson using AI
   * Creates a job and invokes the edge function for generation
   */
  async generateLesson(input: LessonGenerationInput): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate input
    if (!input.topic || input.topic.length < 10) {
      throw new Error('Topic must be at least 10 characters');
    }

    // Create job
    const { data: jobId, error: jobError } = await supabase.rpc('create_ai_content_job', {
      p_user_id: user.id,
      p_job_type: 'lesson',
      p_input_params: input,
    });

    if (jobError) throw jobError;

    // Call edge function
    const { error } = await supabase.functions.invoke('generate-lesson', {
      body: { jobId, ...input },
    });

    if (error) throw error;

    return jobId;
  }

  /**
   * Get lessons for the current user
   */
  async getLessons(filters?: LessonFilters): Promise<GeneratedLesson[]> {
    let query = supabase
      .from('ai_generated_lessons')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.audience) {
      query = query.eq('audience', filters.audience);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,topic.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as GeneratedLesson[];
  }

  /**
   * Get a single lesson by ID
   */
  async getLesson(id: string): Promise<GeneratedLesson | null> {
    const { data, error } = await supabase
      .from('ai_generated_lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as GeneratedLesson | null;
  }

  /**
   * Update a lesson
   */
  async updateLesson(id: string, updates: Partial<GeneratedLesson>): Promise<GeneratedLesson> {
    const { data, error } = await supabase
      .from('ai_generated_lessons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as GeneratedLesson;
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string): Promise<void> {
    const { error } = await supabase.from('ai_generated_lessons').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Publish a lesson
   * Changes status to published and optionally links to a course
   */
  async publishLesson(id: string, courseId?: number): Promise<GeneratedLesson> {
    const { data, error } = await supabase.rpc('publish_generated_lesson', {
      p_lesson_id: id,
      p_course_id: courseId || null,
    });

    if (error) throw error;
    return data as GeneratedLesson;
  }

  /**
   * Archive a lesson
   * Changes status to archived
   */
  async archiveLesson(id: string): Promise<GeneratedLesson> {
    const { data, error } = await supabase.rpc('archive_generated_lesson', {
      p_lesson_id: id,
    });

    if (error) throw error;
    return data as GeneratedLesson;
  }

  /**
   * Get statistics about user's lessons
   */
  async getUserStats(): Promise<LessonStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_user_lesson_stats', {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data as LessonStats;
  }

  /**
   * Export lesson as markdown
   */
  async exportAsMarkdown(id: string): Promise<string> {
    const lesson = await this.getLesson(id);
    if (!lesson) throw new Error('Lesson not found');

    let markdown = `# ${lesson.title}\n\n`;
    markdown += `**Topic:** ${lesson.topic}\n\n`;
    markdown += `**Description:** ${lesson.description}\n\n`;
    markdown += `**Audience:** ${lesson.audience} | **Difficulty:** ${lesson.difficulty} | **Duration:** ${lesson.estimated_duration_minutes} minutes\n\n`;

    // Learning Objectives
    markdown += `## Learning Objectives\n\n`;
    lesson.learning_objectives.forEach(obj => {
      markdown += `- ${obj}\n`;
    });
    markdown += '\n';

    // Prerequisites
    if (lesson.prerequisites.length > 0) {
      markdown += `## Prerequisites\n\n`;
      lesson.prerequisites.forEach(prereq => {
        markdown += `- ${prereq}\n`;
      });
      markdown += '\n';
    }

    // Content Sections
    lesson.content_sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.key_points && section.key_points.length > 0) {
        markdown += `**Key Points:**\n`;
        section.key_points.forEach(point => {
          markdown += `- ${point}\n`;
        });
        markdown += '\n';
      }
    });

    // Practice Exercises
    if (lesson.practice_exercises.length > 0) {
      markdown += `## Practice Exercises\n\n`;
      lesson.practice_exercises.forEach((exercise, index) => {
        markdown += `### Exercise ${index + 1}: ${exercise.title}\n\n`;
        markdown += `${exercise.description}\n\n`;
        markdown += `**Type:** ${exercise.type} | **Difficulty:** ${exercise.difficulty} | **Time:** ${exercise.estimated_minutes} minutes\n\n`;

        if (exercise.solution_hints.length > 0) {
          markdown += `**Hints:**\n`;
          exercise.solution_hints.forEach(hint => {
            markdown += `- ${hint}\n`;
          });
          markdown += '\n';
        }
      });
    }

    // Quiz Questions
    if (lesson.quiz_questions.length > 0) {
      markdown += `## Quiz\n\n`;
      lesson.quiz_questions.forEach((question, index) => {
        markdown += `### Question ${index + 1}\n\n`;
        markdown += `${question.question_text}\n\n`;

        if (question.options) {
          question.options.forEach((option, optIndex) => {
            const marker = option.is_correct ? '✓' : ' ';
            markdown += `${String.fromCharCode(65 + optIndex)}. [${marker}] ${option.text}\n`;
          });
          markdown += '\n';
        }

        markdown += `**Explanation:** ${question.explanation}\n\n`;
      });
    }

    // Additional Resources
    if (lesson.additional_resources) {
      markdown += `## Additional Resources\n\n`;

      if (
        lesson.additional_resources.reading_materials &&
        lesson.additional_resources.reading_materials.length > 0
      ) {
        markdown += `### Reading Materials\n\n`;
        lesson.additional_resources.reading_materials.forEach(resource => {
          markdown += `- [${resource.title}](${resource.url}) (${resource.type})\n`;
        });
        markdown += '\n';
      }

      if (lesson.additional_resources.videos && lesson.additional_resources.videos.length > 0) {
        markdown += `### Videos\n\n`;
        lesson.additional_resources.videos.forEach(video => {
          markdown += `- [${video.title}](${video.url}) (${video.duration})\n`;
        });
        markdown += '\n';
      }

      if (
        lesson.additional_resources.interactive_tools &&
        lesson.additional_resources.interactive_tools.length > 0
      ) {
        markdown += `### Interactive Tools\n\n`;
        lesson.additional_resources.interactive_tools.forEach(tool => {
          markdown += `- [${tool.title}](${tool.url}) - ${tool.description}\n`;
        });
        markdown += '\n';
      }
    }

    // Tags
    if (lesson.tags.length > 0) {
      markdown += `---\n\n**Tags:** ${lesson.tags.join(', ')}\n`;
    }

    return markdown;
  }

  /**
   * Check job status
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    error_message?: string;
    output_data?: unknown;
    output_content_id?: string;
  }> {
    const { data, error } = await supabase
      .from('ai_content_jobs')
      .select('status, error_message, output_data, output_content_id')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  }
}

// =============================================================================
// Export singleton instance
// =============================================================================

export const LessonOnDemandService = new LessonOnDemandServiceClass();
