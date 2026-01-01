/**
 * LingoImportExportService
 *
 * Service for importing and exporting AIBORGLingo lessons and questions.
 * Supports JSON format with validation and conflict resolution.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  LingoExportFile,
  LingoLessonExport,
  LingoQuestionExport,
  LingoExportOptions,
  LingoImportOptions,
  LingoImportValidation,
  LingoLessonValidation,
  LingoImportResult,
  LingoLessonImportResult,
  LingoSkillCategory,
  LingoQuestionType,
} from '@/types/lingo-import-export.types';

const VALID_SKILLS: LingoSkillCategory[] = [
  'Foundations',
  'LLMs',
  'Vision',
  'NLP',
  'Safety',
  'Advanced',
];

const VALID_QUESTION_TYPES: LingoQuestionType[] = [
  'multiple_choice',
  'fill_blank',
  'matching',
  'ordering',
  'free_response',
];

export class LingoImportExportService {
  /**
   * Export lessons to JSON format
   */
  static async exportLessons(options: LingoExportOptions = {}): Promise<LingoExportFile> {
    logger.info('Exporting lessons', options);

    try {
      // Build query
      let query = supabase
        .from('lingo_lessons')
        .select('*')
        .order('sort_order', { ascending: true });

      // Filter by specific lesson IDs if provided
      if (options.lesson_ids && options.lesson_ids.length > 0) {
        query = query.in('id', options.lesson_ids);
      }

      // Filter by active status
      if (!options.include_inactive) {
        query = query.eq('is_active', true);
      }

      const { data: lessons, error: lessonsError } = await query;
      if (lessonsError) throw lessonsError;

      // Get questions for all lessons
      const lessonIds = (lessons || []).map(l => l.id);
      const { data: questions, error: questionsError } = await supabase
        .from('lingo_questions')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('sort_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Group questions by lesson
      const questionsByLesson: Record<string, LingoQuestionExport[]> = {};
      (questions || []).forEach(q => {
        if (!questionsByLesson[q.lesson_id]) {
          questionsByLesson[q.lesson_id] = [];
        }
        questionsByLesson[q.lesson_id].push({
          type: q.type as LingoQuestionType,
          prompt: q.prompt,
          sort_order: q.sort_order,
          explanation: q.explanation || undefined,
          options: q.options || undefined,
          answer: q.answer || undefined,
          answers: q.answers || undefined,
          pairs: q.pairs || undefined,
          steps: q.steps || undefined,
          ideal_answer: q.ideal_answer || undefined,
          rubric: q.rubric || undefined,
          strictness: q.strictness || undefined,
          pass_score: q.pass_score || undefined,
        });
      });

      // Build export file
      const exportData: LingoExportFile = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        lessons: (lessons || []).map(l => ({
          lesson_id: l.lesson_id,
          title: l.title,
          skill: l.skill as LingoSkillCategory,
          duration: l.duration,
          xp_reward: l.xp_reward,
          description: l.description,
          sort_order: l.sort_order,
          is_active: l.is_active,
          questions: questionsByLesson[l.id] || [],
        })),
      };

      logger.info('Export complete', {
        lessons: exportData.lessons.length,
        questions: questions?.length || 0,
      });

      return exportData;
    } catch (_error) {
      logger.error('Failed to export lessons', _error);
      throw error;
    }
  }

  /**
   * Validate import data without actually importing
   */
  static async validateImport(data: LingoExportFile): Promise<LingoImportValidation> {
    const result: LingoImportValidation = {
      is_valid: true,
      total_lessons: data.lessons.length,
      valid_lessons: 0,
      existing_lessons: 0,
      new_lessons: 0,
      lessons: [],
      global_errors: [],
    };

    // Check version
    if (data.version !== '1.0') {
      result.global_errors.push(`Unsupported version: ${data.version}. Expected: 1.0`);
      result.is_valid = false;
    }

    // Check for empty import
    if (!data.lessons || data.lessons.length === 0) {
      result.global_errors.push('No lessons found in import file');
      result.is_valid = false;
      return result;
    }

    // Get existing lessons for comparison
    const { data: existingLessons } = await supabase.from('lingo_lessons').select('lesson_id, id');

    const existingLessonIds = new Set((existingLessons || []).map(l => l.lesson_id));

    // Validate each lesson
    for (const lesson of data.lessons) {
      const validation = this.validateLesson(lesson, existingLessonIds);
      result.lessons.push(validation);

      if (validation.is_valid) {
        result.valid_lessons++;
      } else {
        result.is_valid = false;
      }

      if (validation.exists) {
        result.existing_lessons++;
      } else {
        result.new_lessons++;
      }
    }

    // Check for duplicate lesson_ids in import
    const lessonIds = data.lessons.map(l => l.lesson_id);
    const duplicates = lessonIds.filter((id, index) => lessonIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      result.global_errors.push(`Duplicate lesson IDs found in import: ${duplicates.join(', ')}`);
      result.is_valid = false;
    }

    return result;
  }

  /**
   * Validate a single lesson
   */
  private static validateLesson(
    lesson: LingoLessonExport,
    existingLessonIds: Set<string>
  ): LingoLessonValidation {
    const validation: LingoLessonValidation = {
      lesson_id: lesson.lesson_id,
      title: lesson.title,
      is_valid: true,
      exists: existingLessonIds.has(lesson.lesson_id),
      question_count: lesson.questions?.length || 0,
      errors: [],
      warnings: [],
    };

    // Required fields
    if (!lesson.lesson_id?.trim()) {
      validation.errors.push('Missing lesson_id');
      validation.is_valid = false;
    }

    if (!lesson.title?.trim()) {
      validation.errors.push('Missing title');
      validation.is_valid = false;
    }

    // Validate skill
    if (!VALID_SKILLS.includes(lesson.skill)) {
      validation.errors.push(
        `Invalid skill "${lesson.skill}". Valid options: ${VALID_SKILLS.join(', ')}`
      );
      validation.is_valid = false;
    }

    // Validate questions
    if (!lesson.questions || lesson.questions.length === 0) {
      validation.warnings.push('Lesson has no questions');
    } else {
      lesson.questions.forEach((q, index) => {
        const qErrors = this.validateQuestion(q, index);
        if (qErrors.length > 0) {
          validation.errors.push(...qErrors);
          validation.is_valid = false;
        }
      });
    }

    // Warnings
    if (!lesson.duration) {
      validation.warnings.push('Missing duration');
    }

    if (!lesson.description) {
      validation.warnings.push('Missing description');
    }

    return validation;
  }

  /**
   * Validate a single question
   */
  private static validateQuestion(question: LingoQuestionExport, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Question ${index + 1}`;

    if (!question.prompt?.trim()) {
      errors.push(`${prefix}: Missing prompt`);
    }

    if (!VALID_QUESTION_TYPES.includes(question.type)) {
      errors.push(
        `${prefix}: Invalid type "${question.type}". Valid options: ${VALID_QUESTION_TYPES.join(', ')}`
      );
      return errors; // Skip type-specific validation if type is invalid
    }

    // Type-specific validation
    switch (question.type) {
      case 'multiple_choice':
        if (!question.options || question.options.length < 2) {
          errors.push(`${prefix}: Multiple choice requires at least 2 options`);
        }
        if (!question.answer?.trim()) {
          errors.push(`${prefix}: Missing correct answer`);
        } else if (question.options && !question.options.includes(question.answer)) {
          errors.push(`${prefix}: Correct answer not found in options`);
        }
        break;

      case 'fill_blank':
        if (!question.answers || question.answers.length === 0) {
          errors.push(`${prefix}: Fill in blank requires at least 1 accepted answer`);
        }
        break;

      case 'matching':
        if (!question.pairs || question.pairs.length < 2) {
          errors.push(`${prefix}: Matching requires at least 2 pairs`);
        } else {
          question.pairs.forEach((pair, i) => {
            if (!pair.left?.trim() || !pair.right?.trim()) {
              errors.push(`${prefix}: Pair ${i + 1} is incomplete`);
            }
          });
        }
        break;

      case 'ordering':
        if (!question.steps || question.steps.length < 2) {
          errors.push(`${prefix}: Ordering requires at least 2 steps`);
        }
        break;

      case 'free_response':
        if (!question.ideal_answer?.trim()) {
          errors.push(`${prefix}: Free response requires an ideal answer`);
        }
        break;
    }

    return errors;
  }

  /**
   * Import lessons from JSON data
   */
  static async importLessons(
    data: LingoExportFile,
    options: LingoImportOptions
  ): Promise<LingoImportResult> {
    logger.info('Importing lessons', { mode: options.mode, count: data.lessons.length });

    const result: LingoImportResult = {
      success: true,
      mode: options.mode,
      total_lessons: data.lessons.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      lessons: [],
      errors: [],
    };

    // Validate first
    const validation = await this.validateImport(data);
    if (!validation.is_valid) {
      result.success = false;
      result.errors = [...validation.global_errors, ...validation.lessons.flatMap(l => l.errors)];
      return result;
    }

    // Dry run - just return validation results
    if (options.dry_run) {
      result.lessons = validation.lessons.map(l => ({
        lesson_id: l.lesson_id,
        title: l.title,
        status: l.exists ? 'skipped' : ('created' as const),
        questions_created: l.question_count,
        questions_updated: 0,
      }));
      return result;
    }

    try {
      // Handle replace_all mode - delete all existing first
      if (options.mode === 'replace_all') {
        await supabase
          .from('lingo_questions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase
          .from('lingo_lessons')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        logger.info('Deleted all existing lessons and questions');
      }

      // Get existing lessons for ID lookup
      const { data: existingLessons } = await supabase
        .from('lingo_lessons')
        .select('id, lesson_id');

      const existingLessonMap = new Map((existingLessons || []).map(l => [l.lesson_id, l.id]));

      // Process each lesson
      for (const lesson of data.lessons) {
        const lessonResult = await this.importLesson(lesson, existingLessonMap, options.mode);
        result.lessons.push(lessonResult);

        switch (lessonResult.status) {
          case 'created':
            result.created++;
            break;
          case 'updated':
            result.updated++;
            break;
          case 'skipped':
            result.skipped++;
            break;
          case 'failed':
            result.failed++;
            result.success = false;
            break;
        }
      }

      logger.info('Import complete', {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
      });
    } catch (_error) {
      logger.error('Import failed', _error);
      result.success = false;
      result.errors.push(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Import a single lesson
   */
  private static async importLesson(
    lesson: LingoLessonExport,
    existingLessonMap: Map<string, string>,
    mode: LingoImportOptions['mode']
  ): Promise<LingoLessonImportResult> {
    const result: LingoLessonImportResult = {
      lesson_id: lesson.lesson_id,
      title: lesson.title,
      status: 'skipped',
      questions_created: 0,
      questions_updated: 0,
    };

    try {
      const existingId = existingLessonMap.get(lesson.lesson_id);
      const exists = !!existingId;

      // Handle create_only mode
      if (mode === 'create_only' && exists) {
        result.status = 'skipped';
        return result;
      }

      const lessonData = {
        lesson_id: lesson.lesson_id,
        title: lesson.title,
        skill: lesson.skill,
        duration: lesson.duration || '8 min',
        xp_reward: lesson.xp_reward || 40,
        description: lesson.description || '',
        sort_order: lesson.sort_order || 0,
        is_active: lesson.is_active ?? true,
      };

      let lessonDbId: string;

      if (exists && mode === 'update_existing') {
        // Update existing lesson
        const { error } = await supabase
          .from('lingo_lessons')
          .update(lessonData)
          .eq('id', existingId);

        if (error) throw error;
        lessonDbId = existingId;
        result.status = 'updated';

        // Delete existing questions for this lesson
        await supabase.from('lingo_questions').delete().eq('lesson_id', existingId);
      } else {
        // Create new lesson
        const { data: newLesson, error } = await supabase
          .from('lingo_lessons')
          .insert(lessonData)
          .select()
          .single();

        if (error) throw error;
        lessonDbId = newLesson.id;
        result.status = 'created';
      }

      // Import questions
      if (lesson.questions && lesson.questions.length > 0) {
        const questionsData = lesson.questions.map((q, index) => ({
          lesson_id: lessonDbId,
          type: q.type,
          prompt: q.prompt,
          sort_order: q.sort_order ?? index,
          explanation: q.explanation || null,
          options: q.options || null,
          answer: q.answer || null,
          answers: q.answers || null,
          pairs: q.pairs || null,
          steps: q.steps || null,
          ideal_answer: q.ideal_answer || null,
          rubric: q.rubric || null,
          strictness: q.strictness || null,
          pass_score: q.pass_score || null,
        }));

        const { error: questionsError } = await supabase
          .from('lingo_questions')
          .insert(questionsData);

        if (questionsError) throw questionsError;
        result.questions_created = questionsData.length;
      }
    } catch (_error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to import lesson ${lesson.lesson_id}`, error);
    }

    return result;
  }

  /**
   * Download export as JSON file
   */
  static downloadAsFile(data: LingoExportFile, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `lingo-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse uploaded JSON file
   */
  static async parseFile(file: File): Promise<LingoExportFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as LingoExportFile;
          resolve(data);
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }
}
