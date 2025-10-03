/**
 * Resource Fetch Service
 * Fetches available learning resources from database
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { LearningResources, GapAnalysis } from './types';

export class ResourceFetchService {
  /**
   * Fetch available learning resources from database
   */
  async fetchAvailableResources(_gapAnalysis: GapAnalysis): Promise<LearningResources> {
    logger.log('Fetching resources for gap analysis');

    const [coursesResult, workshopsResult, exercisesResult] = await Promise.all([
      this.fetchCourses(),
      this.fetchWorkshops(),
      this.fetchExercises()
    ]);

    return {
      courses: coursesResult.data ?? [],
      workshops: workshopsResult.data ?? [],
      exercises: exercisesResult.data ?? [],
      quizzes: []
    };
  }

  private async fetchCourses() {
    return await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  private async fetchWorkshops() {
    return await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true });
  }

  private async fetchExercises() {
    return await supabase
      .from('homework_assignments')
      .select('*')
      .eq('is_published', true);
  }
}

export const resourceFetchService = new ResourceFetchService();
